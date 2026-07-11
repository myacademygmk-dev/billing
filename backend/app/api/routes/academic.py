from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.academic import AcademicYear, ClassSection, Subject
from app.models.user import User
from app.schemas.academic import (
    AcademicYearCreate,
    AcademicYearRead,
    ClassSectionCreate,
    ClassSectionRead,
    SubjectCreate,
    SubjectRead,
)

router = APIRouter()


# --- Academic Years ---

@router.post("/years", response_model=AcademicYearRead, status_code=201)
def create_academic_year(
    payload: AcademicYearCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> AcademicYearRead:
    existing = db.execute(select(AcademicYear).where(AcademicYear.name == payload.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Academic year already exists")
    if payload.is_current:
        # Unset other current years
        db.execute(select(AcademicYear).where(AcademicYear.is_current == True))
        for yr in db.execute(select(AcademicYear).where(AcademicYear.is_current == True)).scalars().all():
            yr.is_current = False
    year = AcademicYear(**payload.model_dump())
    db.add(year)
    db.commit()
    db.refresh(year)
    return AcademicYearRead.model_validate(year)


@router.get("/years", response_model=list[AcademicYearRead])
def list_academic_years(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[AcademicYearRead]:
    years = db.execute(select(AcademicYear).order_by(AcademicYear.start_date.desc())).scalars().all()
    return [AcademicYearRead.model_validate(y) for y in years]


@router.patch("/years/{year_id}", response_model=AcademicYearRead)
def update_academic_year(
    year_id: uuid.UUID,
    payload: AcademicYearCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> AcademicYearRead:
    year = db.get(AcademicYear, year_id)
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    if payload.is_current:
        for yr in db.execute(select(AcademicYear).where(AcademicYear.is_current == True)).scalars().all():
            yr.is_current = False
    for field, value in payload.model_dump().items():
        setattr(year, field, value)
    db.commit()
    db.refresh(year)
    return AcademicYearRead.model_validate(year)


@router.delete("/years/{year_id}", status_code=204, response_class=Response, response_model=None)
def delete_academic_year(year_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    year = db.get(AcademicYear, year_id)
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    db.delete(year)
    db.commit()


# --- Classes ---

@router.post("/classes", response_model=ClassSectionRead, status_code=201)
def create_class_section(
    payload: ClassSectionCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> ClassSectionRead:
    cls = ClassSection(**payload.model_dump())
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return ClassSectionRead.model_validate(cls)


@router.get("/classes", response_model=list[ClassSectionRead])
def list_class_sections(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    academic_year_id: uuid.UUID | None = None,
) -> list[ClassSectionRead]:
    stmt = select(ClassSection).options(selectinload(ClassSection.subjects))
    if academic_year_id:
        stmt = stmt.where(ClassSection.academic_year_id == academic_year_id)
    classes = db.execute(stmt.order_by(ClassSection.display_order)).scalars().all()
    return [ClassSectionRead.model_validate(c) for c in classes]


@router.delete("/classes/{class_id}", status_code=204, response_class=Response, response_model=None)
def delete_class_section(class_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    cls = db.get(ClassSection, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    db.delete(cls)
    db.commit()


# --- Subjects ---

@router.post("/subjects", response_model=SubjectRead, status_code=201)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> SubjectRead:
    subject = Subject(**payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectRead.model_validate(subject)


@router.get("/subjects", response_model=list[SubjectRead])
def list_subjects(
    class_section_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[SubjectRead]:
    subjects = db.execute(select(Subject).where(Subject.class_section_id == class_section_id).order_by(Subject.name)).scalars().all()
    return [SubjectRead.model_validate(s) for s in subjects]


@router.delete("/subjects/{subject_id}", status_code=204, response_class=Response, response_model=None)
def delete_subject(subject_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
