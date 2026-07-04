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
    updated_at: datetime
    updated_by: uuid.UUID | None


class InstitutionSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    tagline: str | None = Field(default=None, max_length=300)
    registration_no: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=200)


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
