from datetime import date
from decimal import Decimal

from app.models.enums import StudentStatus
from app.models.student import Student
from app.models.student_fee import StudentFee
from .conftest import auth_header


def test_statistics_are_school_wide_and_count_joining_dates(client, db_session):
    for index in range(30):
        student = Student(
            student_code=f"KPI{index:03}", name=f"Student {index}",
            class_name="10" if index % 2 else "11",
            status=StudentStatus.active if index < 25 else StudentStatus.inactive,
            joined_date=date(2026, 12, 1) if index < 3 else date(2026, 11, 30),
            batch="2026-2027", batch_start_month=6,
        )
        student.fee = StudentFee(expected_fee_amount=Decimal("500") if index < 2 else Decimal("0"))
        db_session.add(student)
    db_session.add(Student(student_code="FUTURE", name="Future admission", joined_date=date(2027, 1, 1)))
    db_session.add(Student(student_code="UNDATED", name="No joining date"))
    db_session.commit()
    response = client.get("/api/students/statistics?month=2026-12-15", headers=auth_header(client))
    assert response.status_code == 200
    assert response.json() == {
        "total_students": 32, "active_students": 27, "new_admissions": 3,
        "students_with_dues": 2, "admissions_month": "2026-12-01",
    }


def test_empty_statistics_and_authentication(client):
    assert client.get("/api/students/statistics").status_code == 401
    response = client.get("/api/students/statistics?month=2026-09-01", headers=auth_header(client))
    assert response.status_code == 200
    assert response.json() == {
        "total_students": 0, "active_students": 0, "new_admissions": 0,
        "students_with_dues": 0, "admissions_month": "2026-09-01",
    }
