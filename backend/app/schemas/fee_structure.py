from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


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

    model_config = ConfigDict(from_attributes=True)


class FeeDiscountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    discount_type: str = Field(default="percentage", pattern="^(percentage|fixed)$")
    value: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str | None = None

    @model_validator(mode="after")
    def validate_value_for_type(self) -> "FeeDiscountCreate":
        if self.discount_type == "percentage" and self.value > Decimal("100"):
            raise ValueError("Percentage discount cannot exceed 100")
        return self


class FeeDiscountRead(BaseModel):
    id: uuid.UUID
    name: str
    discount_type: str
    value: Decimal
    description: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)
