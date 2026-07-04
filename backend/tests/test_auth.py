from .conftest import auth_header


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


def test_setup_password_does_not_leak_user_existence(client):
    """setup-password returns generic error for nonexistent email."""
    resp = client.post("/api/auth/setup-password", json={"email": "nobody@example.com", "password": "secure123"})
    assert resp.status_code == 400
    assert "no account found" not in resp.json()["detail"].lower()


def test_setup_password_rate_limited(client):
    """setup-password is rate limited."""
    for _ in range(5):
        client.post("/api/auth/setup-password", json={"email": "x@x.com", "password": "123456"})
    resp = client.post("/api/auth/setup-password", json={"email": "x@x.com", "password": "123456"})
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
