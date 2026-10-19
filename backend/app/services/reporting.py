from __future__ import annotations

from datetime import date

from sqlalchemy import Integer, Numeric, and_, case, cast, extract, func, literal, select
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.fee_structure import FeeDiscount, StudentDiscount
from app.models.student import Student
from app.models.student_billing_period import StudentBillingPeriod
from app.models.student_fee import StudentFee


def _bounded_month(value, default):
    month = func.coalesce(value, default)
    return case((month < 1, 1), (month > 12, 12), else_=month)


def _student_batch_ordinals():
    base_start_month = _bounded_month(Student.batch_start_month, literal(1))
    anchor = func.coalesce(Student.joined_date, func.current_date())
    anchor_year = cast(extract("year", anchor), Integer)
    anchor_month = cast(extract("month", anchor), Integer)
    has_batch = Student.batch.like("____-____")
    batch_year = cast(func.substr(Student.batch, 1, 4), Integer)
    standard_start_year = case(
        (has_batch, batch_year),
        else_=anchor_year - case((anchor_month < base_start_month, 1), else_=0),
    )

    has_custom_months = and_(Student.billing_start_month.is_not(None), Student.billing_end_month.is_not(None))
    custom_start_month = _bounded_month(Student.billing_start_month, base_start_month)
    custom_end_month = _bounded_month(Student.billing_end_month, base_start_month)
    custom_start_ord = (standard_start_year * 12) + custom_start_month
    custom_end_year = standard_start_year + case((custom_end_month < custom_start_month, 1), else_=0)
    custom_end_ord = (custom_end_year * 12) + custom_end_month
    standard_start_ord = (standard_start_year * 12) + base_start_month

    start_ord = case((has_custom_months, custom_start_ord), else_=standard_start_ord)
    end_ord = case((has_custom_months, custom_end_ord), else_=standard_start_ord + 11)
    return start_ord.label("batch_start_ord"), end_ord.label("batch_end_ord")


def _month_ordinal(value):
    return (cast(extract("year", value), Integer) * 12) + cast(extract("month", value), Integer)


def month_ordinal(value: date) -> int:
    return value.year * 12 + value.month


def paid_period_counts_subquery():
    start_ord, end_ord = _student_batch_ordinals()
    period_ord = _month_ordinal(StudentBillingPeriod.period_month)
    return (
        select(
            StudentBillingPeriod.student_id.label("student_id"),
            func.count(StudentBillingPeriod.id).label("paid_period_count"),
        )
        .join(Student, Student.id == StudentBillingPeriod.student_id)
        .where(StudentBillingPeriod.payment_id.is_not(None))
        .where(period_ord >= start_ord)
        .where(period_ord <= end_ord)
        .group_by(StudentBillingPeriod.student_id)
        .subquery()
    )


def paid_totals_subquery():
    return (
        select(
            Payment.student_id.label("student_id"),
            func.coalesce(func.sum(Payment.amount), 0).label("paid_total"),
        )
        .group_by(Payment.student_id)
        .subquery()
    )


def student_discount_totals_subquery():
    """Return one aggregate row per student, ignoring duplicate legacy links."""
    assignments = (
        select(StudentDiscount.student_id, StudentDiscount.discount_id)
        .distinct()
        .subquery()
    )
    return (
        select(
            assignments.c.student_id.label("student_id"),
            func.coalesce(
                func.sum(case((FeeDiscount.discount_type == "percentage", FeeDiscount.value), else_=0)),
                0,
            ).label("percentage_total"),
            func.coalesce(
                func.sum(case((FeeDiscount.discount_type == "fixed", FeeDiscount.value), else_=0)),
                0,
            ).label("fixed_total"),
        )
        .join(FeeDiscount, FeeDiscount.id == assignments.c.discount_id)
        .group_by(assignments.c.student_id)
        .subquery()
    )


def discounted_monthly_fee_expression(gross_fee, discount_totals):
    """SQL equivalent of billing.discounted_monthly_fee for report queries."""
    percentage_total = func.coalesce(discount_totals.c.percentage_total, 0)
    fixed_total = func.coalesce(discount_totals.c.fixed_total, 0)
    discounted = gross_fee - (gross_fee * percentage_total / 100) - fixed_total
    nonnegative = case((discounted < 0, 0), else_=discounted)
    return cast(func.round(nonnegative, 2), Numeric(12, 2))


def pending_students_query(status=None):
    start_ord, end_ord = _student_batch_ordinals()
    paid_counts = paid_period_counts_subquery()
    paid_totals = paid_totals_subquery()
    discount_totals = student_discount_totals_subquery()
    gross_fee = func.coalesce(StudentFee.expected_fee_amount, 0)
    monthly_fee = discounted_monthly_fee_expression(gross_fee, discount_totals)
    paid_period_count = func.coalesce(paid_counts.c.paid_period_count, 0)
    expected_months = (end_ord - start_ord + 1).label("expected_months")
    pending_months = (end_ord - start_ord + 1 - paid_period_count).label("pending_months")
    pending_amount = (monthly_fee * (end_ord - start_ord + 1 - paid_period_count)).label("pending")

    stmt = (
        select(
            Student.id.label("student_id"),
            Student.student_code,
            Student.name,
            monthly_fee.label("expected_fee"),
            func.coalesce(paid_totals.c.paid_total, 0).label("paid_total"),
            expected_months,
            pending_months,
            pending_amount,
        )
        .outerjoin(StudentFee, StudentFee.student_id == Student.id)
        .outerjoin(discount_totals, discount_totals.c.student_id == Student.id)
        .outerjoin(paid_counts, paid_counts.c.student_id == Student.id)
        .outerjoin(paid_totals, paid_totals.c.student_id == Student.id)
    )
    if status is not None:
        stmt = stmt.where(Student.status == status)
    return stmt.where(pending_amount > 0).order_by(pending_amount.desc(), Student.student_code)


def monthly_students_query(selected_month: date, payment_state: str, search: str | None = None, class_code: str | None = None, class_name: str | None = None):
    start_ord, end_ord = _student_batch_ordinals()
    selected_ord = month_ordinal(selected_month)
    discount_totals = student_discount_totals_subquery()
    gross_fee = func.coalesce(StudentFee.expected_fee_amount, 0)
    monthly_fee = discounted_monthly_fee_expression(gross_fee, discount_totals)
    period_match = and_(
        StudentBillingPeriod.student_id == Student.id,
        StudentBillingPeriod.period_month == selected_month,
    )
    stmt = (
        select(
            Student.id.label("student_id"),
            Student.student_code,
            Student.name,
            Student.class_name,
            Student.payment_period,
            monthly_fee.label("monthly_fee"),
            StudentBillingPeriod.payment_id,
            Payment.receipt_no,
        )
        .outerjoin(StudentFee, StudentFee.student_id == Student.id)
        .outerjoin(discount_totals, discount_totals.c.student_id == Student.id)
        .outerjoin(StudentBillingPeriod, period_match)
        .outerjoin(Payment, Payment.id == StudentBillingPeriod.payment_id)
        .where(selected_ord >= start_ord)
        .where(selected_ord <= end_ord)
    )
    if search:
        s = f"%{search.lower()}%"
        stmt = stmt.where(
            func.lower(Student.student_code).like(s)
            | func.lower(Student.name).like(s)
            | func.lower(Student.class_name).like(s)
        )
    if class_code:
        stmt = stmt.where(Student.student_code.like(f"{class_code.strip()}%"))
    if class_name:
        stmt = stmt.where(Student.class_name == class_name)
    if payment_state == "paid":
        stmt = stmt.where(StudentBillingPeriod.payment_id.is_not(None))
    elif payment_state == "unpaid":
        stmt = stmt.where(StudentBillingPeriod.payment_id.is_(None))
    return stmt.order_by(Student.student_code)


def paged_rows(db: Session, stmt, page: int, page_size: int):
    return db.execute(stmt.offset((page - 1) * page_size).limit(page_size)).mappings().all()
