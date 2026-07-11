from __future__ import annotations

import uuid
from datetime import date, datetime

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
