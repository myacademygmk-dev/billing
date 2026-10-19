import uuid
from decimal import Decimal

from sqlalchemy import select

from app.models.promotion import StudentArrears

from .conftest import auth_header


def _academic_years(client, headers):
    source = client.post(
        "/api/academic/years",
        json={"name": "2026-2027", "start_date": "2026-05-01", "end_date": "2027-04-30"},
        headers=headers,
    )
    target = client.post(
        "/api/academic/years",
        json={"name": "2027-2028", "start_date": "2027-05-01", "end_date": "2028-04-30"},
        headers=headers,
    )
    assert source.status_code == 201
    assert target.status_code == 201
    return source.json()["id"], target.json()["id"]


def _rollover_payload(source_year_id: str, target_year_id: str) -> dict:
    return {
        "from_academic_year_id": source_year_id,
        "to_academic_year_id": target_year_id,
        "class_mappings": [{"from_class": "I", "to_class": "II"}],
        "new_batch": "2027-2028",
        "code_pattern": "{class_num:02d}{serial:02d}",
        "carry_forward_arrears": True,
        "new_billing_start_month": 5,
        "new_billing_end_month": 4,
    }


def test_rollover_carries_all_virtual_unpaid_months_before_batch_change(client, db_session):
    headers = auth_header(client)
    source_year_id, target_year_id = _academic_years(client, headers)
    student = client.post(
        "/api/students",
        json={
            "student_code": "ROLLFULL",
            "name": "Fully Unpaid",
            "class_name": "I",
            "batch": "2026-2027",
            "batch_start_month": 5,
            "billing_start_month": 5,
            "billing_end_month": 4,
        },
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)

    response = client.post(
        "/api/utils/academic-rollover",
        json=_rollover_payload(source_year_id, target_year_id),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["promoted_count"] == 1
    assert response.json()["arrears_created"] == 1
    assert Decimal(response.json()["details"][0]["arrears_amount"]) == Decimal("6000")

    db_session.expire_all()
    arrear = db_session.execute(
        select(StudentArrears).where(StudentArrears.student_id == uuid.UUID(student_id))
    ).scalar_one()
    assert Decimal(arrear.amount) == Decimal("6000")
    assert arrear.from_academic_year_id == uuid.UUID(source_year_id)

    promoted = client.get(f"/api/students/{student_id}", headers=headers)
    assert promoted.status_code == 200
    assert promoted.json()["batch"] == "2027-2028"
    assert promoted.json()["class_name"] == "II"


def test_rollover_excludes_paid_months_from_carried_arrears(client, db_session):
    headers = auth_header(client)
    source_year_id, target_year_id = _academic_years(client, headers)
    student = client.post(
        "/api/students",
        json={
            "student_code": "ROLLPART",
            "name": "Partly Paid",
            "class_name": "I",
            "batch": "2026-2027",
            "batch_start_month": 5,
        },
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 500}, headers=headers)
    payment = client.post(
        "/api/payments",
        json={
            "student_id": student_id,
            "student_code": "ROLLPART",
            "selected_months": ["2026-05-01", "2026-07-01"],
            "mode": "cash",
        },
        headers=headers,
    )
    assert payment.status_code == 201

    response = client.post(
        "/api/utils/academic-rollover",
        json=_rollover_payload(source_year_id, target_year_id),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["arrears_created"] == 1
    assert Decimal(response.json()["details"][0]["arrears_amount"]) == Decimal("5000")
    db_session.expire_all()
    arrear = db_session.execute(
        select(StudentArrears).where(StudentArrears.student_id == uuid.UUID(student_id))
    ).scalar_one()
    assert Decimal(arrear.amount) == Decimal("5000")


def test_rollover_does_not_mutate_same_class_student_from_another_year(client):
    headers = auth_header(client)
    source_year_id, target_year_id = _academic_years(client, headers)
    in_scope = client.post(
        "/api/students",
        json={
            "student_code": "ROLLSCOPE",
            "name": "Source Year",
            "class_name": "I",
            "batch": "2026-2027",
            "batch_start_month": 5,
        },
        headers=headers,
    )
    out_of_scope = client.post(
        "/api/students",
        json={
            "student_code": "ROLLOTHER",
            "name": "Different Year",
            "class_name": "I",
            "batch": "2027-2028",
            "batch_start_month": 5,
        },
        headers=headers,
    )
    assert in_scope.status_code == 201
    assert out_of_scope.status_code == 201

    response = client.post(
        "/api/utils/academic-rollover",
        json=_rollover_payload(source_year_id, target_year_id),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["promoted_count"] == 1
    unchanged = client.get(f"/api/students/{out_of_scope.json()['id']}", headers=headers)
    assert unchanged.json()["student_code"] == "ROLLOTHER"
    assert unchanged.json()["class_name"] == "I"
    assert unchanged.json()["batch"] == "2027-2028"
