from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select, and_, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.attendance import StaffAttendance, StaffClockRecord, StudentAttendance
from app.models.staff import Staff
from app.models.student import Student
from app.models.enums import StudentStatus
from app.models.user import User
from app.schemas.attendance import (
    AttendanceSummary,
    BulkStaffAttendanceCreate,
    BulkStudentAttendanceCreate,
    StaffAttendanceRead,
    StaffClockAnalytics,
    StaffClockInRequest,
    StaffClockOutRequest,
    StaffClockRecordRead,
    StudentAttendanceRead,
)

router = APIRouter()


# --- Student Attendance ---

@router.post("/students", response_model=list[StudentAttendanceRead], status_code=201)
def bulk_mark_student_attendance(
    payload: BulkStudentAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StudentAttendanceRead]:
    """Mark attendance for multiple students at once for a given date."""
    results = []
    for entry in payload.entries:
        # Check if already marked
        existing = db.execute(
            select(StudentAttendance).where(
                and_(StudentAttendance.student_id == entry.student_id, StudentAttendance.date == payload.date)
            )
        ).scalar_one_or_none()

        if existing:
            # Update existing
            existing.status = entry.status
            existing.remarks = entry.remarks
            existing.marked_by = current_user.id
            results.append(existing)
        else:
            # Create new
            record = StudentAttendance(
                student_id=entry.student_id,
                date=payload.date,
                status=entry.status,
                remarks=entry.remarks,
                marked_by=current_user.id,
            )
            db.add(record)
            results.append(record)

    db.commit()
    for r in results:
        db.refresh(r)

    return [_student_attendance_read(db, r) for r in results]


@router.get("/students", response_model=dict)
def list_student_attendance(
    attendance_date: date = Query(alias="date"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    class_name: str | None = None,
) -> dict:
    """Get all student attendance for a given date. Returns all active students with their status."""
    stmt = select(Student).where(Student.status == StudentStatus.active)
    if class_name:
        stmt = stmt.where(Student.class_name == class_name)
    students = db.execute(stmt.order_by(Student.student_code)).scalars().all()

    # Get attendance records for this date
    student_ids = [s.id for s in students]
    attendance_map: dict[uuid.UUID, StudentAttendance] = {}
    if student_ids:
        records = db.execute(
            select(StudentAttendance).where(
                and_(StudentAttendance.date == attendance_date, StudentAttendance.student_id.in_(student_ids))
            )
        ).scalars().all()
        attendance_map = {r.student_id: r for r in records}

    items = []
    for student in students:
        record = attendance_map.get(student.id)
        items.append({
            "student_id": student.id,
            "student_code": student.student_code,
            "student_name": student.name,
            "class_name": student.class_name,
            "date": attendance_date.isoformat(),
            "status": record.status if record else "not_marked",
            "remarks": record.remarks if record else None,
        })

    marked = len(attendance_map)
    return {"items": items, "total": len(students), "marked": marked, "unmarked": len(students) - marked}


@router.get("/students/{student_id}/summary", response_model=AttendanceSummary)
def student_attendance_summary(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> AttendanceSummary:
    """Get attendance summary for a specific student."""
    stmt = select(StudentAttendance).where(StudentAttendance.student_id == student_id)
    if from_date:
        stmt = stmt.where(StudentAttendance.date >= from_date)
    if to_date:
        stmt = stmt.where(StudentAttendance.date <= to_date)
    records = db.execute(stmt).scalars().all()

    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent = sum(1 for r in records if r.status == "absent")
    late = sum(1 for r in records if r.status == "late")
    leave = sum(1 for r in records if r.status == "leave")
    percentage = round((present + late) / total * 100, 1) if total > 0 else 0.0

    return AttendanceSummary(total_days=total, present=present, absent=absent, late=late, leave=leave, percentage=percentage)


@router.get("/students/{student_id}/history", response_model=list[StudentAttendanceRead])
def student_attendance_history(
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> list[StudentAttendanceRead]:
    """Get attendance history for a specific student."""
    stmt = select(StudentAttendance).where(StudentAttendance.student_id == student_id)
    if from_date:
        stmt = stmt.where(StudentAttendance.date >= from_date)
    if to_date:
        stmt = stmt.where(StudentAttendance.date <= to_date)
    records = db.execute(stmt.order_by(StudentAttendance.date.desc())).scalars().all()
    return [_student_attendance_read(db, r) for r in records]


# --- Staff Attendance ---

@router.post("/staff", response_model=list[StaffAttendanceRead], status_code=201)
def bulk_mark_staff_attendance(
    payload: BulkStaffAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StaffAttendanceRead]:
    """Mark attendance for multiple staff at once."""
    results = []
    for entry in payload.entries:
        existing = db.execute(
            select(StaffAttendance).where(
                and_(StaffAttendance.staff_id == entry.staff_id, StaffAttendance.date == payload.date)
            )
        ).scalar_one_or_none()

        if existing:
            existing.status = entry.status
            existing.remarks = entry.remarks
            existing.marked_by = current_user.id
            results.append(existing)
        else:
            record = StaffAttendance(
                staff_id=entry.staff_id,
                date=payload.date,
                status=entry.status,
                remarks=entry.remarks,
                marked_by=current_user.id,
            )
            db.add(record)
            results.append(record)

    db.commit()
    for r in results:
        db.refresh(r)

    return [_staff_attendance_read(db, r) for r in results]


@router.get("/staff", response_model=dict)
def list_staff_attendance(
    attendance_date: date = Query(alias="date"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Get all staff attendance for a given date."""
    from app.models.enums import StaffStatus
    staff_list = db.execute(select(Staff).where(Staff.status == StaffStatus.active).order_by(Staff.name)).scalars().all()

    staff_ids = [s.id for s in staff_list]
    attendance_map: dict[uuid.UUID, StaffAttendance] = {}
    if staff_ids:
        records = db.execute(
            select(StaffAttendance).where(
                and_(StaffAttendance.date == attendance_date, StaffAttendance.staff_id.in_(staff_ids))
            )
        ).scalars().all()
        attendance_map = {r.staff_id: r for r in records}

    items = []
    for s in staff_list:
        record = attendance_map.get(s.id)
        items.append({
            "staff_id": s.id,
            "staff_code": s.staff_code,
            "staff_name": s.name,
            "role": s.role.value,
            "date": attendance_date.isoformat(),
            "status": record.status if record else "not_marked",
            "remarks": record.remarks if record else None,
        })

    marked = len(attendance_map)
    return {"items": items, "total": len(staff_list), "marked": marked, "unmarked": len(staff_list) - marked}


# --- Helpers ---

def _student_attendance_read(db: Session, record: StudentAttendance) -> StudentAttendanceRead:
    student = db.get(Student, record.student_id)
    data = StudentAttendanceRead.model_validate(record).model_dump()
    data["student_name"] = student.name if student else None
    data["student_code"] = student.student_code if student else None
    return StudentAttendanceRead.model_validate(data)


def _staff_attendance_read(db: Session, record: StaffAttendance) -> StaffAttendanceRead:
    staff = db.get(Staff, record.staff_id)
    data = StaffAttendanceRead.model_validate(record).model_dump()
    data["staff_name"] = staff.name if staff else None
    return StaffAttendanceRead.model_validate(data)


# --- Staff Clock In/Out ---

# Configurable expected start time (9:00 AM) and grace period (15 min)
EXPECTED_START_HOUR = 9
EXPECTED_START_MINUTE = 0
GRACE_PERIOD_MINUTES = 15


def _determine_clock_status(clock_in_time: datetime) -> str:
    """Determine status based on clock-in time. Late if after 9:15 AM."""
    local_time = clock_in_time.time()
    cutoff = time(EXPECTED_START_HOUR, EXPECTED_START_MINUTE + GRACE_PERIOD_MINUTES)
    if local_time > cutoff:
        return "late"
    return "present"


@router.post("/staff/clock-in", response_model=StaffClockRecordRead, status_code=201)
def staff_clock_in(
    payload: StaffClockInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StaffClockRecordRead:
    """Record staff clock-in with timestamp."""
    from app.models.enums import StaffStatus

    # Validate staff exists and is active
    staff = db.get(Staff, payload.staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    if staff.status != StaffStatus.active:
        raise HTTPException(status_code=400, detail="Staff is not active")

    now = datetime.now(UTC)
    today = now.date()

    # Check if already clocked in today
    existing = db.execute(
        select(StaffClockRecord).where(
            and_(StaffClockRecord.staff_id == payload.staff_id, StaffClockRecord.date == today)
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Staff already clocked in today")

    status = _determine_clock_status(now)

    record = StaffClockRecord(
        staff_id=payload.staff_id,
        date=today,
        clock_in=now,
        clock_in_note=payload.note,
        recorded_by=current_user.id,
        status=status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _clock_record_read(db, record)


@router.post("/staff/{staff_id}/clock-out", response_model=StaffClockRecordRead)
def staff_clock_out(
    staff_id: uuid.UUID,
    payload: StaffClockOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StaffClockRecordRead:
    """Record staff clock-out with timestamp. Calculates total hours."""
    today = datetime.now(UTC).date()

    # Find today's clock-in record
    record = db.execute(
        select(StaffClockRecord).where(
            and_(StaffClockRecord.staff_id == staff_id, StaffClockRecord.date == today)
        )
    ).scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=404, detail="No clock-in record found for today")

    if record.clock_out is not None:
        raise HTTPException(status_code=400, detail="Staff already clocked out today")

    now = datetime.now(UTC)
    record.clock_out = now
    record.clock_out_note = payload.note

    # Calculate total hours
    delta: timedelta = now - record.clock_in
    total_seconds = delta.total_seconds()
    record.total_hours = Decimal(str(round(total_seconds / 3600, 2)))

    # Mark as half_day if less than 4 hours
    if record.total_hours < Decimal("4.0"):
        record.status = "half_day"

    db.commit()
    db.refresh(record)

    return _clock_record_read(db, record)


@router.get("/staff/clock-records", response_model=list[StaffClockRecordRead])
def list_clock_records(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
    staff_id: uuid.UUID | None = Query(default=None),
) -> list[StaffClockRecordRead]:
    """List clock records for a date range with optional staff filter."""
    stmt = select(StaffClockRecord)

    if staff_id:
        stmt = stmt.where(StaffClockRecord.staff_id == staff_id)
    if from_date:
        stmt = stmt.where(StaffClockRecord.date >= from_date)
    if to_date:
        stmt = stmt.where(StaffClockRecord.date <= to_date)

    stmt = stmt.order_by(StaffClockRecord.date.desc(), StaffClockRecord.clock_in.desc())
    records = db.execute(stmt).scalars().all()

    return [_clock_record_read(db, r) for r in records]


@router.get("/staff/clock-analytics", response_model=list[StaffClockAnalytics])
def staff_clock_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    month: int = Query(ge=1, le=12),
    year: int = Query(ge=2020),
    staff_id: uuid.UUID | None = Query(default=None),
) -> list[StaffClockAnalytics]:
    """Get analytics: avg hours, late count, on-time count per staff for a given month."""
    from app.models.enums import StaffStatus

    stmt = select(StaffClockRecord).where(
        and_(
            extract("month", StaffClockRecord.date) == month,
            extract("year", StaffClockRecord.date) == year,
        )
    )
    if staff_id:
        stmt = stmt.where(StaffClockRecord.staff_id == staff_id)

    records = db.execute(stmt).scalars().all()

    # Group by staff_id
    staff_records: dict[uuid.UUID, list[StaffClockRecord]] = {}
    for r in records:
        staff_records.setdefault(r.staff_id, []).append(r)

    # If no specific staff_id filter, get all active staff for complete picture
    if not staff_id:
        active_staff = db.execute(
            select(Staff).where(Staff.status == StaffStatus.active)
        ).scalars().all()
        for s in active_staff:
            staff_records.setdefault(s.id, [])

    analytics = []
    for sid, recs in staff_records.items():
        staff = db.get(Staff, sid)
        if not staff:
            continue

        total_days = len(recs)
        late_count = sum(1 for r in recs if r.status == "late")
        on_time_count = sum(1 for r in recs if r.status == "present")

        hours_list = [float(r.total_hours) for r in recs if r.total_hours is not None]
        total_hours_month = sum(hours_list)
        avg_hours = round(total_hours_month / len(hours_list), 2) if hours_list else 0.0

        analytics.append(
            StaffClockAnalytics(
                staff_id=sid,
                staff_name=staff.name,
                total_days=total_days,
                avg_hours=avg_hours,
                late_count=late_count,
                on_time_count=on_time_count,
                total_hours_month=round(total_hours_month, 2),
            )
        )

    return analytics


def _clock_record_read(db: Session, record: StaffClockRecord) -> StaffClockRecordRead:
    staff = db.get(Staff, record.staff_id)
    data = StaffClockRecordRead.model_validate(record).model_dump()
    data["staff_name"] = staff.name if staff else None
    return StaffClockRecordRead.model_validate(data)
