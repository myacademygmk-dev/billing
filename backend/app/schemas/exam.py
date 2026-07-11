from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import ExamType


class ExamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    exam_type: ExamType
    academic_year_id: uuid.UUID
    class_section_id: uuid.UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None


class ExamRead(BaseModel):
    id: uuid.UUID
    name: str
    exam_type: ExamType
    academic_year_id: uuid.UUID
    class_section_id: uuid.UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class MarkEntry(BaseModel):
    student_id: uuid.UUID
    subject_id: uuid.UUID
    marks_obtained: Decimal
    max_marks: int = 100
    grade: str | None = None
    remarks: str | None = None


class MarkCreate(BaseModel):
    exam_id: uuid.UUID
    student_id: uuid.UUID
    subject_id: uuid.UUID
    marks_obtained: Decimal
    max_marks: int = 100
    grade: str | None = None
    remarks: str | None = None


class BulkMarkCreate(BaseModel):
    exam_id: uuid.UUID
    marks: list[MarkEntry] = Field(min_length=1)


class MarkRead(BaseModel):
    id: uuid.UUID
    exam_id: uuid.UUID
    student_id: uuid.UUID
    subject_id: uuid.UUID
    marks_obtained: Decimal
    max_marks: int
    grade: str | None = None
    remarks: str | None = None
    student_name: str | None = None
    subject_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
