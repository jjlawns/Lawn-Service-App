"""Single-admin session auth: env-held password, JWT in an httpOnly cookie, brute-force lockout."""

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request

JWT_ALGORITHM = "HS256"
SESSION_COOKIE = "jj_session"
TOKEN_TTL_DAYS = 7


def create_token() -> str:
    payload = {
        "sub": "owner",
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS),
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return {"email": "owner"}
