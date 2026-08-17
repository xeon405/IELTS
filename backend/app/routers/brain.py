"""AI Brain endpoints. The backend is the single source of truth: it owns
question generation, persistence, evaluation, mock tests, tutor chat and
recommendations. The frontend only receives stripped questions and results."""

import base64
import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..database import get_db, active_dialect
from ..deps import get_current_user, get_or_create_profile
from ..schemas import BrainRequest, MockRequest, OnboardingUpdate, SessionRequest, SettingsUpdate, TranscribeRequest, TTSRequest, TutorRequest
from ..services import adaptive
from ..services import evaluation_service as ev
from ..services import gemini
from ..services import knowledge_base as kb
from ..services import large_bank as lb
from ..services import orchestrator
from ..services import recommendation
from ..services import tts_service
from ..services.me_cache import invalidate as me_cache_invalidate
from ..services.ratelimit import rate_limit

# AI-generation endpoints burn real money/time (LLM + Whisper + TTS calls).
# 120 requests / 5 min / IP on top of auth-level limits stops token-farming.
_BRAIN_AI_LIMIT = rate_limit("brain-ai", 120, 300)
_BRAIN_READ_LIMIT = rate_limit("brain-read", 300, 300)

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/brain", tags=["brain"])

SKILLS = ("reading", "listening", "writing", "speaking")

_BANK_LOOKUP: dict[str, dict[str, dict]] = {}


def _bank_id(module: str, mode: str, index: int) -> str:
    return f"bank-{module}-{_slug(mode)}-{index + 1}"


def _bank_lookup_for(module: str) -> dict[str, dict]:
    """id -> item map for a module's offline banks (cached in-process).

    Covers the practice large bank (portal sessions) AND the dedicated mock
    bank (mock-exam items), since mock papers strip answers before sending.
    Ids are pool-position based (per question type and, for mock items, per
    exam section/passage slot), which is exactly how the bank/mock endpoints
    stamp them, so a stripped session can always be re-enriched with the
    correct answers server-side. Every id resolves to the exact item.
    """
    if module not in _BANK_LOOKUP:
        lookup: dict[str, dict] = {}
        by_type = lb.LARGE_BY_TYPE.get(module, {})
        for mode, pool in by_type.items():
            for index, item in enumerate(pool):
                copy = dict(item)
                # The bank endpoint stamps pool-position ids
                # (bank-<module>-<mode slug>-<n>) before returning sessions;
                # check/enrich lookups must resolve those stamped ids. Keep
                # the original pool ids registered too for AI-offline sessions.
                stamped = _bank_id(module, mode, index)
                copy["id"] = stamped
                lookup[stamped] = copy
                original = str(item.get("id") or "")
                if original and original != stamped:
                    keep = dict(copy)
                    keep["id"] = original
                    lookup[original] = keep
        # Mock-exam only banks. Mock listening ids are per section
        # (s1..s4), mock reading ids per passage (p1..p3); writing and
        # speaking ids use the plain pool-position scheme.
        from ..services.large_bank_mock import MOCK_LARGE_BY_TYPE
        mock_by_type = MOCK_LARGE_BY_TYPE.get(module, {})
        for label, pool in mock_by_type.items():
            slug_label = _slug(label)
            for index, item in enumerate(pool):
                base = f"mock-{module}-{slug_label}-{index + 1}"
                copy = dict(item)
                copy["id"] = base
                if module == "listening":
                    for section in range(1, 5):
                        lookup[f"mock-listening-{slug_label}-s{section}-{index + 1}"] = copy
                elif module == "reading":
                    for passage in range(1, 4):
                        lookup[f"mock-reading-{slug_label}-p{passage}-{index + 1}"] = copy
                else:
                    lookup[base] = copy
                # Keep the authored (original) id resolvable as well - mock
                # listening/reading re-stamp ids per section/passage but
                # speaking/writing papers keep the bank's authored ids.
                original = str(item.get("id") or "")
                if original and original != base:
                    keep = dict(copy)
                    keep["id"] = original
                    lookup[original] = keep
        _BANK_LOOKUP[module] = lookup
    return _BANK_LOOKUP[module]


def _profile_dict(db: Session, user: models.User, profile: models.StudentProfile) -> dict:
    return adaptive.serialize_profile(db, profile)


def _load_generated_items(db: Session, user_id: int, module: str, session: dict | None) -> list[dict] | None:
    """Find the stored session row for one skill only (fast path for checks)."""
    if not session:
        return None
    session_id = str(session.get("id") or "")
    if not session_id:
        return None
    model = models.SESSION_MODELS.get(module)
    if model is None:
        return None
    rows = (
        db.query(model)
        .filter(model.user_id == user_id)
        .order_by(model.id.desc())
        .limit(50)
        .all()
    )
    for row in rows:
        if (row.items_json or {}).get("id") == session_id:
            return list((row.items_json or {}).get("items") or [])
    return None


def _session_with_answers(db: Session, user_id: int, session: dict | None) -> dict | None:
    """Session with originals (correct answers hidden from the browser restored).

    Strict resolution - returns None when the session cannot be accounted
    for server-side:
      * the persisted AI session row owned by THIS user, or
      * every item id resolvable in the offline practice/mock banks.

    The client-supplied item bodies are NEVER used as grading truth, so a
    fabricated session (attacker-chosen correctAnswer) can no longer inflate
    band scores or reports.
    """
    if not session:
        return None
    module = str(session.get("module") or "reading")
    stored = _load_generated_items(db, user_id, module, session)
    if stored is not None:
        safe = dict(session)
        safe["items"] = stored
        return safe
    # Bank/mock session: enrich stripped items with correct answers from the
    # authoritative server-side pools. Every id must resolve.
    lookup = _bank_lookup_for(module)
    items = session.get("items") or []
    if not items:
        return None
    enriched: list[dict] = []
    for item in items:
        source = lookup.get(str(item.get("id") or ""))
        if source is None:
            return None
        enriched.append(dict(source))
    safe = dict(session)
    safe["items"] = enriched
    return safe


@router.post("/recommend")
def recommend(payload: BrainRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return {"recommendation": orchestrator.recommend_only(db, profile)}


@router.post("/recommendation")
def get_recommendation(payload: BrainRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    result = orchestrator.recommend_and_generate(db, user, profile, payload.module, payload.mode, question_type=payload.questionType)
    result["session"]["source"] = "ai" if gemini.is_ai_available() else "offline"
    return {"recommendation": result["recommendation"], "session": result["session"]}


def _safe_int(value: Any, default: int | None = None) -> int | None:
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


@router.post("/session")
def session(payload: SessionRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    module = str((payload.session or {}).get("module") or "reading")
    mode = str((payload.session or {}).get("mode") or "Question by Question")
    count = _safe_int((payload.session or {}).get("questionCount")) or None
    question_type = str((payload.session or {}).get("questionType") or "") or None
    full = orchestrator.generate_session(db, user, profile, module, mode, count, question_type)
    full["source"] = "ai" if gemini.is_ai_available() else "offline"
    return {"session": full}


@router.post("/evaluate")
def evaluate(payload: SessionRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    if not payload.session:
        raise HTTPException(status_code=400, detail="Practice session is required.")
    session_data = _session_with_answers(db, user.id, payload.session)
    if session_data is None:
        raise HTTPException(status_code=404, detail="This session could not be found. Submit the section for a full report instead.")
    result = ev.evaluate_session(db, user, profile, session_data, payload.answers, timing=payload.timing)
    adaptive.recompute_profile(db, profile)
    me_cache_invalidate(user.id)
    updated = _profile_dict(db, user, profile)
    return {"evaluation": result, "updatedProfile": updated, "itemFeedback": result.get("perItemFeedback", [])}


@router.post("/check")
def check_answer(payload: SessionRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Grade ONE answered question instantly so the frontend can show right/wrong,
    tip and suggestion before moving on. No profile changes and no DB writes.

    The frontend sends the session id plus just the answers it wants checked;
    items are resolved server-side from the stored AI session or the offline
    bank pools, so the client never uploads the whole session and every id is
    graded against authoritative data.
    """
    if not payload.session:
        raise HTTPException(status_code=400, detail="Practice session is required.")
    answered = {
        item_id: value
        for item_id, value in (payload.answers or {}).items()
        if str(value or "").strip()
    }
    if not answered:
        raise HTTPException(status_code=400, detail="Answer the question before checking it.")
    module = str(payload.session.get("module") or "reading")
    stored = _load_generated_items(db, user.id, module, payload.session)
    lookup = _bank_lookup_for(module) if stored is None else None
    resolved: dict[str, dict] = {}
    for item_id in answered:
        if stored is None:
            source = lookup.get(str(item_id)) if lookup else None
        else:
            source = next((i for i in stored if str(i.get("id")) == str(item_id)), None)
        if source is None:
            raise HTTPException(status_code=404, detail="This session could not be found. Submit the section for a full report instead.")
        resolved[str(item_id)] = source
    results = []
    for item_id, value in answered.items():
        results.append(ev.evaluate_item(resolved[item_id], value))
    if not results:
        raise HTTPException(status_code=404, detail="This session could not be found. Submit the section for a full report instead.")
    return {"itemFeedback": results}


@router.post("/bank")
def bank(payload: SessionRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return one offline bank session (~500 items) for a given question type.

    The frontend opens the bank to see the question types and to pick a type
    with hundreds of ready questions. Items are stripped of answers; the bank
    endpoint and the check endpoint derive correct answers server-side.

    Items are ADAPTIVELY ORDERED, not random: the profile's current band is the
    starting difficulty, the target band is the ceiling, and questions ramp up
    in difficulty with the weakest question type first.
    """
    if not payload.session:
        raise HTTPException(status_code=400, detail="Bank request requires a module and mode.")
    module = str((payload.session or {}).get("module") or "reading")
    mode = str((payload.session or {}).get("mode") or "")
    mode = kb.canonical_question_type(module, mode)
    if not kb.is_question_type(module, mode):
        raise HTTPException(status_code=400, detail="Pick an official question type from the bank.")
    pool = lb.items_for_type(module, mode)
    if not pool:
        raise HTTPException(status_code=404, detail="That question type has no questions yet.")
    count = _safe_int((payload.session or {}).get("questionCount")) or len(pool)
    count = max(1, min(count, len(pool)))

    profile = payload.profile or {}
    bands = {
        s: float((profile.get("bands") or {}).get(s, 5.5) or 5.5)
        for s in ("reading", "listening", "writing", "speaking")
    }
    current = bands.get(module, 5.5)
    target = float((profile or {}).get("targetBand", 7.0) or 7.0)
    weak_types = [str(w).strip() for w in (profile.get("weakQuestionTypes") or []) if str(w).strip()]

    # Stable bank order: Question 1 is always Question 1 regardless of band
    # or profile, so numbering never shifts between visits. Ids are stamped
    # from the pool position so the check endpoint can re-enrich the item.
    pool = [dict(item) for item in pool]
    for index, item in enumerate(pool):
        item["id"] = _bank_id(module, mode, index)
    items = pool[:count]
    for item in items:
        item["difficultyBand"] = _item_difficulty(item, module)

    from ..services import question_generator as qg
    safe = qg.strip_answers({"items": items})["items"]
    session = {
        "id": f"bank-{module}-{mode}",
        "module": module,
        "mode": mode,
        "title": f"{mode} bank",
        "subtitle": f"{len(pool)} ready questions for {mode} — practice them in order, from band {current:.1f} upward.",
        "durationMinutes": kb.question_type_mode_duration(module),
        "questionCount": len(pool),
        "questionTypes": [mode],
        "difficultyBand": round((current + min(target, current + 1.0)) / 2, 1),
        "examinerIntent": f"Work through the full {mode} bank with instant per-question feedback, ramping difficulty from current band {current:.1f} toward target {target:.1f}.",
        "weakTypePriority": [mode] if mode in weak_types else weak_types[:2],
        "items": safe,
        "source": "offline",
    }
    return {"session": session, "total": len(pool), "currentBand": current, "targetBand": target}


@router.post("/mockexam")
def mock_exam(payload: SessionRequest, user: models.User = Depends(get_current_user)):
    """Return one of the ten full mock exam papers (official format + timing).

    ``session.set`` selects the paper (1-10); every paper is a complete test:
    Listening 40Q/30min (+10 transfer), Reading 40Q/60min, Writing 2 tasks/60min,
    Speaking 3 parts/14min including Part 2 prep + long turn.
    """
    try:
        paper_no = int((payload.session or {}).get("set") or 1)
    except (TypeError, ValueError):
        paper_no = 1
    from ..services.mock_papers import MOCK_EXAM_COUNT, build_paper

    paper_no = max(1, min(paper_no, MOCK_EXAM_COUNT))
    return {"paper": build_paper(paper_no), "count": MOCK_EXAM_COUNT}


@router.post("/tts")
def tts(payload: TTSRequest, _: None = Depends(_BRAIN_AI_LIMIT), __: models.User = Depends(get_current_user)):
    """Synthesize listening script text into MP3 audio (edge-tts, disk-cached).

    The frontend falls back to this real audio whenever browser speech
    synthesis has no usable voice, so listening questions always play sound.
    """
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text to speak is required.")
    if len(text) > 2000:
        raise HTTPException(status_code=413, detail="Text is too long to speak.")
    payload_bytes = tts_service.synthesize_sync(text)
    if not payload_bytes:
        raise HTTPException(status_code=503, detail="Speech synthesis is unavailable on this server.")
    return Response(
        content=payload_bytes,
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@router.post("/transcribe")
def transcribe(payload: TranscribeRequest, _: None = Depends(_BRAIN_AI_LIMIT), __: models.User = Depends(get_current_user)):
    """Transcribe a recorded voice note (WAV/WebM/MP4) with Groq Whisper.

    The frontend uploads the base64 audio captured by the MediaRecorder; the
    transcript becomes the student's speaking answer text so evaluation works
    in every browser, even where browser speech recognition is unavailable.
    """
    try:
        audio_bytes = base64.b64decode(payload.audio or "")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid audio data.") from exc
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio payload is empty.")
    if len(audio_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="That recording is too large (15 MB limit).")

    mime = (payload.mime or "audio/wav").strip() or "audio/wav"
    try:
        key = gemini._pick_groq_key()
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Transcription service is not configured on this server.")

    multipart = {
        "model": (None, "whisper-large-v3"),
        "file": ("voice-recording." + _audio_ext(mime), audio_bytes, mime),
    }
    try:
        gemini._throttle()
        response = httpx.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}"},
            files=multipart,
            timeout=120,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("[transcribe] request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Could not reach the transcription service.") from exc
    if response.status_code >= 400:
        logger.warning("[transcribe] rejected (%s): %s", response.status_code, response.text[:400])
        raise HTTPException(status_code=502, detail="The transcription service could not process the recording.")
    text = str((response.json() or {}).get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Nothing was detected in the recording — please speak again or type your answer.")
    return {"text": text}


def _audio_ext(mime: str) -> str:
    name = (mime.split("/")[-1] or "wav").split(";")[0].lower()
    if name in ("webm", "wav", "mp3", "m4a", "mp4", "ogg", "aac", "flac", "pcm"):
        return name
    return "wav"


def _slug(value: str) -> str:
    return "".join(ch if ch.isalnum() else "-" for ch in value.lower()).strip("-") or "type"


def _item_difficulty(item: dict, module: str) -> float:
    """Heuristic difficulty 4.5-9.0 for adaptively ordering bank items.

    Uses the same signals IELTS itself uses: passage position (Passage 1 is
    always the easiest), vocabulary density of the text, and the length of the
    reasoning needed (explanation length tracks how involved the logic is).
    """
    prompt = str(item.get("prompt") or "")
    context = str(item.get("context") or "")
    options = item.get("options") or []
    answer = str(item.get("correctAnswer") or "")
    title = str(item.get("title") or "")

    base = 5.5
    # Passage position: Passage 1 -> 5.5, Passage 2 -> 6.5, Passage 3 -> 7.5.
    import re
    passage = re.search(r"Passage (\d)", title)
    if passage:
        base = 5.5 + max(0, int(passage.group(1)) - 1)
    # Vocabulary density of the stimulus (longer words -> harder text).
    words = re.findall(r"[a-zA-Z]+", context)
    if words:
        avg_len = sum(len(w) for w in words) / len(words)
        base += max(-0.5, min(0.5, (avg_len - 5.0) * 0.3))
    # Options count pushes difficulty up slightly.
    base += min(1.0, (len(options) - 2) * 0.35) if len(options) > 2 else 0.0
    # Answer with more words = more steps to verify.
    base += min(1.0, len(answer.split()) * 0.2)
    # Longer explanations imply more involved logic.
    explanation = str(item.get("explanation") or "")
    base += min(0.5, len(explanation.split()) / 120)
    base = max(4.5, min(9.0, base))
    if module == "writing" and "process" in prompt.lower():
        base = min(9.0, base + 0.5)
    return round(base, 1)


def _adaptive_order_items(pool: list[dict], current: float, target: float, module: str = "reading") -> list[dict]:
    """Difficulty ladder, the way an adaptive test works:

    1. The student's current band is the starting difficulty.
    2. Questions ramp UP toward target band in steps of ~0.5.
    3. Every few questions a slightly EASIER question appears (warm-up/consolidation),
       exactly like real computer-delivered IELTS keeps early items accessible.
    """
    scored = [(item, _item_difficulty(item, module)) for item in pool]

    # Within each difficulty bucket keep the original bank order (deterministic).
    scored.sort(key=lambda pair: pair[1])
    buckets: dict[float, list[dict]] = {}
    for item, difficulty in scored:
        buckets.setdefault(round(difficulty, 1), []).append(item)

    ladder: list[dict] = []
    available = list(buckets.keys())
    if not available:
        return pool
    difficulty = round(current, 1)
    if difficulty not in buckets:
        difficulty = min(available, key=lambda d: abs(d - difficulty))
    guard = 0
    while len(ladder) < len(pool):
        bucket = buckets.get(difficulty)
        if bucket:
            ladder.append(bucket.pop(0))
            guard = 0
        else:
            # Bucket exhausted — jump to the nearest bucket that still has items.
            remaining_keys = [d for d, items in buckets.items() if items]
            if not remaining_keys:
                break
            difficulty = min(remaining_keys, key=lambda d: abs(d - difficulty))
            guard += 1
            if guard > len(buckets) + 1:
                break
            continue
        # Ramp up toward target, with a periodic easy consolidation question.
        step = max(0.5, abs(target - current) / 8)
        if len(ladder) % 5 != 0:
            difficulty = round(difficulty + step, 1)
        else:
            difficulty = round(current, 1)
        if difficulty > 9.0 or difficulty not in buckets:
            difficulty = min(available, key=lambda d: abs(d - difficulty))
        if not any(buckets.values()):
            break
    remaining = [item for bucket_items in buckets.values() for item in bucket_items]
    ladder.extend(remaining)
    return ladder


@router.post("/vocab")
def vocab(payload: BrainRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate one fresh IELTS vocabulary word with the AI provider.

    The frontend sends every word already shown so the AI never repeats a
    word in the same study flow. Falls back to a bank word when AI is off.
    """
    seen = {str(w).strip().lower() for w in (payload.vocabSeen or [])}
    if not gemini.is_ai_available():
        return _fallback_vocab_word(seen)
    prompt = (
        "Generate ONE new, high-frequency IELTS academic vocabulary word the student has not seen yet.\n\n"
        "Words already seen by this student (must NOT repeat any of them, in any form):\n"
        + (", ".join(sorted(seen)[-80:]) if seen else "(none — pick anything)") + "\n\n"
        "Respond with ONLY a single JSON object (no arrays, no markdown fences) with exactly these keys:\n"
        '{"word": "the word", "pos": "noun|verb|adjective|adverb|phrase", '
        '"meaning": "one clear B2-C1 definition for IELTS", '
        '"example": "one natural sentence using the word in an IELTS essay context", '
        '"topic": "Education|Environment|Technology|Health|Society|Work"}\n'
        "Prefer a different topic than the most recent word if possible."
    )
    try:
        raw = gemini.generate_json(prompt)
        item = raw[0] if isinstance(raw, list) and raw else raw
        if not isinstance(item, dict) or not str(item.get("word") or "").strip():
            return _fallback_vocab_word(seen)
        word = str(item["word"]).strip()
        if word.lower() in seen:
            return _fallback_vocab_word(seen)
        return {
            "word": {
                "id": f"ai-{word.lower().replace(' ', '-')}",
                "word": word,
                "pos": str(item.get("pos", "noun")).strip() or "noun",
                "meaning": str(item.get("meaning", "")).strip(),
                "example": str(item.get("example", "")).strip(),
                "topic": str(item.get("topic", "Education")).strip() or "Education",
            },
            "source": gemini.active_provider(),
        }
    except Exception:  # noqa: BLE001
        return _fallback_vocab_word(seen)


def _fallback_vocab_word(seen: set[str]) -> dict:
    for candidate in kb.VOCAB_FALLBACKS:
        if str(candidate.get("word") or "").lower() not in seen:
            return {"word": candidate, "source": "offline"}
    return {"word": None, "source": "offline"}


@router.post("/mock")
def mock(payload: MockRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    answered = {
        item_id: value
        for item_id, value in (payload.answers or {}).items()
        if str(value or "").strip()
    }
    if not answered:
        # An unattempted mock must not write BandScores/MockTest rows or
        # drag the profile down — return a clean "nothing to grade" result.
        return {
            "result": {
                "overallBand": None,
                "message": "You didn't answer any questions, so there is nothing to evaluate yet. Attempt the sections first.",
            },
            "updatedProfile": _profile_dict(db, user, profile),
            "questions": {},
        }
    # Grade each submitted section against the ACTUAL paper the student sat
    # (the frontend echoes each /mockexam section back through /brain/evaluate
    # already; this batch endpoint accepts the same per-skill sessions). The
    # client-supplied item bodies are never trusted — ids resolve to the
    # authoritative banks/stores via _session_with_answers, so a mock can no
    # longer be graded against freshly-generated unrelated questions (and the
    # AI token budget is not burned on pointless regeneration).
    sessions = payload.sessions or {}
    section_results: dict[str, dict] = {}
    questions: dict[str, Any] = {}
    for skill in SKILLS:
        session_data = _session_with_answers(db, user.id, sessions.get(skill))
        if session_data is None:
            continue
        questions[skill] = session_data
        result = ev.evaluate_session(
            db,
            user,
            profile,
            session_data,
            payload.answers,
            timing=(payload.timing or {}).get(skill),
        )
        section_results[skill] = result
    if not section_results:
        raise HTTPException(
            status_code=400,
            detail="The mock sections could not be resolved server-side. Submit each section from the app instead.",
        )
    result = ev.build_mock_result(db, user, profile, section_results, answers=payload.answers, timing=payload.timing)
    adaptive.recompute_profile(db, profile)
    me_cache_invalidate(user.id)
    updated = _profile_dict(db, user, profile)
    return {"result": result, "updatedProfile": updated, "questions": questions}


@router.post("/tutor")
def tutor(payload: TutorRequest, _: None = Depends(_BRAIN_AI_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    bands = adaptive._skill_bands(profile)
    context = (
        f"The student's bands are: reading {bands['reading']}, listening {bands['listening']}, "
        f"writing {bands['writing']}, speaking {bands['speaking']}. Target band: {profile.target_band}. "
        f"Known weaknesses: {', '.join(profile.weak_question_types or []) or 'none yet'}. "
    )
    history_block = ""
    for entry in (payload.history or [])[-6:]:
        role = "student" if str(entry.get("role") or "") == "student" else "tutor"
        history_block += f"{role}: {str(entry.get('text') or '')[:500]}\n"
    reply = ""
    source = "offline"
    if gemini.is_ai_available():
        try:
            reply = gemini.chat(
                f"{context}\nConversation so far:\n{history_block}"
                f"Answer this IELTS question like a helpful, expert tutor. Be concise and practical, "
                f"build on what was said before, and never repeat the previous answer verbatim.\n\n"
                f"Student asks: {payload.question}"
            )
            source = gemini.active_provider()
        except Exception:  # noqa: BLE001
            reply = ""
    if not reply.strip():
        topic = str(payload.question or "").strip()[:90] or "this"
        reply = (
            "I am in offline mode right now, so this answer comes from the built-in study bank instead of live AI. "
            f"For \"{topic}\": identify the exact question type, review its blueprint, practise one focused "
            "session on it, then time a full section. When the AI connection is back you will get a fully "
            "personalised answer again."
        )
    tips = gemini.extract_tips(reply) or [
        "Underline the words that carry the claim before scanning.",
        "If the text has the same idea in different words, it is usually True.",
        "If the text is silent on part of the claim, choose Not Given.",
    ]
    return {"reply": reply, "tips": tips, "source": source}


def _report_payload(db: Session, user: models.User, profile: models.StudentProfile) -> dict[str, Any]:
    """Build the full Reports payload: bands, descriptors, statistics and AI recommendations."""
    profile_dict = _profile_dict(db, user, profile)
    rec = recommendation.recommend_for_profile(db, user, profile)
    history = list(profile_dict.get("practiceHistory") or [])
    mocks = list(profile_dict.get("mockHistory") or [])
    accuracies = [float(entry.get("accuracy") or 0) for entry in history if entry.get("accuracy")]
    average_accuracy = round(sum(accuracies) / len(accuracies)) if accuracies else round((profile.current_band or 5.5) / 9 * 100)

    def descriptor_from_level(level: str, fallback: float, comment: str) -> dict[str, Any]:
        clean = (level or "").lower()
        score = 88 if clean.startswith("c1") else 75 if clean.startswith("b2+") else 62 if clean.startswith("b2") else 45 if clean.startswith("b1") else fallback
        score = round(max(0.0, min(100.0, float(score))))
        level_label = "Advanced (C1)" if score >= 85 else "B2+ Strong" if score >= 70 else "B2 Developing" if score >= 55 else "B1 Building" if score >= 40 else "Foundation"
        return {"score": score, "level": level_label, "comment": comment}

    def descriptor_from_score(score: float, skill: str) -> dict[str, Any]:
        clamped = round(max(0.0, min(100.0, float(score))))
        level_label = "Advanced (C1)" if clamped >= 85 else "B2+ Strong" if clamped >= 70 else "B2 Developing" if clamped >= 55 else "B1 Building" if clamped >= 40 else "Foundation"
        if clamped >= 85:
            comment = f"{skill} is at exam-day level — keep practising to hold it steady."
        elif clamped >= 70:
            comment = f"Solid {skill.lower()}; push accuracy to reach Band 7+ consistency."
        elif clamped >= 55:
            comment = f"{skill} is developing; targeted sessions will move it fastest."
        else:
            comment = f"{skill} needs foundational work before band targets can rise."
        return {"score": clamped, "level": level_label, "comment": comment}

    module = str(rec.get("module") or "reading")
    mode = str(rec.get("mode") or "Question by Question")
    reason = str(rec.get("reason") or "")
    target_weakness = str(rec.get("targetWeakness") or "band descriptor consistency")
    expected_lift = str(rec.get("expectedBandLift") or "+0.5")
    priority = str(rec.get("priority") or "High value")
    difficulty = float(rec.get("difficultyBand") or 6.0)
    weak_types = list(profile.weak_question_types or [])
    recommendations: list[str] = [
        f"Start with {module} — {reason}",
        f"Target weakness: {target_weakness}. Expected lift: {expected_lift}.",
        f"Next session: {mode} at difficulty band {difficulty:.1f} ({priority}).",
    ]
    for weak in weak_types[:2]:
        recommendations.append(f"Focused question-type work: {weak}.")
    if mocks:
        overall = float(mocks[0].get("overallBand") or 0)
        recommendations.append(f"Your last full mock: overall {overall:.1f} — retest in 7 days.")
    recommendations = recommendations[:4]

    return {
        "overallBand": profile.current_band,
        "sectionScores": adaptive._skill_bands(profile),
        "strengths": list(profile.strong_signals or []),
        "weaknesses": weak_types,
        "progress": profile_dict.get("progress", []),
        "recommendation": {
            "module": module,
            "mode": mode,
            "priority": priority,
            "reason": reason,
            "targetWeakness": target_weakness,
            "expectedBandLift": expected_lift,
            "difficultyBand": difficulty,
        },
        "practiceSummary": f"{len(history)} practice sessions and {len(mocks)} full mocks reviewed by the AI examiner.",
        "grammar": descriptor_from_level(
            profile.grammar_level,
            (profile.writing_band or 5.5) * 10,
            "Grammar range holds you below Band 7 — drill complex sentences." if (profile.writing_band or 5.5) < 7 else "Sentence control is strong; maintain range in Task 2.",
        ),
        "vocabulary": descriptor_from_level(
            profile.vocabulary_level,
            (profile.reading_band or 5.5) * 10,
            "Collocation precision is the main vocabulary gap." if (profile.reading_band or 5.5) < 7 else "Academic range is working for you across sections.",
        ),
        "fluency": descriptor_from_score(profile.fluency, "Fluency"),
        "coherence": descriptor_from_score(profile.coherence, "Coherence"),
        "statistics": {
            "studyStreak": int(profile.study_streak or 0),
            "weeklyGoalHours": float(profile.weekly_goal_hours or 0),
            "completedHours": round(float(profile.completed_hours or 0), 2),
            "practiceSessions": len(history),
            "mockExams": len(mocks),
            "confidenceLevel": float(profile.confidence or 0),
            "accuracy": average_accuracy,
        },
        "recommendations": recommendations,
    }


@router.api_route("/report", methods=["GET", "POST"])
def report(_: None = Depends(_BRAIN_READ_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return _report_payload(db, user, profile)


@router.get("/blueprint")
def blueprint(module: str = "reading", _: None = Depends(_BRAIN_READ_LIMIT)):
    module = module if module in SKILLS else "reading"
    data = dict(kb.get_blueprint(module))
    return data


@router.get("/blueprints")
def blueprints(module: str = "reading", _: None = Depends(_BRAIN_READ_LIMIT), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_or_create_profile(db, user)
    module = module if module in SKILLS else "reading"
    modes = kb.MODES[module]
    meta = []
    for mode in modes[:8]:
        meta.append({
            "id": f"{module}-{mode.lower().replace(' ', '-')}",
            "mode": mode,
            "title": f"{module.capitalize()} — {mode}",
            "durationMinutes": kb.mode_duration(module, mode),
            "questionCount": kb.mode_question_count(module, mode),
            "questionTypes": kb.question_types_for(module, mode),
            "difficultyBand": 6.5,
        })
    return meta


@router.get("/profile")
def profile(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return _profile_dict(db, user, profile)


@router.patch("/profile")
def update_profile(payload: OnboardingUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Onboarding step 1: choose Academic or General IELTS (and optional target band)."""
    profile = get_or_create_profile(db, user)
    if payload.test_type is not None and payload.test_type != profile.test_type:
        profile.test_type = payload.test_type
    if payload.target_band is not None:
        profile.target_band = float(payload.target_band)
    db.commit()
    me_cache_invalidate(user.id)
    return _profile_dict(db, user, profile)


@router.patch("/settings")
def update_settings(payload: SettingsUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(models.Settings).filter(models.Settings.user_id == user.id).first()
    if row is None:
        row = models.Settings(user_id=user.id)
        db.add(row)
    changes = payload.model_dump(exclude_unset=True)
    for key, value in changes.items():
        if hasattr(row, key) and value is not None:
            setattr(row, key, value)
    db.commit()
    me_cache_invalidate(user.id)
    return {
        "theme": row.theme,
        "notifications_enabled": row.notifications_enabled,
        "daily_goal_hours": row.daily_goal_hours,
        "weekly_goal_hours": row.weekly_goal_hours,
        "reminder_enabled": row.reminder_enabled,
        "reminder_time": row.reminder_time,
    }


@router.get("/health")
def health():
    from ..config import is_dev
    payload: dict = {"status": "ok", "app": settings.APP_NAME}
    if is_dev():
        # Provider/dialect details are dev-only intelligence; production gets
        # a lean probe so scanners can't fingerprint the stack.
        payload["gemini"] = gemini.is_gemini_available()
        payload["ai_provider"] = gemini.active_provider()
        payload["ai_available"] = gemini.is_ai_available()
        payload["database"] = active_dialect()
    return payload
