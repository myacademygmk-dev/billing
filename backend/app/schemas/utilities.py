from __future__ import annotations

import uuid
from datetime import date as date_type

from pydantic import BaseModel, Field


class PromoteStudentsRequest(BaseModel):
    from_class: str = Field(min_length=1, max_length=100)
    to_class: str = Field(min_length=1, max_length=100)
    new_batch: str | None = Field(default=None, max_length=20)


class FeeReminderRequest(BaseModel):
    class_name: str | None = Field(default=None, max_length=100)


class WhatsappReceiptRequest(BaseModel):
    payment_id: uuid.UUID


class WhatsappStudentRequest(BaseModel):
    student_id: uuid.UUID


class WhatsappAnnouncementRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=2000)
    class_name: str | None = Field(default=None, max_length=100)


class WhatsappLeaveInfoRequest(BaseModel):
    student_id: uuid.UUID
    date: date_type | None = None
    reason: str | None = Field(default=None, max_length=500)
