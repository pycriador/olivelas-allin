from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import jwt
from pwdlib import PasswordHash

from .config import settings

ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(user_id: int, tenant_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_minutes)
    return jwt.encode({"sub": str(user_id), "tenant_id": tenant_id, "exp": expires}, settings.jwt_secret_key, algorithm=ALGORITHM)


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def create_api_key() -> str:
    return f"olv_{secrets.token_urlsafe(32)}"
