from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.staff import SalaryRecord, Staff
from app.models.user import User
from app.schemas.staff import SalaryRecordCreate, SalaryRecordRead, StaffCreate, StaffRead, StaffUpdate

router = APIRouter()


@router.post("", response_model=StaffRead, status_code=201)
def create_staff(
    payload: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> StaffRead:
    existing = db.execute(select(Staff).where(Staff.staff_code == payload.staff_code)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Staff code already exists")
    staff = Staff(**payload.model_dump())
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return StaffRead.model_validate(staff)


@router.get("", response_model=dict)
def list_staff(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(Staff)
    if search:
        s = f"%{search.lower()}%"
        stmt = stmt.where(func.lower(Staff.name).like(s) | func.lower(Staff.staff_code).like(s))
    if status:
        stmt = stmt.where(Staff.status == status)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(Staff.name).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return {"items": [StaffRead.model_validate(s) for s in items], "total": total}


@router.get("/{staff_id}", response_model=StaffRead)
def get_staff(staff_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> StaffRead:
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return StaffRead.model_validate(staff)


@router.patch("/{staff_id}", response_model=StaffRead)
def update_staff(
    staff_id: uuid.UUID,
    payload: StaffUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> StaffRead:
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)
    db.commit()
    db.refresh(staff)
    return StaffRead.model_validate(staff)


@router.delete("/{staff_id}", status_code=204, response_class=Response, response_model=None)
def delete_staff(staff_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(staff)
    db.commit()


# --- Salary ---

@router.post("/salary", response_model=SalaryRecordRead, status_code=201)
def record_salary(
    payload: SalaryRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> SalaryRecordRead:
    staff = db.get(Staff, payload.staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    record = SalaryRecord(
        **payload.model_dump(),
        paid_at=datetime.now(UTC),
        created_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    data = SalaryRecordRead.model_validate(record)
    data.staff_name = staff.name
    return data


@router.get("/salary/records", response_model=dict)
def list_salary_records(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
    staff_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(SalaryRecord)
    if staff_id:
        stmt = stmt.where(SalaryRecord.staff_id == staff_id)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(SalaryRecord.month.desc()).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    results = []
    for record in items:
        data = SalaryRecordRead.model_validate(record)
        staff = db.get(Staff, record.staff_id)
        data.staff_name = staff.name if staff else None
        results.append(data)
    return {"items": results, "total": total}


# --- Salary Slip PDF ---

@router.get("/salary/{record_id}/slip.pdf")
def download_salary_slip(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> Response:
    from app.api.routes.settings import get_institution_branding
    from app.services.salary_pdf import render_salary_slip_pdf

    record = db.get(SalaryRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Salary record not found")
    staff = db.get(Staff, record.staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    branding = get_institution_branding(db)
    pdf = render_salary_slip_pdf(
        staff_name=staff.name,
        staff_code=staff.staff_code,
        designation=staff.role.value.replace("_", " ").title(),
        month=record.month.strftime("%B %Y"),
        salary=str(record.amount),
        deductions=str(record.deductions),
        net_amount=str(record.net_amount),
        mode=record.mode or "cash",
        paid_date=record.paid_at.strftime("%d-%m-%Y") if record.paid_at else "-",
        branding=branding,
    )
    filename = f"salary_slip_{staff.staff_code}_{record.month.strftime('%Y_%m')}.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})
