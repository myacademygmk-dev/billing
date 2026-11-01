from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import ExamType


class ExamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    exam_type: ExamType
    academic_year_id: uuid.UUID
    class_section_id: uuid.UUID | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if not self.name.strip():
            raise ValueError("Exam name is required")
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date")
        return self


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

    model_config = ConfigDict(from_attributes=True)


class MarkEntry(BaseModel):
    student_id: uuid.UUID
    subject_id: uuid.UUID
    marks_obtained: Decimal = Field(ge=0, max_digits=6, decimal_places=2, allow_inf_nan=False)
    max_marks: int = Field(default=100, gt=0, le=9999)
    grade: str | None = Field(default=None, max_length=10)
    remarks: str | None = Field(default=None, max_length=300)

    @model_validator(mode="after")
    def validate_score(self):
        if self.marks_obtained > self.max_marks:
            raise ValueError("Marks cannot exceed the maximum")
        return self


class MarkCreate(MarkEntry):
    exam_id: uuid.UUID


class BulkMarkCreate(BaseModel):
    exam_id: uuid.UUID
    marks: list[MarkEntry] = Field(min_length=1, max_length=5000)


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

    model_config = ConfigDict(from_attributes=True)
