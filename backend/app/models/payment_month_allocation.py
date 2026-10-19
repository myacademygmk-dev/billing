from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PaymentMonthAllocation(Base):
    """Immutable month snapshot used to reproduce a payment's receipt."""

    __tablename__ = "payment_month_allocations"
    __table_args__ = (
        Index("ix_payment_month_allocations_student_period", "student_id", "period_month"),
    )

    payment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("payments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    period_month: Mapped[date] = mapped_column(Date, primary_key=True)
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        server_default=func.now(),
    )

    payment: Mapped["Payment"] = relationship(back_populates="allocation_history")
