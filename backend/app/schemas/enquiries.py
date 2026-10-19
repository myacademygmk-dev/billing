from __future__ import annotations

from datetime import date
import re

from pydantic import BaseModel, Field, field_validator


_PHONE_RE = re.compile(r"^\+?[0-9][0-9\s().-]{6,18}$")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.strip().split())
    return cleaned or None


class EnquirySubmit(BaseModel):
    student_name: str = Field(min_length=1, max_length=200)
    phone: str = Field(min_length=1, max_length=20)
    parent_name: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=200)
    standard: str | None = Field(default=None, max_length=50)
    board: str | None = Field(default=None, max_length=50)
    message: str | None = Field(default=None, max_length=2000)
    source: str | None = Field(default="website", max_length=50)

    @field_validator("student_name", "phone")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned:
            raise ValueError("field is required")
        return cleaned

    @field_validator("parent_name", "email", "standard", "board", "message", "source")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        return _clean_optional_text(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not _PHONE_RE.match(value):
            raise ValueError("Enter a valid phone number")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        if value and not _EMAIL_RE.match(value):
            raise ValueError("Enter a valid email address")
        return value


class EnquiryUpdate(BaseModel):
    status: str | None = Field(default=None, max_length=30)
    follow_up_date: date | None = None
    follow_up_notes: str | None = Field(default=None, max_length=2000)
    source: str | None = Field(default=None, max_length=50)
