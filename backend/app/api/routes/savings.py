from __future__ import annotations

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.savings_entry import SavingsEntry
from app.models.student import Student
from app.models.enums import StudentStatus
from app.models.user import User
from app.schemas.savings import (
    SavingsEntryCreate,
    SavingsEntryEdit,
    SavingsEntryRead,
    StudentSavingsBalanceRead,
)


router = APIRouter()


@router.post("", response_model=SavingsEntryRead, status_code=201)
def create_savings_entry(
    payload: SavingsEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavingsEntryRead:
    if payload.amount == 0:
        raise HTTPException(status_code=422, detail="amount must be non-zero")

    student = db.execute(select(Student).where(Student.student_code == payload.student_code)).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found for the provided roll number")
    if payload.student_id and student.id != payload.student_id:
        raise HTTPException(status_code=409, detail="Student ID and roll number do not match")

    entry = SavingsEntry(
        student_id=student.id,
        amount=payload.amount,
        mode=payload.mode,
        reference_no=payload.reference_no,
        notes=payload.notes,
        recorded_at=payload.recorded_at or datetime.now(UTC),
        created_by=current_user.id,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _savings_entry_read(entry)


@router.get("", response_model=dict)
def list_savings_entries(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    student_id: uuid.UUID | None = None,
    search: str | None = None,
    from_dt: datetime | None = Query(default=None, alias="from"),
    to_dt: datetime | None = Query(default=None, alias="to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(SavingsEntry).join(Student)
    if student_id:
        stmt = stmt.where(SavingsEntry.student_id == student_id)
    if search:
        s = f"%{search.lower()}%"
        stmt = stmt.where(or_(func.lower(Student.student_code).like(s), func.lower(Student.name).like(s)))
    if from_dt:
        stmt = stmt.where(SavingsEntry.recorded_at >= from_dt)
    if to_dt:
        stmt = stmt.where(SavingsEntry.recorded_at <= to_dt)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = (
        db.execute(
            stmt.order_by(SavingsEntry.recorded_at.desc(), SavingsEntry.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    return {"items": [_savings_entry_read(item) for item in items], "total": total}


@router.get("/balances", response_model=dict)
def list_student_savings_balances(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = None,
    class_name: str | None = None,
    class_prefix: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=500),
) -> dict:
    stmt = select(Student).where(Student.status == StudentStatus.active)
    if search:
        s = f"%{search.lower()}%"
        stmt = stmt.where(func.lower(Student.student_code).like(s))
    if class_name:
        stmt = stmt.where(Student.class_name == class_name)
    elif class_prefix:
        stmt = stmt.where(func.lower(Student.student_code).like(f"{class_prefix.lower()[:2]}%"))

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    students = (
        db.execute(
            stmt.order_by(Student.student_code)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )

    # Batch query for savings — separate deposits and withdrawals
    student_ids = [s.id for s in students]
    deposits_map: dict = {}
    withdrawals_map: dict = {}
    if student_ids:
        # Deposits (positive amounts)
        dep_rows = db.execute(
            select(SavingsEntry.student_id, func.coalesce(func.sum(SavingsEntry.amount), 0))
            .where(SavingsEntry.student_id.in_(student_ids), SavingsEntry.amount > 0)
            .group_by(SavingsEntry.student_id)
        ).all()
        deposits_map = {sid: amt for sid, amt in dep_rows}

        # Withdrawals (negative amounts)
        wd_rows = db.execute(
            select(SavingsEntry.student_id, func.coalesce(func.sum(SavingsEntry.amount), 0))
            .where(SavingsEntry.student_id.in_(student_ids), SavingsEntry.amount < 0)
            .group_by(SavingsEntry.student_id)
        ).all()
        withdrawals_map = {sid: abs(amt) for sid, amt in wd_rows}

    items: list[StudentSavingsBalanceRead] = []
    for student in students:
        deposited = Decimal(deposits_map.get(student.id, 0))
        withdrawn = Decimal(withdrawals_map.get(student.id, 0))
        balance = deposited - withdrawn
        # Only include students who have savings activity
        if deposited > 0 or withdrawn > 0:
            items.append(
                StudentSavingsBalanceRead(
                    student_id=student.id,
                    student_code=student.student_code,
                    student_name=student.name,
                    class_name=student.class_name,
                    total_deposited=deposited,
                    total_withdrawn=withdrawn,
                    balance=balance,
                )
            )
    return {"items": items, "total": len(items)}


@router.delete("/{entry_id}", status_code=204, response_model=None)
def delete_savings_entry(
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> None:
    entry = db.get(SavingsEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Savings entry not found")
    db.delete(entry)
    db.commit()


@router.post("/{entry_id}/retract", response_model=SavingsEntryRead, status_code=201)
def retract_savings_entry(
    entry_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SavingsEntryRead:
    """Create a counter-entry that negates the original entry."""
    original = db.get(SavingsEntry, entry_id)
    if not original:
        raise HTTPException(status_code=404, detail="Savings entry not found")

    # Check if already retracted
    existing = db.execute(
        select(SavingsEntry).where(SavingsEntry.retracted_from_id == entry_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="This entry has already been retracted")

    reason = payload.get("reason", "")
    retraction = SavingsEntry(
        student_id=original.student_id,
        amount=-original.amount,
        mode=original.mode,
        reference_no=original.reference_no,
        notes=f"RETRACTION: {reason}" if reason else "RETRACTION",
        recorded_at=datetime.now(UTC),
        created_by=current_user.id,
        retracted_from_id=original.id,
    )
    db.add(retraction)
    db.commit()
    db.refresh(retraction)
    return _savings_entry_read(retraction)


@router.patch("/{entry_id}", response_model=SavingsEntryRead)
def edit_savings_entry(
    entry_id: uuid.UUID,
    payload: SavingsEntryEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> SavingsEntryRead:
    entry = db.get(SavingsEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Savings entry not found")
    if payload.amount == 0:
        raise HTTPException(status_code=422, detail="amount must be non-zero")

    entry.amount = payload.amount
    if payload.notes is not None:
        entry.notes = payload.notes
    entry.is_edited = True
    entry.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(entry)
    return _savings_entry_read(entry)


def _savings_entry_read(entry: SavingsEntry) -> SavingsEntryRead:
    data = SavingsEntryRead.model_validate(entry).model_dump()
    data["student_name"] = entry.student.name if entry.student else None
    data["student_code"] = entry.student.student_code if entry.student else None
    data["created_by_name"] = entry.creator.username if entry.creator else None
    data["is_retraction"] = entry.retracted_from_id is not None
    data["is_edited"] = entry.is_edited
    return SavingsEntryRead.model_validate(data)
