from __future__ import annotations

import uuid

import pytest

from app.api.routes.public import _FORM_RATE_LIMIT
from app.models.cms import GalleryPhoto, WebContent
from app.models.enums import ContentType
from app.models.file_upload import FileUpload
from app.models.institution_settings import InstitutionSettings
from app.models.student_creativity import StudentCreativity


@pytest.fixture(autouse=True)
def clear_public_form_rate_limit():
    _FORM_RATE_LIMIT.clear()
    yield
    _FORM_RATE_LIMIT.clear()


def test_public_enquiry_validates_and_deduplicates(client):
    payload = {
        "student_name": "  Test   Student  ",
        "parent_name": " Parent ",
        "phone": "+91 98765 43210",
        "email": "parent@example.com",
        "standard": "6th - 8th",
        "source": "ignored",
    }

    resp = client.post("/api/public/enquiry", json=payload)
    assert resp.status_code == 200

    duplicate = client.post("/api/public/enquiry", json=payload)
    assert duplicate.status_code == 409


def test_public_enquiry_rejects_invalid_phone_and_email(client):
    phone_resp = client.post("/api/public/enquiry", json={"student_name": "A", "phone": "abc"})
    assert phone_resp.status_code == 422

    email_resp = client.post(
        "/api/public/enquiry",
        json={"student_name": "A", "phone": "9876543210", "email": "not-an-email"},
    )
    assert email_resp.status_code == 422


def test_public_feedback_deduplicates_and_rate_limits(client):
    payload = {"name": "Parent One", "role": "Parent", "message": "Good support", "rating": 5}

    resp = client.post("/api/public/feedback", json=payload)
    assert resp.status_code == 200

    duplicate = client.post("/api/public/feedback", json=payload)
    assert duplicate.status_code == 409

    _FORM_RATE_LIMIT.clear()
    for idx in range(5):
        limited = client.post(
            "/api/public/feedback",
            json={"name": f"Parent {idx}", "message": f"Message {idx}", "rating": 5},
        )
        assert limited.status_code == 200
    blocked = client.post("/api/public/feedback", json={"name": "Parent 6", "message": "Message 6"})
    assert blocked.status_code == 429


def test_public_form_rate_limit_ignores_untrusted_forwarded_for(client):
    for idx in range(5):
        resp = client.post(
            "/api/public/feedback",
            json={"name": f"Parent {idx}", "message": f"Message {idx}"},
            headers={"X-Forwarded-For": f"203.0.113.{idx}"},
        )
        assert resp.status_code == 200

    blocked = client.post(
        "/api/public/feedback",
        json={"name": "Parent 6", "message": "Message 6"},
        headers={"X-Forwarded-For": "203.0.113.99"},
    )
    assert blocked.status_code == 429


def test_public_website_config_filters_media_urls(db_session, client):
    db_session.add(
        InstitutionSettings(
            id=1,
            popup_banner_url="javascript:alert(1)",
            hero_slides="/images/hero.jpg|javascript:bad|/api/uploads/files/missing.png",
            videos="https://youtube.com/watch?v=abc123|https://youtube.com.evil.example/watch?v=abc123|https://youtu.be/xyz789",
        )
    )
    db_session.commit()

    resp = client.get("/api/public/website-config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["popup_banner_url"] is None
    assert data["hero_slides"] == ["/images/hero.jpg"]
    assert data["videos"] == ["https://youtube.com/watch?v=abc123", "https://youtu.be/xyz789"]


def test_public_gallery_and_creativity_filter_missing_or_wrong_uploads(db_session, client):
    image_name = f"{uuid.uuid4().hex}.png"
    pdf_name = f"{uuid.uuid4().hex}.pdf"
    db_session.add_all(
        [
            FileUpload(filename=image_name, original_name="image.png", content_type="image/png", size_bytes=8, url=f"/api/uploads/files/{image_name}"),
            FileUpload(filename=pdf_name, original_name="doc.pdf", content_type="application/pdf", size_bytes=8, url=f"/api/uploads/files/{pdf_name}"),
            WebContent(content_type=ContentType.gallery, title="Album", is_published=True),
            GalleryPhoto(url=f"/api/uploads/files/{image_name}", caption="shown"),
            GalleryPhoto(url=f"/api/uploads/files/{pdf_name}", caption="hidden"),
            GalleryPhoto(url="javascript:alert(1)", caption="unsafe"),
            StudentCreativity(title="Art", file_type="image", file_url=f"/api/uploads/files/{image_name}", is_published=True),
            StudentCreativity(title="Bad", file_type="image", file_url=f"/api/uploads/files/{pdf_name}", is_published=True),
        ]
    )
    db_session.commit()

    gallery = client.get("/api/public/gallery").json()
    standalone = next(album for album in gallery if album["id"] == "standalone")
    assert standalone["photos"] == [{"url": f"/api/uploads/files/{image_name}", "caption": "shown"}]

    creativity = client.get("/api/public/student-creativity").json()
    assert creativity[0]["file_url"] == f"/api/uploads/files/{image_name}"
    assert len(creativity) == 1


def test_published_testimonials_strip_unsafe_photo_urls(db_session, client):
    from app.models.testimonial import Testimonial

    db_session.add(Testimonial(name="Parent", role="Parent", message="Nice", rating=5, photo_url="javascript:bad", is_approved=True, is_published=True))
    db_session.commit()

    resp = client.get("/api/public/testimonials")
    assert resp.status_code == 200
    assert resp.json()[0]["photo_url"] is None


def test_public_website_config_sanitizes_nested_json_media(db_session, client):
    db_session.add(
        InstitutionSettings(
            id=1,
            faculty_data='[{"name":"Teacher","photo_url":"javascript:bad","profile":{"image":"/images/faculty.jpg"}}]',
            management_team='[{"name":"Lead","avatar_url":"/api/uploads/files/missing.png"}]',
        )
    )
    db_session.commit()

    resp = client.get("/api/public/website-config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["faculty"][0]["photo_url"] is None
    assert data["faculty"][0]["profile"]["image"] == "/images/faculty.jpg"
    assert data["management_team"][0]["avatar_url"] is None
