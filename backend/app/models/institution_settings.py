from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text, Uuid, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class InstitutionSettings(Base):
    __tablename__ = "institution_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(200), nullable=False, default="MY Academy")
    tagline: Mapped[str] = mapped_column(String(300), nullable=False, default="Educational Institutions")
    registration_no: Mapped[str] = mapped_column(String(100), nullable=False, default="Regd.No - 469/2016")
    address: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True, default=None)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
