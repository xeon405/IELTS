"""Text-to-speech for listening audio.

Synthesises script text into real MP3 audio with edge-tts (Microsoft Edge
neural voices) so listening questions always come with actual sound, no matter
what voices (or voice bugs) the user's browser has. Audio is cached on disk
keyed by the text hash, so every listening question is synthesized at most
once.""" 

from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import tempfile

logger = logging.getLogger(__name__)

TTS_VOICE = os.environ.get("IELTS_TTS_VOICE", "en-GB-SoniaNeural")
TTS_MAX_CHARS = 1500

_CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "media", "tts")


def _cache_path(text: str) -> str:
    digest = hashlib.sha1(text.encode("utf-8")).hexdigest()
    return os.path.join(_CACHE_DIR, f"{digest}.mp3")


def tts_available() -> bool:
    try:
        import edge_tts  # noqa: F401

        return True
    except Exception:
        return False


def synthesize_sync(text: str) -> bytes | None:
    """Synthesize text to MP3 bytes (with a shared event-loop + disk cache)."""
    text = (text or "").strip()
    if not text:
        return None
    if len(text) > TTS_MAX_CHARS:
        text = text[:TTS_MAX_CHARS]
    path = _cache_path(text)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path) and os.path.getsize(path) > 0:
        with open(path, "rb") as handle:
            return handle.read()

    try:
        import edge_tts
    except Exception as exc:  # pragma: no cover
        logger.warning("edge-tts unavailable for %s: %s", text[:40], exc)
        return None

    loop = asyncio.new_event_loop()
    data = bytearray()

    async def run() -> None:
        nonlocal data
        try:
            communicate = edge_tts.Communicate(text, voice=TTS_VOICE)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    data.extend(chunk["data"])
        except Exception as exc:  # pragma: no cover
            logger.warning("edge-tts synthesis failed for %s: %s", text[:40], exc)

    try:
        loop.run_until_complete(run())
    finally:
        loop.close()

    if not data:
        return None
    payload = bytes(data)
    try:
        with open(path, "wb") as handle:
            handle.write(payload)
    except OSError as exc:  # pragma: no cover
        logger.warning("could not cache tts: %s", exc)
    return payload