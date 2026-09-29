"""Authentication: password hashing, JWT, admin bootstrap, dependencies."""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext

from database import users_col, now_iso

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev_secret")
JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30

bearer = HTTPBearer(auto_error=False)


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(p: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(p, hashed)
    except Exception:
        return False


def create_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "customer"),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except Exception:
        return None


async def bootstrap_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@soleserenity.co.uk").lower()
    password = os.environ.get("ADMIN_PASSWORD", "SoleAdmin2025!")
    existing = await users_col.find_one({"email": email})
    if existing:
        # ensure role admin
        if existing.get("role") != "admin":
            await users_col.update_one({"email": email}, {"$set": {"role": "admin"}})
        return
    await users_col.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "name": "Sole Serenity Admin",
        "password": hash_password(password),
        "role": "admin",
        "created_at": now_iso(),
    })


async def _current_payload(creds: Optional[HTTPAuthorizationCredentials]):
    if not creds:
        return None
    return decode_token(creds.credentials)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    payload = await _current_payload(creds)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = await users_col.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_optional_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    payload = await _current_payload(creds)
    if not payload:
        return None
    return await users_col.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})


async def get_current_admin(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    payload = await _current_payload(creds)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    user = await users_col.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
