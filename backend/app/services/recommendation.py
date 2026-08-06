"""Recommendation Engine.

Decides what to practise next, in which mode, at what difficulty, and why.
The recommendation is deterministic and explainable: it ranks skills by band
gap to target, folds in recorded weaknesses and recent momentum, and persists
each decision so the student can see their learning path."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from .. import models
from . import band_prediction as bp
from . import knowledge_base as kb

SKILLS = ("reading", "listening", "writing", "speaking")

_MODE_BY_GAP = [
    (2.0, "Full {skill} Section"),
    (1.0, "Individual Question Types"),
]
_MAINTENANCE_MODES = {
    "reading": "Passage 2",
    "listening": "Part 3",
    "writing": "Task 2",
    "speaking": "Part 3",
}


def _weakest_skill(state: dict[str, Any]) -> str:
    bands = state.get("bands") or {}
    return min(SKILLS, key=lambda s: bands.get(s, 5.5))


def _priority(gap: float, weakest: str, weakest_band: float) -> str:
    if gap >= 1.5:
        return "Critical path"
    if gap >= 0.5:
        return "High value"
    if weakest_band <= 5.5:
        return "Foundation"
    return "Maintenance"


def _reason(state: dict[str, Any], weakest: str, mode: str, gap: float, target_weakness: str) -> str:
    bands = state.get("bands") or {}
    weakest_band = bands.get(weakest, 5.5)
    projected = state.get("projectedBand")
    parts = [
        f"{weakest.capitalize()} is your lowest section ({weakest_band}), {gap:g} band below your target.",
    ]
    if target_weakness and target_weakness.lower() not in (f"{weakest} accuracy",):
        parts.append(f"Recent evaluations flag {target_weakness}.")
    if projected:
        parts.append(f"Your projected overall band is {projected}.")
    parts.append(f"{mode} is the fastest way to close that gap.")
    return " ".join(parts)


def _expected_lift(gap: float) -> str:
    if gap >= 1.5:
        return "+0.5 after 3 focused sessions"
    if gap >= 0.5:
        return "+0.5 after 4 focused sessions"
    return "+0.25 after 2 focused sessions"


def _target_weakness(state: dict[str, Any], weakest: str) -> str:
    weak_types = state.get("weakQuestionTypes") or []
    if weak_types:
        for label in weak_types:
            if label.lower() not in (f"{weakest} needs the most attention", f"{weakest} starting band"):
                return label
    return f"{weakest.capitalize()} accuracy"


def _band_samples(state: dict[str, Any]) -> list[float]:
    samples: list[float] = []
    for row in state.get("bandScores") or []:
        value = row.get("band") if isinstance(row, dict) else row
        try:
            samples.append(float(value))
        except (TypeError, ValueError):
            continue
    return samples


def recommend(state: dict[str, Any]) -> dict[str, Any]:
    """Build the full recommendation from the learning state."""
    bands = state.get("bands") or {}
    weakest = state.get("weakestSkill") or _weakest_skill(state)
    weakest_band = float(bands.get(weakest, 5.5))
    gap = float(state.get("gapToTarget") or max(0.0, bp.round_to_half((state.get("targetBand") or 7.0) - weakest_band)))

    target_weakness = _target_weakness(state, weakest)
    has_recorded_weakness = bool(state.get("weakQuestionTypes") or state.get("weaknesses"))

    mode = None
    for threshold, candidate in _MODE_BY_GAP:
        if gap >= threshold:
            mode = candidate.format(skill=weakest)
            break
    if mode is None:
        mode = _MAINTENANCE_MODES.get(weakest, "Question by Question")
    if has_recorded_weakness and gap < 1.5:
        mode = "Individual Question Types"

    difficulty = bp.clamp_band(weakest_band + 0.5)

    return {
        "module": weakest,
        "mode": mode,
        "priority": _priority(gap, weakest, weakest_band),
        "reason": _reason(state, weakest, mode, gap, target_weakness),
        "targetWeakness": target_weakness,
        "expectedBandLift": _expected_lift(gap),
        "difficultyBand": difficulty,
        "projectedBand": float(state.get("projectedBand") or bp.overall_band(bands)),
        "bandTrend": state.get("bandTrend") or "no trend yet",
        "focusQuestionTypes": kb.question_types_for(weakest, mode),
        "confidence": bp.band_confidence(_band_samples(state)),
    }


def persist_recommendation(db: Session, user: models.User, rec: dict[str, Any]) -> models.Recommendation:
    row = models.Recommendation(
        user_id=user.id,
        skill=str(rec.get("module") or "reading"),
        mode=str(rec.get("mode") or "Question by Question"),
        priority=str(rec.get("priority") or "High value"),
        reason=str(rec.get("reason") or ""),
        target_weakness=str(rec.get("targetWeakness") or ""),
        expected_lift=str(rec.get("expectedBandLift") or ""),
        difficulty_band=float(rec.get("difficultyBand") or 6.0),
    )
    db.add(row)
    db.commit()
    return row


def recommend_for_profile(db: Session, user: models.User, profile: models.StudentProfile) -> dict[str, Any]:
    from . import profile_engine

    state = profile_engine.build_learning_state(db, profile)
    return recommend(state)
