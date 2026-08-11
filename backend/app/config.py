from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "AI IELTS Examiner API"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "postgresql+psycopg://ielts:ielts_secret@localhost:5432/ielts"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 * 7

    FRONTEND_URL: str = "http://localhost:4000"

    # Google Sign-In (Google Identity Services / OAuth 2.0)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    RATE_LIMIT_LOGIN_MAX: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 300
    RATE_LIMIT_VERIFY_MAX: int = 10

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: float = 20.0
    GEMINI_MAX_OUTPUT_TOKENS: int = 4096
    USE_GEMINI: bool = True

    AI_PROVIDER: str = "auto"  # auto | groq | gemini | groq-only | gemini-only | offline
    AI_MIN_INTERVAL_SECONDS: float = 1.2  # minimum spacing between outgoing AI calls (avoids free-tier 429s)
    AI_MAX_ITEMS_PER_CALL: int = 5  # sessions larger than this use the offline banks (AI output-token cap)

    GROQ_API_KEY: str = ""
    # Optional: comma-separated pool of Groq keys. One is picked at random per
    # request so free-tier rate limits (429s) spread across many keys.
    GROQ_API_KEYS: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FALLBACK_MODEL: str = "llama-3.1-8b-instant"
    GROQ_TIMEOUT_SECONDS: float = 20.0
    GROQ_MAX_TOKENS: int = 4096

    CORS_ORIGINS: str = "http://localhost:4000,http://127.0.0.1:4000,http://localhost:3000,http://localhost:3100,http://127.0.0.1:3100"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "IELTS Examiner <no-reply@ielts-examiner.local>"

    # Resend (transactional email API) — used first when set, SMTP is the fallback.
    RESEND_API_KEY: str = ""
    RESEND_FROM: str = "IELTS Examiner <onboarding@resend.dev>"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
