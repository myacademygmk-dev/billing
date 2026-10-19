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
from app.schemas.enquiries import EnquirySubmit, EnquiryUpdate

router = APIRouter()


# --- Public endpoint (no auth) ---

@router.post("/submit", status_code=201)
def submit_enquiry(
    payload: EnquirySubmit,
    db: Session = Depends(get_db),
) -> dict:
    """Public contact form submission — no auth required."""
    enquiry = Enquiry(
        student_name=payload.student_name.strip(),
        parent_name=payload.parent_name.strip() if payload.parent_name else None,
        phone=payload.phone.strip(),
        email=payload.email.strip() if payload.email else None,
        standard=payload.standard.strip() if payload.standard else None,
        board=payload.board.strip() if payload.board else None,
        message=payload.message.strip() if payload.message else None,
        source=payload.source.strip() if payload.source else "website",
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
    payload: EnquiryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> dict:
    """Update enquiry status, follow-up, notes."""
    enquiry = db.get(Enquiry, enquiry_id)
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(enquiry, field, value)
    if payload.status == "enrolled":
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
