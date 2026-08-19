"""Tiny per-user cache for the learning state assembled by the AI engines.

build_learning_state fans out to ~4-6 sequential DB reads (history, mocks,
band scores, weakness rows) over a remote Postgres link. It is rebuilt on
every session click, recommendation and mock, so we cache it for a short TTL.
No consumer reads the 'profile' object out of the state, so only the plain
data is cached and the fresh profile is re-attached on every hit. Mutating
endpoints (evaluate/mock/diagnostic/profile/settings/auth) invalidate it.
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