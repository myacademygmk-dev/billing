from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class FeeStructureCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    amount: Decimal
    description: str | None = None
    class_name: str | None = Field(default=None, max_length=100)
    academic_year: str | None = Field(default=None, max_length=20)
    is_recurring: bool = True
    is_active: bool = True


class FeeStructureRead(BaseModel):
    id: uuid.UUID
    name: str
    amount: Decimal
    description: str | None = None
    class_name: str | None = None
    academic_year: str | None = None
    is_recurring: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FeeDiscountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    discount_type: str = Field(default="percentage", pattern="^(percentage|fixed)$")
    value: Decimal
    description: str | None = None


class FeeDiscountRead(BaseModel):
    id: uuid.UUID
    name: str
    discount_type: str
    value: Decimal
    description: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StudentDiscountCreate(BaseModel):
    student_id: uuid.UUID
    discount_id: uuid.UUID
    notes: str | None = Field(default=None, max_length=300)


class StudentDiscountRead(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    discount_id: uuid.UUID
    discount_name: str | None = None
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
