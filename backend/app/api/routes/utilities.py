"""Utility routes: backup, student promotion, academic rollover, fee reminders, TC generation."""
from __future__ import annotations

import io
import re
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.enums import StudentStatus
from app.models.student import Student
from app.models.student_fee import StudentFee
from app.models.student_billing_period import StudentBillingPeriod
from app.models.payment import Payment
from app.models.user import User
from app.models.academic import AcademicYear
from app.models.fee_structure import FeeStructure
from app.models.promotion import PromotionHistory, StudentArrears
from app.schemas.promotion import PromotionConfig, PromotionDetail, PromotionResult
from app.services.bill_pdf import InstitutionBranding

router = APIRouter()


# --- Roman numeral / class number helpers ---

ROMANS = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5,
    "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10,
    "XI": 11, "XII": 12,
}


def class_to_number(cls: str) -> int:
    """Extract a numeric class number from a class name string.

    Supports:
      - Roman numerals: 'VI' → 6, 'XII' → 12
      - Numeric strings: '10' → 10, '6th' → 6
      - Mixed: 'Class-VIII' → 8
    """
    upper = cls.strip().upper()
    # Direct roman match
    if upper in ROMANS:
        return ROMANS[upper]
    # Check if any roman is a substring (e.g. "CLASS-VIII")
    for roman, val in sorted(ROMANS.items(), key=lambda x: -len(x[0])):
        if roman in upper:
            return val
    # Fallback: extract first number
    nums = re.findall(r"\d+", cls)
    return int(nums[0]) if nums else 0


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


# --- Student Promotion (Simple) ---

@router.post("/promote-students")
def promote_students_simple(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Simple promotion: updates class_name and batch only. Use /academic-rollover for full year-end processing."""
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


# --- Academic Rollover (Comprehensive) ---

@router.post("/academic-rollover", response_model=PromotionResult)
def academic_rollover(
    payload: PromotionConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> PromotionResult:
    """Comprehensive year-end academic rollover.

    Promotes students class-to-class, generates new student codes, optionally updates fees,
    marks final-year students as completed, and carries forward pending arrears.
    """
    errors: list[str] = []
    details: list[PromotionDetail] = []
    promoted_count = 0
    completed_count = 0
    arrears_created = 0

    # Validate academic years exist
    from_ay = db.get(AcademicYear, payload.from_academic_year_id)
    to_ay = db.get(AcademicYear, payload.to_academic_year_id)
    if not from_ay:
        raise HTTPException(status_code=404, detail="Source academic year not found")
    if not to_ay:
        raise HTTPException(status_code=404, detail="Target academic year not found")

    # Optionally load fee structure
    new_fee_amount: Decimal | None = None
    if payload.update_fees and payload.fee_structure_id:
        fee_struct = db.get(FeeStructure, payload.fee_structure_id)
        if not fee_struct:
            raise HTTPException(status_code=404, detail="Fee structure not found")
        new_fee_amount = fee_struct.amount

    # Track serial counters per target class for code generation
    serial_counters: dict[str, int] = {}

    def _get_next_serial(to_class: str) -> int:
        """Get next serial number for a target class, checking existing codes."""
        if to_class not in serial_counters:
            # Find the max serial currently in the target class for the new batch
            class_num = class_to_number(to_class)
            prefix = f"{class_num:02d}"
            # Check existing students in this class with codes matching the pattern
            existing = db.execute(
                select(Student.student_code).where(
                    Student.class_name == to_class,
                    Student.student_code.like(f"{prefix}%"),
                )
            ).scalars().all()
            max_serial = 0
            for code in existing:
                try:
                    serial_part = int(code[len(prefix):])
                    max_serial = max(max_serial, serial_part)
                except (ValueError, IndexError):
                    pass
            serial_counters[to_class] = max_serial
        serial_counters[to_class] += 1
        return serial_counters[to_class]

    def _calculate_arrears(student: Student) -> Decimal:
        """Calculate unpaid billing periods amount for the current year."""
        unpaid_periods = [bp for bp in student.billing_periods if bp.payment_id is None]
        if not unpaid_periods or not student.fee:
            return Decimal("0")
        monthly_fee = student.fee.expected_fee_amount
        return monthly_fee * len(unpaid_periods)

    def _generate_code(to_class: str, serial: int, pattern: str) -> str:
        """Generate a student code from the pattern."""
        class_num = class_to_number(to_class)
        return pattern.format(class_num=class_num, serial=serial)

    # --- Process class mappings (promotions) ---
    for mapping in payload.class_mappings:
        from_class = mapping.from_class.strip()
        to_class = mapping.to_class.strip()

        students = db.execute(
            select(Student)
            .where(Student.class_name == from_class, Student.status == StudentStatus.active)
            .options(selectinload(Student.fee), selectinload(Student.billing_periods))
            .order_by(Student.serial_no, Student.name)
        ).scalars().all()

        if not students:
            errors.append(f"No active students found in class '{from_class}'")
            continue

        for student in students:
            try:
                old_code = student.student_code
                old_fee = student.fee.expected_fee_amount if student.fee else None
                old_batch = student.batch

                # Calculate arrears before promotion
                arrears_amount = _calculate_arrears(student)

                # Generate new code
                serial = _get_next_serial(to_class)
                new_code = _generate_code(to_class, serial, payload.code_pattern)

                # Ensure code uniqueness
                existing_code = db.execute(
                    select(Student.id).where(Student.student_code == new_code)
                ).scalar_one_or_none()
                if existing_code:
                    # Try incrementing serial until unique
                    for _ in range(100):
                        serial = _get_next_serial(to_class)
                        new_code = _generate_code(to_class, serial, payload.code_pattern)
                        existing_code = db.execute(
                            select(Student.id).where(Student.student_code == new_code)
                        ).scalar_one_or_none()
                        if not existing_code:
                            break
                    else:
                        errors.append(f"Could not generate unique code for {student.name} ({old_code})")
                        continue

                # Update student record
                student.class_name = to_class
                student.batch = payload.new_batch
                student.student_code = new_code
                student.serial_no = serial
                student.academic_year_id = payload.to_academic_year_id
                student.billing_start_month = payload.new_billing_start_month
                student.billing_end_month = payload.new_billing_end_month

                # Update fee if requested
                actual_new_fee = new_fee_amount
                if payload.update_fees and new_fee_amount is not None and student.fee:
                    student.fee.expected_fee_amount = new_fee_amount
                    student.fee.last_fee_updated_at = datetime.now(UTC)
                    student.fee.last_fee_updated_by = current_user.id

                # Create promotion history
                history = PromotionHistory(
                    student_id=student.id,
                    from_class=from_class,
                    to_class=to_class,
                    from_batch=old_batch,
                    to_batch=payload.new_batch,
                    from_student_code=old_code,
                    to_student_code=new_code,
                    from_academic_year_id=payload.from_academic_year_id,
                    to_academic_year_id=payload.to_academic_year_id,
                    old_fee_amount=old_fee,
                    new_fee_amount=actual_new_fee,
                    promoted_at=datetime.now(UTC),
                    promoted_by=current_user.id,
                )
                db.add(history)

                # Create arrears record if pending
                if arrears_amount > 0 and payload.carry_forward_arrears:
                    arrear = StudentArrears(
                        student_id=student.id,
                        from_academic_year_id=payload.from_academic_year_id,
                        amount=arrears_amount,
                        description=f"Pending fee from {from_ay.name} ({from_class}): {arrears_amount}",
                    )
                    db.add(arrear)
                    arrears_created += 1

                promoted_count += 1
                details.append(PromotionDetail(
                    student_id=student.id,
                    student_name=student.name,
                    from_class=from_class,
                    to_class=to_class,
                    old_code=old_code,
                    new_code=new_code,
                    arrears_amount=arrears_amount,
                ))

            except Exception as e:
                errors.append(f"Error promoting {student.name} ({student.student_code}): {str(e)}")
                continue

    # --- Process final year students (graduation / completion) ---
    for final_class in payload.final_year_classes:
        final_class = final_class.strip()
        students = db.execute(
            select(Student)
            .where(Student.class_name == final_class, Student.status == StudentStatus.active)
            .options(selectinload(Student.fee), selectinload(Student.billing_periods))
        ).scalars().all()

        for student in students:
            try:
                old_code = student.student_code
                old_fee = student.fee.expected_fee_amount if student.fee else None
                arrears_amount = _calculate_arrears(student)

                # Mark as completed
                student.status = StudentStatus.completed

                # Create promotion history
                history = PromotionHistory(
                    student_id=student.id,
                    from_class=final_class,
                    to_class="COMPLETED",
                    from_batch=student.batch,
                    to_batch=None,
                    from_student_code=old_code,
                    to_student_code=old_code,
                    from_academic_year_id=payload.from_academic_year_id,
                    to_academic_year_id=None,
                    old_fee_amount=old_fee,
                    new_fee_amount=None,
                    promoted_at=datetime.now(UTC),
                    promoted_by=current_user.id,
                )
                db.add(history)

                # Create arrears if pending
                if arrears_amount > 0 and payload.carry_forward_arrears:
                    arrear = StudentArrears(
                        student_id=student.id,
                        from_academic_year_id=payload.from_academic_year_id,
                        amount=arrears_amount,
                        description=f"Final year pending from {from_ay.name} ({final_class}): {arrears_amount}",
                    )
                    db.add(arrear)
                    arrears_created += 1

                completed_count += 1
                details.append(PromotionDetail(
                    student_id=student.id,
                    student_name=student.name,
                    from_class=final_class,
                    to_class="COMPLETED",
                    old_code=old_code,
                    new_code=old_code,
                    arrears_amount=arrears_amount,
                ))

            except Exception as e:
                errors.append(f"Error completing {student.name} ({student.student_code}): {str(e)}")
                continue

    db.commit()

    return PromotionResult(
        promoted_count=promoted_count,
        completed_count=completed_count,
        arrears_created=arrears_created,
        errors=errors,
        details=details,
    )


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


# ═══════════════════════════════════════════════
# WhatsApp API Integration
# ═══════════════════════════════════════════════

@router.post("/whatsapp/send-receipt")
def whatsapp_send_receipt(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Send payment receipt via WhatsApp to student's parent."""
    from app.services.whatsapp_api import send_text_message_sync

    payment_id = payload.get("payment_id")
    if not payment_id:
        raise HTTPException(status_code=422, detail="payment_id is required")

    from app.models.payment import Payment
    payment = db.get(Payment, uuid.UUID(payment_id))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    student = db.get(Student, payment.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    phone = student.whatsapp_no or student.parent_phone or student.contact_no
    if not phone:
        raise HTTPException(status_code=422, detail="No phone number found for this student")

    message = (
        f"✅ *Fee Payment Received*\n\n"
        f"🏫 MY Academy\n"
        f"━━━━━━━━━━━━━━━\n"
        f"👤 Student: *{student.name}*\n"
        f"🧾 Receipt: {payment.receipt_no}\n"
        f"💰 Amount: *₹{payment.amount}*\n"
        f"💳 Mode: {(payment.mode or 'cash').upper()}\n"
        f"📅 Date: {payment.paid_at.strftime('%d %b %Y') if payment.paid_at else '-'}\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"Thank you for the payment! 🙏"
    )

    result = send_text_message_sync(phone, message)
    return {"status": result.get("status"), "phone": phone, "message": "Receipt sent via WhatsApp" if result.get("status") == "sent" else result.get("error")}


@router.post("/whatsapp/send-reminder")
def whatsapp_send_reminder(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Send fee reminder to a specific student's parent via WhatsApp."""
    from app.services.whatsapp_api import send_text_message_sync
    from app.services.billing import get_student_billing_overview, pending_amount, pending_details
    from app.models.student_billing_period import StudentBillingPeriod

    student_id = payload.get("student_id")
    if not student_id:
        raise HTTPException(status_code=422, detail="student_id is required")

    student = db.execute(
        select(Student)
        .where(Student.id == uuid.UUID(student_id))
        .options(selectinload(Student.fee), selectinload(Student.billing_periods).selectinload(StudentBillingPeriod.payment))
    ).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    phone = student.whatsapp_no or student.parent_phone or student.contact_no
    if not phone:
        raise HTTPException(status_code=422, detail="No phone number found for this student")

    overview = get_student_billing_overview(db, student)
    amount = pending_amount(overview)
    details = pending_details(overview)

    message = (
        f"📢 *Fee Reminder*\n\n"
        f"Dear Parent,\n\n"
        f"This is a gentle reminder regarding pending fees for *{student.name}*.\n\n"
        f"💰 Pending: *₹{amount}*\n"
    )
    if details:
        message += f"📅 Months: {details}\n"
    message += (
        f"\nKindly clear the dues at your earliest convenience.\n\n"
        f"Thank you,\nMY Academy\n📞 044-4356 8296"
    )

    result = send_text_message_sync(phone, message)
    return {"status": result.get("status"), "phone": phone, "message": "Reminder sent" if result.get("status") == "sent" else result.get("error")}


@router.post("/whatsapp/send-bulk-reminder")
def whatsapp_send_bulk_reminder(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Send fee reminder to all students with pending fees (or filtered by class)."""
    from app.services.whatsapp_api import send_text_message_sync
    from app.services.billing import get_student_billing_overview, pending_amount, pending_details
    from app.models.student_billing_period import StudentBillingPeriod

    class_name = payload.get("class_name")
    _BILLING_OPTS = [selectinload(Student.fee), selectinload(Student.billing_periods).selectinload(StudentBillingPeriod.payment)]

    stmt = select(Student).where(Student.status == StudentStatus.active).options(*_BILLING_OPTS)
    if class_name:
        stmt = stmt.where(Student.class_name == class_name)

    students = db.execute(stmt).scalars().all()
    sent = 0
    failed = 0
    skipped = 0

    for student in students:
        overview = get_student_billing_overview(db, student)
        amount = pending_amount(overview)
        if amount <= 0:
            skipped += 1
            continue

        phone = student.whatsapp_no or student.parent_phone or student.contact_no
        if not phone:
            skipped += 1
            continue

        details = pending_details(overview)
        message = (
            f"📢 *Fee Reminder*\n\n"
            f"Dear Parent,\n\n"
            f"Pending fees for *{student.name}*: *₹{amount}*\n"
        )
        if details:
            message += f"Months: {details}\n"
        message += f"\nPlease clear at the earliest.\n— MY Academy"

        result = send_text_message_sync(phone, message)
        if result.get("status") == "sent":
            sent += 1
        else:
            failed += 1

    return {"sent": sent, "failed": failed, "skipped": skipped, "total": len(students)}


@router.post("/whatsapp/send-announcement")
def whatsapp_send_announcement(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Send announcement/ad to all students or a filtered class via WhatsApp."""
    from app.services.whatsapp_api import send_text_message_sync

    title = payload.get("title", "").strip()
    body = payload.get("body", "").strip()
    class_name = payload.get("class_name")

    if not title or not body:
        raise HTTPException(status_code=422, detail="title and body are required")

    message = f"📣 *{title}*\n\n{body}\n\n— MY Academy"

    stmt = select(Student).where(Student.status == StudentStatus.active)
    if class_name:
        stmt = stmt.where(Student.class_name == class_name)

    students = db.execute(stmt).scalars().all()
    sent = 0
    failed = 0

    for student in students:
        phone = student.whatsapp_no or student.parent_phone or student.contact_no
        if not phone:
            continue
        result = send_text_message_sync(phone, message)
        if result.get("status") == "sent":
            sent += 1
        else:
            failed += 1

    return {"sent": sent, "failed": failed, "total": len(students)}


@router.post("/whatsapp/send-leave-info")
def whatsapp_send_leave_info(
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Send leave/absence notification to parent via WhatsApp."""
    from app.services.whatsapp_api import send_text_message_sync

    student_id = payload.get("student_id")
    leave_date = payload.get("date", "")
    reason = payload.get("reason", "")

    if not student_id:
        raise HTTPException(status_code=422, detail="student_id is required")

    student = db.get(Student, uuid.UUID(student_id))
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    phone = student.whatsapp_no or student.parent_phone or student.contact_no
    if not phone:
        raise HTTPException(status_code=422, detail="No phone number found")

    message = (
        f"📋 *Absence Notification*\n\n"
        f"Student: *{student.name}*\n"
        f"Class: {student.class_name or '-'}\n"
        f"Date: {leave_date}\n"
    )
    if reason:
        message += f"Reason: {reason}\n"
    message += f"\n— MY Academy"

    result = send_text_message_sync(phone, message)
    return {"status": result.get("status"), "phone": phone}
