"""Tiny per-user cache for /auth/me.

/auth/me fans out to user, profile and several profile-adjacent reads
(bands, history, mocks, weaknesses) — ~4-7 sequential DB round trips on a
remote Postgres link. The client calls it on every app load, so we cache
the assembled payload for a short TTL and mint a fresh access token on each
hit. Mutating endpoints (profile/settings/diagnostic/auth changes) call
invalidate() so cached state never goes stale beyond a single update.
"""

import threading
import time
from typing import Any

_TTL_SECONDS = 30.0

_lock = threading.Lock()
_cache: dict[int, tuple[float, dict[str, Any]]] = {}


def get(user_id: int) -> dict[str, Any] | None:
    with _lock:
        entry = _cache.get(user_id)
        if entry is None:
            return None
        if entry[0] <= time.monotonic():
            _cache.pop(user_id, None)
            return None
        return entry[1]


def set(user_id: int, payload: dict[str, Any]) -> None:
    with _lock:
        _cache[user_id] = (time.monotonic() + _TTL_SECONDS, payload)


def invalidate(user_id: int) -> None:
    with _lock:
        _cache.pop(user_id, None)