from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class StudentCreativity(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "student_creativity"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    student_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    class_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'image' or 'pdf'
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
