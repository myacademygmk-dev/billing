from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import ContentType


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


class GalleryPhotoRead(BaseModel):
    id: uuid.UUID
    url: str
    thumbnail_url: str | None = None
    caption: str | None = None
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


class GalleryPhotoCreate(BaseModel):
    content_id: uuid.UUID | None = None
    url: str = Field(min_length=1, max_length=500)
    thumbnail_url: str | None = None
    caption: str | None = Field(default=None, max_length=300)
    display_order: int = 0
