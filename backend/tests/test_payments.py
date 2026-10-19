import uuid
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier

import pytest

from app.core.database import engine
from app.models.payment import Payment
from app.models.payment_month_allocation import PaymentMonthAllocation

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


def test_student_list_next_due_matches_partial_quarterly_cycle(client):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={
            "student_code": "CYCLE1",
            "name": "Partial Quarterly",
            "batch": "2026-2027",
            "batch_start_month": 5,
            "payment_period": "QUARTERLY",
        },
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    paid = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "CYCLE1",
            "selected_months": ["2026-05-01"],
            "mode": "cash",
        },
        headers=headers,
    )
    assert paid.status_code == 201

    listing = client.get("/api/students/balances?search=CYCLE1", headers=headers)

    assert listing.status_code == 200
    item = listing.json()["items"][0]
    assert item["next_due_label"] == "Jun-Jul 2026"
    assert item["next_due_state"] == "pending"


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


@pytest.mark.parametrize("requested_amount", [1, 500, 1000])
def test_partial_or_explicit_reversal_amount_is_rejected_without_mutation(client, db_session, requested_amount):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": f"REVAMT{requested_amount}", "name": "Reversal Bounds", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    payment = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": f"REVAMT{requested_amount}", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )

    response = client.post(
        f"/api/payments/{payment.json()['id']}/reverse",
        json={"reason": "Unsupported partial reversal", "amount": requested_amount},
        headers=headers,
    )

    assert response.status_code == 422
    assert "partial reversals are not supported" in response.json()["detail"].lower()
    db_session.expire_all()
    original = db_session.get(Payment, uuid.UUID(payment.json()["id"]))
    assert original is not None
    assert len(original.billing_periods) == 1
    assert original.billing_periods[0].payment_id == original.id


def test_reversing_a_reversal_is_rejected(client):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVERSALROW", "name": "Reversal Row", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVERSALROW", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )
    reversal = client.post(
        f"/api/payments/{original.json()['id']}/reverse",
        json={"reason": "Original correction"},
        headers=headers,
    )

    response = client.post(
        f"/api/payments/{reversal.json()['id']}/reverse",
        json={"reason": "Unsupported reversal of reversal"},
        headers=headers,
    )

    assert response.status_code == 409
    assert "positive original" in response.json()["detail"].lower()
    payments = client.get(f"/api/payments?student_id={student_id}", headers=headers)
    assert payments.json()["total"] == 2
    assert sorted(Decimal(item["amount"]) for item in payments.json()["items"]) == [Decimal("-500"), Decimal("500")]


def test_full_multi_month_reversal_cancels_amount_and_releases_all_months(client, db_session):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVMULTI", "name": "Multi Reversal", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVMULTI", "selected_months": ["2026-05-01", "2026-06-01"], "mode": "cash"},
        headers=headers,
    )

    reversal = client.post(
        f"/api/payments/{original.json()['id']}/reverse",
        json={"reason": "Cancel full receipt"},
        headers=headers,
    )

    assert reversal.status_code == 201
    assert Decimal(reversal.json()["amount"]) == Decimal("-1000")
    db_session.expire_all()
    original_row = db_session.get(Payment, uuid.UUID(original.json()["id"]))
    assert original_row is not None
    assert len(original_row.billing_periods) == 0

    recollection = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVMULTI", "selected_months": ["2026-05-01", "2026-06-01"], "mode": "upi"},
        headers=headers,
    )
    assert recollection.status_code == 201
    assert Decimal(recollection.json()["amount"]) == Decimal("1000")


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


def test_positive_payment_note_cannot_falsely_block_reversal(client):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVNOTE", "name": "Note Marker", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVNOTE", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )
    forged_note = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "REVNOTE",
            "billing_start_month": "2026-06-01",
            "mode": "cash",
            "notes": f"REVERSAL of {original.json()['receipt_no']}: ordinary user note",
        },
        headers=headers,
    )
    assert forged_note.status_code == 201

    reversal = client.post(
        f"/api/payments/{original.json()['id']}/reverse",
        json={"reason": "Legitimate correction"},
        headers=headers,
    )
    assert reversal.status_code == 201
    assert Decimal(reversal.json()["amount"]) == Decimal("-500")


def test_long_valid_reason_stays_within_payment_note_limit(client):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVLONG", "name": "Long Reason", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "REVLONG",
            "billing_start_month": "2026-05-01",
            "mode": "cash",
            "notes": "x" * 500,
        },
        headers=headers,
    )
    reversal = client.post(
        f"/api/payments/{original.json()['id']}/reverse",
        json={"reason": "r" * 300},
        headers=headers,
    )

    assert reversal.status_code == 201
    assert len(reversal.json()["notes"]) <= 500


def test_concurrent_reversal_allows_exactly_one_winner_on_postgresql(client):
    if engine.dialect.name != "postgresql":
        pytest.skip("PostgreSQL row-lock test requires a PostgreSQL test database")

    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVCONCURRENT", "name": "Concurrent Reversal", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVCONCURRENT", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )
    start = Barrier(2)

    def reverse(reason: str) -> int:
        start.wait()
        return client.post(
            f"/api/payments/{original.json()['id']}/reverse",
            json={"reason": reason},
            headers=headers,
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = sorted(pool.map(reverse, ["Concurrent A", "Concurrent B"]))

    assert statuses == [201, 409]
    payments = client.get(f"/api/payments?student_id={student_id}", headers=headers).json()["items"]
    assert sum(1 for payment in payments if Decimal(payment["amount"]) < 0) == 1
    recollection = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVCONCURRENT", "billing_start_month": "2026-05-01", "mode": "upi"},
        headers=headers,
    )
    assert recollection.status_code == 201


def test_concurrent_create_and_reversal_do_not_deadlock_on_postgresql(client):
    if engine.dialect.name != "postgresql":
        pytest.skip("PostgreSQL row-lock test requires a PostgreSQL test database")

    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVCREATE", "name": "Create Race", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVCREATE", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )
    start = Barrier(2)

    def reverse() -> int:
        start.wait()
        return client.post(
            f"/api/payments/{original.json()['id']}/reverse",
            json={"reason": "Concurrent correction"},
            headers=headers,
        ).status_code

    def recollect() -> int:
        start.wait()
        return client.post(
            "/api/payments",
            json={"student_id": student_id, "student_code": "REVCREATE", "billing_start_month": "2026-05-01", "mode": "upi"},
            headers=headers,
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        reverse_future = pool.submit(reverse)
        recollect_future = pool.submit(recollect)
        reverse_status = reverse_future.result(timeout=10)
        recollect_status = recollect_future.result(timeout=10)

    assert reverse_status == 201
    assert recollect_status in (201, 409)


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


def test_same_calendar_month_dates_create_one_charge_and_allocation(client, db_session):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "MONTHDAY", "name": "Month Day", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)

    response = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "MONTHDAY",
            "selected_months": ["2026-05-01", "2026-05-15"],
            "mode": "cash",
        },
        headers=headers,
    )

    assert response.status_code == 201
    assert Decimal(response.json()["amount"]) == Decimal("500")
    assert response.json()["billing_cycle_months"] == 1
    assert response.json()["billing_start_month"] == "2026-05-01"
    assert response.json()["fee_period_label"] == "May 2026"

    db_session.expire_all()
    payment = db_session.get(Payment, uuid.UUID(response.json()["id"]))
    assert payment is not None
    assert len(payment.billing_periods) == 1
    assert payment.billing_periods[0].period_month.isoformat() == "2026-05-01"
    assert Decimal(payment.amount) == Decimal("500") * len(payment.billing_periods)

    receipt = client.get(f"/api/payments/{response.json()['id']}/receipt", headers=headers)
    assert receipt.status_code == 200
    assert Decimal(receipt.json()["amount"]) == Decimal("500")
    assert receipt.json()["fee_period_label"] == "May 2026"

    duplicate_day = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "MONTHDAY", "selected_months": ["2026-05-20"], "mode": "upi"},
        headers=headers,
    )
    assert duplicate_day.status_code == 409
    assert "already paid" in duplicate_day.json()["detail"].lower()


def test_arbitrary_dates_across_months_create_distinct_normalized_allocations(client, db_session):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "TWOMONTHS", "name": "Two Months", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)

    response = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "TWOMONTHS",
            "selected_months": ["2026-06-30", "2026-05-15", "2026-05-01"],
            "mode": "cash",
        },
        headers=headers,
    )

    assert response.status_code == 201
    assert Decimal(response.json()["amount"]) == Decimal("1000")
    assert response.json()["billing_cycle_months"] == 2
    assert response.json()["billing_start_month"] == "2026-05-01"
    assert response.json()["fee_period_label"] == "May 2026 - Jun 2026"

    db_session.expire_all()
    payment = db_session.get(Payment, uuid.UUID(response.json()["id"]))
    assert payment is not None
    assert sorted(period.period_month.isoformat() for period in payment.billing_periods) == ["2026-05-01", "2026-06-01"]
    assert Decimal(payment.amount) == Decimal("500") * len(payment.billing_periods)


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


def test_reversal_preserves_non_contiguous_receipt_month_history(client, db_session, monkeypatch):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "HISTORY", "name": "Receipt History", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    original = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "HISTORY",
            "selected_months": ["2026-05-01", "2026-07-01"],
            "mode": "cash",
        },
        headers=headers,
    )
    reversal = client.post(
        f"/api/payments/{original.json()['id']}/reverse",
        json={"reason": "Correct non-contiguous payment"},
        headers=headers,
    )
    assert reversal.status_code == 201

    original_receipt = client.get(f"/api/payments/{original.json()['id']}/receipt", headers=headers)
    reversal_receipt = client.get(f"/api/payments/{reversal.json()['id']}/receipt", headers=headers)
    assert original_receipt.json()["fee_period_label"] == "May 2026, Jul 2026"
    assert reversal_receipt.json()["fee_period_label"] == "May 2026, Jul 2026"

    captured_periods = []

    def fake_render_bill_pdf(**kwargs):
        captured_periods.append(kwargs["fee_period"])
        return b"%PDF-test"

    monkeypatch.setattr("app.api.routes.payments.render_bill_pdf", fake_render_bill_pdf)
    pdf = client.get(f"/api/payments/{original.json()['id']}/receipt.pdf", headers=headers)
    assert pdf.status_code == 200
    assert captured_periods == ["May 2026, Jul 2026"]

    recollection = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "HISTORY",
            "selected_months": ["2026-05-01", "2026-07-01"],
            "mode": "upi",
        },
        headers=headers,
    )
    assert recollection.status_code == 201
    unchanged = client.get(f"/api/payments/{original.json()['id']}/receipt", headers=headers)
    assert unchanged.json()["fee_period_label"] == "May 2026, Jul 2026"

    db_session.expire_all()
    history = db_session.query(PaymentMonthAllocation).filter(
        PaymentMonthAllocation.payment_id.in_(
            [uuid.UUID(original.json()["id"]), uuid.UUID(reversal.json()["id"])]
        )
    ).all()
    assert len(history) == 4


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
