from .conftest import auth_header


def test_login_works(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"


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
