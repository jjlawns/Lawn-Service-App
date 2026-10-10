import asyncio
import logging
import math
import os
import re
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from lib.db import client, db, ensure_indexes
from lib.emailer import send_quote_alert
from routers.admin import router as admin_router

logger = logging.getLogger(__name__)

CENSUS_GEOCODER_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
ARCGIS_GEOCODER_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
FDOR_PARCEL_URL = (
    "https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/"
    "Florida_Statewide_Parcel_Centroid_Version/FeatureServer/0/query"
)
HTTP_HEADERS = {"User-Agent": "J&J-Lawn/1.0 (lawn-service-estimator)"}
SQFT_PER_ACRE = 43560.0
ZIP_RE = re.compile(r"\b(\d{5})(?:-\d{4})?\b")

# Port St. Lucie cuts carry a drive-distance surcharge from the 34982 Fort Pierce base.
PSL_ZIPS = {"34952", "34953", "34983", "34984", "34986", "34987"}
BASE_LAT, BASE_LNG = 27.388946, -80.3184303  # 34982 centroid
DISTANCE_TIERS = [(10.0, 0.0), (15.0, 5.0), (float("inf"), 10.0)]  # (max miles, $/cut)

# Automatic per-zip rate adjustment from Census ACS 2024 5-yr median household income
# (Census Reporter API, no key). pct = clamp((zip_income / county_median - 1) * strength).
CENSUS_REPORTER_URL = "https://api.censusreporter.org/1.0/data/show/latest"
DEFAULT_INCOME_ADJUST = {"enabled": True, "strength": 0.25, "min": -0.10, "max": 0.15}

DEFAULT_CONFIG = {
    "id": "main",
    "phone": "(772) 940-4424",
    "zips": [
        "34945", "34946", "34947", "34949", "34950", "34951", "34952",
        "34953", "34981", "34982", "34983", "34984", "34986", "34987",
    ],
    "base_price": 35.0,
    "per_acre": 70.0,
    "included_acres": 0.25,
    "min_price": 35.0,
    "easement_fee": 5.0,
    "monthly_min": 100.0,
    "income_adjust": dict(DEFAULT_INCOME_ADJUST),
}


class ServiceConfig(BaseModel):
    id: str = "main"
    phone: str
    zips: list[str]
    base_price: float
    per_acre: float
    included_acres: float
    min_price: float
    easement_fee: float
    monthly_min: float


class ServiceConfigUpdate(BaseModel):
    phone: str = Field(min_length=7, max_length=30)
    zips: list[str]
    base_price: float = Field(gt=0)
    per_acre: float = Field(ge=0)
    included_acres: float = Field(ge=0)
    min_price: float = Field(gt=0)
    easement_fee: float = Field(ge=0)
    monthly_min: float = Field(gt=0)


class AddressCheckRequest(BaseModel):
    address: str = Field(min_length=3, max_length=300)


class AddressCheckResult(BaseModel):
    in_area: bool
    matched_address: str | None = None
    city: str | None = None
    zip: str | None = None
    county: str | None = None
    acres: float | None = None
    distance_miles: float | None = None
    distance_fee: float | None = None
    income_adjust_pct: float | None = None
    acres_source: str | None = None
    estimate_cut: float | None = None


class QuoteRequestBody(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr
    address: str = Field(min_length=3, max_length=300)
    zip: str | None = None
    acres: float | None = None
    plan: str = "monthly"
    overgrowth: str | None = None
    corner_lot: bool = False
    estimate: float | None = None
    notes: str = Field(default="", max_length=1000)


class Quote(QuoteRequestBody):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def cut_estimate(cfg: dict, acres: float) -> float:
    billable = max(0.0, acres - cfg["included_acres"])
    cut = max(cfg["min_price"], cfg["base_price"] + cfg["per_acre"] * billable)
    # Easement upkeep scales with lot size: flat fee up to the included acreage, then grows.
    cut += cfg["easement_fee"] * max(1.0, 1.0 + (acres - cfg["included_acres"]))
    return float(math.floor(cut + 0.5))


def normalize_address(address: str) -> str:
    return re.sub(r"\s+", " ", address.strip().lower())


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


async def get_zip_stats(cfg: dict) -> dict:
    doc = await db.zip_stats.find_one({"id": "main"})
    if doc and doc.get("zips"):
        fetched = doc.get("fetched_at")
        if fetched and fetched.tzinfo is None:
            fetched = fetched.replace(tzinfo=timezone.utc)
        if fetched and (datetime.now(timezone.utc) - fetched).days < 30:
            return doc
    geo_ids = ",".join(f"86000US{z}" for z in cfg["zips"]) + ",05000US12111"
    try:
        async with httpx.AsyncClient(timeout=20, headers=HTTP_HEADERS) as http:
            resp = await http.get(
                CENSUS_REPORTER_URL, params={"table_ids": "B19013", "geo_ids": geo_ids}
            )
            resp.raise_for_status()
            payload = resp.json()
        zips: dict[str, float] = {}
        county_median = None
        for gid, g in payload.get("data", {}).items():
            est = g.get("B19013", {}).get("estimate", {}).get("B19013001")
            if not est or est <= 0:
                continue
            if gid.startswith("86000US"):
                zips[gid[-5:]] = est
            elif gid == "05000US12111":
                county_median = est
        doc = {
            "id": "main",
            "zips": zips,
            "county_median": county_median,
            "fetched_at": datetime.now(timezone.utc),
        }
        await db.zip_stats.update_one({"id": "main"}, {"$set": doc}, upsert=True)
        return doc
    except Exception as exc:
        logger.warning("income stats fetch failed: %s", exc)
        return doc or {"zips": {}, "county_median": None}


async def income_adjustment(zipcode: str | None, cfg: dict) -> float:
    adj = cfg.get("income_adjust") or DEFAULT_INCOME_ADJUST
    if not adj.get("enabled", True) or not zipcode:
        return 0.0
    stats = await get_zip_stats(cfg)
    income = (stats.get("zips") or {}).get(zipcode)
    median = stats.get("county_median")
    if not income or not median:
        return 0.0
    raw = (income / median - 1) * adj.get("strength", 0.25)
    return max(adj.get("min", -0.10), min(adj.get("max", 0.15), raw))


async def _arcgis_geocode(address: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=12, headers=HTTP_HEADERS) as http:
            resp = await http.get(
                ARCGIS_GEOCODER_URL,
                params={
                    "SingleLine": address,
                    "f": "json",
                    "maxLocations": 1,
                    "outFields": "PlaceName,Subregion,Region,Postal",
                },
            )
            resp.raise_for_status()
            candidates = resp.json().get("candidates", [])
            if not candidates:
                return None
            c = candidates[0]
            if c.get("score", 0) < 80:
                return None
            attrs = c.get("attributes", {})
            if attrs.get("Region") not in ("Florida", "FL"):
                return None
            parts = [p.strip() for p in (c.get("address") or "").split(",")]
            return {
                "matched_address": c.get("address"),
                "city": attrs.get("PlaceName") or (parts[1] if len(parts) > 2 else None),
                "zip": attrs.get("Postal") or None,
                "county": attrs.get("Subregion") or None,
                "lat": c["location"]["y"],
                "lng": c["location"]["x"],
            }
    except Exception as exc:
        logger.warning("arcgis geocode failed for %r: %s", address, exc)
        return None


async def _census_geocode(address: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=12, headers=HTTP_HEADERS) as http:
            resp = await http.get(
                CENSUS_GEOCODER_URL,
                params={"address": address, "benchmark": "Public_AR_Current", "format": "json"},
            )
            resp.raise_for_status()
            matches = resp.json().get("result", {}).get("addressMatches", [])
            if not matches:
                return None
            m = matches[0]
            comps = m.get("addressComponents", {})
            coords = m.get("coordinates", {})
            return {
                "matched_address": m.get("matchedAddress"),
                "city": comps.get("city"),
                "zip": comps.get("zip"),
                "county": None,
                "lat": coords.get("y"),
                "lng": coords.get("x"),
            }
    except Exception as exc:
        logger.warning("census geocode failed for %r: %s", address, exc)
        return None


async def geocode(address: str) -> dict | None:
    # Local customers rarely type the city — try county-scoped forms first, statewide last.
    attempts = (
        [address]
        if ZIP_RE.search(address)
        else [f"{address}, St. Lucie County, FL", f"{address}, FL", address]
    )
    for attempt in attempts:
        result = await _arcgis_geocode(attempt)
        if result:
            return result
    for attempt in attempts:
        result = await _census_geocode(attempt)
        if result:
            return result
    return None


async def lookup_acres(lat: float, lng: float) -> float | None:
    params = {
        "geometry": f"{lng},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "distance": "150",
        "units": "esriSRUnit_Meter",
        "outFields": "PARCEL_ID,PHY_ADDR1,PHY_CITY,PHY_ZIPCD,LND_SQFOOT",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "json",
    }
    try:
        async with httpx.AsyncClient(timeout=15, headers=HTTP_HEADERS) as http:
            resp = await http.get(FDOR_PARCEL_URL, params=params)
            resp.raise_for_status()
            features = resp.json().get("features", [])
        best_sqft = None
        best_dist = None
        for f in features:
            sqft = (f.get("attributes") or {}).get("LND_SQFOOT")
            geom = f.get("geometry") or {}
            if not sqft or "x" not in geom or "y" not in geom:
                continue
            d = haversine_m(lat, lng, geom["y"], geom["x"])
            if best_dist is None or d < best_dist:
                best_dist = d
                best_sqft = sqft
        if best_sqft:
            return round(float(best_sqft) / SQFT_PER_ACRE, 2)
    except Exception as exc:
        logger.warning("parcel lookup failed: %s", exc)
    return None


async def get_config() -> dict:
    doc = await db.config.find_one({"id": "main"})
    if not doc:
        doc = dict(DEFAULT_CONFIG)
        await db.config.insert_one(doc)
    doc.pop("_id", None)
    return doc


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "J&J Lawn & Landscape API"}


@api_router.get("/config", response_model=ServiceConfig)
async def read_config():
    return ServiceConfig(**await get_config())


@api_router.put("/config", response_model=ServiceConfig)
async def update_config(body: ServiceConfigUpdate):
    update = body.model_dump()
    update["zips"] = sorted({z for z in (z.strip() for z in update["zips"]) if re.fullmatch(r"\d{5}", z)})
    if not update["zips"]:
        raise HTTPException(status_code=400, detail="At least one valid 5-digit zip code is required.")
    await db.config.update_one({"id": "main"}, {"$set": update}, upsert=True)
    return ServiceConfig(id="main", **update)


@api_router.post("/check-address", response_model=AddressCheckResult)
async def check_address(body: AddressCheckRequest):
    cfg = await get_config()
    key = normalize_address(body.address)

    cached = await db.properties.find_one({"address_key": key})
    if cached:
        return AddressCheckResult(**{k: v for k, v in cached.items() if k in AddressCheckResult.model_fields})

    typed_zip = ZIP_RE.search(body.address)
    geo = await geocode(body.address)
    zipcode = (geo or {}).get("zip") or (typed_zip.group(1) if typed_zip else None)
    county = (geo or {}).get("county")
    # St. Lucie County only: a verified county match always wins; when the geocoder can't
    # name the county, fall back to the zip list (covers cross-boundary zips safely).
    if county:
        in_area = "st. lucie" in county.lower()
    else:
        in_area = bool(zipcode and zipcode in cfg["zips"])

    acres = None
    if in_area and geo and geo.get("lat") is not None:
        acres = await lookup_acres(geo["lat"], geo["lng"])

    distance_miles = None
    distance_fee = 0.0
    if in_area and zipcode in PSL_ZIPS and geo and geo.get("lat") is not None:
        distance_miles = round(
            haversine_m(BASE_LAT, BASE_LNG, geo["lat"], geo["lng"]) / 1609.344, 1
        )
        for limit, fee in DISTANCE_TIERS:
            if distance_miles <= limit:
                distance_fee = fee
                break
    income_pct = await income_adjustment(zipcode, cfg) if in_area else 0.0

    estimate = None
    if acres:
        estimate = float(math.floor((cut_estimate(cfg, acres) + distance_fee) * (1 + income_pct) + 0.5))

    result = AddressCheckResult(
        in_area=in_area,
        matched_address=geo["matched_address"] if geo else None,
        city=geo["city"] if geo else None,
        zip=zipcode,
        county=county,
        acres=acres,
        distance_miles=distance_miles,
        distance_fee=distance_fee if distance_miles is not None else None,
        income_adjust_pct=round(income_pct, 4),
        acres_source="county" if acres else None,
        estimate_cut=estimate,
    )
    await db.properties.update_one(
        {"address_key": key},
        {"$set": {**result.model_dump(), "address_key": key, "created_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return result


@api_router.post("/quotes", response_model=Quote, status_code=201)
async def create_quote(body: QuoteRequestBody):
    quote = Quote(**body.model_dump())
    await db.quotes.insert_one(quote.model_dump())
    asyncio.create_task(send_quote_alert(quote.model_dump()))  # fire-and-forget; lead is saved regardless
    return quote


api_router.include_router(admin_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
