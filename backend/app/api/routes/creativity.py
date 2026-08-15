from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin_user
from app.core.database import get_db
from app.models.student_creativity import StudentCreativity
from app.models.user import User

router = APIRouter()


class CreativityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    student_name: str | None = Field(default=None, max_length=200)
    class_name: str | None = Field(default=None, max_length=100)
    file_type: str = Field(pattern=r"^(image|pdf)$")
    file_url: str = Field(min_length=1, max_length=500)
    description: str | None = None
    is_published: bool = True
    display_order: int = 0


@router.post("/")
def create_creativity(
    payload: CreativityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> dict:
    """Create a new student creativity entry."""
    entry = StudentCreativity(
        title=payload.title.strip(),
        student_name=payload.student_name.strip() if payload.student_name else None,
        class_name=payload.class_name.strip() if payload.class_name else None,
        file_type=payload.file_type,
        file_url=payload.file_url.strip(),
        description=payload.description.strip() if payload.description else None,
        is_published=payload.is_published,
        display_order=payload.display_order,
        uploaded_by=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "id": str(entry.id),
        "title": entry.title,
        "student_name": entry.student_name,
        "class_name": entry.class_name,
        "file_type": entry.file_type,
        "file_url": entry.file_url,
        "description": entry.description,
        "is_published": entry.is_published,
        "display_order": entry.display_order,
        "created_at": entry.created_at.isoformat(),
    }


@router.get("/")
def list_creativity(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> list[dict]:
    """List all student creativity entries (admin)."""
    items = db.execute(
        select(StudentCreativity).order_by(StudentCreativity.display_order, StudentCreativity.created_at.desc())
    ).scalars().all()
    return [
        {
            "id": str(i.id),
            "title": i.title,
            "student_name": i.student_name,
            "class_name": i.class_name,
            "file_type": i.file_type,
            "file_url": i.file_url,
            "description": i.description,
            "is_published": i.is_published,
            "display_order": i.display_order,
            "uploaded_by": str(i.uploaded_by) if i.uploaded_by else None,
            "created_at": i.created_at.isoformat(),
        }
        for i in items
    ]


@router.delete("/{entry_id}")
def delete_creativity(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Delete a student creativity entry."""
    entry = db.get(StudentCreativity, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Entry deleted successfully"}
