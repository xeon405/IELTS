from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from jwt import InvalidTokenError

from .config import settings


def hash_password(password: str) -> str:
    # Cost 10: ~60-90ms on Render's free CPU instead of ~300-500ms at the
    # bcrypt default (12). Auth endpoints are already rate-limited, and
    # existing cost-12 hashes still verify (bcrypt reads the cost from the
    # stored hash).
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=10)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, token_version: int = 0) -> str:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.JWT_EXPIRES_MINUTES)
    payload = {"sub": subject, "iat": now, "exp": expires, "ver": token_version}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Return the verified payload (sub, iat, ver, exp) or None."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except InvalidTokenError:
        return None