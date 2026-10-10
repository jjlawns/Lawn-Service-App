# Verdant Coast Turf & Grounds — PRD

## Original problem statement
"An app that customers can search their address in St Lucie County and tell them if they're in our service area and also give them an estimated price for their lawn service."
User choices: zip-code-list service area (St. Lucie County + northernmost Vero Beach, sample data), price based on property acreage from county property records, quote request form + visible phone number after the estimate, sample prices editable later.

## User personas
- Homeowner in St. Lucie County / North Vero Beach checking if their address is serviced and what a mow costs
- Business owner who needs to adjust service zips, rates, and phone number without a developer

## Architecture
- FastAPI + MongoDB backend (`backend/server.py`), React 19 + Vite + Tailwind v4 frontend
- Address verification: US Census Bureau geocoder (`geocoding.geo.census.gov`, free, no key) → zip + lat/lng
- Acreage: Florida Dept. of Revenue statewide parcel service (ArcGIS FeatureServer, county property-appraiser tax-roll data) — nearest parcel centroid to geocoded point, `LND_SQFOOT / 43560`
- Results cached in `properties` collection (address_key); service config in `config` collection; leads in `quotes`
- Design: obsidian-forest (#0B1510) + emerald (#10B981), Lora/DM Sans/IBM Plex Mono, motion/react reveals, lenis smooth scroll

## Core endpoints
- GET/PUT /api/config — service zips, phone, pricing (no auth — owner drawer is open by design for the demo)
- POST /api/check-address — geocode + zip check + county acreage + weekly estimate
- POST /api/quotes — quote-request lead capture

## Implemented (2026-10-10)
- Kinetic split hero with masked line reveal, parallax live rate card, editorial marquee, bento grid, route-map zip chips, footer with click-to-call
- Address checker: full address or zip-only; city optional (auto-retries with "St. Lucie County, FL" context); in/out-of-area badge; county acreage with slider override
- Pricing: cut price = max($28, base $28 + $70/acre beyond 0.25 ac) + $5 easement fee on lots under 1 acre; monthly = max($100 floor, 3×cut). Plans: Monthly Service (3 cuts/month, every 10 days summer / 14 winter, month-to-month) and One-Time Cleanup (1.5× cut). Overgrowth first-cut multipliers: 2–4 wks 2×, 1–2 mo 3×, 2+ mo 4×. All PSL zips serviced (34952/34953/34983–34988/34990) + Fort Pierce + Hutchinson Island + North Vero Beach
- Standard service copy: mow, weed eat, edge, blow off, weed control; no debris vacuuming, no bush hogging; residential & commercial. Phone (772) 940-4424
- Quote request dialog (name/phone/email/address/notes + plan/overgrowth) → MongoDB, success toast
- Owner settings drawer (gear in navbar): edit phone, zips, base/per-acre/min price, included acres — live
- Original SVG logo + favicon

## Verified
- curl: config read, check-address (in-area w/ real 0.60ac county record → $91, out-of-area 90210, zip-only 34986), quote create 201, 422 negatives
- UI: hero, check flows, quote submit toast, out-of-area panel, bento, areas, footer — all via public preview URL
- `yarn typecheck` clean

## Backlog
- P0: Admin view for quote leads (currently stored only; no listing UI) + auth for owner drawer
- P0: Replace placeholder phone (772) 882-9420 and sample zips/prices with real business data
- P1: Email/SMS notification to owner on new quote (Resend/Twilio)
- P1: Quote follow-up status tracking
- P2: Map preview of matched address (leaflet), service-day scheduling
