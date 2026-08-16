"""Test environment bootstrap. MUST run before the app is imported anywhere:
the settings object is cached at import time and tests need a clean sqlite DB,
offline AI and the dev-code path enabled."""

import os
import tempfile

_TMP = tempfile.mkdtemp(prefix="ielts-test-")
_TEST_EMAIL = f"ci-student-{os.getpid()}@example.com"
os.environ["APP_ENV"] = "development"
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMP, 'test.db')}"
os.environ["JWT_SECRET"] = "test-only-secret-not-used-in-production"
os.environ["AI_PROVIDER"] = "offline"
os.environ["GEMINI_API_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""
os.environ["SMTP_HOST"] = ""
os.environ["RESEND_API_KEY"] = ""
os.environ["RATE_LIMIT_LOGIN_MAX"] = "5"
os.environ["RATE_LIMIT_VERIFY_MAX"] = "10"
os.environ["RATE_LIMIT_WINDOW_SECONDS"] = "300"
os.environ["BETA_VERIFY_EMAIL"] = _TEST_EMAIL

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TMP_DIR = _TMP


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _user() -> dict:
    return {
        "email": _TEST_EMAIL,
        "password": "SecurePass123!",
        "full_name": "Test Student",
    }


@pytest.fixture(scope="module")
def registered_user(client):
    user = _user()
    response = client.post("/api/auth/register", json=user)
    assert response.status_code == 201, response.text
    dev_code = response.json().get("dev_code")
    assert dev_code, "dev-mode register must expose the code on screen"
    verify = client.post("/api/auth/verify", json={"email": user["email"], "code": dev_code})
    assert verify.status_code == 200, verify.text
    token = verify.json()["access_token"]
    assert token
    return {**user, "token": token}
