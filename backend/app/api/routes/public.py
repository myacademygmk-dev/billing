from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.cms import GalleryPhoto, WebContent
from app.models.enums import ContentType
from app.models.institution_settings import InstitutionSettings

router = APIRouter()


@router.get("/institution")
def public_institution(db: Session = Depends(get_db)) -> dict:
    inst = db.get(InstitutionSettings, 1)
    if not inst:
        return {"name": "MY Academy", "tagline": "Educational Institutions", "registration_no": "Regd.No - 469/2016"}
    return {
        "name": inst.name,
        "tagline": inst.tagline,
        "registration_no": inst.registration_no,
        "address": inst.address,
        "phone": inst.phone,
        "email": inst.email,
    }


@router.get("/news")
def public_news(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)) -> list[dict]:
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.news, WebContent.is_published == True)
        .order_by(WebContent.created_at.desc())
        .limit(limit)
    ).scalars().all()
    return [{"id": str(i.id), "title": i.title, "description": i.description, "image_url": i.image_url, "date": i.event_date.isoformat() if i.event_date else i.created_at.date().isoformat()} for i in items]


@router.get("/events")
def public_events(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)) -> list[dict]:
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.event, WebContent.is_published == True)
        .order_by(WebContent.event_date.desc().nulls_last())
        .limit(limit)
    ).scalars().all()
    return [{"id": str(i.id), "title": i.title, "description": i.description, "image_url": i.image_url, "date": i.event_date.isoformat() if i.event_date else None} for i in items]


@router.get("/achievements")
def public_achievements(db: Session = Depends(get_db), year: str | None = None, limit: int = Query(20, ge=1, le=100)) -> list[dict]:
    stmt = select(WebContent).where(WebContent.content_type == ContentType.achievement, WebContent.is_published == True)
    if year:
        stmt = stmt.where(WebContent.year == year)
    items = db.execute(stmt.order_by(WebContent.display_order, WebContent.created_at.desc()).limit(limit)).scalars().all()
    return [{"id": str(i.id), "title": i.title, "student_name": i.student_name, "class_name": i.class_name, "rank": i.rank, "marks": i.marks, "year": i.year, "image_url": i.image_url} for i in items]


@router.get("/gallery")
def public_gallery(db: Session = Depends(get_db), limit: int = Query(20, ge=1, le=100)) -> list[dict]:
    # Get gallery-type content with their photos
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.gallery, WebContent.is_published == True)
        .options(selectinload(WebContent.photos))
        .order_by(WebContent.display_order, WebContent.created_at.desc())
        .limit(limit)
    ).scalars().all()
    results = []
    for item in items:
        results.append({
            "id": str(item.id),
            "title": item.title,
            "description": item.description,
            "photos": [{"url": p.url, "caption": p.caption} for p in item.photos],
        })
    # Also get standalone photos not in any album
    standalone = db.execute(
        select(GalleryPhoto).where(GalleryPhoto.content_id == None).order_by(GalleryPhoto.display_order).limit(50)
    ).scalars().all()
    if standalone:
        results.append({"id": "standalone", "title": "Photos", "description": None, "photos": [{"url": p.url, "caption": p.caption} for p in standalone]})
    return results


@router.get("/circulars")
def public_circulars(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)) -> list[dict]:
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.circular, WebContent.is_published == True)
        .order_by(WebContent.created_at.desc())
        .limit(limit)
    ).scalars().all()
    return [{"id": str(i.id), "title": i.title, "description": i.description, "date": i.event_date.isoformat() if i.event_date else i.created_at.date().isoformat()} for i in items]


# Enquiry submission (public, no auth)
@router.post("/enquiry")
def public_submit_enquiry(payload: dict, db: Session = Depends(get_db)) -> dict:
    """Public contact form submission."""
    from app.models.enquiry import Enquiry

    student_name = payload.get("student_name", "").strip()
    phone = payload.get("phone", "").strip()
    if not student_name or not phone:
        return {"error": "Student name and phone are required"}

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
    return {"message": "Enquiry submitted successfully"}
