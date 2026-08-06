from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class AttendanceEntry(BaseModel):
    student_id: uuid.UUID
    status: str = Field(pattern="^(present|absent|late|leave)$")
    remarks: str | None = None


class BulkStudentAttendanceCreate(BaseModel):
    date: date
    entries: list[AttendanceEntry] = Field(min_length=1)


class StudentAttendanceRead(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str | None = None
    student_code: str | None = None
    date: date
    status: str
    remarks: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class StaffAttendanceEntry(BaseModel):
    staff_id: uuid.UUID
    status: str = Field(pattern="^(present|absent|late|leave)$")
    remarks: str | None = None


class BulkStaffAttendanceCreate(BaseModel):
    date: date
    entries: list[StaffAttendanceEntry] = Field(min_length=1)


class StaffAttendanceRead(BaseModel):
    id: uuid.UUID
    staff_id: uuid.UUID
    staff_name: str | None = None
    date: date
    status: str
    remarks: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    total_days: int
    present: int
    absent: int
    late: int
    leave: int
    percentage: float


# --- Staff Clock In/Out Schemas ---


class StaffClockInRequest(BaseModel):
    staff_id: uuid.UUID
    note: str | None = Field(default=None, max_length=200)


class StaffClockOutRequest(BaseModel):
    note: str | None = Field(default=None, max_length=200)


class StaffClockRecordRead(BaseModel):
    id: uuid.UUID
    staff_id: uuid.UUID
    staff_name: str | None = None
    date: date
    clock_in: datetime
    clock_out: datetime | None = None
    clock_in_note: str | None = None
    clock_out_note: str | None = None
    status: str
    total_hours: Decimal | None = None
    recorded_by: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class StaffClockAnalytics(BaseModel):
    staff_id: uuid.UUID
    staff_name: str
    total_days: int
    avg_hours: float
    late_count: int
    on_time_count: int
    total_hours_month: float
