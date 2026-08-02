from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import PaymentCycle


class BillingSettingsRead(BaseModel):
    cycle_mode: PaymentCycle
    cycle_months: int
    updated_at: datetime
    updated_by: uuid.UUID | None


class BillingSettingsUpdate(BaseModel):
    cycle_mode: PaymentCycle


class InstitutionSettingsRead(BaseModel):
    name: str
    tagline: str
    registration_no: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    marquee_text: str | None = None
    stats_students: str | None = None
    stats_staff: str | None = None
    stats_years: str | None = None
    stats_standards: str | None = None
    hero_title: str | None = None
    hero_subtitle: str | None = None
    hero_description: str | None = None
    admission_text: str | None = None
    alumni_data: str | None = None
    faculty_data: str | None = None
    facilities_data: str | None = None
    updated_at: datetime
    updated_by: uuid.UUID | None


class InstitutionSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    tagline: str | None = Field(default=None, max_length=300)
    registration_no: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=200)
    marquee_text: str | None = Field(default=None)
    stats_students: str | None = Field(default=None, max_length=20)
    stats_staff: str | None = Field(default=None, max_length=20)
    stats_years: str | None = Field(default=None, max_length=20)
    stats_standards: str | None = Field(default=None, max_length=20)
    hero_title: str | None = Field(default=None, max_length=200)
    hero_subtitle: str | None = Field(default=None, max_length=300)
    hero_description: str | None = Field(default=None)
    admission_text: str | None = Field(default=None, max_length=200)
    alumni_data: str | None = Field(default=None)
    faculty_data: str | None = Field(default=None)
    facilities_data: str | None = Field(default=None)


class DatabaseResetRequest(BaseModel):
    confirmation_text: str


class DatabaseResetRead(BaseModel):
    students_deleted: int
    payments_deleted: int
    billing_periods_deleted: int
    fee_records_deleted: int
    receipt_sequence_reset: bool
    billing_cycle_reset_to_default: bool


class RandomBillField(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    value: str = Field(min_length=1, max_length=300)


class RandomBillRequest(BaseModel):
    file_name: str | None = Field(default=None, max_length=50)
    fields: list[RandomBillField] = Field(min_length=1, max_length=12)
