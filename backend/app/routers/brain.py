"""AI Brain endpoints. The backend is the single source of truth: it owns
question generation, persistence, evaluation, mock tests, tutor chat and
recommendations. The frontend only receives stripped questions and results."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from ..database import get_db, active_dialect
from ..deps import get_current_user, get_or_create_profile
from ..schemas import BrainRequest, MockRequest, OnboardingUpdate, SessionRequest, SettingsUpdate, TutorRequest
from ..services import adaptive
from ..services import evaluation_service as ev
from ..services import gemini
from ..services import knowledge_base as kb
from ..services import orchestrator
from ..services import recommendation

router = APIRouter(prefix="/brain", tags=["brain"])

SKILLS = ("reading", "listening", "writing", "speaking")


def _profile_dict(db: Session, user: models.User, profile: models.StudentProfile) -> dict:
    return adaptive.serialize_profile(db, profile)


def _load_generated_items(db: Session, user_id: int, session: dict | None) -> list[dict] | None:
    if not session:
        return None
    session_id = str(session.get("id") or "")
    if not session_id:
        return None
    for skill in SKILLS:
        model = models.SESSION_MODELS[skill]
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


def _session_with_answers(db: Session, user_id: int, session: dict | None) -> dict:
    if not session:
        return {}
    stored = _load_generated_items(db, user_id, session)
    if stored is None:
        return dict(session)
    safe = dict(session)
    safe["items"] = stored
    return safe


@router.post("/recommend")
def recommend(payload: BrainRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return {"recommendation": orchestrator.recommend_only(db, profile)}


@router.post("/recommendation")
def get_recommendation(payload: BrainRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    result = orchestrator.recommend_and_generate(db, user, profile, payload.module, payload.mode, question_type=payload.questionType)
    result["session"]["source"] = "ai" if gemini.is_ai_available() else "offline"
    return {"recommendation": result["recommendation"], "session": result["session"]}


@router.post("/session")
def session(payload: SessionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    module = str((payload.session or {}).get("module") or "reading")
    mode = str((payload.session or {}).get("mode") or "Question by Question")
    count = int((payload.session or {}).get("questionCount") or 0) or None
    question_type = str((payload.session or {}).get("questionType") or "") or None
    full = orchestrator.generate_session(db, user, profile, module, mode, count, question_type)
    full["source"] = "ai" if gemini.is_ai_available() else "offline"
    return {"session": full}


@router.post("/evaluate")
def evaluate(payload: SessionRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    if not payload.session:
        raise HTTPException(status_code=400, detail="Practice session is required.")
    session_data = _session_with_answers(db, user.id, payload.session)
    result = ev.evaluate_session(db, user, profile, session_data, payload.answers, timing=payload.timing)
    adaptive.recompute_profile(db, profile)
    updated = _profile_dict(db, user, profile)
    return {"evaluation": result, "updatedProfile": updated, "itemFeedback": result.get("perItemFeedback", [])}


@router.post("/vocab")
def vocab(payload: BrainRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def mock(payload: MockRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    section_results: dict[str, dict] = {}
    questions: dict[str, Any] = {}
    for skill in SKILLS:
        full = orchestrator.generate_session(db, user, profile, skill, "Question by Question", 3)
        questions[skill] = full
        stored = _session_with_answers(db, user.id, full)
        result = ev.evaluate_session(db, user, profile, stored, payload.answers)
        section_results[skill] = result
    result = ev.build_mock_result(db, user, profile, section_results, answers=payload.answers, timing=payload.timing)
    adaptive.recompute_profile(db, profile)
    updated = _profile_dict(db, user, profile)
    return {"result": result, "updatedProfile": updated, "questions": questions}


@router.post("/tutor")
def tutor(payload: TutorRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
def report(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = get_or_create_profile(db, user)
    return _report_payload(db, user, profile)


@router.get("/blueprint")
def blueprint(module: str = "reading"):
    module = module if module in SKILLS else "reading"
    data = dict(kb.get_blueprint(module))
    return data


@router.get("/blueprints")
def blueprints(module: str = "reading", user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
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
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "gemini": gemini.is_gemini_available(),
        "ai_provider": gemini.active_provider(),
        "ai_available": gemini.is_ai_available(),
        "database": active_dialect(),
    }
