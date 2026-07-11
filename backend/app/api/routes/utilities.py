"""Utility routes: backup, student promotion, fee reminders, TC generation."""
from __future__ import annotations

import io
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.enums import StudentStatus
from app.models.student import Student
from app.models.student_fee import StudentFee
from app.models.payment import Payment
from app.models.user import User
from app.services.bill_pdf import InstitutionBranding

router = APIRouter()


# --- Database Backup ---

@router.get("/backup/download")
def download_backup(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> StreamingResponse:
    """Download a JSON export of all critical data for backup."""
    import json

    from app.models.staff import Staff
    from app.models.expense_entry import ExpenseEntry

    students = db.execute(select(Student)).scalars().all()
    payments = db.execute(select(Payment)).scalars().all()
    staff_list = db.execute(select(Staff)).scalars().all()
    expenses = db.execute(select(ExpenseEntry)).scalars().all()

    def serialize_date(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return str(obj)

    data = {
        "exported_at": datetime.now(UTC).isoformat(),
        "students": [
            {
                "student_code": s.student_code, "name": s.name, "class_name": s.class_name,
                "section": s.section, "batch": s.batch, "status": s.status.value,
                "father_name": s.father_name, "parent_phone": s.parent_phone,
                "joined_date": serialize_date(s.joined_date) if s.joined_date else None,
            }
            for s in students
        ],
        "payments": [
            {
                "receipt_no": p.receipt_no, "student_id": str(p.student_id),
                "amount": str(p.amount), "mode": p.mode.value,
                "paid_at": serialize_date(p.paid_at),
            }
            for p in payments
        ],
        "staff": [
            {"staff_code": s.staff_code, "name": s.name, "role": s.role.value, "phone": s.phone}
            for s in staff_list
        ],
        "expenses": [
            {"title": e.title, "amount": str(e.amount), "category": e.category, "month": serialize_date(e.expense_month)}
            for e in expenses
        ],
        "summary": {
            "total_students": len(students),
            "total_payments": len(payments),
            "total_staff": len(staff_list),
            "total_expenses": len(expenses),
        },
    }

    content = json.dumps(data, indent=2, default=serialize_date)
    filename = f"backup_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.json"

    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- Student Promotion ---

@router.post("/promote-students")
def promote_students(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Promote students from one class to next. Updates class_name and batch."""
    from_class = payload.get("from_class", "").strip()
    to_class = payload.get("to_class", "").strip()
    new_batch = payload.get("new_batch", "").strip()

    if not from_class or not to_class:
        raise HTTPException(status_code=422, detail="from_class and to_class are required")

    students = db.execute(
        select(Student).where(Student.class_name == from_class, Student.status == StudentStatus.active)
    ).scalars().all()

    if not students:
        raise HTTPException(status_code=404, detail=f"No active students found in class '{from_class}'")

    count = 0
    for student in students:
        student.class_name = to_class
        if new_batch:
            student.batch = new_batch
        count += 1

    db.commit()
    return {"message": f"Promoted {count} students from {from_class} to {to_class}", "count": count}


# --- Fee Reminder ---

@router.post("/fee-reminder")
def send_fee_reminder(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Generate fee reminder data for students with pending fees.
    Returns the list of students + phone numbers for manual or WhatsApp sending."""
    from app.services.billing import get_student_billing_overview, pending_amount
    from app.models.student_billing_period import StudentBillingPeriod
    from sqlalchemy.orm import selectinload

    _BILLING_OPTS = [selectinload(Student.fee), selectinload(Student.billing_periods).selectinload(StudentBillingPeriod.payment)]

    class_name = payload.get("class_name")
    stmt = select(Student).where(Student.status == StudentStatus.active).options(*_BILLING_OPTS)
    if class_name:
        stmt = stmt.where(Student.class_name == class_name)

    students = db.execute(stmt).scalars().all()
    reminders = []

    for student in students:
        overview = get_student_billing_overview(db, student)
        pending = pending_amount(overview)
        if pending > 0:
            reminders.append({
                "student_id": str(student.id),
                "student_code": student.student_code,
                "student_name": student.name,
                "class_name": student.class_name,
                "parent_phone": student.parent_phone,
                "whatsapp_no": student.whatsapp_no or student.parent_phone,
                "pending_amount": str(pending),
                "pending_months": len(overview.pending_months),
            })

    return {"items": reminders, "total": len(reminders)}


# --- Transfer Certificate PDF ---

@router.get("/tc/{student_id}.pdf")
def generate_transfer_certificate(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> Response:
    """Generate a Transfer Certificate PDF for a student."""
    from app.api.routes.settings import get_institution_branding

    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    branding = get_institution_branding(db)
    pdf = _render_tc_pdf(student, branding)
    filename = f"TC_{student.student_code}.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


def _render_tc_pdf(student: Student, branding: InstitutionBranding) -> bytes:
    def esc(v: str) -> str:
        return v.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    lines = [
        ("F2", 18, 180, 760, branding.name),
        ("F1", 10, 200, 742, branding.tagline),
        ("F1", 9, 50, 724, branding.registration_no),
        ("F2", 14, 210, 690, "TRANSFER CERTIFICATE"),
        ("F1", 11, 50, 650, f"Student Name : {student.name}"),
        ("F1", 11, 50, 625, f"Roll Number : {student.student_code}"),
        ("F1", 11, 50, 600, f"Class : {student.class_name or '-'}"),
        ("F1", 11, 50, 575, f"Father's Name : {student.father_name or '-'}"),
        ("F1", 11, 50, 550, f"Date of Birth : {student.date_of_birth.strftime('%d-%m-%Y') if student.date_of_birth else '-'}"),
        ("F1", 11, 50, 525, f"Date of Admission : {student.joined_date.strftime('%d-%m-%Y') if student.joined_date else '-'}"),
        ("F1", 11, 50, 500, f"Date of Leaving : {datetime.now(UTC).strftime('%d-%m-%Y')}"),
        ("F1", 11, 50, 475, f"Batch : {student.batch or '-'}"),
        ("F1", 11, 50, 440, "Reason for Leaving : As per request"),
        ("F1", 11, 50, 410, "Conduct & Character : Good"),
        ("F1", 9, 50, 370, "This is to certify that the above student has been a bonafide student of this institution."),
        ("F1", 9, 400, 320, "Authorized Signatory"),
    ]

    content = ["0.2 w", "36 310 540 470 re S", "36 710 540 0 re S", "36 670 540 0 re S", "BT"]
    for font, size, x, y, text in lines:
        content.append(f"/{font} {size} Tf")
        content.append(f"1 0 0 1 {x} {y} Tm")
        content.append(f"({esc(text)}) Tj")
    content.append("ET")
    stream = "\n".join(content).encode("ascii")

    objects: list[bytes] = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n")
    objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
    objects.append(b"5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n")
    objects.append(f"6 0 obj << /Length {len(stream)} >> stream\n".encode("ascii") + stream + b"\nendstream endobj\n")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)
    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("ascii"))
    return bytes(pdf)


# --- WhatsApp Links ---

@router.get("/whatsapp/fee-reminder/{student_id}")
def get_whatsapp_fee_reminder(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Generate WhatsApp deep link for fee reminder."""
    from app.services.whatsapp import whatsapp_fee_reminder_message, whatsapp_deep_link
    from app.services.billing import get_student_billing_overview, pending_amount
    from app.models.student_billing_period import StudentBillingPeriod
    from sqlalchemy.orm import selectinload

    student = db.execute(
        select(Student).where(Student.id == student_id)
        .options(selectinload(Student.fee), selectinload(Student.billing_periods).selectinload(StudentBillingPeriod.payment))
    ).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    phone = student.whatsapp_no or student.parent_phone
    if not phone:
        raise HTTPException(status_code=422, detail="No phone number available for this student")

    overview = get_student_billing_overview(db, student)
    pending = str(pending_amount(overview))
    message = whatsapp_fee_reminder_message(student.name, pending)
    link = whatsapp_deep_link(phone, message)

    return {"link": link, "phone": phone, "message": message}


@router.get("/birthdays")
def get_upcoming_birthdays(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    days: int = Query(7, ge=1, le=30),
) -> dict:
    """Get students with birthdays in the next N days."""
    from datetime import date, timedelta

    today = date.today()
    students = db.execute(
        select(Student).where(Student.status == StudentStatus.active, Student.date_of_birth != None)
    ).scalars().all()

    upcoming = []
    for student in students:
        if not student.date_of_birth:
            continue
        # Check if birthday falls within next N days (ignore year)
        bday_this_year = student.date_of_birth.replace(year=today.year)
        if bday_this_year < today:
            bday_this_year = bday_this_year.replace(year=today.year + 1)
        diff = (bday_this_year - today).days
        if 0 <= diff <= days:
            upcoming.append({
                "student_id": str(student.id),
                "student_code": student.student_code,
                "name": student.name,
                "class_name": student.class_name,
                "date_of_birth": student.date_of_birth.isoformat(),
                "birthday_date": bday_this_year.isoformat(),
                "days_away": diff,
                "phone": student.whatsapp_no or student.parent_phone,
            })

    upcoming.sort(key=lambda x: x["days_away"])
    return {"items": upcoming, "total": len(upcoming)}
