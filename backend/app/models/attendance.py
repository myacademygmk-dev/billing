from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AttendanceStatus:
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    LEAVE = "leave"


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
