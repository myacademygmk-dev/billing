from __future__ import annotations

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import Gender, StudentStatus


class Student(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "students"

    serial_no: Mapped[int | None] = mapped_column(Integer, nullable=True)
    student_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payment_period: Mapped[str | None] = mapped_column(String(50), nullable=True)
    joined_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    batch: Mapped[str | None] = mapped_column(String(20), nullable=True)
    batch_start_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    billing_start_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    billing_end_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    academic_year_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("academic_years.id"), nullable=True
    )
    status: Mapped[StudentStatus] = mapped_column(
        Enum(StudentStatus, name="student_status"), nullable=False, default=StudentStatus.active
    )

    # Extended profile fields
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender, name="gender_type"), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    admission_no: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Parent/Guardian details
    father_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    mother_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    guardian_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    parent_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    parent_phone_2: Mapped[str | None] = mapped_column(String(20), nullable=True)
    parent_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    parent_occupation: Mapped[str | None] = mapped_column(String(200), nullable=True)
    whatsapp_no: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Address
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Academic
    previous_school: Mapped[str | None] = mapped_column(String(300), nullable=True)
    school_name: Mapped[str | None] = mapped_column(String(300), nullable=True)  # Current school name
    subjects: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON or comma-separated
    hobbies: Mapped[str | None] = mapped_column(Text, nullable=True)
    student_email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    father_occupation: Mapped[str | None] = mapped_column(String(200), nullable=True)
    mother_occupation: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_no: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Student's own contact

    # Emergency
    emergency_contact: Mapped[str | None] = mapped_column(String(200), nullable=True)
    emergency_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    fee: Mapped["StudentFee"] = relationship(
        back_populates="student", cascade="all, delete-orphan", uselist=False
    )
    payments: Mapped[list["Payment"]] = relationship(back_populates="student")
    billing_periods: Mapped[list["StudentBillingPeriod"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
    savings_entries: Mapped[list["SavingsEntry"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
    academic_year: Mapped["AcademicYear | None"] = relationship(foreign_keys=[academic_year_id])
    promotion_history: Mapped[list["PromotionHistory"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
    arrears: Mapped[list["StudentArrears"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
