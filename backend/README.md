# AI IELTS Examiner — Backend

FastAPI + PostgreSQL + SQLAlchemy + Pydantic + JWT backend for the AI IELTS
platform. The backend owns authentication, the student profile, question
generation, evaluation, mock tests, tutor chat, adaptive recommendations and
reporting. **Only the backend ever talks to Gemini.**

## Quick start with Docker (recommended)

```bash
cd backend
cp .env.example .env
# put your Gemini key in .env:  GEMINI_API_KEY=...
cd ..
docker compose up --build
```

- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- PostgreSQL runs on `localhost:5432` (user `ielts`, password `ielts_secret`, db `ielts`)

Without a `GEMINI_API_KEY`, the API still works using the built-in offline
question bank — set `USE_GEMINI=false` to disable Gemini calls explicitly.

## Run without Docker (needs Python 3.12+)

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows
pip install -r requirements.txt
copy .env.example .env              # fill in GEMINI_API_KEY and DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

## Main endpoints

| Method | Path                    | Purpose                                   |
| ------ | ----------------------- | ----------------------------------------- |
| POST   | `/api/auth/register`    | Create account + student profile + settings |
| POST   | `/api/auth/login`       | JWT login (returns `requires_diagnostic`) |
| POST   | `/api/auth/forgot-password` | Issue one-time reset token             |
| POST   | `/api/auth/reset-password` | Set a new password with the token       |
| GET    | `/api/auth/me`          | Current user + profile                     |
| GET    | `/api/diagnostic/start` | First-login diagnostic questions           |
| POST   | `/api/diagnostic/submit`| Grade diagnostic, set starting bands       |
| POST   | `/api/brain/recommendation` | Adaptive recommendation + practice session |
| POST   | `/api/brain/session`    | Generate a practice session                |
| POST   | `/api/brain/evaluate`   | Grade answers, persist, update profile     |
| POST   | `/api/brain/mock`       | Full four-section mock exam                |
| POST   | `/api/brain/tutor`      | AI tutor chat                              |
| GET    | `/api/brain/report`     | Progress report                            |
| GET    | `/api/brain/blueprints` | Section blueprint metadata                 |
| GET    | `/api/brain/profile`    | Fresh student profile                      |
| PATCH  | `/api/brain/settings`   | Update user settings                       |

All `/api/brain/*` and `/api/diagnostic/*` routes require the
`Authorization: Bearer <token>` header returned by login/register.

## Architecture

- `app/config.py` — settings (env/.env via pydantic-settings)
- `app/models.py` — all tables (users, profiles, sessions, mocks, questions, answers, band scores, weaknesses, recommendations, history, achievements, settings, reset tokens)
- `app/services/gemini.py` — Gemini client with model fallback + offline guard
- `app/services/knowledge_base.py` — official-style question types, topics, blueprints
- `app/services/question_generator.py` — AI Orchestrator (pipeline → Gemini → validate → fallback bank)
- `app/services/evaluation_service.py` — per-answer grading + band estimation + persistence
- `app/services/adaptive.py` — profile serialization + band recomputation
- `app/services/diagnostic_service.py` — first-login diagnostic flow
