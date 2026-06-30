from decimal import Decimal

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
