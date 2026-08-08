from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import Gender, StaffRole, StaffStatus


class StaffCreate(BaseModel):
    staff_code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=200)
    role: StaffRole = StaffRole.teacher
    date_of_birth: date | None = None
    gender: Gender | None = None
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    photo_url: str | None = None
    address: str | None = None
    qualification: str | None = Field(default=None, max_length=300)
    designation: str | None = Field(default=None, max_length=200)
    specialization: str | None = Field(default=None, max_length=300)
    subjects: str | None = None
    classes_assigned: str | None = None
    experience: str | None = Field(default=None, max_length=100)
    joining_date: date | None = None
    monthly_salary: Decimal | None = None
    notes: str | None = None


class StaffUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    role: StaffRole | None = None
    status: StaffStatus | None = None
    date_of_birth: date | None = None
    gender: Gender | None = None
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    photo_url: str | None = None
    address: str | None = None
    qualification: str | None = Field(default=None, max_length=300)
    designation: str | None = Field(default=None, max_length=200)
    specialization: str | None = Field(default=None, max_length=300)
    subjects: str | None = None
    classes_assigned: str | None = None
    experience: str | None = Field(default=None, max_length=100)
    joining_date: date | None = None
    leaving_date: date | None = None
    monthly_salary: Decimal | None = None
    notes: str | None = None


class StaffRead(BaseModel):
    id: uuid.UUID
    staff_code: str
    name: str
    role: StaffRole
    status: StaffStatus
    date_of_birth: date | None = None
    gender: Gender | None = None
    phone: str | None = None
    email: str | None = None
    photo_url: str | None = None
    address: str | None = None
    qualification: str | None = None
    designation: str | None = None
    specialization: str | None = None
    subjects: str | None = None
    classes_assigned: str | None = None
    experience: str | None = None
    joining_date: date | None = None
    leaving_date: date | None = None
    monthly_salary: Decimal | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SalaryRecordCreate(BaseModel):
    staff_id: uuid.UUID
    month: date
    amount: Decimal
    deductions: Decimal = Decimal("0")
    net_amount: Decimal
    mode: str | None = Field(default=None, max_length=50)
    notes: str | None = None


class SalaryRecordRead(BaseModel):
    id: uuid.UUID
    staff_id: uuid.UUID
    staff_name: str | None = None
    month: date
    amount: Decimal
    deductions: Decimal
    net_amount: Decimal
    mode: str | None = None
    paid_at: datetime | None = None
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
