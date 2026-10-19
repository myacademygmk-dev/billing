from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ContentType
from app.services.public_content_safety import is_local_public_url


def _validate_local_media_url(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if not is_local_public_url(cleaned):
        raise ValueError("Use an uploaded file path or local /images/ asset")
    return cleaned


class WebContentCreate(BaseModel):
    content_type: ContentType
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    image_url: str | None = None
    event_date: date | None = None
    is_published: bool = True
    display_order: int = 0
    # Achievement fields
    student_name: str | None = None
    class_name: str | None = None
    rank: str | None = None
    marks: str | None = None
    year: str | None = None

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        return _validate_local_media_url(value)


class WebContentUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = None
    image_url: str | None = None
    event_date: date | None = None
    is_published: bool | None = None
    display_order: int | None = None
    student_name: str | None = None
    class_name: str | None = None
    rank: str | None = None
    marks: str | None = None
    year: str | None = None

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        return _validate_local_media_url(value)


class GalleryPhotoRead(BaseModel):
    id: uuid.UUID
    url: str
    thumbnail_url: str | None = None
    caption: str | None = None
    display_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebContentRead(BaseModel):
    id: uuid.UUID
    content_type: ContentType
    title: str
    description: str | None = None
    image_url: str | None = None
    event_date: date | None = None
    is_published: bool
    display_order: int
    student_name: str | None = None
    class_name: str | None = None
    rank: str | None = None
    marks: str | None = None
    year: str | None = None
    photos: list[GalleryPhotoRead] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GalleryPhotoCreate(BaseModel):
    content_id: uuid.UUID | None = None
    url: str = Field(min_length=1, max_length=500)
    thumbnail_url: str | None = None
    caption: str | None = Field(default=None, max_length=300)
    display_order: int = 0

    @field_validator("url", "thumbnail_url")
    @classmethod
    def validate_media_url(cls, value: str | None) -> str | None:
        return _validate_local_media_url(value)
