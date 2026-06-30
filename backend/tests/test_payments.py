from decimal import Decimal

from .conftest import auth_header


def test_payment_generates_unique_receipt(client):
    headers = auth_header(client)
    s = client.post(
        "/api/students",
        json={"student_code": "S002", "name": "Bob", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)

    p1 = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "S002", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )
    p2 = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "S002", "billing_start_month": "2026-06-01", "mode": "upi"},
        headers=headers,
    )
    assert p1.status_code == 201
    assert p2.status_code == 201
    assert p1.json()["receipt_no"] != p2.json()["receipt_no"]
    assert p1.json()["bill_no"] == "0001"
    assert p2.json()["bill_no"] == "0002"


def test_bill_no_resets_for_new_academic_period(client):
    headers = auth_header(client)
    s1 = client.post("/api/students", json={"student_code": "S002A", "name": "Bob A", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    s2 = client.post("/api/students", json={"student_code": "S002B", "name": "Bob B", "batch": "2027-2028", "batch_start_month": 5}, headers=headers)
    client.patch(f"/api/students/{s1.json()['id']}/fee", json={"expected_fee_amount": 500}, headers=headers)
    client.patch(f"/api/students/{s2.json()['id']}/fee", json={"expected_fee_amount": 500}, headers=headers)

    p1 = client.post("/api/payments", json={"student_id": s1.json()["id"], "student_code": "S002A", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)
    p2 = client.post("/api/payments", json={"student_id": s2.json()["id"], "student_code": "S002B", "billing_start_month": "2027-05-01", "mode": "cash"}, headers=headers)

    assert p1.status_code == 201
    assert p2.status_code == 201
    assert p1.json()["academic_period"] == "2026-2027"
    assert p2.json()["academic_period"] == "2027-2028"
    assert p1.json()["bill_no"] == "0001"
    assert p2.json()["bill_no"] == "0001"


def test_list_payments_filters_by_bill_no(client):
    headers = auth_header(client)
    student = client.post("/api/students", json={"student_code": "S002C", "name": "Bob C", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)

    first = client.post("/api/payments", json={"student_id": student_id, "student_code": "S002C", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)
    second = client.post("/api/payments", json={"student_id": student_id, "student_code": "S002C", "billing_start_month": "2026-06-01", "mode": "upi"}, headers=headers)
    assert first.status_code == 201
    assert second.status_code == 201

    filtered = client.get("/api/payments?bill_no=0002", headers=headers)
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1
    assert filtered.json()["items"][0]["bill_no"] == "0002"


def test_reverse_payment_creates_negative_entry(client):
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S003", "name": "Carol", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 250}, headers=headers)

    p = client.post("/api/payments", json={"student_id": student_id, "student_code": "S003", "billing_start_month": "2026-05-01", "mode": "bank"}, headers=headers)
    payment_id = p.json()["id"]

    rev = client.post(f"/api/payments/{payment_id}/reverse", json={"reason": "Entered twice"}, headers=headers)
    assert rev.status_code == 201
    assert Decimal(rev.json()["amount"]) == Decimal("-250")
    assert "REVERSAL" in rev.json()["notes"]


def test_double_reversal_is_blocked(client):
    """A payment cannot be reversed twice."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S020", "name": "Rev Test", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 800}, headers=headers)

    p = client.post("/api/payments", json={"student_id": sid, "student_code": "S020", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)
    pid = p.json()["id"]

    first_rev = client.post(f"/api/payments/{pid}/reverse", json={"reason": "Mistake"}, headers=headers)
    assert first_rev.status_code == 201

    second_rev = client.post(f"/api/payments/{pid}/reverse", json={"reason": "Again"}, headers=headers)
    assert second_rev.status_code == 409
    assert "already been reversed" in second_rev.json()["detail"].lower()


def test_duplicate_month_payment_is_blocked(client):
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S012", "name": "Grace", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)

    first = client.post("/api/payments", json={"student_id": student_id, "student_code": "S012", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)
    second = client.post("/api/payments", json={"student_id": student_id, "student_code": "S012", "billing_start_month": "2026-05-01", "mode": "upi"}, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 409
    assert "already paid" in second.json()["detail"].lower()


def test_reversal_reopens_billing_periods(client):
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "S013", "name": "Hari"}, headers=headers)
    student_id = s.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 600}, headers=headers)

    payment = client.post("/api/payments", json={"student_id": student_id, "student_code": "S013", "billing_start_month": "2026-01-01", "mode": "cash"}, headers=headers)
    payment_id = payment.json()["id"]
    reverse = client.post(f"/api/payments/{payment_id}/reverse", json={"reason": "Customer refund"}, headers=headers)
    retry = client.post("/api/payments", json={"student_id": student_id, "student_code": "S013", "billing_start_month": "2026-01-01", "mode": "cash"}, headers=headers)

    assert reverse.status_code == 201
    assert retry.status_code == 201


def test_payment_with_zero_fee_rejected(client):
    """Payment is rejected when student has zero fee."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "ZERO", "name": "No Fee", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    sid = s.json()["id"]

    resp = client.post("/api/payments", json={"student_id": sid, "student_code": "ZERO", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)
    assert resp.status_code == 422
    assert "fee" in resp.json()["detail"].lower()


def test_payment_receipt_pdf_generated(client):
    """Payment receipt PDF is valid."""
    headers = auth_header(client)
    s = client.post("/api/students", json={"student_code": "PDF1", "name": "PDF Test", "batch": "2026-2027", "batch_start_month": 5}, headers=headers)
    sid = s.json()["id"]
    client.patch(f"/api/students/{sid}/fee", json={"expected_fee_amount": 900}, headers=headers)
    p = client.post("/api/payments", json={"student_id": sid, "student_code": "PDF1", "billing_start_month": "2026-05-01", "mode": "cash"}, headers=headers)
    pid = p.json()["id"]

    resp = client.get(f"/api/payments/{pid}/receipt.pdf", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content.startswith(b"%PDF")
