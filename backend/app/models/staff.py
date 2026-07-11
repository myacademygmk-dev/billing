from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Gender, StaffRole, StaffStatus


class Staff(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "staff"

    staff_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[StaffRole] = mapped_column(Enum(StaffRole, name="staff_role_type"), nullable=False, default=StaffRole.teacher)
    status: Mapped[StaffStatus] = mapped_column(Enum(StaffStatus, name="staff_status_type"), nullable=False, default=StaffStatus.active)

    # Personal details
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender, name="gender_type", create_constraint=False), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Professional
    qualification: Mapped[str | None] = mapped_column(String(300), nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(300), nullable=True)
    subjects: Mapped[str | None] = mapped_column(Text, nullable=True)  # Comma-separated or JSON
    classes_assigned: Mapped[str | None] = mapped_column(Text, nullable=True)  # Comma-separated
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    leaving_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Salary
    monthly_salary: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Link to user account (optional)
    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    salary_records: Mapped[list["SalaryRecord"]] = relationship(back_populates="staff", cascade="all, delete-orphan")


class SalaryRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "salary_records"

    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("staff.id"), nullable=False)
    month: Mapped[date] = mapped_column(Date, nullable=False)  # First of the month
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    deductions: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    mode: Mapped[str | None] = mapped_column(String(50), nullable=True)  # cash/upi/bank
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    staff: Mapped["Staff"] = relationship(back_populates="salary_records")
