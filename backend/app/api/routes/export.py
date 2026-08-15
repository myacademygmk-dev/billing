from __future__ import annotations

import csv
import io
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Generator

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.enums import StudentStatus
from app.models.payment import Payment
from app.models.student import Student
from app.models.student_billing_period import StudentBillingPeriod
from app.models.student_fee import StudentFee
from app.models.user import User
from app.services.billing import fee_period_label, get_student_billing_overview, pending_amount
from app.services.billing import normalize_month

router = APIRouter()

# Chunk size for DB-level streaming
_CHUNK_SIZE = 500

_BILLING_OPTS = [
    selectinload(Student.fee),
    selectinload(Student.billing_periods).selectinload(StudentBillingPeriod.payment),
]


def _csv_row(row: list[str]) -> str:
    """Encode a single CSV row to string."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(row)
    return buf.getvalue()


def _csv_streaming_response(filename: str, row_generator: Generator[str, None, None]) -> StreamingResponse:
    """Stream CSV rows one at a time to the client."""
    return StreamingResponse(
        row_generator,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/students.csv")
def export_students_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StreamingResponse:
    def generate():
        yield _csv_row([
            "roll_no", "name", "class", "school", "dob", "doj", "gender",
            "contact_no", "father_name", "mother_name", "father_phone", "mother_phone",
            "whatsapp", "father_occupation", "mother_occupation",
            "hobbies", "address", "email", "fee", "status"
        ])
        offset = 0
        while True:
            students = db.execute(
                select(Student)
                .order_by(Student.student_code)
                .offset(offset)
                .limit(_CHUNK_SIZE)
            ).scalars().all()
            if not students:
                break
            for s in students:
                # Get fee
                fee_row = db.get(StudentFee, s.id)
                fee_val = str(fee_row.expected_fee_amount) if fee_row else "0"
                yield _csv_row([
                    s.student_code, s.name, s.class_name or "",
                    s.school_name or "", 
                    s.date_of_birth.isoformat() if s.date_of_birth else "",
                    s.joined_date.isoformat() if s.joined_date else "",
                    s.gender or "",
                    s.contact_no or "", s.father_name or "", s.mother_name or "",
                    s.parent_phone or "", s.parent_phone_2 or "",
                    s.whatsapp_no or "", s.father_occupation or "", s.mother_occupation or "",
                    s.hobbies or "", s.address or "", s.student_email or "",
                    fee_val, s.status.value,
                ])
            if len(students) < _CHUNK_SIZE:
                break
            offset += _CHUNK_SIZE

    return _csv_streaming_response("students.csv", generate())


@router.get("/payments.csv")
def export_payments_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    student_id: uuid.UUID | None = None,
    from_dt: datetime | None = Query(default=None, alias="from"),
    to_dt: datetime | None = Query(default=None, alias="to"),
) -> StreamingResponse:
    def generate():
        yield _csv_row(["receipt_no", "roll_no", "student_name", "class", "amount", "mode", "reference_no", "notes", "fee_period", "paid_at"])
        offset = 0
        while True:
            stmt = select(Payment).options(selectinload(Payment.student)).order_by(Payment.paid_at.desc())
            if student_id:
                stmt = stmt.where(Payment.student_id == student_id)
            if from_dt:
                stmt = stmt.where(Payment.paid_at >= from_dt)
            if to_dt:
                stmt = stmt.where(Payment.paid_at <= to_dt)
            stmt = stmt.offset(offset).limit(_CHUNK_SIZE)
            payments = db.execute(stmt).scalars().all()
            if not payments:
                break
            for p in payments:
                student_name = p.student.name if p.student else ""
                student_code = p.student.student_code if p.student else ""
                class_name = p.student.class_name if p.student else ""
                yield _csv_row([
                    p.receipt_no, student_code, student_name, class_name,
                    str(p.amount), p.mode.value if p.mode else "",
                    p.reference_no or "", p.notes or "",
                    fee_period_label(p.billing_start_month, p.billing_cycle_months) or "",
                    p.paid_at.isoformat() if p.paid_at else "",
                ])
            if len(payments) < _CHUNK_SIZE:
                break
            offset += _CHUNK_SIZE

    return _csv_streaming_response("payments.csv", generate())


@router.get("/pending.csv")
def export_pending_csv(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StreamingResponse:
    def generate():
        yield _csv_row(["student_code", "name", "expected_fee", "paid_total", "pending"])
        offset = 0
        pending_rows: list[dict] = []
        while True:
            students = db.execute(
                select(Student)
                .order_by(Student.student_code)
                .options(*_BILLING_OPTS)
                .offset(offset)
                .limit(_CHUNK_SIZE)
            ).scalars().all()
            if not students:
                break
            student_ids = [s.id for s in students]
            paid_totals: dict = {}
            if student_ids:
                paid_rows = db.execute(
                    select(Payment.student_id, func.coalesce(func.sum(Payment.amount), 0))
                    .where(Payment.student_id.in_(student_ids))
                    .group_by(Payment.student_id)
                ).all()
                paid_totals = {sid: total for sid, total in paid_rows}

            for student in students:
                overview = get_student_billing_overview(db, student)
                pending_value = pending_amount(overview)
                if pending_value == 0:
                    continue
                pending_rows.append({
                    "student_code": student.student_code,
                    "name": student.name,
                    "expected_fee": overview.monthly_fee,
                    "paid_total": paid_totals.get(student.id, 0),
                    "pending": pending_value,
                })
            if len(students) < _CHUNK_SIZE:
                break
            offset += _CHUNK_SIZE

        # Sort by pending amount descending
        pending_rows.sort(key=lambda item: Decimal(str(item["pending"])), reverse=True)
        for r in pending_rows:
            yield _csv_row([r["student_code"], r["name"], str(r["expected_fee"]), str(r["paid_total"]), str(r["pending"])])

    return _csv_streaming_response("pending.csv", generate())


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

    def generate():
        yield _csv_row(["student_code", "name", "class_name", "section", "payment_period", "monthly_fee", "month", "status", "receipt_no"])
        offset = 0
        while True:
            stmt = select(Student).where(Student.status == StudentStatus.active).order_by(Student.student_code)
            if search:
                s = f"%{search.lower()}%"
                stmt = stmt.where(
                    func.lower(Student.student_code).like(s) | func.lower(Student.name).like(s) | func.lower(Student.class_name).like(s)
                )
            if class_code:
                stmt = stmt.where(Student.student_code.like(f"{class_code.strip()}%"))
            stmt = stmt.options(*_BILLING_OPTS).offset(offset).limit(_CHUNK_SIZE)
            students = db.execute(stmt).scalars().all()
            if not students:
                break
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
                yield _csv_row([
                    student.student_code,
                    student.name,
                    student.class_name or "",
                    student.section or "",
                    overview.cycle_label,
                    str(overview.monthly_fee),
                    target_month["label"],
                    "paid" if is_paid else "unpaid",
                    target_month["receipt_no"] or "",
                ])
            if len(students) < _CHUNK_SIZE:
                break
            offset += _CHUNK_SIZE

    return _csv_streaming_response(f"students_{payment_state}_{selected_month.isoformat()}.csv", generate())


@router.get("/students.xlsx")
def export_students_excel(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export students as multi-sheet Excel: Full Details, Summary, Attendance, Marks."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    from app.models.attendance import StudentAttendance
    from app.models.exam import Mark, Exam

    wb = openpyxl.Workbook()
    header_font = Font(bold=True, color='FFFFFF', size=10)
    header_fill = PatternFill(start_color='2563EB', end_color='2563EB', fill_type='solid')

    def style_header(ws):
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal='center')

    # --- Sheet 1: Full Details ---
    ws1 = wb.active
    ws1.title = "Full Details"
    ws1.append([
        "Roll No", "Name", "Class", "School", "DOB", "DOJ", "Gender",
        "Contact", "Father Name", "Mother Name", "Father Phone", "Mother Phone",
        "WhatsApp", "Father Occupation", "Mother Occupation",
        "Hobbies", "Address", "Email", "Fee", "Status"
    ])
    style_header(ws1)

    students = db.execute(select(Student).order_by(Student.student_code)).scalars().all()
    for s in students:
        fee_row = db.get(StudentFee, s.id)
        fee_val = str(fee_row.expected_fee_amount) if fee_row else "0"
        ws1.append([
            s.student_code, s.name, s.class_name or "", s.school_name or "",
            s.date_of_birth.isoformat() if s.date_of_birth else "",
            s.joined_date.isoformat() if s.joined_date else "",
            s.gender or "", s.contact_no or "",
            s.father_name or "", s.mother_name or "",
            s.parent_phone or "", s.parent_phone_2 or "",
            s.whatsapp_no or "", s.father_occupation or "", s.mother_occupation or "",
            s.hobbies or "", s.address or "", s.student_email or "",
            fee_val, s.status.value,
        ])

    # --- Sheet 2: Summary (Short) ---
    ws2 = wb.create_sheet("Summary")
    ws2.append(["Roll No", "Name", "Class", "Fee", "Status"])
    style_header(ws2)
    for s in students:
        fee_row = db.get(StudentFee, s.id)
        fee_val = str(fee_row.expected_fee_amount) if fee_row else "0"
        ws2.append([s.student_code, s.name, s.class_name or "", fee_val, s.status.value])

    # --- Sheet 3: Attendance ---
    ws3 = wb.create_sheet("Attendance")
    ws3.append(["Roll No", "Name", "Class", "Date", "Status"])
    style_header(ws3)
    attendance_rows = db.execute(
        select(StudentAttendance, Student)
        .join(Student, StudentAttendance.student_id == Student.id)
        .order_by(StudentAttendance.date.desc())
        .limit(5000)
    ).all()
    for att, stu in attendance_rows:
        ws3.append([stu.student_code, stu.name, stu.class_name or "", att.date.isoformat(), att.status])

    # --- Sheet 4: Marks ---
    ws4 = wb.create_sheet("Marks")
    ws4.append(["Roll No", "Name", "Class", "Exam", "Marks Obtained", "Max Marks", "Grade"])
    style_header(ws4)
    mark_rows = db.execute(
        select(Mark, Student, Exam)
        .join(Student, Mark.student_id == Student.id)
        .join(Exam, Mark.exam_id == Exam.id)
        .order_by(Exam.name, Student.student_code)
        .limit(5000)
    ).all()
    for m, stu, exam in mark_rows:
        ws4.append([
            stu.student_code, stu.name, stu.class_name or "",
            exam.name, str(m.marks_obtained), str(m.max_marks), m.grade or "",
        ])

    # Save to buffer
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_export.xlsx"},
    )
