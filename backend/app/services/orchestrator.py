"""AI Orchestrator.

The single entry point the API uses for "give me practice". It composes the
other engines into one explainable pipeline:

    profile_engine (learning memory)
      -> band_prediction (where they are, where they're heading)
      -> recommendation (what to do next)
      -> adaptive (difficulty + question types + schedule)
      -> knowledge_base (blueprints / official styles)
      -> question_generator (offline bank or Gemini) -> validate
      -> persist session + recommendation
      -> strip answers -> return to frontend

The frontend never talks to Gemini: only this pipeline (via question_generator
and gemini) ever calls the model."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from .. import models
from . import adaptive
from . import band_prediction as bp
from . import knowledge_base as kb
from . import profile_engine
from . import question_generator as qg
from . import recommendation

SKILLS = ("reading", "listening", "writing", "speaking")


def _pipeline_steps(state: dict, rec: dict, module: str, mode: str, types: list[str], difficulty: float) -> list[str]:
    bands = state.get("bands") or {}
    return [
        "Load student learning profile",
        "Load learning history and band scores",
        f"Analyse current bands: reading {bands.get('reading')}, listening {bands.get('listening')}, writing {bands.get('writing')}, speaking {bands.get('speaking')}",
        f"Projected overall band: {state.get('projectedBand')}",
        f"Target band: {state.get('targetBand')}",
        f"Weakest skill: {state.get('weakestSkill')} (gap {state.get('gapToTarget')} to target)",
        f"Detected weaknesses: {', '.join(state.get('weakQuestionTypes') or []) or 'none recorded yet'}",
        f"Recommendation: {rec.get('module')} / {rec.get('mode')} ({rec.get('priority')})",
        f"Choose skill: {module}",
        f"Choose question types: {', '.join(types)}",
        f"Set difficulty to band {difficulty}",
        "Consult IELTS knowledge base (blueprints + official styles)",
        "Construct structured prompt",
        "Send prompt to Gemini (or use offline brain)",
        "Validate questions",
        "Return questions to frontend",
    ]


def _persist_session(db: Session, user: models.User, session: dict) -> None:
    module = str(session.get("module") or "reading")
    model = models.SESSION_MODELS.get(module)
    if model is None:
        return
    row = model(
        user_id=user.id,
        mode=str(session.get("mode") or "Practice"),
        title=str(session.get("title") or f"{module.capitalize()} practice"),
        duration_minutes=int(session.get("durationMinutes") or 5),
        question_count=int(session.get("questionCount") or len(session.get("items") or [])),
        difficulty_band=float(session.get("difficultyBand") or 6.0),
        question_types=list(session.get("questionTypes") or []),
        examiner_intent=str(session.get("examinerIntent") or ""),
        items_json=session,
    )
    db.add(row)
    db.flush()


def _persist_recommendation(db: Session, user: models.User, rec: dict) -> None:
    db.add(models.Recommendation(
        user_id=user.id,
        skill=str(rec.get("module") or "reading"),
        mode=str(rec.get("mode") or "Question by Question"),
        priority=str(rec.get("priority") or "High value"),
        reason=str(rec.get("reason") or ""),
        target_weakness=str(rec.get("targetWeakness") or ""),
        expected_lift=str(rec.get("expectedBandLift") or ""),
        difficulty_band=float(rec.get("difficultyBand") or 6.0),
    ))
    db.flush()


def recommend_only(
    db: Session,
    profile: models.StudentProfile,
) -> dict[str, Any]:
    """Fast path: recommendation only (no session generation, no AI)."""
    state = profile_engine.build_learning_state(db, profile)
    return recommendation.recommend(state)


def recommend_and_generate(
    db: Session,
    user: models.User,
    profile: models.StudentProfile,
    module: str | None = None,
    mode: str | None = None,
    count: int | None = None,
    question_type: str | None = None,
) -> dict[str, Any]:
    """The full pipeline. Returns a stripped session plus its recommendation."""
    state = profile_engine.build_learning_state(db, profile)
    rec = recommendation.recommend(state)

    module = module if module in SKILLS else (rec.get("module") or "reading")
    if question_type and kb.is_question_type(module, question_type):
        mode = question_type
    elif not kb.is_question_type(module, mode or ""):
        mode = mode if mode in kb.MODES.get(module, []) else (rec.get("mode") or kb.MODES[module][0])
    difficulty = adaptive.pick_difficulty(state, module)
    types = adaptive.pick_question_types(state, module, mode)

    profile_dict = adaptive.profile_brief(profile)
    full = qg.generate_session(profile_dict, module, mode, count, question_type)
    full["id"] = f"{full.get('id')}-{uuid4().hex[:8]}"
    full["difficultyBand"] = difficulty
    full["questionTypes"] = types
    full["pipeline"] = _pipeline_steps(state, rec, module, mode, types, difficulty)

    _persist_session(db, user, full)
    _persist_recommendation(db, user, rec)
    db.commit()

    session = qg.strip_answers(full)
    return {"recommendation": rec, "session": session}


def generate_session(
    db: Session,
    user: models.User,
    profile: models.StudentProfile,
    module: str,
    mode: str,
    count: int | None = None,
    question_type: str | None = None,
) -> dict[str, Any]:
    """Generate (and persist) a session for an explicit module/mode."""
    state = profile_engine.build_learning_state(db, profile)
    rec = recommendation.recommend(state)
    module = module if module in SKILLS else "reading"
    if question_type and kb.is_question_type(module, question_type):
        mode = question_type
    elif not kb.is_question_type(module, mode or ""):
        mode = mode if mode in kb.MODES.get(module, []) else kb.MODES[module][0]
    difficulty = adaptive.pick_difficulty(state, module)
    types = adaptive.pick_question_types(state, module, mode)

    profile_dict = adaptive.profile_brief(profile)
    full = qg.generate_session(profile_dict, module, mode, count, question_type)
    full["id"] = f"{full.get('id')}-{uuid4().hex[:8]}"
    full["difficultyBand"] = difficulty
    full["questionTypes"] = types
    full["pipeline"] = _pipeline_steps(state, rec, module, mode, types, difficulty)

    _persist_session(db, user, full)
    db.commit()
    return qg.strip_answers(full)


def _mark_activity(profile: models.StudentProfile) -> None:
    profile.last_activity_at = datetime.now(timezone.utc)
