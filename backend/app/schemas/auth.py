from __future__ import annotations

import uuid

from pydantic import BaseModel

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str | None = None
    role: UserRole


class RegisterRequest(BaseModel):
    username: str
    email: str
    role: UserRole = UserRole.staff


class SetupPasswordRequest(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str | None = None
    role: UserRole
    has_password: bool = False

    class Config:
        from_attributes = True
