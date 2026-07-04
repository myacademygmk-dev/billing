from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserMeResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: str | None = None
    role: UserRole
    permissions: list[str]


class RegisterRequest(BaseModel):
    username: str
    email: str
    role: UserRole = UserRole.staff
    permissions: list[str] | None = None


class UpdateUserPermissionsRequest(BaseModel):
    permissions: list[str] = Field(..., description="List of page keys the user can access")


class SetupPasswordRequest(BaseModel):
    email: str
    password: str


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: str | None = None
    role: UserRole
    has_password: bool = False
    permissions: list[str] = []

    class Config:
        from_attributes = True
