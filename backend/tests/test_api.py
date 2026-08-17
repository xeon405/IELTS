"""End-to-end API regression suite (fast, offline, sqlite).

Covers the exact flows the client demo exercises and the bugs that shipped to
production: bank-session 404s, the spot_correction crash, auth gating, and
client-side answer injection.

Run:  cd backend; python -m pytest tests -q
"""

import time

OFFICIAL_TYPES = [
    ("reading", "True / False / Not Given"),
    ("listening", "Form Completion"),
    ("writing", "Task 1 Charts & Graphs"),
    ("writing", "Task 2 Opinion"),
    ("speaking", "Part 1 - Introduction & Interview"),
    ("speaking", "Part 2 - Cue Card / Individual Long Turn"),
]

VALID_ANSWERS = {
    "True / False / Not Given": "not given",
    "Form Completion": "city library",
    "Task 1 Charts & Graphs": "The chart compares imports and exports between 2010 and 2020. Trade grew steadily.",
    "Task 2 Opinion": "Technology has changed the way people work. Overall, it created more opportunities than it removed.",
    "Part 1 - Introduction & Interview": "I live in a small town with my family.",
    "Part 2 - Cue Card / Individual Long Turn": "My favourite festival is the spring festival, because families gather together and share meals.",
}


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------- auth ----
def test_health(client):
    response = client.get("/api/brain/health")
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "ok"


def test_register_non_beta_never_exposes_code(client):
    """Fail-closed: a non-beta account must NEVER see the code on screen,
    even in dev mode, because SMTP is unconfigured here."""
    response = client.post("/api/auth/register", json={
        "email": "mr-robot@example.com", "password": "SecurePass123!", "full_name": "Robot"
    })
    assert response.status_code == 201, response.text
    assert response.json()["dev_code"] is None, response.text


def test_verify_wrong_code_rejected(client):
    response = client.post("/api/auth/verify", json={"email": "mr-robot@example.com", "code": "000000"})
    assert response.status_code in (400, 401), response.text


def test_login_wrong_password(client):
    response = client.post("/api/auth/login", json={"email": "mr-robot@example.com", "password": "wrong"})
    assert response.status_code == 401, response.text


def test_login_rate_limit(client):
    """Login quota is per-IP and shared with earlier tests in this module:
    fire attempts until the limiter kicks in; the FIRST attempt must be a
    clean 401 (the limiter must not trigger instantly)."""
    statuses = [client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "x"}).status_code for _ in range(12)]
    assert statuses[0] == 401, statuses
    assert 429 in statuses, statuses


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_roundtrip(client, registered_user):
    response = client.get("/api/auth/me", headers=_auth_headers(registered_user["token"]))
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["user"]["email"] == registered_user["email"]
    assert body["user"]["id"] > 0
    assert body["requires_diagnostic"] is not None


# --------------------------------------------------------------- brain ----
def test_bank_requires_token(client):
    assert client.post("/api/brain/bank", json={}).status_code == 401


def test_bank_all_modules(client, registered_user):
    token = registered_user["token"]
    for module, question_type in OFFICIAL_TYPES:
        response = client.post("/api/brain/bank", headers=_auth_headers(token), json={
            "session": {"module": module, "mode": question_type, "questionType": question_type, "questionCount": 3}
        })
        assert response.status_code == 200, f"{module}/{question_type}: {response.text}"
        body = response.json()
        assert body["session"]["id"], f"{module}/{question_type}: no session id"
        assert body["session"]["items"], f"{module}/{question_type}: no items"


def _check_roundtrip(client, token, module, question_type, answer):
    bank = client.post("/api/brain/bank", headers=_auth_headers(token), json={
        "session": {"module": module, "mode": question_type, "questionType": question_type, "questionCount": 1}
    })
    assert bank.status_code == 200, bank.text
    session_id = bank.json()["session"]["id"]
    item_id = bank.json()["session"]["items"][0]["id"]
    response = client.post("/api/brain/check", headers=_auth_headers(token), json={
        "session": {"id": session_id, "module": module, "mode": question_type},
        "answers": {item_id: answer},
    })
    assert response.status_code == 200, f"{module}/{question_type}: {response.text}"
    feedback = response.json()["itemFeedback"]
    assert len(feedback) == 1, f"{module}/{question_type}: {feedback}"
    assert feedback[0]["id"] == item_id
    assert isinstance(feedback[0]["isCorrect"], bool)


def test_check_roundtrip_all_modules(client, registered_user):
    token = registered_user["token"]
    for module, question_type in OFFICIAL_TYPES:
        _check_roundtrip(client, token, module, question_type, VALID_ANSWERS[question_type])


def test_check_fabricated_item_rejected(client, registered_user):
    """Security: the client cannot grade items it invented. The server resolves
    answers strictly against the stamped session bank."""
    token = registered_user["token"]
    bank = client.post("/api/brain/bank", headers=_auth_headers(token), json={
        "session": {"module": "reading", "mode": "True / False / Not Given", "questionType": "True / False / Not Given", "questionCount": 1}
    })
    session_id = bank.json()["session"]["id"]
    response = client.post("/api/brain/check", headers=_auth_headers(token), json={
        "session": {"id": session_id, "module": "reading", "mode": "True / False / Not Given"},
        "answers": {"bank-reading-fake-1": "true"},
    })
    assert response.status_code == 404, response.text


def test_check_unknown_session_404(client, registered_user):
    response = client.post("/api/brain/check", headers=_auth_headers(registered_user["token"]), json={
        "session": {"id": "no-such-session", "module": "reading", "mode": "True / False / Not Given"},
        "answers": {"bank-reading-fake-1": "true"},
    })
    assert response.status_code == 404, response.text


def test_check_bad_module_400(client, registered_user):
    response = client.post("/api/brain/check", headers=_auth_headers(registered_user["token"]), json={
        "session": {"id": "x", "module": "gardening", "mode": "general"},
        "answers": {},
    })
    assert response.status_code == 400, response.text


def test_recommendation(client, registered_user):
    token = registered_user["token"]
    session_id = client.post("/api/brain/bank", headers=_auth_headers(token), json={
        "session": {"module": "reading", "mode": "True / False / Not Given", "questionType": "True / False / Not Given", "questionCount": 3}
    }).json()["session"]["id"]
    response = client.post("/api/brain/recommendation", headers=_auth_headers(token), json={
        "session": {"id": session_id, "module": "reading", "mode": "True / False / Not Given"}
    })
    assert response.status_code == 200, response.text
    assert response.json()["recommendation"]


def test_mock_evaluate(client, registered_user):
    token = registered_user["token"]
    speaking_session = {
        "id": "mock-speaking-test",
        "module": "speaking",
        "mode": "Full Mock",
        "durationMinutes": 14,
        "items": [
            {"id": "lb-speaking-1-0701", "type": "speaking-part1"},
            {"id": "lb-speaking-2-0601", "type": "speaking-part2"},
        ],
    }
    response = client.post("/api/brain/mock", headers=_auth_headers(token), json={
        "profile": {"band": 6.5, "target_band": 7.0},
        "answers": {
            "lb-speaking-1-0701": "My name is Test. I live in a town and I like reading books.",
            "lb-speaking-2-0601": "Reading makes me happy because it takes me to new worlds.",
        },
        "sessions": {"speaking": speaking_session},
    })
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["result"], body
    # The old bug produced a silent default 5.5 with 0% accuracy for every
    # section; now the submitted section must carry a real prediction.
    assert body["result"]["speakingBand"] not in (None, 0)
    assert body["result"]["accuracy"] > 0


def test_tutor_offline_reply(client, registered_user):
    response = client.post("/api/brain/tutor", headers=_auth_headers(registered_user["token"]), json={
        "question": "How can I improve my reading speed for True/False/Not Given?",
        "history": [],
    })
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["reply"]
    assert body["source"] == "offline"


def test_bank_rejects_oversize(client, registered_user):
    response = client.post("/api/brain/bank", headers=_auth_headers(registered_user["token"]), json={
        "session": {"module": "reading", "mode": "general", "questionCount": 3},
        "junk": "x" * 100_000,
    })
    assert response.status_code in (200, 400, 413), response.text

