from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ExamType


class Exam(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """An exam instance (e.g., Quarterly Exam Oct 2025 for 10th-A)."""
    __tablename__ = "exams"

    name: Mapped[str] = mapped_column(String(200), nullable=False)  # e.g. "Quarterly Exam - Oct 2025"
    exam_type: Mapped[ExamType] = mapped_column(Enum(ExamType, name="exam_type"), nullable=False)
    academic_year_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    class_section_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("class_sections.id"), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    marks: Mapped[list["Mark"]] = relationship(back_populates="exam", cascade="all, delete-orphan")


class Mark(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A single mark entry: student + subject + exam."""
    __tablename__ = "marks"

    exam_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("exams.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("students.id"), nullable=False)
    subject_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    marks_obtained: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    max_marks: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    grade: Mapped[str | None] = mapped_column(String(10), nullable=True)
    remarks: Mapped[str | None] = mapped_column(String(300), nullable=True)
    entered_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)

    exam: Mapped["Exam"] = relationship(back_populates="marks")
