from __future__ import annotations

from pathlib import Path

from tests.conftest import auth_header


PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


def test_upload_rejects_invalid_mime_type(client, monkeypatch, tmp_path):
    monkeypatch.setattr("app.api.routes.uploads.UPLOAD_DIR", tmp_path)
    headers = auth_header(client)
    resp = client.post(
        "/api/uploads",
        files={"file": ("bad.txt", b"hello", "text/plain")},
        headers=headers,
    )
    assert resp.status_code == 422


def test_upload_rejects_extension_mismatch(client, monkeypatch, tmp_path):
    monkeypatch.setattr("app.api.routes.uploads.UPLOAD_DIR", tmp_path)
    headers = auth_header(client)
    resp = client.post(
        "/api/uploads",
        files={"file": ("bad.jpg", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert resp.status_code == 422


def test_upload_rejects_spoofed_content(client, monkeypatch, tmp_path):
    monkeypatch.setattr("app.api.routes.uploads.UPLOAD_DIR", tmp_path)
    headers = auth_header(client)
    resp = client.post(
        "/api/uploads",
        files={"file": ("bad.png", b"not really png", "image/png")},
        headers=headers,
    )
    assert resp.status_code == 422


def test_upload_serve_and_delete_lifecycle(client, monkeypatch, tmp_path):
    monkeypatch.setattr("app.api.routes.uploads.UPLOAD_DIR", tmp_path)
    headers = auth_header(client)
    upload = client.post(
        "/api/uploads",
        files={"file": ("ok.png", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert upload.status_code == 201
    data = upload.json()
    filename = data["url"].rsplit("/", 1)[-1]
    assert Path(filename).suffix == ".png"

    served = client.get(data["url"])
    assert served.status_code == 200
    assert served.headers["content-type"].startswith("image/png")
    assert served.content == PNG_BYTES

    deleted = client.delete(f"/api/uploads/{data['id']}", headers=headers)
    assert deleted.status_code == 204
    assert not (tmp_path / filename).exists()


def test_upload_rejects_invalid_entity_id(client, monkeypatch, tmp_path):
    monkeypatch.setattr("app.api.routes.uploads.UPLOAD_DIR", tmp_path)
    headers = auth_header(client)
    resp = client.post(
        "/api/uploads?entity_id=not-a-uuid",
        files={"file": ("ok.png", PNG_BYTES, "image/png")},
        headers=headers,
    )
    assert resp.status_code == 422
    assert list(tmp_path.iterdir()) == []


def test_upload_serving_rejects_traversal_and_missing_record(client, monkeypatch, tmp_path):
    monkeypatch.setattr("app.api.routes.uploads.UPLOAD_DIR", tmp_path)
    traversal = client.get("/api/uploads/files/%2e%2e%2fsecret.png")
    assert traversal.status_code == 404

    missing = client.get("/api/uploads/files/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png")
    assert missing.status_code == 404
