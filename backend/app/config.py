from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AI IELTS Examiner API"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api"
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "postgresql+psycopg://ielts:ielts_secret@localhost:5432/ielts"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24 * 7

    FRONTEND_URL: str = "http://localhost:4000"

    RATE_LIMIT_LOGIN_MAX: int = 20
    RATE_LIMIT_WINDOW_SECONDS: int = 300
    RATE_LIMIT_VERIFY_MAX: int = 10

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_TIMEOUT_SECONDS: float = 60.0
    GEMINI_MAX_OUTPUT_TOKENS: int = 4096
    USE_GEMINI: bool = True

    AI_PROVIDER: str = "auto"  # auto | groq | gemini | groq-only | gemini-only | offline

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_FALLBACK_MODEL: str = "llama-3.1-8b-instant"
    GROQ_TIMEOUT_SECONDS: float = 60.0
    GROQ_MAX_TOKENS: int = 8192

    CORS_ORIGINS: str = "http://localhost:4000,http://localhost:3000"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "IELTS Examiner <no-reply@ielts-examiner.local>"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
