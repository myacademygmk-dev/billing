"""Enquiry routes: public contact form + admin pipeline management."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.enquiry import Enquiry
from app.models.user import User

router = APIRouter()


# --- Public endpoint (no auth) ---

@router.post("/submit", status_code=201)
def submit_enquiry(
    payload: dict,
    db: Session = Depends(get_db),
) -> dict:
    """Public contact form submission — no auth required."""
    student_name = payload.get("student_name", "").strip()
    phone = payload.get("phone", "").strip()
    if not student_name or not phone:
        raise HTTPException(status_code=422, detail="Student name and phone are required")

    enquiry = Enquiry(
        student_name=student_name,
        parent_name=payload.get("parent_name", "").strip() or None,
        phone=phone,
        email=payload.get("email", "").strip() or None,
        standard=payload.get("standard", "").strip() or None,
        board=payload.get("board", "").strip() or None,
        message=payload.get("message", "").strip() or None,
        source=payload.get("source", "website"),
    )
    db.add(enquiry)
    db.commit()
    return {"message": "Enquiry submitted successfully. We will contact you soon."}


# --- Admin endpoints ---

@router.get("", response_model=dict)
def list_enquiries(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(Enquiry)
    if status:
        stmt = stmt.where(Enquiry.status == status)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(Enquiry.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return {
        "items": [_enquiry_dict(e) for e in items],
        "total": total,
    }


@router.patch("/{enquiry_id}", response_model=dict)
def update_enquiry(
    enquiry_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Update enquiry status, follow-up, notes."""
    enquiry = db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    for field in ["status", "follow_up_notes", "source"]:
        if field in payload:
            setattr(enquiry, field, payload[field])
    if "follow_up_date" in payload:
        enquiry.follow_up_date = payload["follow_up_date"] if payload["follow_up_date"] else None
    if payload.get("status") == "enrolled":
        enquiry.converted_at = datetime.now(UTC)
    enquiry.assigned_to = current_user.id
    db.commit()
    db.refresh(enquiry)
    return _enquiry_dict(enquiry)


@router.delete("/{enquiry_id}", status_code=204, response_class=Response, response_model=None)
def delete_enquiry(
    enquiry_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> Response:
    enquiry = db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    db.delete(enquiry)
    db.commit()
    return Response(status_code=204)


def _enquiry_dict(e: Enquiry) -> dict:
    return {
        "id": str(e.id),
        "student_name": e.student_name,
        "parent_name": e.parent_name,
        "phone": e.phone,
        "email": e.email,
        "standard": e.standard,
        "board": e.board,
        "message": e.message,
        "source": e.source,
        "status": e.status,
        "follow_up_date": e.follow_up_date.isoformat() if e.follow_up_date else None,
        "follow_up_notes": e.follow_up_notes,
        "converted_at": e.converted_at.isoformat() if e.converted_at else None,
        "created_at": e.created_at.isoformat(),
    }
