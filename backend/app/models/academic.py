from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class AcademicYear(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Represents an academic year like 2025-2026."""
    __tablename__ = "academic_years"

    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # e.g. "2025-2026"
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    classes: Mapped[list["ClassSection"]] = relationship(back_populates="academic_year", cascade="all, delete-orphan")


class ClassSection(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A class-section in a specific academic year (e.g., 10-A in 2025-2026)."""
    __tablename__ = "class_sections"

    academic_year_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    class_name: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "10th"
    section: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. "A"
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    academic_year: Mapped["AcademicYear"] = relationship(back_populates="classes")
    subjects: Mapped[list["Subject"]] = relationship(back_populates="class_section", cascade="all, delete-orphan")


class Subject(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A subject offered in a specific class-section."""
    __tablename__ = "subjects"

    class_section_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("class_sections.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Mathematics"
    code: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. "MATH"
    max_marks: Mapped[int] = mapped_column(Integer, nullable=False, default=100)

    class_section: Mapped["ClassSection"] = relationship(back_populates="subjects")
