"""AI provider integration. The backend is the ONLY component that talks to
any external AI. Providers are tried in order (Groq -> Gemini) so a free tier
being rate-limited never blocks a feature; if every provider fails, callers use
the built-in offline brain instead so every feature still works."""

import hashlib
import json
import re
import threading
import time

import httpx

from ..config import settings

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

_CACHE: dict[str, tuple[float, str]] = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL_SECONDS = 15 * 60
_CACHE_MAX = 128

_RATE_LOCK = threading.Lock()
_LAST_CALL_TS = 0.0


def _throttle() -> None:
    """Space out outgoing AI calls so bursty sessions stay under provider RPM limits."""
    global _LAST_CALL_TS
    interval = max(0.0, float(settings.AI_MIN_INTERVAL_SECONDS))
    with _RATE_LOCK:
        wait = _LAST_CALL_TS + interval - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _LAST_CALL_TS = time.monotonic()


def _retry_after(seconds: float, attempt: int) -> None:
    wait = max(float(seconds), 1.0 * (attempt + 1))
    time.sleep(wait)


def _cache_key(prompt: str, system_instruction: str | None) -> str:
    return hashlib.sha256(f"{system_instruction or ''}|{prompt}".encode("utf-8")).hexdigest()


def _cache_get(key: str) -> str | None:
    with _CACHE_LOCK:
        entry = _CACHE.get(key)
        if entry is None:
            return None
        created, text = entry
        if time.monotonic() - created > _CACHE_TTL_SECONDS:
            _CACHE.pop(key, None)
            return None
        return text


def _cache_put(key: str, text: str) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.monotonic(), text)
        if len(_CACHE) > _CACHE_MAX:
            oldest = min(_CACHE, key=lambda k: _CACHE[k][0])
            _CACHE.pop(oldest, None)


def is_gemini_available() -> bool:
    """True when at least one AI provider is configured (any free source)."""
    return is_ai_available()


def is_ai_available() -> bool:
    return any(provider_configured(p) for p in ai_provider_order())


def provider_configured(provider: str) -> bool:
    if provider == "groq":
        return bool(settings.GROQ_API_KEY.strip())
    if provider == "gemini":
        return settings.USE_GEMINI and bool(settings.GEMINI_API_KEY.strip())
    return False


def ai_provider_order() -> list[str]:
    choices = {
        "auto": ["groq", "gemini"],
        "groq": ["groq", "gemini"],
        "gemini": ["gemini", "groq"],
        "groq-only": ["groq"],
        "gemini-only": ["gemini"],
        "offline": [],
    }
    key = (settings.AI_PROVIDER or "auto").lower()
    if key not in choices:
        key = "auto"
    order = choices[key]
    if key == "auto":
        if provider_configured("groq") and not provider_configured("gemini"):
            order = ["groq"]
        elif provider_configured("gemini") and not provider_configured("groq"):
            order = ["gemini"]
    return order or ["groq", "gemini"]


def active_provider() -> str:
    for provider in ai_provider_order():
        if provider_configured(provider):
            return provider
    return "none"


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    fences = re.findall(r"```(?:json)?\s*(.*?)```", text, flags=re.DOTALL)
    if fences:
        return fences[-1].strip()
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    return match.group(0) if match else text


def _groq_generate_text(prompt: str, system_instruction: str | None) -> str:
    if not provider_configured("groq"):
        raise RuntimeError("Groq not configured")
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"}
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})
    timeout = httpx.Timeout(settings.GROQ_TIMEOUT_SECONDS)
    last_error: Exception | None = None
    with httpx.Client(timeout=timeout) as client:
        for model in (settings.GROQ_MODEL, settings.GROQ_FALLBACK_MODEL):
            for attempt in range(2):
                _throttle()
                try:
                    response = client.post(
                        GROQ_URL,
                        headers=headers,
                        json={
                            "model": model,
                            "messages": messages,
                            "temperature": 0.8,
                            "max_tokens": settings.GROQ_MAX_TOKENS,
                        },
                    )
                    if response.status_code in (429, 500, 502, 503, 504):
                        retry_after = float(response.headers.get("retry-after") or 0)
                        raise RuntimeError(f"HTTP {response.status_code} from Groq model {model}:{retry_after}")
                    response.raise_for_status()
                    data = response.json()
                    text = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
                    if text.strip():
                        return text.strip()
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    if isinstance(exc, RuntimeError) and re.search(r"HTTP (429|500|502|503|504)", str(exc)):
                        match = re.search(r":([\d.]+)$", str(exc))
                        _retry_after(float(match.group(1) or 0) if match else 0, attempt)
                    else:
                        break
    raise RuntimeError(f"Groq request failed: {last_error}")


def _gemini_generate_text(prompt: str, system_instruction: str | None) -> str:
    if not provider_configured("gemini"):
        raise RuntimeError("Gemini not configured")
    body: dict = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
        },
    }
    if system_instruction:
        body["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    headers = {"x-goog-api-key": settings.GEMINI_API_KEY, "Content-Type": "application/json"}
    models = [settings.GEMINI_MODEL, settings.GEMINI_FALLBACK_MODEL]
    timeout = httpx.Timeout(settings.GEMINI_TIMEOUT_SECONDS)
    last_error: Exception | None = None
    with httpx.Client(timeout=timeout) as client:
        for model in models:
            for attempt in range(2):
                _throttle()
                try:
                    response = client.post(
                        GEMINI_URL.format(model=model),
                        headers=headers,
                        json=body,
                    )
                    if response.status_code in (429, 500, 502, 503, 504):
                        retry_after = float(response.headers.get("retry-after") or 0)
                        raise RuntimeError(f"HTTP {response.status_code} from model {model}:{retry_after}")
                    response.raise_for_status()
                    data = response.json()
                    candidates = data.get("candidates") or []
                    if not candidates:
                        continue
                    parts = candidates[0].get("content", {}).get("parts") or []
                    text = "".join(part.get("text", "") for part in parts).strip()
                    if text:
                        return text
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    if isinstance(exc, RuntimeError) and re.search(r"HTTP (429|500|502|503|504)", str(exc)):
                        match = re.search(r":([\d.]+)$", str(exc))
                        _retry_after(float(match.group(1) or 0) if match else 0, attempt)
                    else:
                        break
    raise RuntimeError(f"Gemini request failed: {last_error}")


def generate_text(prompt: str, system_instruction: str | None = None) -> str:
    if not is_ai_available():
        raise RuntimeError("No AI provider configured")
    key = _cache_key(prompt, system_instruction)
    cached = _cache_get(key)
    if cached is not None:
        return cached
    last_error: Exception | None = None
    for provider in ai_provider_order():
        try:
            if provider == "groq":
                text = _groq_generate_text(prompt, system_instruction)
                _cache_put(key, text)
                return text
            if provider == "gemini":
                text = _gemini_generate_text(prompt, system_instruction)
                _cache_put(key, text)
                return text
        except Exception as exc:  # noqa: BLE001
            last_error = exc
    raise RuntimeError(f"All AI providers failed: {last_error}")


def generate_json(prompt: str, system_instruction: str | None = None) -> dict | list:
    text = generate_text(prompt, system_instruction)
    cleaned = _strip_code_fences(text)
    return json.loads(cleaned)


def chat(prompt: str) -> str:
    """Free-form tutor style response with line-separated tips."""
    return generate_text(prompt)


def extract_tips(reply: str) -> list[str]:
    lines = [line.strip() for line in reply.splitlines() if line.strip()]
    tips: list[str] = []
    for line in lines[1:]:
        cleaned = re.sub(r"^[-*•]?\s*", "", line).strip()
        if cleaned and cleaned.startswith(("Tip", "Try", "Practice", "Use", "Focus", "Next")):
            tips.append(cleaned[:180])
    return tips[:4]
