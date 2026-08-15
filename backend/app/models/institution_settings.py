from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, String, Text, Uuid, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class InstitutionSettings(Base):
    __tablename__ = "institution_settings"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(200), nullable=False, default="MY Academy")
    tagline: Mapped[str] = mapped_column(String(300), nullable=False, default="Educational Institutions")
    registration_no: Mapped[str] = mapped_column(String(100), nullable=False, default="Regd.No - 469/2016")
    address: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True, default=None)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True, default=None)

    # Website configuration
    marquee_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # pipe-separated announcements
    stats_students: Mapped[str | None] = mapped_column(String(20), nullable=True, default="200+")
    stats_staff: Mapped[str | None] = mapped_column(String(20), nullable=True, default="22")
    stats_years: Mapped[str | None] = mapped_column(String(20), nullable=True, default="15+")
    stats_standards: Mapped[str | None] = mapped_column(String(20), nullable=True, default="LKG-12")
    hero_title: Mapped[str | None] = mapped_column(String(200), nullable=True, default="MY ACADEMY")
    hero_subtitle: Mapped[str | None] = mapped_column(String(300), nullable=True, default="Gain More Knowledge")
    hero_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    admission_text: Mapped[str | None] = mapped_column(String(200), nullable=True, default="Admissions Open for 2025-2026")
    alumni_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of alumni details
    faculty_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of faculty details
    facilities_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of facilities
    popup_banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # URL of popup banner image
    hero_slides: Mapped[str | None] = mapped_column(Text, nullable=True)  # pipe-separated image URLs for hero slideshow
    videos: Mapped[str | None] = mapped_column(Text, nullable=True)  # pipe-separated YouTube URLs
    countdown_date: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ISO date for countdown
    countdown_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    top_bar_text: Mapped[str | None] = mapped_column(String(500), nullable=True)  # custom top bar text
    management_team: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    technical_team: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    former_staff: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of retired/old staff

    updated_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
