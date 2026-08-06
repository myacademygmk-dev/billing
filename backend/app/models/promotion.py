"""Promotion history and student arrears models for academic rollover."""
from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PromotionHistory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Tracks every student promotion/rollover between academic years."""

    __tablename__ = "promotion_history"

    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False
    )
    from_class: Mapped[str] = mapped_column(String(100), nullable=False)
    to_class: Mapped[str] = mapped_column(String(100), nullable=False)
    from_batch: Mapped[str | None] = mapped_column(String(20), nullable=True)
    to_batch: Mapped[str | None] = mapped_column(String(20), nullable=True)
    from_student_code: Mapped[str] = mapped_column(String(50), nullable=False)
    to_student_code: Mapped[str] = mapped_column(String(50), nullable=False)
    from_academic_year_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_years.id"), nullable=True
    )
    to_academic_year_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_years.id"), nullable=True
    )
    old_fee_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    new_fee_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    promoted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )
    promoted_by: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="promotion_history")
    from_academic_year: Mapped["AcademicYear | None"] = relationship(foreign_keys=[from_academic_year_id])
    to_academic_year: Mapped["AcademicYear | None"] = relationship(foreign_keys=[to_academic_year_id])


class StudentArrears(Base, UUIDPrimaryKeyMixin):
    """Pending fee carried forward from a previous academic year."""

    __tablename__ = "student_arrears"

    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False
    )
    from_academic_year_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_years.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_cleared: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    cleared_payment_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("payments.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    # Relationships
    student: Mapped["Student"] = relationship(back_populates="arrears")
    from_academic_year: Mapped["AcademicYear"] = relationship(foreign_keys=[from_academic_year_id])
