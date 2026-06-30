from .conftest import auth_header


def test_expense_rows_include_created_at(client):
    headers = auth_header(client)
    saved = client.put("/api/expenses/monthly", json={"month": "2026-04-01", "items": [{"title": "Internet", "amount": 850, "notes": "April bill"}]}, headers=headers)
    assert saved.status_code == 200
    assert saved.json()["items"][0]["created_at"]

    fetched = client.get("/api/expenses/monthly?month=2026-04-01", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["items"][0]["created_at"]


def test_expenses_upsert_and_retrieve(client):
    """Expenses can be created and retrieved."""
    headers = auth_header(client)
    resp = client.put("/api/expenses/monthly", json={"month": "2026-07-01", "items": [{"title": "Water", "amount": 200}]}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["items"][0]["title"] == "Water"

    get_resp = client.get("/api/expenses/monthly?month=2026-07-01", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["items"][0]["amount"] == "200.00"


def test_billing_settings_update(client):
    """Billing settings can be updated by admin."""
    headers = auth_header(client)
    resp = client.patch("/api/settings/billing", json={"cycle_mode": "monthly"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["cycle_mode"] == "monthly"
    assert resp.json()["cycle_months"] == 1


def test_admin_can_generate_random_bill_pdf(client):
    headers = auth_header(client)
    response = client.post(
        "/api/settings/random-bill.pdf",
        json={"file_name": "manual-demo", "fields": [{"label": "Bill No", "value": "25"}, {"label": "Student", "value": "Demo Student"}, {"label": "Amount", "value": "1000.00"}]},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "manual-demo.pdf" in response.headers["content-disposition"]
    assert response.content.startswith(b"%PDF")


def test_health_db_returns_200_when_connected(client):
    """Health DB endpoint returns 200 when DB is reachable."""
    resp = client.get("/api/health/db")
    assert resp.status_code == 200
    assert resp.json()["db"] == "ok"
