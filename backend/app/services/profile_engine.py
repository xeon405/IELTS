"""Student Learning Profile engine.

Builds the student's "learning memory" from the database: current bands,
target, history, weaknesses, strengths, momentum and projected trajectory.
Every other engine (orchestrator, adaptive, recommendation, band prediction)
reads from this state so all decisions share one consistent view of the
student."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from .. import models
from . import band_prediction as bp
from .state_cache import get as state_cache_get
from .state_cache import set as state_cache_set

SKILLS = ("reading", "listening", "writing", "speaking")


def _skill_bands(profile: models.StudentProfile) -> dict[str, float]:
    return {
        "reading": float(profile.reading_band),
        "listening": float(profile.listening_band),
        "writing": float(profile.writing_band),
        "speaking": float(profile.speaking_band),
    }


def _band_scores(db: Session, user_id: int) -> list[dict]:
    rows = (
        db.query(models.BandScore)
        .filter(models.BandScore.user_id == user_id)
        .order_by(models.BandScore.created_at.asc())
        .limit(100)
        .all()
    )
    return [
        {
            "skill": row.skill,
            "band": float(row.band),
            "accuracy": float(row.accuracy or 0),
            "source": row.source,
            "createdAt": row.created_at.isoformat(),
        }
        for row in rows
    ]


def _practice_history(db: Session, user_id: int) -> list[dict]:
    events = (
        db.query(models.LearningHistory)
        .filter(models.LearningHistory.user_id == user_id, models.LearningHistory.event_type == "practice_completed")
        .order_by(models.LearningHistory.created_at.desc())
        .limit(50)
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
        }
        for e in events
    ]


def _mock_history(db: Session, user_id: int) -> list[dict]:
    mocks = (
        db.query(models.MockTest)
        .filter(models.MockTest.user_id == user_id, models.MockTest.overall_band.isnot(None))
        .order_by(models.MockTest.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": str(m.id),
            "date": m.created_at.isoformat(),
            "overallBand": float(m.overall_band),
            "bands": {
                "listening": float(m.listening_band or 0),
                "reading": float(m.reading_band or 0),
                "writing": float(m.writing_band or 0),
                "speaking": float(m.speaking_band or 0),
            },
        }
        for m in mocks
    ]


def _weakness_rows(db: Session, user_id: int) -> list[dict]:
    rows = (
        db.query(models.Weakness)
        .filter(models.Weakness.user_id == user_id)
        .order_by(models.Weakness.severity.desc())
        .limit(25)
        .all()
    )
    return [
        {"category": row.category, "label": row.label, "severity": float(row.severity)}
        for row in rows
    ]


def _recent_accuracy(practice_history: list[dict]) -> float:
    recent = [h for h in practice_history if h.get("accuracy")][:5]
    if not recent:
        return 0.0
    return round(sum(h["accuracy"] for h in recent) / len(recent), 1)


def build_learning_state(db: Session, profile: models.StudentProfile) -> dict[str, Any]:
    """The complete learning memory consumed by the AI engines.

    Cached for 30s per user: the four reads below are sequential round
    trips over a remote Postgres link, and this state is rebuilt on every
    session click, recommendation and mock.
    """
    cached = state_cache_get(profile.user_id)
    if cached is not None:
        cached["profile"] = profile
        return cached

    bands = _skill_bands(profile)
    practice_history = _practice_history(db, profile.user_id)
    mock_history = _mock_history(db, profile.user_id)
    band_scores = _band_scores(db, profile.user_id)
    weaknesses = _weakness_rows(db, profile.user_id)

    weak_types = list(profile.weak_question_types or [])
    weak_topics = list(profile.weak_topics or [])
    for w in weaknesses:
        if w["category"] == "question_type" and w["label"] not in weak_types:
            weak_types.append(w["label"])
        if w["category"] == "skill" and w["label"] not in weak_types:
            weak_types.append(w["label"])

    weakest = min(SKILLS, key=lambda s: bands[s])
    state: dict[str, Any] = {
        "profile": profile,
        "bands": bands,
        "overallBand": bp.overall_band(bands),
        "targetBand": float(profile.target_band),
        "testType": profile.test_type,
        "currentBand": float(profile.current_band),
        "weakestSkill": weakest,
        "weakestBand": bands[weakest],
        "gapToTarget": max(0.0, bp.round_to_half(float(profile.target_band) - bands[weakest])),
        "weakQuestionTypes": weak_types,
        "weakTopics": weak_topics,
        "strongSignals": list(profile.strong_signals or []),
        "weaknesses": weaknesses,
        "practiceHistory": practice_history,
        "mockHistory": mock_history,
        "bandScores": band_scores,
        "projectedBand": bp.project_band({
            "bands": bands,
            "bandScores": band_scores,
            "practiceHistory": practice_history,
        }),
        "bandTrend": bp.band_trend({"practiceHistory": practice_history}),
        "momentum": _recent_accuracy(practice_history),
        "learningSpeed": float(profile.learning_speed or 0),
        "sessionCount": len(practice_history),
        "mockCount": len(mock_history),
        "studyStreak": int(profile.study_streak),
        "completedHours": round(float(profile.completed_hours), 2),
        "confidence": float(profile.confidence),
        "diagnosticCompleted": bool(profile.diagnostic_completed),
        "grammarLevel": profile.grammar_level,
        "vocabularyLevel": profile.vocabulary_level,
    }
    state_cache_set(profile.user_id, {key: value for key, value in state.items() if key != "profile"})
    return state


def refresh_state(db: Session, profile: models.StudentProfile) -> dict[str, Any]:
    """Rebuild the state after an activity so recommendations never go stale."""
    return build_learning_state(db, profile)
