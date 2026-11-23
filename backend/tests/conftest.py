import io

import pytest
from PIL import Image

from memoria import create_app
from memoria.extensions import db


@pytest.fixture
def sent_codes(monkeypatch):
    """Capture verification emails instead of sending them."""
    codes: dict[str, str] = {}
    monkeypatch.setattr(
        "memoria.routes.auth.send_verification_email",
        lambda to, username, code: codes.__setitem__(to, code),
    )
    return codes


@pytest.fixture
def app(monkeypatch, sent_codes):
    # Never load the real BLIP model in tests.
    monkeypatch.setattr("memoria.services.captioning.caption_image", lambda image: "A dog playing in a park")
    app = create_app(
        {
            "TESTING": True,
            "SECRET_KEY": "test-secret",
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "GEMINI_API_KEY": "test-key",
        }
    )
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, sent_codes, email="ada@example.com", username="ada", password="correct horse"):
    """Sign up + verify; returns auth headers."""
    res = client.post("/auth/signup", json={"email": email, "username": username, "password": password})
    assert res.status_code == 201, res.get_json()
    account_id = res.get_json()["account_id"]
    res = client.post("/auth/verify", json={"account_id": account_id, "code": sent_codes[email]})
    assert res.status_code == 200, res.get_json()
    return {"Authorization": f"Bearer {res.get_json()['token']}"}


@pytest.fixture
def auth(client, sent_codes):
    return register(client, sent_codes)


def jpeg_bytes(size=(64, 48), color=(200, 120, 40)) -> io.BytesIO:
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="JPEG")
    buf.seek(0)
    return buf
