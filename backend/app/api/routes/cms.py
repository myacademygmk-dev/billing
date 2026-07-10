from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.cms import GalleryPhoto, WebContent
from app.models.enums import ContentType
from app.models.user import User
from app.schemas.cms import GalleryPhotoCreate, GalleryPhotoRead, WebContentCreate, WebContentRead, WebContentUpdate

router = APIRouter()


# --- Web Content ---

@router.post("", response_model=WebContentRead, status_code=201)
def create_content(
    payload: WebContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> WebContentRead:
    content = WebContent(**payload.model_dump(), created_by=current_user.id)
    db.add(content)
    db.commit()
    db.refresh(content)
    return WebContentRead.model_validate(content)


@router.get("", response_model=dict)
def list_content(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    content_type: ContentType | None = None,
    is_published: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(WebContent).options(selectinload(WebContent.photos))
    if content_type:
        stmt = stmt.where(WebContent.content_type == content_type)
    if is_published is not None:
        stmt = stmt.where(WebContent.is_published == is_published)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(
        stmt.order_by(WebContent.display_order, WebContent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).scalars().all()
    return {"items": [WebContentRead.model_validate(c) for c in items], "total": total}


@router.get("/{content_id}", response_model=WebContentRead)
def get_content(content_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> WebContentRead:
    content = db.execute(select(WebContent).where(WebContent.id == content_id).options(selectinload(WebContent.photos))).scalar_one_or_none()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    return WebContentRead.model_validate(content)


@router.patch("/{content_id}", response_model=WebContentRead)
def update_content(
    content_id: uuid.UUID,
    payload: WebContentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> WebContentRead:
    content = db.get(WebContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(content, field, value)
    db.commit()
    db.refresh(content)
    return WebContentRead.model_validate(content)


@router.delete("/{content_id}", status_code=204, response_class=Response, response_model=None)
def delete_content(content_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    content = db.get(WebContent, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    db.delete(content)
    db.commit()


# --- Gallery Photos ---

@router.post("/photos", response_model=GalleryPhotoRead, status_code=201)
def add_photo(
    payload: GalleryPhotoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> GalleryPhotoRead:
    photo = GalleryPhoto(**payload.model_dump(), uploaded_by=current_user.id)
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return GalleryPhotoRead.model_validate(photo)


@router.get("/photos", response_model=dict)
def list_photos(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    content_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(GalleryPhoto)
    if content_id:
        stmt = stmt.where(GalleryPhoto.content_id == content_id)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(GalleryPhoto.display_order).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return {"items": [GalleryPhotoRead.model_validate(p) for p in items], "total": total}


@router.delete("/photos/{photo_id}", status_code=204, response_class=Response, response_model=None)
def delete_photo(photo_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    photo = db.get(GalleryPhoto, photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    db.delete(photo)
    db.commit()
