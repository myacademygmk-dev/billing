from __future__ import annotations

from datetime import UTC, date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.enums import StudentStatus
from app.models.payment import Payment
from app.models.student import Student
from app.models.user import User
from app.services.billing import month_label, normalize_month, payment_period_label
from app.services.reporting import monthly_students_query, paged_rows, pending_students_query


router = APIRouter()


@router.get("/summary", response_model=dict)
def summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    from_dt: datetime | None = Query(default=None, alias="from"),
    to_dt: datetime | None = Query(default=None, alias="to"),
    month: date | None = Query(default=None),
) -> dict:
    selected_month = normalize_month(month or datetime.now(UTC).date())
    month_start = datetime.combine(selected_month, time.min, tzinfo=UTC)
    if selected_month.month == 12:
        next_month = date(selected_month.year + 1, 1, 1)
    else:
        next_month = date(selected_month.year, selected_month.month + 1, 1)
    next_month_start = datetime.combine(next_month, time.min, tzinfo=UTC)

    stmt = select(func.coalesce(func.sum(Payment.amount), 0))
    if from_dt:
        stmt = stmt.where(Payment.paid_at >= from_dt)
    if to_dt:
        stmt = stmt.where(Payment.paid_at <= to_dt)
    if month is not None:
        stmt = stmt.where(Payment.paid_at >= month_start).where(Payment.paid_at < next_month_start)
    total_collected = db.execute(stmt).scalar_one()

    now = datetime.now(UTC)
    today_start = datetime.combine(now.date(), time.min, tzinfo=UTC)
    today_total = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.paid_at >= today_start)
    ).scalar_one()
    month_total = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.paid_at >= month_start)
        .where(Payment.paid_at < next_month_start)
    ).scalar_one()

    monthly_rows = monthly_students_query(selected_month, "all").where(Student.status == StudentStatus.active).subquery()
    summary_row = db.execute(
        select(
            func.count(monthly_rows.c.student_id).label("active_students"),
            func.count(monthly_rows.c.payment_id).label("paid_students"),
            func.coalesce(
                func.sum(
                    case(
                        (monthly_rows.c.payment_id.is_(None), monthly_rows.c.monthly_fee),
                        else_=0,
                    )
                ),
                0,
            ).label("pending_total"),
        )
    ).one()
    active_students = summary_row.active_students
    paid_students = summary_row.paid_students
    unpaid_students = max(active_students - paid_students, 0)
    pending_total = summary_row.pending_total
    return {
        "total_collected": str(total_collected),
        "today_total": str(today_total),
        "month_total": str(month_total),
        "pending_total": str(pending_total),
        "paid_students": paid_students,
        "unpaid_students": unpaid_students,
        "active_students": active_students,
        "selected_month": selected_month.isoformat(),
    }


@router.get("/pending", response_model=list[dict])
def pending(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    status: StudentStatus | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=500),
) -> list[dict]:
    rows = paged_rows(db, pending_students_query(status), page, page_size)
    return [
        {
            "student_id": row["student_id"],
            "student_code": row["student_code"],
            "name": row["name"],
            "expected_fee": str(row["expected_fee"]),
            "paid_total": str(row["paid_total"]),
            "pending": str(row["pending"]),
        }
        for row in rows
    ]


@router.get("/monthly-students", response_model=list[dict])
def monthly_students(
    month: date = Query(...),
    payment_state: str = Query("unpaid", pattern="^(paid|unpaid|all)$"),
    search: str | None = None,
    class_code: str | None = None,
    class_name: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[dict]:
    selected_month = normalize_month(month)
    stmt = monthly_students_query(selected_month, payment_state, search, class_code, class_name).where(
        Student.status == StudentStatus.active
    )
    rows = paged_rows(db, stmt, page, page_size)
    items: list[dict] = []
    for row in rows:
        is_paid = row["payment_id"] is not None
        items.append(
            {
                "student_id": row["student_id"],
                "student_code": row["student_code"],
                "name": row["name"],
                "class_name": row["class_name"],
                "payment_period": payment_period_label(row["payment_period"]),
                "monthly_fee": str(row["monthly_fee"]),
                "month": selected_month.isoformat(),
                "month_label": month_label(selected_month),
                "is_paid": is_paid,
                "receipt_no": row["receipt_no"],
            }
        )
    return items


@router.get("/daily", response_model=list[dict])
def daily(
    report_date: date = Query(alias="date"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[dict]:
    start = datetime.combine(report_date, time.min, tzinfo=UTC)
    end = datetime.combine(report_date, time.max, tzinfo=UTC)
    rows = (
        db.execute(
            select(Payment.mode, func.coalesce(func.sum(Payment.amount), 0).label("total"))
            .where(Payment.paid_at >= start)
            .where(Payment.paid_at <= end)
            .group_by(Payment.mode)
        )
        .all()
    )
    return [{"mode": mode.value, "total": str(total)} for mode, total in rows]


@router.get("/annual", response_model=dict)
def annual_revenue(
    year: int = Query(..., description="Calendar year (e.g. 2025)"),
    from_month: date | None = Query(default=None, alias="from", description="Start month (YYYY-MM-DD)"),
    to_month: date | None = Query(default=None, alias="to", description="End month (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Annual revenue summary: monthly breakdown, mode breakdown, and totals.
    
    Optionally filter by from/to month range. If not provided, defaults to full year.
    """
    # Determine date range
    if from_month and to_month:
        range_start = datetime.combine(normalize_month(from_month), time.min, tzinfo=UTC)
        # End of the 'to' month
        to_normalized = normalize_month(to_month)
        if to_normalized.month == 12:
            range_end_date = date(to_normalized.year + 1, 1, 1)
        else:
            range_end_date = date(to_normalized.year, to_normalized.month + 1, 1)
        range_end = datetime.combine(range_end_date, time.min, tzinfo=UTC)
    else:
        range_start = datetime.combine(date(year, 1, 1), time.min, tzinfo=UTC)
        range_end = datetime.combine(date(year + 1, 1, 1), time.min, tzinfo=UTC)

    # Monthly totals
    monthly_rows = db.execute(
        select(
            extract("year", Payment.paid_at).label("yr"),
            extract("month", Payment.paid_at).label("month"),
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
            func.count(Payment.id).label("count"),
        )
        .where(Payment.paid_at >= range_start)
        .where(Payment.paid_at < range_end)
        .group_by(extract("year", Payment.paid_at), extract("month", Payment.paid_at))
        .order_by(extract("year", Payment.paid_at), extract("month", Payment.paid_at))
    ).all()

    monthly_breakdown = []
    seen_keys: set[tuple[int, int]] = set()
    for yr, month_num, total, count in monthly_rows:
        y = int(yr)
        m = int(month_num)
        seen_keys.add((y, m))
        monthly_breakdown.append({
            "year": y,
            "month": m,
            "month_name": date(y, m, 1).strftime("%B"),
            "total": str(total),
            "payment_count": count,
        })

    # Fill missing months in the range with zero
    if from_month and to_month:
        cursor = normalize_month(from_month)
        end_cursor = normalize_month(to_month)
        while cursor <= end_cursor:
            if (cursor.year, cursor.month) not in seen_keys:
                monthly_breakdown.append({
                    "year": cursor.year,
                    "month": cursor.month,
                    "month_name": cursor.strftime("%B"),
                    "total": "0",
                    "payment_count": 0,
                })
            if cursor.month == 12:
                cursor = date(cursor.year + 1, 1, 1)
            else:
                cursor = date(cursor.year, cursor.month + 1, 1)
    else:
        for m in range(1, 13):
            if (year, m) not in seen_keys:
                monthly_breakdown.append({
                    "year": year,
                    "month": m,
                    "month_name": date(year, m, 1).strftime("%B"),
                    "total": "0",
                    "payment_count": 0,
                })
    monthly_breakdown.sort(key=lambda x: (x["year"], x["month"]))

    # Mode breakdown
    mode_rows = db.execute(
        select(
            Payment.mode,
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
            func.count(Payment.id).label("count"),
        )
        .where(Payment.paid_at >= range_start)
        .where(Payment.paid_at < range_end)
        .group_by(Payment.mode)
    ).all()

    mode_breakdown = [
        {"mode": mode.value, "total": str(total), "payment_count": count}
        for mode, total, count in mode_rows
    ]

    # Grand total
    grand_total = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.paid_at >= range_start)
        .where(Payment.paid_at < range_end)
    ).scalar_one()

    total_payments = db.execute(
        select(func.count(Payment.id))
        .where(Payment.paid_at >= range_start)
        .where(Payment.paid_at < range_end)
    ).scalar_one()

    # Previous year comparison
    prev_year_start = datetime.combine(date(year - 1, 1, 1), time.min, tzinfo=UTC)
    prev_year_end = datetime.combine(date(year, 1, 1), time.min, tzinfo=UTC)
    prev_year_total = db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.paid_at >= prev_year_start)
        .where(Payment.paid_at < prev_year_end)
    ).scalar_one()

    return {
        "year": year,
        "grand_total": str(grand_total),
        "total_payments": total_payments,
        "previous_year_total": str(prev_year_total),
        "monthly_breakdown": monthly_breakdown,
        "mode_breakdown": mode_breakdown,
    }
