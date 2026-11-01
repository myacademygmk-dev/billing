from .conftest import auth_header
import json


def test_multiple_countdowns_limit_and_public_roundtrip(client):
    headers = auth_header(client)
    events = [{'title': f'Event {i}', 'date': '2030-12-01T10:30:00+05:30'} for i in range(4)]
    response = client.patch('/api/settings/institution', headers=headers, json={'countdowns': events})
    assert response.status_code == 200
    assert response.json()['countdowns'] == events
    assert client.get('/api/public/website-config').json()['countdowns'] == events
    assert client.patch('/api/settings/institution', headers=headers, json={'countdowns': events + [events[0]]}).status_code == 422
    assert client.get('/api/public/website-config').json()['countdowns'] == events
    for event in [{'title': ' ', 'date': events[0]['date']}, {'title': 'Bad date', 'date': 'invalid'}, {'title': 'No timezone', 'date': '2030-12-01T10:30'}]:
        assert client.patch('/api/settings/institution', headers=headers, json={'countdowns': [event]}).status_code == 422
    assert client.patch('/api/settings/institution', headers=headers, json={'countdowns': []}).status_code == 200
    assert client.get('/api/public/website-config').json()['countdowns'] == []


def test_website_collections_edit_and_clear(client):
    headers = auth_header(client)
    entry = {'name': 'Library', 'description': 'Books for all classes', 'photo_url': '/images/library.jpg'}
    payload = {field: json.dumps([entry]) for field in ['facilities_data', 'faculty_data', 'alumni_data', 'management_team', 'technical_team', 'former_staff']}
    response = client.patch('/api/settings/institution', headers=headers, json=payload)
    assert response.status_code == 200
    public = client.get('/api/public/website-config').json()
    for field in ['facilities', 'faculty', 'alumni', 'management_team', 'technical_team', 'former_staff']:
        assert public[field] == [entry]
    assert client.patch('/api/settings/institution', headers=headers, json={'facilities_data': '[]'}).status_code == 200
    assert client.get('/api/public/website-config').json()['facilities'] == []


def test_homepage_stats_follow_saved_settings(client):
    headers = auth_header(client)
    stats = {'students': '1,250+', 'staff': '0', 'years': '17+',
             'standards': 'LKG-12', 'alumni': '500+'}
    payload = {f'stats_{key}': value for key, value in stats.items()}
    saved = client.patch('/api/settings/institution', headers=headers, json=payload)
    assert saved.status_code == 200
    for key, value in payload.items():
        assert saved.json()[key] == value
        assert client.get('/api/settings/institution', headers=headers).json()[key] == value
    assert client.get('/api/public/website-config').json()['stats'] == stats
    updated = client.patch('/api/settings/institution', headers=headers, json={'stats_alumni': '650'})
    assert updated.status_code == 200
    assert client.get('/api/public/website-config').json()['stats']['alumni'] == '650'


def test_settings_normalize_proxy_upload_paths(client):
    headers = auth_header(client)
    response = client.patch('/api/settings/institution', headers=headers, json={
        'hero_slides': '/images/banner.jpg| /api/backend/uploads/files/new.jpg |/api/uploads/files/old.jpg',
        'popup_banner_url': '/api/backend/uploads/files/popup.jpg',
    })
    assert response.status_code == 200
    assert response.json()['hero_slides'] == '/images/banner.jpg|/api/uploads/files/new.jpg|/api/uploads/files/old.jpg'
    assert response.json()['popup_banner_url'] == '/api/uploads/files/popup.jpg'
    assert client.get('/api/settings/institution', headers=headers).json()['hero_slides'] == response.json()['hero_slides']


def test_invalid_slide_reports_its_position_without_saving(client):
    headers = auth_header(client)
    response = client.patch('/api/settings/institution', headers=headers, json={
        'hero_slides': '/images/banner.jpg|https://example.com/remote.jpg',
    })
    assert response.status_code == 422
    assert 'Hero slide 2' in response.json()['detail'][0]['msg']


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
