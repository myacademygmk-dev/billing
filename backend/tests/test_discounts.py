from decimal import Decimal

from .conftest import auth_header


def _student_with_fee(client, headers, code: str, amount: int = 1000) -> tuple[str, str]:
    student = client.post(
        "/api/students",
        json={
            "student_code": code,
            "name": f"{code} Student",
            "batch": "2026-2027",
            "batch_start_month": 5,
        },
        headers=headers,
    )
    assert student.status_code == 201
    student_id = student.json()["id"]
    fee = client.patch(
        f"/api/students/{student_id}/fee",
        json={"expected_fee_amount": amount},
        headers=headers,
    )
    assert fee.status_code == 200
    return student_id, code


def _discount(client, headers, name: str, discount_type: str, value: str) -> str:
    response = client.post(
        "/api/fees/discounts",
        json={"name": name, "discount_type": discount_type, "value": value},
        headers=headers,
    )
    assert response.status_code == 201
    return response.json()["id"]


def _assign(client, headers, student_id: str, discount_id: str):
    return client.post(
        "/api/fees/student-discounts",
        json={"student_id": student_id, "discount_id": discount_id},
        headers=headers,
    )


def test_assigned_discounts_reduce_collection_balance_and_reports(client):
    headers = auth_header(client)
    student_id, code = _student_with_fee(client, headers, "DISC001", amount=1000)
    ten_percent = _discount(client, headers, "Sibling", "percentage", "10")
    fixed_100 = _discount(client, headers, "Scholarship", "fixed", "100")

    assert _assign(client, headers, student_id, ten_percent).status_code == 201
    assert _assign(client, headers, student_id, fixed_100).status_code == 201

    overview = client.get(f"/api/students/{student_id}/billing-overview", headers=headers)
    assert overview.status_code == 200
    assert Decimal(overview.json()["monthly_fee"]) == Decimal("800.00")
    assert Decimal(overview.json()["payable_amount"]) == Decimal("800.00")

    payment = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": code,
            "selected_months": ["2026-05-01", "2026-06-01"],
            "mode": "cash",
        },
        headers=headers,
    )
    assert payment.status_code == 201
    assert Decimal(payment.json()["amount"]) == Decimal("1600.00")

    balance = client.get(f"/api/students/{student_id}/balance", headers=headers)
    assert balance.status_code == 200
    assert Decimal(balance.json()["expected_fee"]) == Decimal("800.00")
    assert Decimal(balance.json()["pending"]) == Decimal("8000.00")

    monthly = client.get(
        "/api/reports/monthly-students",
        params={"month": "2026-07-01", "payment_state": "unpaid"},
        headers=headers,
    )
    assert monthly.status_code == 200
    row = next(item for item in monthly.json() if item["student_code"] == code)
    assert Decimal(row["monthly_fee"]) == Decimal("800.00")

    pending = client.get("/api/reports/pending", headers=headers)
    assert pending.status_code == 200
    pending_row = next(item for item in pending.json() if item["student_code"] == code)
    assert Decimal(pending_row["expected_fee"]) == Decimal("800.00")
    assert Decimal(pending_row["pending"]) == Decimal("8000.00")


def test_discount_rounding_clamps_and_assignment_guards(client):
    headers = auth_header(client)
    student_id, code = _student_with_fee(client, headers, "DISC002", amount=333)
    one_third = _discount(client, headers, "One Third", "percentage", "33.33")
    huge_fixed = _discount(client, headers, "Full Aid", "fixed", "500")

    first_assignment = _assign(client, headers, student_id, one_third)
    duplicate_assignment = _assign(client, headers, student_id, one_third)
    assert first_assignment.status_code == 201
    assert duplicate_assignment.status_code == 409

    overview = client.get(f"/api/students/{student_id}/billing-overview", headers=headers)
    assert Decimal(overview.json()["monthly_fee"]) == Decimal("222.01")

    remove = client.delete(
        f"/api/fees/student-discounts/{first_assignment.json()['id']}",
        headers=headers,
    )
    assert remove.status_code == 204
    assert _assign(client, headers, student_id, huge_fixed).status_code == 201

    clamped = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": code,
            "billing_start_month": "2026-05-01",
            "mode": "cash",
        },
        headers=headers,
    )
    assert clamped.status_code == 422
    assert "greater than zero" in clamped.json()["detail"].lower()


def test_inactive_discount_cannot_be_newly_assigned_but_existing_assignment_still_applies(client):
    headers = auth_header(client)
    existing_student_id, existing_code = _student_with_fee(client, headers, "DISC003", amount=1000)
    new_student_id, _ = _student_with_fee(client, headers, "DISC004", amount=1000)
    discount_id = _discount(client, headers, "Legacy", "fixed", "250")

    assert _assign(client, headers, existing_student_id, discount_id).status_code == 201
    delete = client.delete(f"/api/fees/discounts/{discount_id}", headers=headers)
    assert delete.status_code == 204

    blocked = _assign(client, headers, new_student_id, discount_id)
    assert blocked.status_code == 409
    assert "inactive discount" in blocked.json()["detail"].lower()

    payment = client.post(
        "/api/payments",
        json={
            "student_id": existing_student_id,
            "student_code": existing_code,
            "billing_start_month": "2026-05-01",
            "mode": "cash",
        },
        headers=headers,
    )
    assert payment.status_code == 201
    assert Decimal(payment.json()["amount"]) == Decimal("750.00")
