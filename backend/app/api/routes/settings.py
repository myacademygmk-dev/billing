from __future__ import annotations

import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin_user
from app.core.database import get_db
from app.models.billing_settings import BillingSettings
from app.models.enums import PaymentCycle
from app.models.institution_settings import InstitutionSettings
from app.models.payment import Payment
from app.models.receipt_sequence import ReceiptSequence
from app.models.savings_entry import SavingsEntry
from app.models.student import Student
from app.models.student_billing_period import StudentBillingPeriod
from app.models.student_fee import StudentFee
from app.models.user import User
from app.schemas.settings import (
    BillingSettingsRead,
    BillingSettingsUpdate,
    DatabaseResetRead,
    DatabaseResetRequest,
    InstitutionSettingsRead,
    InstitutionSettingsUpdate,
    RandomBillRequest,
)
from app.services.bill_pdf import InstitutionBranding, render_custom_bill_pdf
from app.services.billing import cycle_months_for, get_billing_settings


router = APIRouter()

RESET_CONFIRMATION_TEXT = "DELETE ALL DATA"
logger = logging.getLogger(__name__)


def get_institution_settings(db: Session) -> InstitutionSettings:
    """Get or create singleton institution settings row."""
    settings = db.get(InstitutionSettings, 1)
    if settings is None:
        settings = InstitutionSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def get_institution_branding(db: Session) -> InstitutionBranding:
    """Load institution branding for PDF generation."""
    inst = get_institution_settings(db)
    return InstitutionBranding(
        name=inst.name,
        tagline=inst.tagline,
        registration_no=inst.registration_no,
    )


@router.get("/billing", response_model=BillingSettingsRead)
def get_billing_settings_route(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> BillingSettingsRead:
    settings = get_billing_settings(db)
    return BillingSettingsRead(
        cycle_mode=settings.cycle_mode,
        cycle_months=cycle_months_for(settings.cycle_mode),
        updated_at=settings.updated_at,
        updated_by=settings.updated_by,
    )


@router.patch("/billing", response_model=BillingSettingsRead)
def update_billing_settings_route(
    payload: BillingSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> BillingSettingsRead:
    settings = get_billing_settings(db)
    settings.cycle_mode = payload.cycle_mode
    settings.updated_at = datetime.now(UTC)
    settings.updated_by = current_user.id
    db.commit()
    db.refresh(settings)
    return BillingSettingsRead(
        cycle_mode=settings.cycle_mode,
        cycle_months=cycle_months_for(settings.cycle_mode),
        updated_at=settings.updated_at,
        updated_by=settings.updated_by,
    )


@router.get("/institution", response_model=InstitutionSettingsRead)
def get_institution_settings_route(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> InstitutionSettingsRead:
    inst = get_institution_settings(db)
    return _inst_to_read(inst)


@router.patch("/institution", response_model=InstitutionSettingsRead)
def update_institution_settings_route(
    payload: InstitutionSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> InstitutionSettingsRead:
    inst = get_institution_settings(db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(inst, field, value)
    inst.updated_at = datetime.now(UTC)
    inst.updated_by = current_user.id
    db.commit()
    db.refresh(inst)
    return _inst_to_read(inst)


def _inst_to_read(inst) -> InstitutionSettingsRead:
    return InstitutionSettingsRead(
        name=inst.name,
        tagline=inst.tagline,
        registration_no=inst.registration_no,
        address=inst.address,
        phone=inst.phone,
        email=inst.email,
        marquee_text=inst.marquee_text,
        stats_students=inst.stats_students,
        stats_staff=inst.stats_staff,
        stats_years=inst.stats_years,
        stats_standards=inst.stats_standards,
        hero_title=inst.hero_title,
        hero_subtitle=inst.hero_subtitle,
        hero_description=inst.hero_description,
        admission_text=inst.admission_text,
        alumni_data=inst.alumni_data,
        faculty_data=inst.faculty_data,
        facilities_data=inst.facilities_data,
        popup_banner_url=inst.popup_banner_url,
        hero_slides=inst.hero_slides,
        videos=inst.videos,
        countdown_date=inst.countdown_date,
        countdown_title=inst.countdown_title,
        top_bar_text=inst.top_bar_text,
        management_team=inst.management_team,
        technical_team=inst.technical_team,
        former_staff=inst.former_staff,
        updated_at=inst.updated_at,
        updated_by=inst.updated_by,
    )


@router.post("/database/reset", response_model=DatabaseResetRead)
def reset_database_route(
    payload: DatabaseResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_user),
) -> DatabaseResetRead:
    if payload.confirmation_text.strip() != RESET_CONFIRMATION_TEXT:
        raise HTTPException(status_code=422, detail=f'Type "{RESET_CONFIRMATION_TEXT}" to confirm this action')

    students_deleted = db.execute(select(func.count()).select_from(Student)).scalar_one()
    payments_deleted = db.execute(select(func.count()).select_from(Payment)).scalar_one()
    billing_periods_deleted = db.execute(select(func.count()).select_from(StudentBillingPeriod)).scalar_one()
    fee_records_deleted = db.execute(select(func.count()).select_from(StudentFee)).scalar_one()

    settings = get_billing_settings(db)
    receipt_sequence = db.get(ReceiptSequence, 1)
    try:
        # Delete child tables first (order matters for FK constraints)
        db.execute(delete(SavingsEntry))
        db.execute(delete(StudentBillingPeriod))
        db.execute(delete(Payment))
        db.execute(delete(StudentFee))
        # Delete attendance and other FK references
        from app.models.attendance import StudentAttendance, StaffAttendance
        from app.models.attendance import StaffClockRecord
        from app.models.promotion import PromotionHistory, StudentArrears
        from app.models.exam import Mark
        db.execute(delete(Mark))
        db.execute(delete(StudentAttendance))
        db.execute(delete(StaffAttendance))
        db.execute(delete(StaffClockRecord))
        db.execute(delete(PromotionHistory))
        db.execute(delete(StudentArrears))
        # Now safe to delete students
        db.execute(delete(Student))

        if receipt_sequence is None:
            receipt_sequence = ReceiptSequence(id=1, current_number=0)
            db.add(receipt_sequence)
        else:
            receipt_sequence.current_number = 0
            receipt_sequence.updated_at = datetime.now(UTC)

        settings.cycle_mode = PaymentCycle.tri_monthly
        settings.updated_at = datetime.now(UTC)
        settings.updated_by = current_user.id

        db.commit()
        logger.warning(
            "DATABASE RESET by user=%s: students=%d payments=%d periods=%d fees=%d",
            current_user.id, students_deleted, payments_deleted, billing_periods_deleted, fee_records_deleted,
        )
    except Exception:
        db.rollback()
        raise

    return DatabaseResetRead(
        students_deleted=students_deleted,
        payments_deleted=payments_deleted,
        billing_periods_deleted=billing_periods_deleted,
        fee_records_deleted=fee_records_deleted,
        receipt_sequence_reset=True,
        billing_cycle_reset_to_default=True,
    )


@router.post("/random-bill.pdf")
def generate_random_bill_pdf(
    payload: RandomBillRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
) -> Response:
    branding = get_institution_branding(db)
    pdf = render_custom_bill_pdf(
        fields=[(field.label.strip(), field.value.strip()) for field in payload.fields],
        branding=branding,
    )
    filename = (payload.file_name.strip() if payload.file_name else "random-bill") or "random-bill"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )
