from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AttendanceStatus:
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    LEAVE = "leave"


class ClockStatus:
    PRESENT = "present"
    LATE = "late"
    HALF_DAY = "half_day"
    ABSENT = "absent"


class StudentAttendance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Daily student attendance record."""
    __tablename__ = "student_attendance"

    student_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="present")  # present/absent/late/leave
    remarks: Mapped[str | None] = mapped_column(String(300), nullable=True)
    marked_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        # One record per student per day
        {"comment": "unique constraint handled by uq_student_attendance_date"},
    )


class StaffAttendance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Daily staff attendance record."""
    __tablename__ = "staff_attendance"

    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("staff.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="present")  # present/absent/late/leave
    remarks: Mapped[str | None] = mapped_column(String(300), nullable=True)
    marked_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)


class StaffClockRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Staff clock-in/clock-out attendance record."""

    __tablename__ = "staff_clock_records"

    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("staff.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    clock_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    clock_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    clock_in_note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    clock_out_note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    recorded_by: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="present")  # present/late/half_day/absent
    total_hours: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
