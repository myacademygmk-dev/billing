from __future__ import annotations

import json
import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import PaymentCycle
from app.services.public_content_safety import is_local_public_url, pipe_list


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _validate_local_url(value: str | None) -> str | None:
    cleaned = _clean_optional(value)
    if cleaned and not is_local_public_url(cleaned):
        raise ValueError("Use an uploaded file path or local /images/ asset")
    return cleaned


def _validate_local_url_list(value: str | None) -> str | None:
    cleaned = _clean_optional(value)
    if cleaned is None:
        return None
    parts = [part.strip() for part in cleaned.split("|") if part.strip()]
    invalid = [part for part in parts if not is_local_public_url(part)]
    if invalid:
        raise ValueError("Hero slides must use uploaded file paths or local /images/ assets")
    return "|".join(parts)


def _validate_youtube_list(value: str | None) -> str | None:
    cleaned = _clean_optional(value)
    if cleaned is None:
        return None
    valid = pipe_list(cleaned, youtube_only=True)
    raw_parts = [part.strip() for part in cleaned.split("|") if part.strip()]
    if len(valid) != len(raw_parts):
        raise ValueError("Videos must be valid YouTube URLs")
    return "|".join(valid)


def _validate_nested_public_json(value: str | None) -> str | None:
    cleaned = _clean_optional(value)
    if cleaned is None:
        return None
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError("Must be valid JSON") from exc
    if not isinstance(parsed, list):
        raise ValueError("Must be a JSON array")

    def validate_item(item: object) -> None:
        if isinstance(item, list):
            for child in item:
                validate_item(child)
            return
        if not isinstance(item, dict):
            return
        for key, child in item.items():
            key_text = str(key).lower()
            if isinstance(child, str) and any(part in key_text for part in ("url", "image", "photo", "avatar")):
                if not child.strip():
                    continue
                if "video" in key_text or "youtube" in key_text:
                    if not pipe_list(child, youtube_only=True):
                        raise ValueError("Video fields must be valid YouTube URLs")
                elif not is_local_public_url(child.strip()):
                    raise ValueError("Media fields must use uploaded file paths or local /images/ assets")
            else:
                validate_item(child)

    validate_item(parsed)
    return json.dumps(parsed, separators=(",", ":"))


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
    popup_banner_url: str | None = None
    hero_slides: str | None = None
    videos: str | None = None
    countdown_date: str | None = None
    countdown_title: str | None = None
    top_bar_text: str | None = None
    management_team: str | None = None
    technical_team: str | None = None
    former_staff: str | None = None
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
    popup_banner_url: str | None = Field(default=None, max_length=500)
    hero_slides: str | None = Field(default=None)
    videos: str | None = Field(default=None)
    countdown_date: str | None = Field(default=None, max_length=50)
    countdown_title: str | None = Field(default=None, max_length=200)
    top_bar_text: str | None = Field(default=None, max_length=500)
    management_team: str | None = Field(default=None)
    technical_team: str | None = Field(default=None)
    former_staff: str | None = Field(default=None)

    @field_validator("popup_banner_url")
    @classmethod
    def validate_popup_banner_url(cls, value: str | None) -> str | None:
        return _validate_local_url(value)

    @field_validator("hero_slides")
    @classmethod
    def validate_hero_slides(cls, value: str | None) -> str | None:
        return _validate_local_url_list(value)

    @field_validator("videos")
    @classmethod
    def validate_videos(cls, value: str | None) -> str | None:
        return _validate_youtube_list(value)

    @field_validator("alumni_data", "faculty_data", "facilities_data", "management_team", "technical_team", "former_staff")
    @classmethod
    def validate_nested_json_media(cls, value: str | None) -> str | None:
        return _validate_nested_public_json(value)


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
