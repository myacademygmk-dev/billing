from datetime import date
import uuid

import pytest
from sqlalchemy import select

from app.models.academic import AcademicYear, ClassSection, Subject
from app.models.exam import Exam, Mark
from app.models.student import Student
from app.models.enums import ExamType, StudentStatus
from .conftest import auth_header


@pytest.fixture
def sheet(db_session):
    year = AcademicYear(name="2026-27", start_date=date(2026, 6, 1), end_date=date(2027, 5, 31))
    db_session.add(year)
    db_session.flush()
    cls = ClassSection(academic_year_id=year.id, class_name="10")
    db_session.add(cls)
    db_session.flush()
    subjects = [Subject(class_section_id=cls.id, name="Math", max_marks=100), Subject(class_section_id=cls.id, name="Science", max_marks=50)]
    students = [Student(name="Anu", student_code="S001", class_name="10"), Student(name="Bala", student_code="S002", class_name="10")]
    exam = Exam(name="Quarterly", exam_type=ExamType.quarterly, academic_year_id=year.id, class_section_id=cls.id)
    db_session.add_all([*subjects, *students, exam])
    db_session.commit()
    return exam, cls, subjects, students


def entry(sheet, student=0, subject=0, score=0):
    return {"student_id": str(sheet[3][student].id), "subject_id": str(sheet[2][subject].id), "marks_obtained": score, "max_marks": sheet[2][subject].max_marks}


def test_sheet_saves_multiple_subjects_and_zero_without_overwriting(client, sheet):
    headers = auth_header(client)
    payload = {"exam_id": str(sheet[0].id), "marks": [entry(sheet), entry(sheet, subject=1, score="49.25")]}
    response = client.post('/api/exams/marks/bulk', json=payload, headers=headers)
    assert response.status_code == 201
    assert [m['marks_obtained'] for m in response.json()] == ['0.00', '49.25']
    assert client.post('/api/exams/marks/bulk', json=payload, headers=headers).status_code == 409
    assert client.get('/api/exams/marks', params={"exam_id": str(sheet[0].id)}, headers=headers).json()['total'] == 2


@pytest.mark.parametrize('score', [-1, 101, 'NaN', 'Infinity', '1.234'])
def test_invalid_scores_rejected_in_both_entry_routes(client, sheet, score):
    headers = auth_header(client)
    mark = entry(sheet, score=score)
    assert client.post('/api/exams/marks', json={"exam_id": str(sheet[0].id), **mark}, headers=headers).status_code == 422
    assert client.post('/api/exams/marks/bulk', json={"exam_id": str(sheet[0].id), "marks": [mark]}, headers=headers).status_code == 422


def test_duplicate_batch_and_invalid_member_write_nothing(client, sheet, db_session):
    headers = auth_header(client)
    mark = entry(sheet)
    payload = {"exam_id": str(sheet[0].id), "marks": [mark, mark]}
    assert client.post('/api/exams/marks/bulk', json=payload, headers=headers).status_code == 409
    payload['marks'][1] = {**entry(sheet, student=1), 'student_id': str(uuid.uuid4())}
    assert client.post('/api/exams/marks/bulk', json=payload, headers=headers).status_code == 404
    assert db_session.execute(select(Mark)).scalars().all() == []


def test_subject_maximum_and_student_class_are_authoritative(client, sheet, db_session):
    headers = auth_header(client)
    payload = {"exam_id": str(sheet[0].id), **entry(sheet), "max_marks": 200}
    assert client.post('/api/exams/marks', json=payload, headers=headers).status_code == 422
    sheet[3][0].class_name = '9'
    db_session.commit()
    payload['max_marks'] = 100
    assert client.post('/api/exams/marks', json=payload, headers=headers).status_code == 422


def test_roster_is_minimal_and_excludes_inactive_students(client, sheet, db_session):
    sheet[3][1].status = StudentStatus.inactive
    db_session.commit()
    response = client.get(f'/api/exams/{sheet[0].id}/roster', params={"class_section_id": str(sheet[1].id)}, headers=auth_header(client))
    assert response.status_code == 200
    assert response.json() == {'items': [{'id': str(sheet[3][0].id), 'name': 'Anu', 'student_code': 'S001'}], 'total': 1}


def test_exam_dates_and_class_year_validated(client, sheet, db_session):
    headers = auth_header(client)
    payload = {'name': 'Test', 'exam_type': 'quarterly', 'academic_year_id': str(sheet[0].academic_year_id), 'start_date': '2026-10-12', 'end_date': '2026-10-01'}
    assert client.post('/api/exams', json=payload, headers=headers).status_code == 422
    payload.update(start_date=None, end_date=None, class_section_id=str(uuid.uuid4()))
    assert client.post('/api/exams', json=payload, headers=headers).status_code == 422


def test_marks_cannot_cross_academic_years(client, sheet, db_session):
    year = AcademicYear(name='2027-28', start_date=date(2027, 6, 1), end_date=date(2028, 5, 31))
    db_session.add(year)
    db_session.flush()
    sheet[1].academic_year_id = year.id
    db_session.commit()
    headers = auth_header(client)
    assert client.post('/api/exams/marks', json={'exam_id': str(sheet[0].id), **entry(sheet)}, headers=headers).status_code == 422
    assert client.get(f'/api/exams/{sheet[0].id}/roster', params={'class_section_id': str(sheet[1].id)}, headers=headers).status_code == 422
