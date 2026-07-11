from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.exam import Exam, Mark
from app.models.student import Student
from app.models.academic import Subject
from app.models.user import User
from app.schemas.exam import BulkMarkCreate, ExamCreate, ExamRead, MarkCreate, MarkRead

router = APIRouter()


# --- Exams ---

@router.post("", response_model=ExamRead, status_code=201)
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> ExamRead:
    exam = Exam(**payload.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return ExamRead.model_validate(exam)


@router.get("", response_model=dict)
def list_exams(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    academic_year_id: uuid.UUID | None = None,
    class_section_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    stmt = select(Exam)
    if academic_year_id:
        stmt = stmt.where(Exam.academic_year_id == academic_year_id)
    if class_section_id:
        stmt = stmt.where(Exam.class_section_id == class_section_id)
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()
    items = db.execute(stmt.order_by(Exam.start_date.desc().nulls_last()).offset((page - 1) * page_size).limit(page_size)).scalars().all()
    return {"items": [ExamRead.model_validate(e) for e in items], "total": total}


@router.get("/{exam_id}", response_model=ExamRead)
def get_exam(exam_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)) -> ExamRead:
    exam = db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return ExamRead.model_validate(exam)


@router.delete("/{exam_id}", status_code=204, response_class=Response, response_model=None)
def delete_exam(exam_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    exam = db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()


# --- Marks ---

@router.post("/marks", response_model=MarkRead, status_code=201)
def create_mark(
    payload: MarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MarkRead:
    mark = Mark(**payload.model_dump(), entered_by=current_user.id)
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return _mark_read(db, mark)


@router.post("/marks/bulk", response_model=list[MarkRead], status_code=201)
def bulk_create_marks(
    payload: BulkMarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MarkRead]:
    exam = db.get(Exam, payload.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    created = []
    for entry in payload.marks:
        mark = Mark(
            exam_id=payload.exam_id,
            student_id=entry.student_id,
            subject_id=entry.subject_id,
            marks_obtained=entry.marks_obtained,
            max_marks=entry.max_marks,
            grade=entry.grade,
            remarks=entry.remarks,
            entered_by=current_user.id,
        )
        db.add(mark)
        created.append(mark)
    db.commit()
    return [_mark_read(db, m) for m in created]


@router.get("/marks", response_model=dict)
def list_marks(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    student_id: uuid.UUID | None = None,
) -> dict:
    stmt = select(Mark).where(Mark.exam_id == exam_id)
    if student_id:
        stmt = stmt.where(Mark.student_id == student_id)
    marks = db.execute(stmt.order_by(Mark.created_at)).scalars().all()
    return {"items": [_mark_read(db, m) for m in marks], "total": len(marks)}


@router.delete("/marks/{mark_id}", status_code=204, response_class=Response, response_model=None)
def delete_mark(mark_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin_user)) -> Response:
    mark = db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")
    db.delete(mark)
    db.commit()


def _mark_read(db: Session, mark: Mark) -> MarkRead:
    student = db.get(Student, mark.student_id)
    subject = db.get(Subject, mark.subject_id)
    data = MarkRead.model_validate(mark).model_dump()
    data["student_name"] = student.name if student else None
    data["subject_name"] = subject.name if subject else None
    return MarkRead.model_validate(data)


# --- Report Card PDF ---

@router.get("/{exam_id}/report-card/{student_id}.pdf")
def download_report_card(
    exam_id: uuid.UUID,
    student_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Response:
    from app.api.routes.settings import get_institution_branding
    from app.services.report_card_pdf import MarkEntry as PdfMarkEntry, render_report_card_pdf
    from decimal import Decimal

    exam = db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    marks_records = db.execute(
        select(Mark).where(Mark.exam_id == exam_id, Mark.student_id == student_id)
    ).scalars().all()

    if not marks_records:
        raise HTTPException(status_code=404, detail="No marks found for this student in this exam")

    pdf_marks = []
    total_obtained = Decimal("0")
    total_max = 0
    for m in marks_records:
        subject = db.get(Subject, m.subject_id)
        pdf_marks.append(PdfMarkEntry(
            subject=subject.name if subject else "Unknown",
            marks_obtained=m.marks_obtained,
            max_marks=m.max_marks,
            grade=m.grade,
        ))
        total_obtained += m.marks_obtained
        total_max += m.max_marks

    percentage = float(total_obtained / Decimal(total_max) * 100) if total_max > 0 else 0.0

    branding = get_institution_branding(db)
    pdf = render_report_card_pdf(
        student_name=student.name,
        student_code=student.student_code,
        class_name=student.class_name or "-",
        exam_name=exam.name,
        marks=pdf_marks,
        total_obtained=total_obtained,
        total_max=total_max,
        percentage=percentage,
        branding=branding,
    )
    filename = f"report_card_{student.student_code}_{exam.name.replace(' ', '_')}.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# --- Auto Grade & Rank ---

@router.post("/{exam_id}/calculate-grades")
def calculate_grades_and_ranks(
    exam_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> dict:
    """Auto-calculate grades and ranks for all students in an exam."""
    from decimal import Decimal

    exam = db.get(Exam, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    marks = db.execute(select(Mark).where(Mark.exam_id == exam_id)).scalars().all()
    if not marks:
        raise HTTPException(status_code=404, detail="No marks found for this exam")

    # Group by student, calculate total
    student_totals: dict[uuid.UUID, dict] = {}
    for m in marks:
        if m.student_id not in student_totals:
            student_totals[m.student_id] = {"total": Decimal("0"), "max": 0, "marks": []}
        student_totals[m.student_id]["total"] += m.marks_obtained
        student_totals[m.student_id]["max"] += m.max_marks
        student_totals[m.student_id]["marks"].append(m)

    # Calculate percentage and assign grades
    def get_grade(percentage: float) -> str:
        if percentage >= 90: return "A+"
        if percentage >= 80: return "A"
        if percentage >= 70: return "B+"
        if percentage >= 60: return "B"
        if percentage >= 50: return "C"
        if percentage >= 35: return "D"
        return "F"

    # Sort by total for ranking
    ranked = sorted(student_totals.items(), key=lambda x: x[1]["total"], reverse=True)

    for rank_idx, (student_id, data) in enumerate(ranked, 1):
        percentage = float(data["total"] / Decimal(data["max"]) * 100) if data["max"] > 0 else 0
        grade = get_grade(percentage)
        for m in data["marks"]:
            mark_pct = float(m.marks_obtained / Decimal(m.max_marks) * 100) if m.max_marks > 0 else 0
            m.grade = get_grade(mark_pct)

    db.commit()

    return {
        "message": f"Calculated grades for {len(student_totals)} students",
        "rankings": [
            {
                "rank": i + 1,
                "student_id": str(sid),
                "total": str(data["total"]),
                "max": data["max"],
                "percentage": round(float(data["total"] / Decimal(data["max"]) * 100), 1) if data["max"] > 0 else 0,
                "grade": get_grade(float(data["total"] / Decimal(data["max"]) * 100) if data["max"] > 0 else 0),
            }
            for i, (sid, data) in enumerate(ranked)
        ],
    }
