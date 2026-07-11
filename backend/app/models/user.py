from __future__ import annotations

from sqlalchemy import Enum, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import UserRole


# All available permission keys (pages/sections staff can access)
ALL_PERMISSIONS = [
    "dashboard",
    "students",
    "collect",
    "savings",
    "staff",
    "academic",
    "exams",
    "cms",
    "fees",
    "attendance",
    "reports",
    "transactions",
    "expenses",
    "settings",
]


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(200), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.staff)
    permissions: Mapped[list | None] = mapped_column(JSON, nullable=True, default=None)
