from decimal import Decimal

from .conftest import auth_header


def test_create_student_and_update_fee(client):
    headers = auth_header(client)
    s = client.post(
        "/api/students",
        json={"student_code": "S001", "name": "Alice", "class_name": "10", "section": "A"},
        headers=headers,
    )
    assert s.status_code == 201
    student_id = s.json()["id"]

    fee = client.patch(
        f"/api/students/{student_id}/fee",
        json={"expected_fee_amount": 1000},
        headers=headers,
    )
    assert fee.status_code == 200
    assert Decimal(fee.json()["expected_fee_amount"]) == Decimal("1000")


def test_student_code_uniqueness_on_update(client):
    """Updating student_code to an existing code is blocked."""
    headers = auth_header(client)
    client.post("/api/students", json={"student_code": "U001", "name": "First"}, headers=headers)
    s2 = client.post("/api/students", json={"student_code": "U002", "name": "Second"}, headers=headers)
    sid2 = s2.json()["id"]

    resp = client.patch(f"/api/students/{sid2}", json={"student_code": "U001"}, headers=headers)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"].lower()


def test_student_code_update_valid(client):
    """Updating student_code to a unique value works."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "U003", "name": "Third"}, headers=headers)
    sid = s.json()["id"]

    resp = client.patch(f"/api/students/{sid}", json={"student_code": "U999"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["student_code"] == "U999"


def test_student_list_pagination(client):
    """Student list supports pagination."""
    headers = auth_header(client)
    for i in range(5):
        client.post("/api/students", json={"student_code": f"PG{i:03d}", "name": f"Page {i}"}, headers=headers)

    resp = client.get("/api/students?page=1&page_size=2", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2
    assert resp.json()["total"] >= 5


def test_student_list_search(client):
    """Student list supports search by name and code."""
    headers = auth_header(client)
    client.post("/api/students", json={"student_code": "SRCH1", "name": "Searchable Student"}, headers=headers)

    resp = client.get("/api/students?search=Searchable", headers=headers)
    assert resp.status_code == 200
    assert any(s["student_code"] == "SRCH1" for s in resp.json()["items"])


def test_inactive_student_without_payments_can_be_hard_deleted(client):
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S014", "name": "Ivy"}, headers=headers)
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}", json={"status": "inactive"}, headers=headers)

    deleted = client.delete(f"/api/students/{student_id}", headers=headers)
    lookup = client.get(f"/api/students/{student_id}", headers=headers)

    assert deleted.status_code == 204
    assert lookup.status_code == 404


def test_hard_delete_fails_when_payment_history_exists(client):
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S015", "name": "Jill"}, headers=headers)
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 700}, headers=headers)
    client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "S015", "billing_start_month": "2026-01-01", "mode": "cash"},
        headers=headers,
    )
    client.patch(f"/api/students/{student_id}", json={"status": "inactive"}, headers=headers)

    deleted = client.delete(f"/api/students/{student_id}", headers=headers)

    assert deleted.status_code == 409
    assert "payment history" in deleted.json()["detail"].lower()


def test_import_students_from_excel(client):
    from io import BytesIO
    from openpyxl import Workbook

    headers = auth_header(client)
    wb = Workbook()
    ws = wb.active
    ws.append(["S.NO", "R.NO", "NAME", "CLASS", "FEE", "PERIOD", "JOINED DATE", "START", "END"])
    ws.append([1, "S010", "Eve", "10-B", 1200, "MONTHLY", "2026-05-20", "JUN", "APR"])
    ws.append([2, "S011", "Frank", "9-A", "900.50", "QUARTERLY", "2026-05-20", "NOV", "APR"])
    buf = BytesIO()
    wb.save(buf)
    payload = buf.getvalue()

    resp = client.post(
        "/api/students/import",
        headers=headers,
        data={"batch": "2026-2027", "batch_start_month": "May"},
        files={"file": ("students.xlsx", payload, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["created"] == 2
    assert data["fee_updated"] == 2

    students = client.get("/api/students?search=S011", headers=headers)
    student = students.json()["items"][0]
    assert student["billing_start_month"] == 11
    assert student["billing_end_month"] == 4

    overview = client.get(f"/api/students/{student['id']}/billing-overview", headers=headers)
    overview_data = overview.json()
    assert overview_data["batch_start_label"] == "Nov 2026"
    assert overview_data["batch_end_label"] == "Apr 2027"
