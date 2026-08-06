"""Adaptive Learning Engine.

Turns the stored StudentProfile + learning history into the profile shape the
frontend renders, and recomputes bands/weaknesses after every activity so the
AI Orchestrator always recommends from fresh state. Also decides the difficulty,
question types and session schedule for each practice round."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from . import band_prediction as bp
from . import knowledge_base as kb


def _skill_bands(profile: models.StudentProfile) -> dict[str, float]:
    return {
        "reading": float(profile.reading_band),
        "listening": float(profile.listening_band),
        "writing": float(profile.writing_band),
        "speaking": float(profile.speaking_band),
    }


def compute_overall(bands: dict[str, float]) -> float:
    return round(sum(bands.values()) / 4 * 2) / 2


def _latest_band_by_skill(db: Session, user_id: int, skill: str) -> float | None:
    row = (
        db.query(models.BandScore)
        .filter(models.BandScore.user_id == user_id, models.BandScore.skill == skill)
        .order_by(models.BandScore.created_at.desc())
        .first()
    )
    return float(row.band) if row else None


def _weighted_band(db: Session, user_id: int, skill: str, fallback: float) -> float:
    rows = (
        db.query(models.BandScore)
        .filter(models.BandScore.user_id == user_id, models.BandScore.skill == skill)
        .order_by(models.BandScore.created_at.desc())
        .limit(10)
        .all()
    )
    if not rows:
        return fallback
    total = 0.0
    weight = 0.0
    for index, row in enumerate(reversed(rows)):
        w = index + 1
        total += float(row.band) * w
        weight += w
    return round(total / weight * 2) / 2


def _practice_history(db: Session, user_id: int) -> list[dict]:
    events = (
        db.query(models.LearningHistory)
        .filter(models.LearningHistory.user_id == user_id, models.LearningHistory.event_type == "practice_completed")
        .order_by(models.LearningHistory.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": str(e.id),
            "date": e.created_at.isoformat(),
            "module": e.skill,
            "mode": (e.details_json or {}).get("mode", ""),
            "title": (e.details_json or {}).get("title", f"{e.skill.capitalize()} practice"),
            "band": float((e.details_json or {}).get("band", 0) or 0),
            "accuracy": float((e.details_json or {}).get("accuracy", 0) or 0),
            "weaknesses": list((e.details_json or {}).get("weaknesses", [])),
        }
        for e in events
    ]


def _mock_history(db: Session, user_id: int) -> list[dict]:
    mocks = (
        db.query(models.MockTest)
        .filter(models.MockTest.user_id == user_id, models.MockTest.overall_band.isnot(None))
        .order_by(models.MockTest.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": str(m.id),
            "date": m.created_at.isoformat(),
            "overallBand": float(m.overall_band),
            "listeningBand": float(m.listening_band or 0),
            "readingBand": float(m.reading_band or 0),
            "writingBand": float(m.writing_band or 0),
            "speakingBand": float(m.speaking_band or 0),
            "summary": f"Full mock scored {m.overall_band} overall by the AI examiner.",
        }
        for m in mocks
    ]


def _progress(db: Session, user_id: int, bands: dict[str, float]) -> list[dict]:
    rows = (
        db.query(models.BandScore)
        .filter(models.BandScore.user_id == user_id)
        .order_by(models.BandScore.created_at.asc())
        .limit(60)
        .all()
    )
    points: list[dict] = []
    current = dict(bands)
    for row in rows:
        current[row.skill] = float(row.band)
        overall = compute_overall(current)
        points.append({
            "label": row.created_at.strftime("%b %d"),
            "overall": overall,
            "reading": current.get("reading", 5.5),
            "listening": current.get("listening", 5.5),
            "writing": current.get("writing", 5.5),
            "speaking": current.get("speaking", 5.5),
        })
    if not points:
        points.append({
            "label": "Start",
            "overall": compute_overall(bands),
            "reading": bands.get("reading", 5.5),
            "listening": bands.get("listening", 5.5),
            "writing": bands.get("writing", 5.5),
            "speaking": bands.get("speaking", 5.5),
        })
    return points[-20:]


def serialize_profile(db: Session, profile: models.StudentProfile) -> dict[str, Any]:
    bands = _skill_bands(profile)
    return {
        "id": str(profile.id),
        "name": (profile.user.full_name if profile.user else "IELTS Student"),
        "currentBand": float(profile.current_band),
        "targetBand": float(profile.target_band),
        "testType": profile.test_type,
        "diagnosticCompleted": bool(profile.diagnostic_completed),
        "firstLogin": bool(profile.first_login_redirected),
        "studyStreak": int(profile.study_streak),
        "weeklyGoalHours": float(profile.weekly_goal_hours),
        "completedHours": round(float(profile.completed_hours), 2),
        "grammarLevel": profile.grammar_level,
        "vocabularyLevel": profile.vocabulary_level,
        "confidenceLevel": float(profile.confidence),
        "fluency": float(profile.fluency),
        "coherence": float(profile.coherence),
        "bands": bands,
        "weakQuestionTypes": list(profile.weak_question_types or []),
        "weakTopics": list(profile.weak_topics or []),
        "strongSignals": list(profile.strong_signals or []),
        "practiceHistory": _practice_history(db, profile.user_id),
        "mockHistory": _mock_history(db, profile.user_id),
        "progress": _progress(db, profile.user_id, bands),
        "vocabMastered": list(profile.vocab_mastered or []),
        "vocabQuizzesTaken": 0,
        "vocabQuizBest": 0,
    }


def recompute_profile(db: Session, profile: models.StudentProfile) -> models.StudentProfile:
    updated = False
    for skill in ("reading", "listening", "writing", "speaking"):
        latest = _latest_band_by_skill(db, profile.user_id, skill)
        if latest is not None:
            weighted = _weighted_band(db, profile.user_id, skill, latest)
            current = getattr(profile, f"{skill}_band")
            if weighted != current:
                setattr(profile, f"{skill}_band", weighted)
                updated = True
    bands = _skill_bands(profile)
    overall = compute_overall(bands)
    if overall != profile.current_band:
        profile.current_band = overall
        updated = True
    if updated:
        profile.updated_at = datetime.now(timezone.utc)
        db.commit()
    return profile


# ---------------------------------------------------------------------------
# Adaptive decisions: difficulty, question types and schedule
# ---------------------------------------------------------------------------

def _recent_for_skill(state: dict, module: str) -> list[dict]:
    history = state.get("practiceHistory") or []
    return [h for h in history if h.get("module") == module][:5]


def _average(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def pick_difficulty(state: dict, module: str) -> float:
    """Stretch difficulty: current band +0.5, eased or raised by recent accuracy."""
    bands = state.get("bands") or {}
    base = float(bands.get(module, 5.5))
    recent = _recent_for_skill(state, module)
    if recent:
        avg_acc = _average([float(h.get("accuracy") or 0) for h in recent])
        if avg_acc >= 80:
            base += 1.0
        elif avg_acc >= 60:
            base += 0.5
        elif avg_acc < 40:
            base -= 0.5
    return bp.clamp_band(base + 0.5)


def pick_question_types(state: dict, module: str, mode: str) -> list[str]:
    """Focus question types: recorded weaknesses first, then the mode defaults."""
    weak_types = [t for t in (state.get("weakQuestionTypes") or []) if any(t.lower() in q.lower() for q in kb.QUESTION_TYPES[module])]
    defaults = kb.question_types_for(module, mode)
    picked: list[str] = []
    for label in weak_types[:2]:
        match = next((q for q in kb.QUESTION_TYPES[module] if q.lower() == label.lower()), label)
        if match not in picked:
            picked.append(match)
    for q in defaults:
        if q not in picked:
            picked.append(q)
    return picked[:4]


def schedule_next(state: dict) -> dict:
    """Suggest the next session (module + mode) based on weakest skill and gap."""
    bands = state.get("bands") or {}
    weakest = min(bands, key=lambda s: bands.get(s, 5.5)) if bands else "reading"
    gap = max(0.0, float(state.get("targetBand") or 7.0) - float(bands.get(weakest, 5.5)))
    if gap >= 1.0:
        mode = "Individual Question Types"
    elif gap > 0:
        mode = "Question by Question"
    else:
        mode = "Quick Practice"
    return {"module": weakest, "mode": mode}


def compute_learning_speed(state: dict) -> float:
    """Average band change per practice event (sessions per half-band)."""
    history = sorted(
        (h for h in (state.get("practiceHistory") or []) if h.get("band")),
        key=lambda h: h.get("date", ""),
    )
    if len(history) < 3:
        return 0.0
    first = float(history[0]["band"])
    last = float(history[-1]["band"])
    delta = last - first
    events = len(history) - 1
    if delta <= 0:
        return 0.0
    return round(delta / events, 2)
