import uuid
from datetime import UTC, datetime, timedelta

import jwt

from .conftest import auth_header
from app.core.config import settings


def staff_auth_header(client, username: str = "staffuser", permissions: list[str] | None = None) -> dict[str, str]:
    headers = auth_header(client)
    email = f"{username}@test.com"
    payload = {"username": username, "email": email, "role": "staff"}
    if permissions is not None:
        payload["permissions"] = permissions
    registration = client.post("/api/auth/register", json=payload, headers=headers)
    client.post(
        "/api/auth/setup-password",
        json={"token": registration.json()["invitation_token"], "password": "staff123"},
    )
    login = client.post("/api/auth/login", json={"username": username, "password": "staff123"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_login_works(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"


def test_refresh_token_flow(client):
    """Refresh token can be exchanged for a new token pair."""
    login_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    refresh_token = login_resp.json()["refresh_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"
    # New access token works
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200


def test_refresh_with_access_token_rejected(client):
    """Access tokens cannot be used as refresh tokens."""
    login_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    access_token = login_resp.json()["access_token"]

    resp = client.post("/api/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401


def test_refresh_with_invalid_token_rejected(client):
    """Invalid refresh token is rejected."""
    resp = client.post("/api/auth/refresh", json={"refresh_token": "invalid-token"})
    assert resp.status_code == 401


def test_login_rate_limiting(client):
    """Rate limiter blocks after 5 failed attempts."""
    for _ in range(5):
        client.post("/api/auth/login", json={"username": "bad", "password": "bad"})
    resp = client.post("/api/auth/login", json={"username": "bad", "password": "bad"})
    assert resp.status_code == 429
    assert "wait" in resp.json()["detail"].lower()


def test_setup_password_rejects_email_only_account_claim(client):
    headers = auth_header(client)
    client.post(
        "/api/auth/register",
        json={"username": "unclaimed", "email": "unclaimed@test.com", "role": "staff"},
        headers=headers,
    )

    resp = client.post(
        "/api/auth/setup-password",
        json={"email": "unclaimed@test.com", "password": "attacker-password"},
    )

    assert resp.status_code == 422
    login = client.post("/api/auth/login", json={"username": "unclaimed", "password": "attacker-password"})
    assert login.status_code == 401


def test_valid_invitation_sets_password_once(client):
    headers = auth_header(client)
    registration = client.post(
        "/api/auth/register",
        json={"username": "invited", "email": "invited@test.com", "role": "staff"},
        headers=headers,
    )
    token = registration.json()["invitation_token"]

    first = client.post("/api/auth/setup-password", json={"token": token, "password": "first-password"})
    replay = client.post("/api/auth/setup-password", json={"token": token, "password": "replacement-password"})

    assert first.status_code == 200
    assert replay.status_code == 400
    assert client.post("/api/auth/login", json={"username": "invited", "password": "first-password"}).status_code == 200
    assert client.post("/api/auth/login", json={"username": "invited", "password": "replacement-password"}).status_code == 401


def test_setup_password_rejects_expired_and_wrong_type_tokens(client):
    headers = auth_header(client)
    registration = client.post(
        "/api/auth/register",
        json={"username": "tokenchecks", "email": "tokenchecks@test.com", "role": "staff"},
        headers=headers,
    )
    user_id = registration.json()["id"]
    expired = jwt.encode(
        {"sub": user_id, "exp": datetime.now(UTC) - timedelta(seconds=1), "type": "invitation"},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    access_token = client.post(
        "/api/auth/login", json={"username": "admin", "password": "admin123"}
    ).json()["access_token"]

    assert client.post("/api/auth/setup-password", json={"token": expired, "password": "secure123"}).status_code == 400
    assert client.post("/api/auth/setup-password", json={"token": access_token, "password": "secure123"}).status_code == 400
    assert client.post("/api/auth/setup-password", json={"token": "malformed", "password": "secure123"}).status_code == 400


def test_admin_can_reissue_invitation_only_for_pending_account(client):
    headers = auth_header(client)
    registration = client.post(
        "/api/auth/register",
        json={"username": "reissue", "email": "reissue@test.com", "role": "staff"},
        headers=headers,
    )
    user_id = registration.json()["id"]

    reissue = client.post(f"/api/auth/users/{user_id}/invitation", headers=headers)
    assert reissue.status_code == 200
    assert reissue.json()["invitation_token"]

    old_invitation = client.post(
        "/api/auth/setup-password",
        json={"token": registration.json()["invitation_token"], "password": "old-link-password"},
    )
    assert old_invitation.status_code == 400

    client.post(
        "/api/auth/setup-password",
        json={"token": reissue.json()["invitation_token"], "password": "staff123"},
    )
    assert client.post(f"/api/auth/users/{user_id}/invitation", headers=headers).status_code == 400


def test_invitation_reissue_requires_admin(client):
    headers = auth_header(client)
    pending = client.post(
        "/api/auth/register",
        json={"username": "pendinginvite", "email": "pendinginvite@test.com", "role": "staff"},
        headers=headers,
    )
    staff_headers = staff_auth_header(client, "ordinarystaff")

    resp = client.post(f"/api/auth/users/{pending.json()['id']}/invitation", headers=staff_headers)
    assert resp.status_code == 403


def test_invitation_for_deleted_account_is_rejected(client):
    headers = auth_header(client)
    registration = client.post(
        "/api/auth/register",
        json={"username": "deletedinvite", "email": "deletedinvite@test.com", "role": "staff"},
        headers=headers,
    )
    client.delete(f"/api/auth/users/{registration.json()['id']}", headers=headers)

    resp = client.post(
        "/api/auth/setup-password",
        json={"token": registration.json()["invitation_token"], "password": "secure123"},
    )
    assert resp.status_code == 400


def test_setup_password_rate_limited(client):
    """setup-password is rate limited."""
    for _ in range(5):
        client.post("/api/auth/setup-password", json={"token": "invalid", "password": "123456"})
    resp = client.post("/api/auth/setup-password", json={"token": "invalid", "password": "123456"})
    assert resp.status_code == 429


def test_auth_me_returns_user_info(client):
    """GET /auth/me returns correct user data."""
    headers = auth_header(client)
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "admin"
    assert resp.json()["role"] == "admin"


def test_invalid_token_rejected(client):
    """Invalid JWT token is rejected with 401."""
    resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})
    assert resp.status_code == 401


def test_register_duplicate_username_rejected(client):
    """Registering a duplicate username is blocked."""
    headers = auth_header(client)
    client.post("/api/auth/register", json={"username": "dupuser", "email": "dup1@test.com", "role": "staff"}, headers=headers)
    resp = client.post("/api/auth/register", json={"username": "dupuser", "email": "dup2@test.com", "role": "staff"}, headers=headers)
    assert resp.status_code == 409


def test_register_duplicate_email_rejected(client):
    """Registering a duplicate email is blocked."""
    headers = auth_header(client)
    client.post("/api/auth/register", json={"username": "emailuser1", "email": "same@test.com", "role": "staff"}, headers=headers)
    resp = client.post("/api/auth/register", json={"username": "emailuser2", "email": "same@test.com", "role": "staff"}, headers=headers)
    assert resp.status_code == 409


def test_delete_user(client):
    """Admin can delete another user."""
    headers = auth_header(client)
    r = client.post("/api/auth/register", json={"username": "todelete", "email": "del@test.com", "role": "staff"}, headers=headers)
    uid = r.json()["id"]
    resp = client.delete(f"/api/auth/users/{uid}", headers=headers)
    assert resp.status_code == 204


def test_cannot_delete_self(client):
    """Admin cannot delete themselves."""
    headers = auth_header(client)
    me = client.get("/api/auth/me", headers=headers)
    my_id = me.json()["id"]
    resp = client.delete(f"/api/auth/users/{my_id}", headers=headers)
    assert resp.status_code == 400


def test_update_user_permissions(client):
    """Admin can update staff user permissions."""
    headers = auth_header(client)
    r = client.post("/api/auth/register", json={"username": "staffperm", "email": "perm@test.com", "role": "staff"}, headers=headers)
    uid = r.json()["id"]

    # Initially no permissions
    assert r.json()["permissions"] == []

    # Set permissions
    resp = client.patch(f"/api/auth/users/{uid}/permissions", json={"permissions": ["dashboard", "collect", "students"]}, headers=headers)
    assert resp.status_code == 200
    assert set(resp.json()["permissions"]) == {"dashboard", "collect", "students"}

    # Update to different permissions
    resp = client.patch(f"/api/auth/users/{uid}/permissions", json={"permissions": ["savings"]}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["permissions"] == ["savings"]


def test_cannot_set_permissions_on_admin(client):
    """Cannot change permissions for admin users."""
    headers = auth_header(client)
    me = client.get("/api/auth/me", headers=headers)
    my_id = me.json()["id"]
    resp = client.patch(f"/api/auth/users/{my_id}/permissions", json={"permissions": ["dashboard"]}, headers=headers)
    assert resp.status_code == 400


def test_invalid_permissions_rejected(client):
    """Invalid permission keys are rejected."""
    headers = auth_header(client)
    r = client.post("/api/auth/register", json={"username": "badperm", "email": "bad@test.com", "role": "staff"}, headers=headers)
    uid = r.json()["id"]
    resp = client.patch(f"/api/auth/users/{uid}/permissions", json={"permissions": ["dashboard", "nonexistent"]}, headers=headers)
    assert resp.status_code == 422


def test_admin_me_returns_all_permissions(client):
    """Admin /me returns all permissions."""
    headers = auth_header(client)
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "dashboard" in data["permissions"]
    assert "students" in data["permissions"]
    assert "settings" in data["permissions"]


def test_list_available_permissions(client):
    """GET /auth/permissions returns all available keys."""
    headers = auth_header(client)
    resp = client.get("/api/auth/permissions", headers=headers)
    assert resp.status_code == 200
    perms = resp.json()
    assert "dashboard" in perms
    assert "collect" in perms
    assert "settings" in perms


def test_staff_without_permission_cannot_create_student(client):
    staff_headers = staff_auth_header(client, "noperms")

    resp = client.post("/api/students", json={"student_code": "DENY1", "name": "Denied"}, headers=staff_headers)
    assert resp.status_code == 403


def test_staff_with_permission_can_create_student(client):
    staff_headers = staff_auth_header(client, "studentperm", ["students"])

    resp = client.post("/api/students", json={"student_code": "ALLOW1", "name": "Allowed"}, headers=staff_headers)
    assert resp.status_code == 201


def test_staff_without_collect_permission_cannot_collect_payment(client):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "PAYDENY", "name": "Pay Denied", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    client.patch(f"/api/students/{student.json()['id']}/fee", json={"expected_fee_amount": 100}, headers=headers)
    staff_headers = staff_auth_header(client, "paynoperm")

    resp = client.post(
        "/api/payments",
        json={"student_code": "PAYDENY", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=staff_headers,
    )
    assert resp.status_code == 403


def test_staff_cannot_update_enquiry(client):
    staff_headers = staff_auth_header(client, "enquirynoperm")

    resp = client.patch(
        f"/api/enquiries/{uuid.uuid4()}",
        json={"status": "contacted"},
        headers=staff_headers,
    )
    assert resp.status_code == 403


def test_staff_cannot_use_utility_action_endpoints(client):
    staff_headers = staff_auth_header(client, "utilsnoperm")

    checks = [
        ("/api/utils/fee-reminder", {"class_name": "I"}),
        ("/api/utils/whatsapp/send-receipt", {"payment_id": str(uuid.uuid4())}),
        ("/api/utils/whatsapp/send-reminder", {"student_id": str(uuid.uuid4())}),
        ("/api/utils/whatsapp/send-leave-info", {"student_id": str(uuid.uuid4()), "date": "2026-08-16"}),
    ]
    for path, payload in checks:
        resp = client.post(path, json=payload, headers=staff_headers)
        assert resp.status_code == 403


def test_staff_without_cms_permission_cannot_delete_upload(client):
    staff_headers = staff_auth_header(client, "uploadnoperm")

    resp = client.delete(f"/api/uploads/{uuid.uuid4()}", headers=staff_headers)
    assert resp.status_code == 403


def test_staff_without_attendance_permission_cannot_mark_attendance(client):
    staff_headers = staff_auth_header(client, "attnoperm")

    resp = client.post(
        "/api/attendance/students",
        json={"date": "2026-08-17", "entries": [{"student_id": str(uuid.uuid4()), "status": "present"}]},
        headers=staff_headers,
    )
    assert resp.status_code == 403


def test_staff_without_exams_permission_cannot_create_marks(client):
    staff_headers = staff_auth_header(client, "examnoperm")

    resp = client.post(
        "/api/exams/marks",
        json={
            "exam_id": str(uuid.uuid4()),
            "student_id": str(uuid.uuid4()),
            "subject_id": str(uuid.uuid4()),
            "marks_obtained": 80,
        },
        headers=staff_headers,
    )
    assert resp.status_code == 403


def test_staff_cannot_create_exam(client):
    staff_headers = staff_auth_header(client, "examadminnoperm", ["exams"])

    resp = client.post(
        "/api/exams",
        json={"name": "Unit Test", "exam_type": "monthly_test", "academic_year_id": str(uuid.uuid4())},
        headers=staff_headers,
    )
    assert resp.status_code == 403


def test_staff_without_savings_permission_cannot_create_savings(client):
    staff_headers = staff_auth_header(client, "savingsnoperm")

    resp = client.post(
        "/api/savings",
        json={"student_code": "NOPE", "amount": 100, "mode": "cash"},
        headers=staff_headers,
    )
    assert resp.status_code == 403


def test_transaction_staff_cannot_reverse_payment(client):
    headers = auth_header(client)
    student = client.post(
        "/api/students",
        json={"student_code": "REVADMIN", "name": "Reverse Admin", "batch": "2026-2027", "batch_start_month": 5},
        headers=headers,
    )
    student_id = student.json()["id"]
    client.patch(f"/api/students/{student_id}/fee", json={"expected_fee_amount": 100}, headers=headers)
    payment = client.post(
        "/api/payments",
        json={"student_id": student_id, "student_code": "REVADMIN", "billing_start_month": "2026-05-01", "mode": "cash"},
        headers=headers,
    )
    staff_headers = staff_auth_header(client, "transactionstaff", ["transactions"])

    resp = client.post(
        f"/api/payments/{payment.json()['id']}/reverse",
        json={"reason": "No longer allowed for staff"},
        headers=staff_headers,
    )
    assert resp.status_code == 403
