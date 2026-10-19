import uuid
from datetime import date
from decimal import Decimal

from app.models.academic import AcademicYear, ClassSection, Subject
from app.models.cms import GalleryPhoto
from app.models.enums import ExamType
from app.models.exam import Exam, Mark
from app.models.student import Student

from .conftest import auth_header


def test_marks_list_route_returns_marks(client, db_session):
    year = AcademicYear(
        name="2026-2027",
        start_date=date(2026, 5, 1),
        end_date=date(2027, 4, 30),
        is_current=True,
    )
    db_session.add(year)
    db_session.flush()

    class_section = ClassSection(
        academic_year_id=year.id,
        class_name="10",
        section="A",
    )
    db_session.add(class_section)
    db_session.flush()

    subject = Subject(class_section_id=class_section.id, name="Mathematics")
    student = Student(student_code="API-01", name="Route Test Student")
    exam = Exam(
        name="Quarterly Exam",
        exam_type=ExamType.quarterly,
        academic_year_id=year.id,
        class_section_id=class_section.id,
    )
    db_session.add_all([subject, student, exam])
    db_session.flush()

    mark = Mark(
        exam_id=exam.id,
        student_id=student.id,
        subject_id=subject.id,
        marks_obtained=Decimal("87.50"),
        max_marks=100,
    )
    db_session.add(mark)
    db_session.commit()

    response = client.get(
        "/api/exams/marks",
        params={"exam_id": str(exam.id)},
        headers=auth_header(client),
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"] == [
        {
            "id": str(mark.id),
            "exam_id": str(exam.id),
            "student_id": str(student.id),
            "subject_id": str(subject.id),
            "marks_obtained": "87.50",
            "max_marks": 100,
            "grade": None,
            "remarks": None,
            "student_name": "Route Test Student",
            "subject_name": "Mathematics",
            "created_at": mark.created_at.isoformat().replace("+00:00", "Z"),
        }
    ]


def test_unknown_exam_detail_still_returns_not_found(client):
    response = client.get(f"/api/exams/{uuid.uuid4()}", headers=auth_header(client))

    assert response.status_code == 404
    assert response.json() == {"detail": "Exam not found"}


def test_gallery_photo_list_route_returns_photos(client, db_session):
    photo = GalleryPhoto(
        url="/images/gallery-route-test.jpg",
        caption="Route test photo",
        display_order=3,
    )
    db_session.add(photo)
    db_session.commit()

    response = client.get("/api/cms/photos", headers=auth_header(client))

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"] == [
        {
            "id": str(photo.id),
            "url": "/images/gallery-route-test.jpg",
            "thumbnail_url": None,
            "caption": "Route test photo",
            "display_order": 3,
            "created_at": photo.created_at.isoformat().replace("+00:00", "Z"),
        }
    ]


def test_unknown_content_detail_still_returns_not_found(client):
    response = client.get(f"/api/cms/{uuid.uuid4()}", headers=auth_header(client))

    assert response.status_code == 404
    assert response.json() == {"detail": "Content not found"}
