from __future__ import annotations

import csv
import io
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Generator

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.enums import StudentStatus
from app.models.payment import Payment
from app.models.student import Student
from app.models.student_billing_period import StudentBillingPeriod
from app.models.user import User
from app.services.billing import fee_period_label, get_student_billing_overview, pending_amount
from app.services.billing import normalize_month

router = APIRouter()

_BILLING_OPTS = [
    selectinload(Student.fee),
    selectinload(Student.billing_periods).selectinload(StudentBillingPeriod.payment),
]


def _csv_streaming_response(filename: str, row_generator: Generator[list[str], None, None]) -> StreamingResponse:
    def generate():
        buf = io.StringIO()
        writer = csv.writer(buf)
        for row in row_generator:
            writer.writerow(row)
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/students.csv")
def export_students_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StreamingResponse:
    students = db.execute(select(Student).order_by(Student.student_code)).scalars().all()

    def rows():
        yield ["student_code", "name", "class_name", "section", "status", "created_at"]
        for s in students:
            yield [s.student_code, s.name, s.class_name or "", s.section or "", s.status.value, s.created_at.isoformat()]

    return _csv_streaming_response("students.csv", rows())


@router.get("/payments.csv")
def export_payments_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    student_id: uuid.UUID | None = None,
    from_dt: datetime | None = Query(default=None, alias="from"),
    to_dt: datetime | None = Query(default=None, alias="to"),
) -> StreamingResponse:
    stmt = select(Payment).order_by(Payment.paid_at.desc())
    if student_id:
        stmt = stmt.where(Payment.student_id == student_id)
    if from_dt:
        stmt = stmt.where(Payment.paid_at >= from_dt)
    if to_dt:
        stmt = stmt.where(Payment.paid_at <= to_dt)
    payments = db.execute(stmt).scalars().all()

    def rows():
        yield ["receipt_no", "student_id", "amount", "mode", "reference_no", "notes", "fee_period", "paid_at", "created_by"]
        for p in payments:
            yield [
                p.receipt_no, str(p.student_id), str(p.amount), p.mode.value,
                p.reference_no or "", p.notes or "",
                fee_period_label(p.billing_start_month, p.billing_cycle_months) or "",
                p.paid_at.isoformat(), str(p.created_by),
            ]

    return _csv_streaming_response("payments.csv", rows())


@router.get("/pending.csv")
def export_pending_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StreamingResponse:
    students = db.execute(select(Student).order_by(Student.student_code).options(*_BILLING_OPTS)).scalars().all()

    student_ids = [s.id for s in students]
    paid_totals: dict = {}
    if student_ids:
        paid_rows = db.execute(
            select(Payment.student_id, func.coalesce(func.sum(Payment.amount), 0))
            .where(Payment.student_id.in_(student_ids))
            .group_by(Payment.student_id)
        ).all()
        paid_totals = {sid: total for sid, total in paid_rows}

    rows_data = []
    for student in students:
        overview = get_student_billing_overview(db, student)
        pending_value = pending_amount(overview)
        if pending_value == 0:
            continue
        rows_data.append(
            {
                "student_code": student.student_code,
                "name": student.name,
                "expected_fee": overview.monthly_fee,
                "paid_total": paid_totals.get(student.id, 0),
                "pending": pending_value,
            }
        )
    rows_data.sort(key=lambda item: Decimal(item["pending"]), reverse=True)

    def rows():
        yield ["student_code", "name", "expected_fee", "paid_total", "pending"]
        for r in rows_data:
            yield [r["student_code"], r["name"], str(r["expected_fee"]), str(r["paid_total"]), str(r["pending"])]

    return _csv_streaming_response("pending.csv", rows())


@router.get("/monthly-students.csv")
def export_monthly_students_csv(
    month: date = Query(...),
    payment_state: str = Query("unpaid", pattern="^(paid|unpaid|all)$"),
    search: str | None = None,
    class_code: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StreamingResponse:
    selected_month = normalize_month(month)
    stmt = select(Student).where(Student.status == StudentStatus.active).order_by(Student.student_code)
    if search:
        s = f"%{search.lower()}%"
        stmt = stmt.where(
            func.lower(Student.student_code).like(s) | func.lower(Student.name).like(s) | func.lower(Student.class_name).like(s)
        )
    if class_code:
        stmt = stmt.where(Student.student_code.like(f"{class_code.strip()}%"))
    students = db.execute(stmt.options(*_BILLING_OPTS)).scalars().all()
    rows_data: list[list[str]] = []
    for student in students:
        overview = get_student_billing_overview(db, student)
        target_month = next((item for item in overview.months if item["month"] == selected_month), None)
        if target_month is None:
            continue
        is_paid = bool(target_month["is_paid"])
        if payment_state == "paid" and not is_paid:
            continue
        if payment_state == "unpaid" and is_paid:
            continue
        rows_data.append(
            [
                student.student_code,
                student.name,
                student.class_name or "",
                student.section or "",
                overview.cycle_label,
                str(overview.monthly_fee),
                target_month["label"],
                "paid" if is_paid else "unpaid",
                target_month["receipt_no"] or "",
            ]
        )

    def rows():
        yield ["student_code", "name", "class_name", "section", "payment_period", "monthly_fee", "month", "status", "receipt_no"]
        yield from rows_data

    return _csv_streaming_response(f"students_{payment_state}_{selected_month.isoformat()}.csv", rows())
