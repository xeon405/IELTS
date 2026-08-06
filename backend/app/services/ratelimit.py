"""In-memory rate limiting for sensitive endpoints (auth).

Fixed-window counter per (key, scope). Good enough for a single-process
deployment; swap for Redis (redis-py + Lua) when scaling to multiple workers.
"""

import threading
import time

from fastapi import HTTPException, Request, status

_WINDOW_SECONDS = 300
_MAX_PER_WINDOW = 30
_COUNTERS: dict[tuple[str, str], tuple[float, int]] = {}
_LOCK = threading.Lock()


def _client_key(request: Request) -> str:
    if request.client and request.client.host:
        return request.client.host
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return "unknown"


def check_rate_limit(request: Request, scope: str = "auth", max_per_window: int | None = None, window_seconds: int | None = None) -> None:
    limit = max_per_window or _MAX_PER_WINDOW
    window = window_seconds or _WINDOW_SECONDS
    key = (_client_key(request), scope)
    now = time.monotonic()
    with _LOCK:
        window_start, count = _COUNTERS.get(key, (now, 0))
        if now - window_start >= window:
            window_start, count = now, 0
        if count >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Please wait a few minutes and try again.",
            )
        _COUNTERS[key] = (window_start, count + 1)
        if len(_COUNTERS) > 10_000:
            cutoff = now - 2 * window
            _COUNTERS.clear()

    for key in list(_COUNTERS):
        if now - _COUNTERS[key][0] >= 2 * window:
            _COUNTERS.pop(key, None)


def rate_limit(scope: str = "auth", max_per_window: int | None = None, window_seconds: int | None = None):
    """FastAPI dependency wrapper for the shared limiter."""

    def dependency(request: Request) -> None:
        check_rate_limit(request, scope, max_per_window, window_seconds)

    return dependency
