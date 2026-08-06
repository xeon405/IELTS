"""Database engine with an automatic SQLite dev fallback.

Production uses PostgreSQL via ``DATABASE_URL``. If a PostgreSQL URL is
configured but the server is unreachable (e.g. running without Docker during
local development), the app falls back to a local SQLite file so every feature
still works. Set ``DATABASE_URL`` to a ``sqlite:///`` path to force SQLite.
"""

import logging
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

logger = logging.getLogger("ielts")

_DEV_SQLITE_URL = f"sqlite:///{(Path(__file__).resolve().parent.parent / 'ielts_dev.db').as_posix()}"


def _build_engine(url: str):
    kwargs: dict = {"pool_pre_ping": True, "pool_size": 10, "max_overflow": 20}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
        kwargs.pop("pool_size")
        kwargs.pop("max_overflow")
    elif "psycopg" in url:
        # Supabase's pgBouncer pooler runs in transaction mode and rejects
        # server-side prepared statements (psycopg 3 enables them by default),
        # which surfaces as intermittent "DuplicatePreparedStatement" 500s.
        kwargs["connect_args"] = {"prepare_threshold": None}
    return create_engine(url, **kwargs)


def _normalize_url(url: str) -> str:
    url = url.strip()
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql+psycopg://") and "sslmode" not in url and "localhost" not in url and "127.0.0.1" not in url:
        url = f"{url}?sslmode=require"
    return url


def _resolve_database_url() -> str:
    url = settings.DATABASE_URL
    if not url.startswith("postgres"):
        return url
    normalized = _normalize_url(url)
    probe = _build_engine(normalized)
    try:
        with probe.connect():
            pass
        logger.info("Connected to PostgreSQL (%s)", normalized.split("://")[1].split("@")[-1].split("/")[0])
    except Exception as exc:  # noqa: BLE001 - environment dependent
        probe.dispose()
        logger.warning("PostgreSQL unavailable (%s); falling back to SQLite dev database", exc)
        return _DEV_SQLITE_URL
    return normalized


def active_dialect() -> str:
    return engine.url.get_backend_name()


engine = _build_engine(_resolve_database_url())

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()