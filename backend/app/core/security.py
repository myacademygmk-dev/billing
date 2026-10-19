from __future__ import annotations

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
import uuid

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(*, subject: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_access_token_exp_minutes)
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(*, subject: str) -> str:
    expires_delta = timedelta(days=settings.jwt_refresh_token_exp_days)
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_invitation_token(*, subject: str, version: str) -> str:
    """Create a short-lived capability for initial password setup only."""
    now = datetime.now(UTC)
    to_encode = {
        "sub": subject,
        "exp": now + timedelta(hours=settings.jwt_invitation_exp_hours),
        "iat": now,
        "jti": str(uuid.uuid4()),
        "type": "invitation",
        "ver": version,
    }
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises jwt.exceptions.PyJWTError on failure."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
