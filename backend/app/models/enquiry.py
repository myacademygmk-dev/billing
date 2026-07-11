"""Enquiry model for contact form submissions and admission pipeline."""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Enquiry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Stores contact form submissions and admission enquiries."""
    __tablename__ = "enquiries"

    student_name: Mapped[str] = mapped_column(String(200), nullable=False)
    parent_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    standard: Mapped[str | None] = mapped_column(String(50), nullable=True)
    board: Mapped[str | None] = mapped_column(String(50), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[str | None] = mapped_column(String(50), nullable=True, default="website")  # website, walkin, phone, referral

    # Pipeline status
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="new")  # new, contacted, demo_scheduled, enrolled, lost
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    follow_up_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    converted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
