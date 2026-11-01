import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from sqlalchemy import select

from app.core.config import settings
from app.core.security import create_access_token, create_invitation_token, create_refresh_token, verify_password
from app.models.user import User
from app.models.enums import UserRole
from app.bootstrap_admin import provision_admin


def test_only_access_tokens_authenticate(client, db_session):
    admin = db_session.execute(select(User).where(User.username == 'admin')).scalar_one()
    subject = str(admin.id)
    invalid_tokens = [
        create_refresh_token(subject=subject),
        create_invitation_token(subject=subject, version='expired-invitation-version'),
        jwt.encode({'sub': subject, 'exp': datetime.now(UTC) + timedelta(hours=1)}, settings.jwt_secret, algorithm=settings.jwt_algorithm),
        jwt.encode({'sub': subject, 'type': 'access'}, settings.jwt_secret, algorithm=settings.jwt_algorithm),
    ]
    for token in invalid_tokens:
        assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + token}).status_code == 401
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + create_access_token(subject=subject)}).status_code == 200


@pytest.mark.parametrize('path', ['/staff', '/reports/summary', '/payments', '/students', '/academic/years', '/exams', '/cms', '/savings', '/enquiries', '/expenses/monthly?month=2026-10-01', '/attendance/students?date=2026-10-01'])
def test_unprivileged_staff_cannot_read_private_modules(client, db_session, path):
    user = User(username='restricted', password_hash='', role=UserRole.staff, permissions=[])
    db_session.add(user)
    db_session.commit()
    headers = {'Authorization': 'Bearer ' + create_access_token(subject=str(user.id))}
    assert client.get('/api' + path, headers=headers).status_code == 403


def test_exam_staff_can_load_structure_but_not_financial_or_student_profiles(client, db_session):
    user = User(username='teacher', password_hash='', role=UserRole.staff, permissions=['exams'])
    db_session.add(user)
    db_session.commit()
    headers = {'Authorization': 'Bearer ' + create_access_token(subject=str(user.id))}
    for path in ['/academic/years', '/academic/classes', '/exams']:
        assert client.get('/api' + path, headers=headers).status_code == 200
    for path in ['/staff', '/reports/summary', '/payments', '/students']:
        assert client.get('/api' + path, headers=headers).status_code == 403


def test_admin_provisioning_requires_explicit_reset_and_strong_password(db_session):
    with pytest.raises(ValueError):
        provision_admin(db_session, 'newadmin', 'admin123')
    provision_admin(db_session, 'newadmin', 'strong-password-123')
    user = db_session.execute(select(User).where(User.username == 'newadmin')).scalar_one()
    assert user.role == UserRole.admin and verify_password('strong-password-123', user.password_hash)
    with pytest.raises(ValueError):
        provision_admin(db_session, 'newadmin', 'another-password-123')
    provision_admin(db_session, 'newadmin', 'another-password-123', reset_password=True)
    assert verify_password('another-password-123', user.password_hash)


def test_attendance_staff_can_read_class_names_but_not_student_finances(client, db_session):
    user = User(username='attendanceonly', password_hash='', role=UserRole.staff, permissions=['attendance'])
    db_session.add(user)
    db_session.commit()
    headers = {'Authorization': 'Bearer ' + create_access_token(subject=str(user.id))}
    assert client.get('/api/students/classes', headers=headers).status_code == 200
    assert client.get('/api/students/balances', headers=headers).status_code == 403
    assert client.get('/api/students', headers=headers).status_code == 403
