from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.fee_structure import FeeDiscount, FeeStructure, StudentDiscount
from app.models.student import Student
from app.models.user import User
from app.schemas.fee_structure import (
    FeeDiscountCreate,
    FeeDiscountRead,
    FeeStructureCreate,
    FeeStructureRead,
    StudentDiscountCreate,
    StudentDiscountRead,
)

router = APIRouter()


# --- Fee Structures ---

@router.post("/structures", response_model=FeeStructureRead, status_code=201)
def create_fee_structure(
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> FeeStructureRead:
    structure = FeeStructure(**payload.model_dump(), created_by=current_user.id)
    db.add(structure)
    db.commit()
    db.refresh(structure)
    return FeeStructureRead.model_validate(structure)


@router.get("/structures", response_model=list[FeeStructureRead])
def list_fee_structures(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    class_name: str | None = None,
    is_active: bool | None = None,
) -> list[FeeStructureRead]:
    stmt = select(FeeStructure)
    if class_name:
        stmt = stmt.where(FeeStructure.class_name == class_name)
    if is_active is not None:
        stmt = stmt.where(FeeStructure.is_active == is_active)
    items = db.execute(stmt.order_by(FeeStructure.name)).scalars().all()
    return [FeeStructureRead.model_validate(f) for f in items]


@router.patch("/structures/{structure_id}", response_model=FeeStructureRead)
def update_fee_structure(
    structure_id: uuid.UUID,
    payload: FeeStructureCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> FeeStructureRead:
    structure = db.get(FeeStructure, structure_id)
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    for field, value in payload.model_dump().items():
        setattr(structure, field, value)
    db.commit()
    db.refresh(structure)
    return FeeStructureRead.model_validate(structure)


@router.delete("/structures/{structure_id}", status_code=204, response_class=Response, response_model=None)
def delete_fee_structure(structure_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    structure = db.get(FeeStructure, structure_id)
    if not structure:
        raise HTTPException(status_code=404, detail="Fee structure not found")
    db.delete(structure)
    db.commit()


# --- Discounts ---

@router.post("/discounts", response_model=FeeDiscountRead, status_code=201)
def create_discount(
    payload: FeeDiscountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> FeeDiscountRead:
    discount = FeeDiscount(**payload.model_dump(), created_by=current_user.id)
    db.add(discount)
    db.commit()
    db.refresh(discount)
    return FeeDiscountRead.model_validate(discount)


@router.get("/discounts", response_model=list[FeeDiscountRead])
def list_discounts(db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> list[FeeDiscountRead]:
    items = db.execute(select(FeeDiscount).where(FeeDiscount.is_active == True).order_by(FeeDiscount.name)).scalars().all()
    return [FeeDiscountRead.model_validate(d) for d in items]


@router.delete("/discounts/{discount_id}", status_code=204, response_class=Response, response_model=None)
def delete_discount(discount_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    discount = db.get(FeeDiscount, discount_id)
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    discount.is_active = False
    db.commit()


# --- Student Discounts ---

@router.post("/student-discounts", response_model=StudentDiscountRead, status_code=201)
def assign_discount_to_student(
    payload: StudentDiscountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> StudentDiscountRead:
    student = db.get(Student, payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    discount = db.get(FeeDiscount, payload.discount_id)
    if not discount:
        raise HTTPException(status_code=404, detail="Discount not found")
    sd = StudentDiscount(**payload.model_dump(), applied_by=current_user.id)
    db.add(sd)
    db.commit()
    db.refresh(sd)
    data = StudentDiscountRead.model_validate(sd).model_dump()
    data["discount_name"] = discount.name
    return StudentDiscountRead.model_validate(data)


@router.get("/student-discounts", response_model=list[StudentDiscountRead])
def list_student_discounts(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[StudentDiscountRead]:
    items = db.execute(select(StudentDiscount).where(StudentDiscount.student_id == student_id)).scalars().all()
    results = []
    for sd in items:
        discount = db.get(FeeDiscount, sd.discount_id)
        data = StudentDiscountRead.model_validate(sd).model_dump()
        data["discount_name"] = discount.name if discount else None
        results.append(StudentDiscountRead.model_validate(data))
    return results


@router.delete("/student-discounts/{sd_id}", status_code=204, response_class=Response, response_model=None)
def remove_student_discount(sd_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    sd = db.get(StudentDiscount, sd_id)
    if not sd:
        raise HTTPException(status_code=404, detail="Student discount not found")
    db.delete(sd)
    db.commit()
