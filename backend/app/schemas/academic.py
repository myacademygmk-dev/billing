from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class AcademicYearCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicYearRead(BaseModel):
    id: uuid.UUID
    name: str
    start_date: date
    end_date: date
    is_current: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SubjectRead(BaseModel):
    id: uuid.UUID
    name: str
    code: str | None = None
    max_marks: int

    class Config:
        from_attributes = True


class ClassSectionCreate(BaseModel):
    academic_year_id: uuid.UUID
    class_name: str = Field(min_length=1, max_length=50)
    section: str | None = Field(default=None, max_length=20)
    display_order: int = 0


class ClassSectionRead(BaseModel):
    id: uuid.UUID
    academic_year_id: uuid.UUID
    class_name: str
    section: str | None = None
    display_order: int
    subjects: list[SubjectRead] = []
    created_at: datetime

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    class_section_id: uuid.UUID
    name: str = Field(min_length=1, max_length=100)
    code: str | None = Field(default=None, max_length=20)
    max_marks: int = 100
