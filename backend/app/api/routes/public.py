from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from threading import Lock
from time import time

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.cms import GalleryPhoto, WebContent
from app.models.enums import ContentType
from app.models.institution_settings import InstitutionSettings
from app.models.student_creativity import StudentCreativity
from app.models.testimonial import Testimonial
from app.schemas.enquiries import EnquirySubmit
from app.services.public_content_safety import IMAGE_CONTENT_TYPES, pipe_list, safe_public_url

router = APIRouter()

_FORM_RATE_LIMIT: dict[str, list[float]] = {}
_FORM_RATE_LIMIT_LOCK = Lock()
_FORM_WINDOW_SECONDS = 60 * 10
_FORM_MAX_SUBMISSIONS = 5
_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_public_form_rate_limit(request: Request) -> None:
    key = _client_key(request)
    now = time()
    with _FORM_RATE_LIMIT_LOCK:
        for existing_key, timestamps in list(_FORM_RATE_LIMIT.items()):
            active = [t for t in timestamps if now - t < _FORM_WINDOW_SECONDS]
            if active:
                _FORM_RATE_LIMIT[existing_key] = active
            else:
                del _FORM_RATE_LIMIT[existing_key]
        attempts = [t for t in _FORM_RATE_LIMIT.get(key, []) if now - t < _FORM_WINDOW_SECONDS]
        if len(attempts) >= _FORM_MAX_SUBMISSIONS:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many submissions. Please try again later.")
        attempts.append(now)
        _FORM_RATE_LIMIT[key] = attempts


def _public_key(prefix: str, title: str | None, order: int = 0) -> str:
    slug = _SLUG_RE.sub("-", (title or prefix).strip().lower()).strip("-")[:48]
    return f"{prefix}-{order}-{slug or 'item'}"


def _uploaded_file_url_is_public(db: Session, value: str | None, *, images_only: bool = True) -> bool:
    if not value or not value.startswith("/api/uploads/files/"):
        return True
    filename = value.rsplit("/", 1)[-1]
    from app.models.file_upload import FileUpload

    record = db.execute(select(FileUpload).where(FileUpload.filename == filename)).scalar_one_or_none()
    if not record:
        return False
    return (not images_only) or record.content_type in IMAGE_CONTENT_TYPES


def _safe_uploaded_url(db: Session, value: str | None, *, images_only: bool = True) -> str | None:
    url = safe_public_url(value)
    if url and _uploaded_file_url_is_public(db, url, images_only=images_only):
        return url
    return None


def _sanitize_public_json(value: object, db: Session) -> object:
    if isinstance(value, list):
        return [_sanitize_public_json(item, db) for item in value]
    if isinstance(value, dict):
        sanitized: dict[str, object] = {}
        for key, item in value.items():
            key_text = str(key).lower()
            if isinstance(item, str) and any(part in key_text for part in ("url", "image", "photo", "avatar")):
                if "video" in key_text or "youtube" in key_text:
                    sanitized[key] = pipe_list(item, youtube_only=True)[0] if pipe_list(item, youtube_only=True) else None
                else:
                    sanitized[key] = _safe_uploaded_url(db, item, images_only="pdf" not in key_text and "file" not in key_text)
            else:
                sanitized[key] = _sanitize_public_json(item, db)
        return sanitized
    return value


def _parse_json_field(value: str | None, db: Session) -> list | None:
    """Safely parse a JSON string field into a list."""
    if not value:
        return None
    try:
        parsed = json.loads(value)
        return _sanitize_public_json(parsed, db) if isinstance(parsed, list) else None
    except (json.JSONDecodeError, TypeError):
        return None


@router.get("/institution")
def public_institution(db: Session = Depends(get_db)) -> dict:
    inst = db.get(InstitutionSettings, 1)
    if not inst:
        return {}

    # Parse marquee_text (pipe-separated) into announcements list
    announcements: list[str] = []
    if inst.marquee_text:
        announcements = [a.strip() for a in inst.marquee_text.split("|") if a.strip()]

    return {
        "name": inst.name,
        "tagline": inst.tagline,
        "registration_no": inst.registration_no,
        "address": inst.address,
        "phone": inst.phone,
        "email": inst.email,
        "announcements": announcements,
        "stats": {
            "students": inst.stats_students,
            "staff": inst.stats_staff,
            "years": inst.stats_years,
            "standards": inst.stats_standards,
        },
        "hero": {
            "title": inst.hero_title,
            "subtitle": inst.hero_subtitle,
            "description": inst.hero_description,
        },
        "admission_text": inst.admission_text,
    }


@router.get("/website-config")
def public_website_config(db: Session = Depends(get_db)) -> dict:
    """Returns all website configuration for the public site."""
    inst = db.get(InstitutionSettings, 1)
    if not inst:
        return {}

    # Parse marquee_text (pipe-separated) into announcements list
    announcements: list[str] = []
    if inst.marquee_text:
        announcements = [a.strip() for a in inst.marquee_text.split("|") if a.strip()]

    return {
        "institution": {
            "name": inst.name,
            "tagline": inst.tagline,
            "registration_no": inst.registration_no,
            "address": inst.address,
            "phone": inst.phone,
            "email": inst.email,
        },
        "announcements": announcements,
        "stats": {
            "students": inst.stats_students,
            "staff": inst.stats_staff,
            "years": inst.stats_years,
            "standards": inst.stats_standards,
        },
        "hero": {
            "title": inst.hero_title,
            "subtitle": inst.hero_subtitle,
            "description": inst.hero_description,
        },
        "admission_text": inst.admission_text,
        "alumni": _parse_json_field(inst.alumni_data, db),
        "faculty": _parse_json_field(inst.faculty_data, db),
        "facilities": _parse_json_field(inst.facilities_data, db),
        "popup_banner_url": _safe_uploaded_url(db, inst.popup_banner_url),
        "hero_slides": [url for url in pipe_list(inst.hero_slides) if _uploaded_file_url_is_public(db, url)],
        "videos": pipe_list(inst.videos, youtube_only=True),
        "countdown_date": inst.countdown_date,
        "countdown_title": inst.countdown_title,
        "top_bar_text": inst.top_bar_text,
        "management_team": _parse_json_field(inst.management_team, db),
        "technical_team": _parse_json_field(inst.technical_team, db),
        "former_staff": _parse_json_field(inst.former_staff, db),
    }


@router.get("/news")
def public_news(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)) -> list[dict]:
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.news, WebContent.is_published == True)
        .order_by(WebContent.created_at.desc())
        .limit(limit)
    ).scalars().all()
    return [{"id": _public_key("news", i.title, i.display_order), "title": i.title, "description": i.description, "image_url": _safe_uploaded_url(db, i.image_url), "date": i.event_date.isoformat() if i.event_date else i.created_at.date().isoformat()} for i in items]


@router.get("/events")
def public_events(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)) -> list[dict]:
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.event, WebContent.is_published == True)
        .order_by(WebContent.event_date.desc().nulls_last())
        .limit(limit)
    ).scalars().all()
    return [{"id": _public_key("event", i.title, i.display_order), "title": i.title, "description": i.description, "image_url": _safe_uploaded_url(db, i.image_url), "date": i.event_date.isoformat() if i.event_date else None} for i in items]


@router.get("/achievements")
def public_achievements(db: Session = Depends(get_db), year: str | None = None, limit: int = Query(20, ge=1, le=100)) -> list[dict]:
    stmt = select(WebContent).where(WebContent.content_type == ContentType.achievement, WebContent.is_published == True)
    if year:
        stmt = stmt.where(WebContent.year == year)
    items = db.execute(stmt.order_by(WebContent.display_order, WebContent.created_at.desc()).limit(limit)).scalars().all()
    return [{"id": _public_key("achievement", i.title or i.student_name, i.display_order), "title": i.title, "student_name": i.student_name, "class_name": i.class_name, "rank": i.rank, "marks": i.marks, "year": i.year, "image_url": _safe_uploaded_url(db, i.image_url)} for i in items]


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
            "id": _public_key("gallery", item.title, item.display_order),
            "title": item.title,
            "description": item.description,
            "photos": [{"url": url, "caption": p.caption} for p in item.photos if (url := _safe_uploaded_url(db, p.url))],
        })
    # Also get standalone photos not in any album
    standalone = db.execute(
        select(GalleryPhoto).where(GalleryPhoto.content_id == None).order_by(GalleryPhoto.display_order).limit(50)
    ).scalars().all()
    if standalone:
        photos = [{"url": url, "caption": p.caption} for p in standalone if (url := _safe_uploaded_url(db, p.url))]
        if photos:
            results.append({"id": "standalone", "title": "Photos", "description": None, "photos": photos})
    return results


@router.get("/circulars")
def public_circulars(db: Session = Depends(get_db), limit: int = Query(10, ge=1, le=50)) -> list[dict]:
    items = db.execute(
        select(WebContent)
        .where(WebContent.content_type == ContentType.circular, WebContent.is_published == True)
        .order_by(WebContent.created_at.desc())
        .limit(limit)
    ).scalars().all()
    return [{"id": _public_key("circular", i.title, i.display_order), "title": i.title, "description": i.description, "date": i.event_date.isoformat() if i.event_date else i.created_at.date().isoformat()} for i in items]


# Enquiry submission (public, no auth)
@router.post("/enquiry")
def public_submit_enquiry(payload: EnquirySubmit, request: Request, db: Session = Depends(get_db)) -> dict:
    """Public contact form submission."""
    from app.models.enquiry import Enquiry

    _check_public_form_rate_limit(request)
    duplicate = db.execute(
        select(Enquiry).where(
            Enquiry.phone == payload.phone,
            Enquiry.student_name == payload.student_name,
            Enquiry.source == "website",
        )
    ).scalar_one_or_none()
    if duplicate:
        raise HTTPException(status_code=409, detail="This enquiry has already been submitted.")

    enquiry = Enquiry(
        student_name=payload.student_name,
        parent_name=payload.parent_name,
        phone=payload.phone,
        email=payload.email,
        standard=payload.standard,
        board=payload.board,
        message=payload.message,
        source="website",
    )
    db.add(enquiry)
    db.commit()
    return {"message": "Enquiry submitted successfully"}


@router.get("/student-creativity")
def public_student_creativity(db: Session = Depends(get_db), limit: int = Query(20, ge=1, le=100)) -> list[dict]:
    """Returns published student creativity entries."""
    items = db.execute(
        select(StudentCreativity)
        .where(StudentCreativity.is_published == True)
        .order_by(StudentCreativity.display_order, StudentCreativity.created_at.desc())
        .limit(limit)
    ).scalars().all()
    results = []
    for i in items:
        file_url = _safe_uploaded_url(db, i.file_url, images_only=i.file_type == "image")
        if not file_url:
            continue
        results.append(
            {
                "id": _public_key("creativity", i.title, i.display_order),
                "title": i.title,
                "student_name": i.student_name,
                "class_name": i.class_name,
                "file_type": i.file_type,
                "file_url": file_url,
                "description": i.description,
            }
        )
    return results


@router.get("/testimonials")
def public_testimonials(db: Session = Depends(get_db), limit: int = Query(20, ge=1, le=50)) -> list[dict]:
    """Returns approved and published testimonials."""
    items = db.execute(
        select(Testimonial)
        .where(Testimonial.is_approved == True, Testimonial.is_published == True)
        .order_by(Testimonial.submitted_at.desc())
        .limit(limit)
    ).scalars().all()
    return [
        {
            "id": _public_key("testimonial", i.name),
            "name": i.name,
            "role": i.role,
            "message": i.message,
            "rating": i.rating,
            "photo_url": _safe_uploaded_url(db, i.photo_url),
        }
        for i in items
    ]


class FeedbackSubmit(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    role: str | None = Field(default=None, max_length=100)
    message: str = Field(min_length=1, max_length=2000)
    rating: int | None = Field(default=None, ge=1, le=5)
    photo_url: str | None = Field(default=None, max_length=500)

    @field_validator("name", "message")
    @classmethod
    def clean_required_text(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned:
            raise ValueError("field is required")
        return cleaned

    @field_validator("role", "photo_url")
    @classmethod
    def clean_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.strip().split())
        return cleaned or None


@router.post("/feedback")
def public_submit_feedback(payload: FeedbackSubmit, request: Request, db: Session = Depends(get_db)) -> dict:
    """Submit a testimonial/feedback (no auth required). Admin must approve before it's shown."""
    _check_public_form_rate_limit(request)
    duplicate = db.execute(
        select(Testimonial).where(
            Testimonial.name == payload.name,
            Testimonial.message == payload.message,
            Testimonial.is_approved == False,
        )
    ).scalar_one_or_none()
    if duplicate:
        raise HTTPException(status_code=409, detail="This feedback has already been submitted.")

    testimonial = Testimonial(
        name=payload.name,
        role=payload.role,
        message=payload.message,
        rating=payload.rating,
        photo_url=safe_public_url(payload.photo_url),
        is_approved=False,
        is_published=False,
        submitted_at=datetime.now(UTC),
    )
    db.add(testimonial)
    db.commit()
    return {"message": "Feedback submitted successfully. It will be visible after admin approval."}
