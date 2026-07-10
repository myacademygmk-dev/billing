from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class FeeStructure(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Fee type template: tuition, admission, exam, transport, lab, etc."""
    __tablename__ = "fee_structures"

    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Tuition Fee"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Specific to class, or null = all
    academic_year: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. "2025-2026"
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)  # Monthly recurring?
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)


class FeeDiscount(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Discount/concession: sibling, merit, staff child, etc."""
    __tablename__ = "fee_discounts"

    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Sibling Discount"
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False, default="percentage")  # "percentage" or "fixed"
    value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)  # 10 = 10% or ₹10
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)


class StudentDiscount(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Links a discount to a specific student."""
    __tablename__ = "student_discounts"

    student_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False)
    discount_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("fee_discounts.id"), nullable=False)
    applied_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(300), nullable=True)
