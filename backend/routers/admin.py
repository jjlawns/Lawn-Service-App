import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from lib.auth import SESSION_COOKIE, create_token, get_current_admin
from lib.db import db

router = APIRouter()

STATUSES = ("new", "contacted", "won", "lost")
LOCKOUT_MINUTES = 15
MAX_ATTEMPTS = 5


class LoginBody(BaseModel):
    password: str


class StatusBody(BaseModel):
    status: str


@router.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    ip = request.client.host if request.client else "unknown"
    key = f"{ip}:owner"
    attempts = await db.login_attempts.find_one({"identifier": key})
    if attempts and attempts.get("count", 0) >= MAX_ATTEMPTS:
        locked_at = attempts["updated_at"]
        if locked_at.tzinfo is None:
            locked_at = locked_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - locked_at < timedelta(minutes=LOCKOUT_MINUTES):
            raise HTTPException(status_code=429, detail="Too many attempts — try again in 15 minutes.")

    expected = os.environ.get("ADMIN_PASSWORD", "")
    if not expected or not secrets.compare_digest(body.password.encode(), expected.encode()):
        await db.login_attempts.update_one(
            {"identifier": key},
            {"$inc": {"count": 1}, "$set": {"updated_at": datetime.now(timezone.utc)}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Wrong password.")

    await db.login_attempts.delete_one({"identifier": key})
    response.set_cookie(
        SESSION_COOKIE, create_token(), httponly=True, secure=True, samesite="lax",
        max_age=7 * 24 * 3600, path="/",
    )
    return {"email": "owner"}


@router.get("/auth/me")
async def me(admin: dict = Depends(get_current_admin)):
    return admin


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/admin/quotes")
async def list_quotes(admin: dict = Depends(get_current_admin)):
    return await db.quotes.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@router.patch("/admin/quotes/{quote_id}")
async def update_quote_status(quote_id: str, body: StatusBody, admin: dict = Depends(get_current_admin)):
    if body.status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {STATUSES}")
    res = await db.quotes.update_one({"id": quote_id}, {"$set": {"status": body.status}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"ok": True}
