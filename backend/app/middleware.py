"""Production middleware: request IDs, structured request logging, security headers, body-size guard."""

import logging
import time
import uuid

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from .config import settings

logger = logging.getLogger("app.middleware")

# Hard ceiling for any single request body. Per-route payloads are bounded
# more tightly in the Pydantic schemas; this is the last line of defence
# against memory-exhaustion attacks via chunked/undocumented uploads.
MAX_BODY_BYTES = 50 * 1024 * 1024


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized request bodies before the app buffers them.

    Content-Length is authoritative for JSON bodies; requests without it
    (e.g. chunked transfer-encoding) are rejected outright so the 50 MB
    ceiling cannot be bypassed with an unbounded stream.
    """

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if request.method in ("POST", "PUT", "PATCH"):
            if content_length is None:
                return JSONResponse(status_code=411, content={"detail": "A Content-Length header is required."})
            if content_length.isdigit() and int(content_length) > MAX_BODY_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request body too large."})
        return await call_next(request)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach a request ID, log every request, set security headers."""

    async def dispatch(self, request: Request, call_next):
        # Never trust a client-supplied request ID: it is reflected into logs
        # and response headers, so a crafted value could inject fake log lines
        # or malformed headers (log/header injection).
        request_id = uuid.uuid4().hex[:16]
        started = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - started) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if settings.APP_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        logger.info(
            "request_id=%s method=%s path=%s status=%d duration_ms=%.1f ip=%s"
            % (
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                request.client.host if request.client else "unknown",
            )
        )
        return response