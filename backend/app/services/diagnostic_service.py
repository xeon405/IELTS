"""Diagnostic assessment.

First-time users get a short diagnostic: one original question per skill.
Bands are estimated from accuracy and written into the student profile, which
then drives adaptive learning. Completing it also seeds band history and
weakness records."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from . import band_prediction as bp
from . import evaluation_service as ev
from . import gemini
from .question_generator import FALLBACK_ITEMS, _build_fallback_session, strip_answers

DIAGNOSTIC_SKILLS = ("reading", "listening", "writing", "speaking")

WRITING_CHART = {
    "type": "bar",
    "title": "International students at a university (2010–2025)",
    "unit": "thousands",
    "categories": ["2010", "2013", "2016", "2019", "2022", "2025"],
    "values": [24, 31, 38, 46, 41, 53],
}

_DIAGNOSTIC_GEMINI_PROMPT = """You are the IELTS AI question generator. Create a short first-login diagnostic: exactly FOUR original questions, one per skill. The student's target band is {target}.

For EACH skill follow these rules:
- READING: one multiple-choice OR true-false question. Include a SHORT passage (3-4 sentences) in "context". The question must require reading that passage.
- LISTENING: one form-completion OR map-labelling OR multiple-choice question. The "context" must be a short AUDIO SCRIPT written as a short dialogue or directions, exactly as a speaker would say it.
- WRITING: one Academic Task 1 REPORT question about a bar chart. Include a "chart" object with EXACTLY this shape: {{"type":"bar","title":"short title","unit":"label","categories":["A","B","C","D","E","F"],"values":[10,22,18,30,26,41]}}. The "prompt" must refer to that chart ("The bar chart below shows ... Summarise the information..."). Use 5-6 categories with realistic rounded numbers.
- SPEAKING: one Part 2 cue card question in "prompt" (start with "Describe ...").

Every item MUST include: "skill" (reading|listening|writing|speaking), "type", "title", "prompt", "context" (or empty), "options" (array, or [] if writing/speaking), "correctAnswer", "explanation", "tip", "logic" (step-by-step reasoning), "suggestions" (what to do differently), "bandAdvice" (band-level note).

Return ONLY JSON, no prose: a JSON object {{"items":[...the 4 items above...]}} where each item has the "id" field set to "reading-1", "listening-1", "writing-1" or "speaking-1".
"""


def _diagnostic_fallback_items(bands: dict) -> list[dict]:
    """Offline diagnostic (used when Gemini is unavailable or fails)."""
    items: list[dict] = []
    for skill in DIAGNOSTIC_SKILLS:
        session = _build_fallback_session(skill, "Question by Question", 1, bands)
        item = session["items"][0]
        item["id"] = f"diagnostic-{skill}-1"
        items.append(item)
    # Rewrite the writing item as a Task 1 chart report so the diagnostic shows a real chart.
    writing_base = next((b for b in FALLBACK_ITEMS["writing"] if b.get("type") == "essay" and b.get("title", "").startswith("Task 1")), FALLBACK_ITEMS["writing"][3])
    items = [
        {
            **items[2],
            "title": "Task 1 Report · International students",
            "prompt": "The bar chart below shows the number of international students at a university from 2010 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
            "context": "",
            "options": [],
            "correctAnswer": writing_base.get("correctAnswer", ""),
            "explanation": writing_base.get("explanation", ""),
            "tip": writing_base.get("tip", "Write the overview after the introduction. Compare highest/lowest and increases/decreases instead of listing every number."),
            "logic": writing_base.get("logic", ""),
            "suggestions": writing_base.get("suggestions", ""),
            "bandAdvice": writing_base.get("bandAdvice", ""),
            "chart": WRITING_CHART,
        }
        if item["id"] == "diagnostic-writing-1"
        else item
        for item in items
    ]
    return items


def _parse_diagnostic_items(raw) -> list[dict]:
    """Parse the Gemini response into validated diagnostic items."""
    items: list = []
    if isinstance(raw, dict):
        raw = raw.get("items") or []
    if not isinstance(raw, list):
        return []
    for raw_item in raw:
        if not isinstance(raw_item, dict) or not raw_item.get("prompt"):
            continue
        skill = str(raw_item.get("skill") or "").lower()
        if skill not in DIAGNOSTIC_SKILLS:
            continue
        item: dict = {
            "id": f"diagnostic-{skill}-1",
            "skill": skill,
            "type": str(raw_item.get("type") or "multiple-choice"),
            "title": str(raw_item.get("title") or "Diagnostic question"),
            "prompt": str(raw_item.get("prompt")),
            "context": str(raw_item.get("context") or ""),
            "options": raw_item.get("options") if isinstance(raw_item.get("options"), list) else [],
            "expectedFocus": "Skill accuracy",
            "descriptorFocus": "Current band estimate",
            "correctAnswer": str(raw_item.get("correctAnswer") or ""),
            "explanation": str(raw_item.get("explanation") or "Review the section blueprint for the strategy behind this answer."),
            "logic": str(raw_item.get("logic") or "Locate the key information and match it to the answer, rejecting options the text contradicts."),
            "tip": str(raw_item.get("tip") or "Read the question, find the exact evidence, and verify against the word limit or scope words."),
            "suggestions": str(raw_item.get("suggestions") or "Re-read the question and check your answer against the source material."),
            "bandAdvice": str(raw_item.get("bandAdvice") or "This question type rewards careful scanning and clear structure."),
        }
        if skill == "writing":
            chart = raw_item.get("chart")
            if isinstance(chart, dict) and isinstance(chart.get("categories"), list) and isinstance(chart.get("values"), list):
                item["chart"] = chart
            else:
                item["chart"] = WRITING_CHART
                if not item["correctAnswer"]:
                    item["correctAnswer"] = "Model answer: overall, numbers rose steadily with the sharpest growth after 2016. The largest figure was recorded in 2025, while the smallest was in 2010."
        items.append(item)
    return items


def build_diagnostic(profile: models.StudentProfile) -> dict:
    """Build the diagnostic question set (4 items, one per skill, no answers).

    Prefers freshly generated Gemini questions; falls back to the original
    offline bank (with a Task 1 chart for writing) when Gemini is unavailable.
    """
    bands = {
        "reading": profile.reading_band,
        "listening": profile.listening_band,
        "writing": profile.writing_band,
        "speaking": profile.speaking_band,
    }
    source = "offline-brain"
    items: list[dict] = []
    if gemini.is_ai_available():
        try:
            target = float(profile.target_band or 7.0)
            raw = gemini.generate_json(
                _DIAGNOSTIC_GEMINI_PROMPT.format(target=target),
                system_instruction="You generate original IELTS-style diagnostic material only. Output valid JSON.",
            )
            parsed = _parse_diagnostic_items(raw)
            if len(parsed) == len(DIAGNOSTIC_SKILLS):
                items = parsed
                source = gemini.active_provider()
        except Exception:  # noqa: BLE001
            items = []
    if not items:
        items = _diagnostic_fallback_items(bands)
    return {
        "id": f"diagnostic-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "title": "Diagnostic Assessment",
        "subtitle": "One question per section. The AI examiner estimates your starting bands.",
        "durationMinutes": 15,
        "questionCount": len(items),
        "questionTypes": ["One per section"],
        "difficultyBand": 6.0,
        "examinerIntent": "Establish starting bands so adaptive practice can begin immediately.",
        "items": items,
        "source": source,
    }


def create_or_get_test(db: Session, user: models.User, profile: models.StudentProfile) -> models.DiagnosticTest:
    test = (
        db.query(models.DiagnosticTest)
        .filter(models.DiagnosticTest.user_id == user.id, models.DiagnosticTest.status == "in_progress")
        .order_by(models.DiagnosticTest.started_at.desc())
        .first()
    )
    if test and test.questions_json:
        return test
    if test is None:
        test = models.DiagnosticTest(user_id=user.id, status="in_progress")
        db.add(test)
    diagnostic = build_diagnostic(profile)
    test.questions_json = diagnostic
    db.commit()
    return test


def submit_diagnostic(db: Session, user: models.User, profile: models.StudentProfile, test: models.DiagnosticTest, answers: dict[str, str]) -> dict:
    questions = test.questions_json or {}
    items = questions.get("items") or []
    results: dict[str, Any] = {}
    per_skill: dict[str, list[dict]] = {}
    for item in items:
        skill = str(item.get("id") or "").replace("diagnostic-", "").split("-")[0]
        if skill not in per_skill:
            per_skill[skill] = []
        per_skill[skill].append(item)
    total_accuracy = 0.0
    for skill in DIAGNOSTIC_SKILLS:
        skill_items = per_skill.get(skill, [])
        if not skill_items:
            results[skill] = {"band": 5.5, "accuracy": 50.0}
            continue
        scores = [ev.evaluate_item(item, answers.get(str(item.get("id")), "")) for item in skill_items]
        accuracy = round((sum(1 for s in scores if s.get("isCorrect")) / len(scores)) * 100)
        band = bp.band_from_accuracy(accuracy)
        if skill in ("writing", "speaking"):
            text = " ".join(answers.get(str(item.get("id")), "") for item in skill_items)
            band = bp.band_from_text(text, skill)
            band = band if band > 0 else 5.0
            accuracy = round((band / 9) * 100)
        band = bp.round_to_half(band)
        total_accuracy += accuracy
        results[skill] = {"band": band, "accuracy": accuracy}
        db.add(models.BandScore(user_id=user.id, skill=skill, band=band, accuracy=accuracy, source="diagnostic"))

    profile.reading_band = results["reading"]["band"]
    profile.listening_band = results["listening"]["band"]
    profile.writing_band = results["writing"]["band"]
    profile.speaking_band = results["speaking"]["band"]
    profile.current_band = round(sum(r["band"] for r in results.values()) / 4 * 2) / 2
    profile.diagnostic_completed = True
    profile.first_login_redirected = True
    profile.last_activity_at = datetime.now(timezone.utc)
    profile.completed_hours = float(profile.completed_hours or 0) + 0.25

    weakest = min(results, key=lambda s: results[s]["band"])
    if results[weakest]["band"] <= 6.0:
        db.add(models.Weakness(user_id=user.id, category="skill", label=f"{weakest.capitalize()} starting band", severity=0.5))
        weak_types = list(profile.weak_question_types or [])
        label = f"{weakest.capitalize()} needs the most attention"
        if label not in weak_types:
            weak_types.append(label)
            profile.weak_question_types = weak_types

    test.status = "completed"
    test.completed_at = datetime.now(timezone.utc)
    test.answers_json = answers
    test.results_json = results

    db.add(models.LearningHistory(
        user_id=user.id,
        event_type="diagnostic_completed",
        skill="",
        details_json={"results": {k: v["band"] for k, v in results.items()}, "overall": profile.current_band},
    ))
    db.add(models.Achievement(user_id=user.id, code="diagnostic_done", title="Diagnostic Complete", description="Completed the diagnostic assessment."))
    db.commit()
    return {
        "results": {k: v["band"] for k, v in results.items()},
        "overallBand": profile.current_band,
        "profile": results,
    }
