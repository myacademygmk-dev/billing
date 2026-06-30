from decimal import Decimal

from .conftest import auth_header


def test_savings_entries_support_negative_values_and_retraction(client):
    headers = auth_header(client)
    student = client.post("/api/students", json={"student_code": "S016", "name": "Kavi"}, headers=headers)
    student_id = student.json()["id"]

    add = client.post("/api/savings", json={"student_id": student_id, "student_code": "S016", "amount": 500, "mode": "cash", "notes": "Initial savings"}, headers=headers)
    minus = client.post("/api/savings", json={"student_id": student_id, "student_code": "S016", "amount": -100, "mode": "cash", "notes": "Student withdrew"}, headers=headers)

    assert add.status_code == 201
    assert minus.status_code == 201
    assert Decimal(minus.json()["amount"]) == Decimal("-100")

    balances = client.get("/api/savings/balances?search=S016", headers=headers)
    assert Decimal(balances.json()["items"][0]["total_savings"]) == Decimal("400")

    retract = client.post(f"/api/savings/{minus.json()['id']}/retract", json={"reason": "Wrong entry"}, headers=headers)
    assert retract.status_code == 201
    assert Decimal(retract.json()["amount"]) == Decimal("100")
    assert retract.json()["is_retraction"] is True

    balances_after = client.get("/api/savings/balances?search=S016", headers=headers)
    assert Decimal(balances_after.json()["items"][0]["total_savings"]) == Decimal("500")


def test_savings_retract_blocks_double_retraction(client):
    """A savings entry cannot be retracted twice."""
    headers = auth_header(client)
    client.post("/api/students", json={"student_code": "SRET", "name": "RetTest"}, headers=headers)
    entry = client.post("/api/savings", json={"student_code": "SRET", "amount": 300, "mode": "cash"}, headers=headers)
    entry_id = entry.json()["id"]

    first = client.post(f"/api/savings/{entry_id}/retract", json={"reason": "Wrong"}, headers=headers)
    assert first.status_code == 201

    second = client.post(f"/api/savings/{entry_id}/retract", json={"reason": "Again"}, headers=headers)
    assert second.status_code == 409


def test_savings_delete_requires_admin(client):
    """Non-admin cannot delete savings entries."""
    headers = auth_header(client)
    client.post("/api/auth/register", json={"username": "staffdel", "email": "staffdel@test.com", "role": "staff"}, headers=headers)
    client.post("/api/auth/setup-password", json={"email": "staffdel@test.com", "password": "staff123"})
    staff_login = client.post("/api/auth/login", json={"username": "staffdel", "password": "staff123"})
    staff_headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    client.post("/api/students", json={"student_code": "SDEL", "name": "DelTest"}, headers=headers)
    entry = client.post("/api/savings", json={"student_code": "SDEL", "amount": 100, "mode": "cash"}, headers=staff_headers)
    entry_id = entry.json()["id"]

    resp = client.delete(f"/api/savings/{entry_id}", headers=staff_headers)
    assert resp.status_code == 403


def test_savings_edit_requires_admin(client):
    """Non-admin cannot edit savings entries."""
    headers = auth_header(client)
    client.post("/api/auth/register", json={"username": "staffedit", "email": "staffedit@test.com", "role": "staff"}, headers=headers)
    client.post("/api/auth/setup-password", json={"email": "staffedit@test.com", "password": "staff123"})
    staff_login = client.post("/api/auth/login", json={"username": "staffedit", "password": "staff123"})
    staff_headers = {"Authorization": f"Bearer {staff_login.json()['access_token']}"}

    client.post("/api/students", json={"student_code": "SEDIT", "name": "EditTest"}, headers=headers)
    entry = client.post("/api/savings", json={"student_code": "SEDIT", "amount": 200, "mode": "cash"}, headers=staff_headers)
    entry_id = entry.json()["id"]

    resp = client.patch(f"/api/savings/{entry_id}", json={"amount": 300}, headers=staff_headers)
    assert resp.status_code == 403
