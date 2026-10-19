from decimal import Decimal
import csv
import io

from app.models.student import Student
from app.models.student_fee import StudentFee

from .conftest import auth_header


def test_pending_calculation_correct(client):
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S004", "name": "Dan", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 1000}, headers=headers)
    client.post("/api/payments", json={"student_id": student_id, "student_code": "S004", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)

    pending = client.get("/api/reports/pending", headers=headers)
    assert pending.status_code == 200
    row = next(r for r in pending.json() if r["student_code"] == "S004")
    # 12-month batch, 1 month paid = 11 months pending @ 1000/mo
    assert Decimal(row["pending"]) == Decimal("11000")


def test_reports_summary(client):
    """Reports summary returns expected fields."""
    headers = auth_header(client)
    resp = client.get("/api/reports/summary?month=2026-06-01", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_collected" in data
    assert "paid_students" in data
    assert "unpaid_students" in data
    assert "active_students" in data


def test_reports_summary_counts_only_students_in_selected_billing_month(client):
    headers = auth_header(client)
    inside = client.post(
        "/api/students",
        json={"student_code": "SUMIN", "name": "Summary In", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    outside = client.post(
        "/api/students",
        json={"student_code": "SUMOUT", "name": "Summary Out", "batch": "2025-2026", "batch_start_month": 5},
        headers=headers,
    )
    client.patch(f"/api/students/{inside.json()['id']}/fee", json={"expected_fee_amount": 300}, headers=headers)
    client.patch(f"/api/students/{outside.json()['id']}/fee", json={"expected_fee_amount": 900}, headers=headers)

    resp = client.get("/api/reports/summary?month=2026-05-01", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["active_students"] == 1
    assert data["unpaid_students"] == 1
    assert Decimal(data["pending_total"]) == Decimal("300.00")


def test_reports_daily(client):
    """Reports daily returns mode-grouped totals."""
    headers = auth_header(client)
    resp = client.get("/api/reports/daily?date=2026-06-29", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_reports_monthly_students(client):
    """Reports monthly-students supports filtering."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "RPT1", "name": "Report Student", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 300}, headers=headers)

    resp = client.get("/api/reports/monthly-students?month=2026-05-01&payment_state=unpaid", headers=headers)
    assert resp.status_code == 200
    codes = [r["student_code"] for r in resp.json()]
    assert "RPT1" in codes


def test_export_students_csv(client):
    """Export students CSV returns valid CSV content."""
    headers = auth_header(client)
    client.post("/api/students", json={"student_code": "EXP1", "name": "Export Student"}, headers=headers)

    resp = client.get("/api/export/students.csv", headers=headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "student_code" in resp.text
    assert "EXP1" in resp.text


def test_export_payments_csv(client):
    """Export payments CSV returns valid CSV with data."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "EXP2", "name": "Pay Export", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 400}, headers=headers)
    client.post("/api/payments", json={"student_id": sid, "student_code": "EXP2", "billing_start_month": "2026-05-01", "mode": "upi"}, headers=headers)

    resp = client.get("/api/export/payments.csv", headers=headers)
    assert resp.status_code == 200
    assert "receipt_no" in resp.text


def test_export_pending_csv(client):
    """Export pending CSV only includes students with pending balance."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "EXP3", "name": "Pending Export", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 500}, headers=headers)

    resp = client.get("/api/export/pending.csv", headers=headers)
    assert resp.status_code == 200
    assert "EXP3" in resp.text


def test_pending_uses_custom_billing_month_range(client):
    headers = auth_header(client)
    s = client.post(
        "/api/students",
        json={
            "student_code": "CUSTOMRANGE",
            "name": "Custom Range",
            "batch": "2026-2027",
            "batch_start_month": 5,
            "billing_start_month": 11,
            "billing_end_month": 4,
        },
        headers=headers,
    )
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 100}, headers=headers)
    client.post(
        "/api/payments",
        json={"student_id": sid, "student_code": "CUSTOMRANGE", "billing_start_month": "2026-11-01", "mode": "cash"},
        headers=headers,
    )

    resp = client.get("/api/reports/pending?status=active", headers=headers)
    assert resp.status_code == 200
    row = next(r for r in resp.json() if r["student_code"] == "CUSTOMRANGE")
    assert Decimal(row["pending"]) == Decimal("500.00")


def test_monthly_students_filters_batch_window_before_pagination(client):
    headers = auth_header(client)
    outside = client.post(
        "/api/students",
        json={"student_code": "AAAOUT", "name": "Outside", "batch": "2025-2026", "batch_start_month": 5},
        headers=headers,
    )
    inside = client.post(
        "/api/students",
        json={"student_code": "ZZZIN", "name": "Inside", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    client.patch(f"/api/students/{outside.json()['id']}/fee", json={"expected_fee_amount": 100}, headers=headers)
    client.patch(f"/api/students/{inside.json()['id']}/fee", json={"expected_fee_amount": 100}, headers=headers)

    resp = client.get(
        "/api/reports/monthly-students?month=2026-05-01&payment_state=unpaid&page=1&page_size=1",
        headers=headers,
    )
    assert resp.status_code == 200
    assert [row["student_code"] for row in resp.json()] == ["ZZZIN"]


def test_export_pending_csv_matches_report_pending_order(client):
    headers = auth_header(client)
    low = client.post(
        "/api/students",
        json={"student_code": "CSVLOW", "name": "CSV Low", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    high = client.post(
        "/api/students",
        json={"student_code": "CSVHIGH", "name": "CSV High", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    client.patch(f"/api/students/{low.json()['id']}/fee", json={"expected_fee_amount": 100}, headers=headers)
    client.patch(f"/api/students/{high.json()['id']}/fee", json={"expected_fee_amount": 200}, headers=headers)

    api_rows = client.get("/api/reports/pending", headers=headers).json()
    csv_resp = client.get("/api/export/pending.csv", headers=headers)

    assert csv_resp.status_code == 200
    csv_rows = list(csv.DictReader(io.StringIO(csv_resp.text)))
    api_codes = [row["student_code"] for row in api_rows if row["student_code"] in {"CSVHIGH", "CSVLOW"}]
    csv_codes = [row["student_code"] for row in csv_rows if row["student_code"] in {"CSVHIGH", "CSVLOW"}]
    assert api_codes == ["CSVHIGH", "CSVLOW"]
    assert csv_codes == api_codes


def test_export_students_csv_keyset_paginates_all_rows(client, monkeypatch):
    from app.api.routes import export as export_routes

    monkeypatch.setattr(export_routes, "_CHUNK_SIZE", 1)
    headers = auth_header(client)
    for code in ["KEY001", "KEY002", "KEY003"]:
        client.post("/api/students", json={"student_code": code, "name": code}, headers=headers)

    resp = client.get("/api/export/students.csv", headers=headers)

    assert resp.status_code == 200
    rows = list(csv.DictReader(io.StringIO(resp.text)))
    codes = [row["student_code"] for row in rows if row["student_code"].startswith("KEY")]
    assert codes == ["KEY001", "KEY002", "KEY003"]


def test_export_payments_csv_keyset_paginates_all_rows(client, monkeypatch):
    from app.api.routes import export as export_routes

    monkeypatch.setattr(export_routes, "_CHUNK_SIZE", 1)
    headers = auth_header(client)
    s = client.post(
        "/api/students",
        json={"student_code": "PAYKEY", "name": "Pay Key", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 100}, headers=headers)
    for month in ["2026-05-01", "2026-06-01", "2026-07-01"]:
        client.post(
            "/api/payments",
            json={"student_id": sid, "student_code": "PAYKEY", "billing_start_month": month, "mode": "cash"},
            headers=headers,
        )

    resp = client.get("/api/export/payments.csv?student_id=" + sid, headers=headers)

    assert resp.status_code == 200
    rows = list(csv.DictReader(io.StringIO(resp.text)))
    assert len(rows) == 3
    assert {row["roll_no"] for row in rows} == {"PAYKEY"}


def test_export_students_xlsx_streams_with_explicit_ranges(client, monkeypatch):
    from app.api.routes import export as export_routes

    monkeypatch.setattr(export_routes, "_CHUNK_SIZE", 1)
    headers = auth_header(client)
    client.post("/api/students", json={"student_code": "XLSX1", "name": "Excel Export"}, headers=headers)

    resp = client.get(
        "/api/export/students.xlsx?attendance_from=2026-01-01&attendance_to=2026-12-31&marks_from=2026-01-01&marks_to=2026-12-31",
        headers=headers,
    )

    assert resp.status_code == 200
    assert "spreadsheetml.sheet" in resp.headers["content-type"]
    assert resp.content.startswith(b"PK")


def test_export_pending_csv_handles_larger_keyset_batches(client, db_session, monkeypatch):
    from app.api.routes import export as export_routes

    monkeypatch.setattr(export_routes, "_CHUNK_SIZE", 75)
    headers = auth_header(client)
    students = [
        Student(
            student_code=f"SCALE{i:04d}",
            name=f"Scale Student {i}",
            batch="2026-2027",
            batch_start_month=5,
        )
        for i in range(260)
    ]
    db_session.add_all(students)
    db_session.flush()
    db_session.add_all(
        StudentFee(student_id=student.id, expected_fee_amount=Decimal("100"))
        for student in students
    )
    db_session.commit()

    resp = client.get("/api/export/pending.csv", headers=headers)

    assert resp.status_code == 200
    rows = list(csv.DictReader(io.StringIO(resp.text)))
    scale_rows = [row for row in rows if row["student_code"].startswith("SCALE")]
    assert len(scale_rows) == 260
    assert {row["pending"] for row in scale_rows} == {"1200.00"}
