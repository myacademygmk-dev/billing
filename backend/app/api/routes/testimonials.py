from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin_user
from app.core.database import get_db
from app.models.testimonial import Testimonial
from app.models.user import User

router = APIRouter()


@router.get("/")
def list_testimonials(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> list[dict]:
    """List all testimonials including unapproved (admin)."""
    items = db.execute(
        select(Testimonial).order_by(Testimonial.submitted_at.desc())
    ).scalars().all()
    return [
        {
            "id": str(i.id),
            "name": i.name,
            "role": i.role,
            "message": i.message,
            "rating": i.rating,
            "is_approved": i.is_approved,
            "is_published": i.is_published,
            "photo_url": i.photo_url,
            "submitted_at": i.submitted_at.isoformat(),
            "created_at": i.created_at.isoformat(),
        }
        for i in items
    ]


@router.patch("/{testimonial_id}/approve")
def approve_testimonial(
    testimonial_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Approve and publish a testimonial."""
    testimonial = db.get(Testimonial, testimonial_id)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    testimonial.is_approved = True
    testimonial.is_published = True
    db.commit()
    db.refresh(testimonial)
    return {
        "id": str(testimonial.id),
        "name": testimonial.name,
        "is_approved": testimonial.is_approved,
        "is_published": testimonial.is_published,
        "message": "Testimonial approved and published",
    }


@router.delete("/{testimonial_id}")
def delete_testimonial(
    testimonial_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Delete a testimonial."""
    testimonial = db.get(Testimonial, testimonial_id)
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    db.delete(testimonial)
    db.commit()
    return {"message": "Testimonial deleted successfully"}
