from __future__ import annotations

import logging
import time
import uuid
from collections import defaultdict
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jwt.exceptions import PyJWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import ALL_PERMISSIONS, User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    SetupPasswordRequest,
    TokenResponse,
    UpdateUserPermissionsRequest,
    UserMeResponse,
    UserRead,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory rate limiter (works per-worker; provides basic protection)
_login_attempts: dict[str, list[float]] = defaultdict(list)
_rate_limit_lock = Lock()
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 60
_MAX_TRACKED_IPS = 10000


def _check_rate_limit(ip: str) -> None:
    now = time.time()
    with _rate_limit_lock:
        if len(_login_attempts) > _MAX_TRACKED_IPS:
            stale = [k for k, v in _login_attempts.items() if not v or now - v[-1] > _WINDOW_SECONDS]
            for k in stale:
                del _login_attempts[k]

        attempts = _login_attempts[ip]
        _login_attempts[ip] = [t for t in attempts if now - t < _WINDOW_SECONDS]
        if len(_login_attempts[ip]) >= _MAX_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Too many attempts. Please wait a minute.")
        _login_attempts[ip].append(now)


def _get_user_permissions(user: User) -> list[str]:
    """Get effective permissions for a user. Admin gets all permissions."""
    if user.role == UserRole.admin:
        return ALL_PERMISSIONS
    return user.permissions if user.permissions else []


def _user_read(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role,
        has_password=bool(user.password_hash),
        permissions=_get_user_permissions(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    _check_rate_limit(request.client.host if request.client else "unknown")
    user = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        logger.warning("Failed login attempt for username=%r", payload.username)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    logger.info("User logged in: username=%r id=%s role=%s", user.username, user.id, user.role)
    return TokenResponse(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Exchange a valid refresh token for a new access + refresh token pair."""
    try:
        token_data = decode_token(payload.refresh_token)
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    sub = token_data.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    logger.info("Token refreshed for user: username=%r id=%s", user.username, user.id)
    return TokenResponse(
        access_token=create_access_token(subject=str(user.id)),
        refresh_token=create_refresh_token(subject=str(user.id)),
    )


@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user)) -> UserMeResponse:
    return UserMeResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        permissions=_get_user_permissions(current_user),
    )


@router.get("/permissions", response_model=list[str])
def list_available_permissions(_: User = Depends(get_current_user)) -> list[str]:
    """Return all available permission keys."""
    return ALL_PERMISSIONS


@router.post("/register", response_model=UserRead, status_code=201)
def register_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> UserRead:
    """Admin creates a user with username + email + role. No password — user sets it themselves."""
    existing = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    email_exists = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if email_exists:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Validate permissions
    permissions = payload.permissions
    if permissions is not None:
        invalid = [p for p in permissions if p not in ALL_PERMISSIONS]
        if invalid:
            raise HTTPException(status_code=422, detail=f"Invalid permissions: {invalid}")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash="",  # No password yet — user must set it via /setup-password
        role=payload.role,
        permissions=permissions,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User created: username=%r role=%s by=%s", user.username, user.role, current_user.username)
    return _user_read(user)


@router.patch("/users/{user_id}/permissions", response_model=UserRead)
def update_user_permissions(
    user_id: uuid.UUID,
    payload: UpdateUserPermissionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> UserRead:
    """Admin updates which pages/sections a staff user can access."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Admin users always have full access")

    # Validate permissions
    invalid = [p for p in payload.permissions if p not in ALL_PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=422, detail=f"Invalid permissions: {invalid}")

    user.permissions = payload.permissions
    db.commit()
    db.refresh(user)
    logger.info("Permissions updated for user=%r by=%s: %s", user.username, current_user.username, payload.permissions)
    return _user_read(user)


@router.post("/setup-password", response_model=dict)
def setup_password(payload: SetupPasswordRequest, request: Request, db: Session = Depends(get_db)) -> dict:
    """Public endpoint — user sets their password using their email. Only works if password not already set."""
    _check_rate_limit(request.client.host if request.client else "unknown")

    if len(payload.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")

    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or user.password_hash:
        # Generic message to prevent user enumeration
        raise HTTPException(status_code=400, detail="Unable to set password. Account may not exist or password already set.")

    user.password_hash = hash_password(payload.password)
    db.commit()
    logger.info("Password set for user: username=%r", user.username)
    return {"message": "Password set successfully. You can now log in."}


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> list[UserRead]:
    users = db.execute(select(User).order_by(User.created_at)).scalars().all()
    return [_user_read(u) for u in users]


@router.delete("/users/{user_id}", status_code=204, response_class=Response)
def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> Response:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    logger.info("User deleted: username=%r by=%s", user.username, current_user.username)
    return Response(status_code=204)
