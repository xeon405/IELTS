"""AI IELTS Examiner API entrypoint."""

import asyncio
import logging
from contextlib import asynccontextmanager

import sqlalchemy
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import Base, engine, active_dialect
from .middleware import RequestContextMiddleware
from .routers import auth, brain, diagnostic

logging.basicConfig(
    level=getattr(logging, (settings.LOG_LEVEL or "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("uvicorn.error")


async def _db_keepalive(stop: asyncio.Event):
    """Serverless Postgres (Neon) sleeps when idle and force-closes mid-request
    connections; wake it every 30s so evaluations never hit a sleeping DB."""
    while not stop.is_set():
        try:
            with engine.connect() as conn:
                conn.exec_driver_sql("SELECT 1")
        except Exception:  # noqa: BLE001 - wake will retry next tick
            logger.warning("DB keepalive ping failed; serverless DB still waking up")
        try:
            await asyncio.wait_for(stop.wait(), timeout=30)
        except asyncio.TimeoutError:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.APP_ENV == "production" and settings.JWT_SECRET in ("", "change-me-in-production"):
        raise RuntimeError(
            "Refusing to start in production: JWT_SECRET must be set to a long random value."
        )
    Base.metadata.create_all(bind=engine)
    inspector = sqlalchemy.inspect(engine)
    try:
        columns = {column["name"] for column in inspector.get_columns("users")}
    except Exception:  # noqa: BLE001
        columns = set()
    if columns:
        dialect = engine.dialect.name
        ts = "TIMESTAMPTZ" if dialect == "postgresql" else "DATETIME"
        alterations = []
        if "email_verified" not in columns:
            alterations.append("ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE")
            alterations.append("ADD COLUMN verification_code VARCHAR(64)")
            alterations.append(f"ADD COLUMN verification_code_expires {ts}")
        elif "verification_code" in columns and dialect == "postgresql":
            # Older databases created the column as VARCHAR(10); the code is
            # now stored as a SHA-256 digest (64 chars). SQLite does not
            # enforce VARCHAR length, so only PostgreSQL needs a resize.
            alterations.append("ALTER COLUMN verification_code TYPE VARCHAR(64)")
        if "google_sub" not in columns:
            alterations.append("ADD COLUMN google_sub VARCHAR(255)")
        if alterations:
            with engine.begin() as conn:
                for clause in alterations:
                    conn.exec_driver_sql(f"ALTER TABLE users {clause}")
    logger.info("startup complete (database=%s)", active_dialect())
    stop = asyncio.Event()
    wake = asyncio.create_task(_db_keepalive(stop))
    try:
        yield
    finally:
        stop.set()
        wake.cancel()
    logger.info("shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url=None if settings.APP_ENV == "production" else None,
)

app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc.detail)},
        headers={"X-Request-ID": request.headers.get("x-request-id", "")},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request payload", "errors": exc.errors()},
        headers={"X-Request-ID": request.headers.get("x-request-id", "")},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"X-Request-ID": request.headers.get("x-request-id", "")},
    )


app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(brain.router, prefix=settings.API_PREFIX)
app.include_router(diagnostic.router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "docs": "/docs", "health": "/api/brain/health"}


@app.get("/health")
def health():
    return {"status": "ok", "database": active_dialect()}
