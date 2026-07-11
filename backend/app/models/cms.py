from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ContentType


class WebContent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """CMS content: news, events, achievements, gallery items, circulars."""
    __tablename__ = "web_contents"

    content_type: Mapped[ContentType] = mapped_column(Enum(ContentType, name="content_type"), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # For achievements
    student_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    rank: Mapped[str | None] = mapped_column(String(50), nullable=True)
    marks: Mapped[str | None] = mapped_column(String(50), nullable=True)
    year: Mapped[str | None] = mapped_column(String(20), nullable=True)

    photos: Mapped[list["GalleryPhoto"]] = relationship(back_populates="content", cascade="all, delete-orphan")


class GalleryPhoto(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Individual photos in a gallery album/content."""
    __tablename__ = "gallery_photos"

    content_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("web_contents.id"), nullable=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    caption: Mapped[str | None] = mapped_column(String(300), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    content: Mapped["WebContent | None"] = relationship(back_populates="photos")
