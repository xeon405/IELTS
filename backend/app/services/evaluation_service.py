"""Evaluation engine.

Grades every submitted answer, produces the EvaluationResult/MockExamResult
the frontend renders, and persists the outcome to the database (answers, band
scores, weaknesses, learning history, achievements). Writing and speaking
answers get a Gemini band estimate when available, otherwise a transparent
heuristic based on length, structure and vocabulary range."""

import re
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from . import band_prediction as bp
from . import gemini
from . import knowledge_base as kb

SKILLS = ("reading", "listening", "writing", "speaking")

OBJECTIVE_TYPES = ("multiple-choice", "true-false", "yes-no-not-given", "sentence-completion", "short-answer", "matching", "matching-headings", "matching-sentence-endings", "summary-completion", "form-completion", "map-labelling", "table-completion")
SUBJECTIVE_TYPES = ("essay", "speaking-cue")


def _normalize(text: str) -> str:
    text = (text or "").strip().lower()
    text = re.sub(r"[.,;:'\"!?()\[\]]", "", text)
    return re.sub(r"\s+", " ", text).strip()


band_from_accuracy = bp.band_from_accuracy
round_band = bp.round_to_half


def analyze_text(text: str) -> dict:
    cleaned = (text or "").strip()
    words = cleaned.split()
    sentences = [s.strip() for s in re.split(r"[.!?]+", cleaned) if s.strip()]
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", cleaned) if p.strip()]
    avg_sentence = round((len(words) / len(sentences)) * 10) / 10 if sentences else 0
    unique_ratio = round((len({w.lower() for w in words}) / len(words)) * 100) if words else 0
    long_sentences = sum(1 for s in sentences if len(s.split()) > 20)
    insights: list[str] = []
    if len(words) == 0:
        insights.append("No text submitted — write at least a few sentences for a diagnosis.")
    elif len(words) < 150:
        insights.append("Below 150 words: aim for 250+ on Writing Task 2.")
    elif len(words) < 250:
        insights.append("Good length; push to 250+ words to remove a length penalty.")
    else:
        insights.append("Strong response length for a Task 2 answer.")
    if sentences:
        if avg_sentence > 22:
            insights.append("Sentences average very long — vary short and long for rhythm and clarity.")
        elif avg_sentence < 12:
            insights.append("Sentences are short — link ideas with connectors for cohesion.")
    if unique_ratio >= 60:
        insights.append("Good vocabulary range; keep using precise, topic-specific words.")
    elif words and unique_ratio < 45:
        insights.append("Limited vocabulary range — aim for more precise, less common words.")
    return {
        "wordCount": len(words),
        "sentenceCount": len(sentences),
        "paragraphCount": len(paragraphs),
        "averageSentenceWords": avg_sentence,
        "uniqueWordRatio": unique_ratio,
        "longSentenceCount": long_sentences,
        "insights": insights,
    }


def _heuristic_writing_band(text: str) -> float:
    return bp.band_from_text(text, "writing")


def _heuristic_speaking_band(text: str) -> float:
    return bp.band_from_text(text, "speaking")


FILLERS = {
    "umm", "um", "uh", "er", "eh", "ah", "hmm", "hm", "huh", "mm", "ahem",
}


def _strip_fillers(text: str) -> str:
    """Remove speech fillers so they never distort fluency or restart analysis.

    Requirement: the AI must not restart or penalise because of 'umm', 'ah' or
    'hmm'. The transcript keeps the user's real words; only the filler tokens
    are removed before metrics and criteria are computed.
    """
    words = (text or "").split()
    kept = [word for word in words if word.strip(".,!?;:()\"'").lower() not in FILLERS]
    return " ".join(kept)


def _speaking_criteria(text: str) -> list[dict]:
    """Break a spoken response into the five evaluation criteria.

    Filler words are stripped first, so hesitation sounds such as 'umm' never
    lower the fluency or pronunciation bands — they are reported as advice only.
    """
    analysis = analyze_text(text)
    words = analysis["wordCount"]
    sentences = analysis["sentenceCount"]
    avg = analysis["averageSentenceWords"]
    unique = analysis["uniqueWordRatio"]
    long_sentences = analysis["longSentenceCount"]
    base = _heuristic_speaking_band(text)

    if words and words >= 40:
        flu_band = round_band(5.5 + 0.5 * (avg >= 8) + 0.5 * (long_sentences >= 1))
    else:
        flu_band = round_band(5.5 + 0.5 * (words >= 15))
    flu_band = min(flu_band, 8.5)
    flu_comment = (
        "Short answer — extend each idea with a reason and an example so the answer keeps flowing."
        if words < 25
        else "Natural rhythm and connected sentences; keep a steady pace with linking phrases."
    )

    pro_band = round_band(max(4.5, min(8.5, base - 0.5 + 0.5 * (avg >= 10 and avg <= 18))))
    pro_comment = (
        "Record and listen back, stressing content words and keeping a steady rhythm."
        if pro_band <= 6.0
        else "Clear rhythm and sentence stress; keep word stress natural when you use new vocabulary."
    )

    gra_band = round_band(max(4.0, min(8.5, base - 0.5 + 0.5 * (avg >= 10))))
    gra_comment = (
        "Check verb tenses, articles and subject-verb agreement while you speak."
        if gra_band <= 6.0
        else "Good range of structures; add conditionals and relative clauses for a half-band gain."
    )

    lex_band = round_band(5.5 + 0.5 * (unique >= 55) + 0.5 * (unique >= 62))
    lex_comment = (
        "Replace generic words with precise, topic-specific vocabulary."
        if unique < 55
        else "Good lexical range; use idiomatic or less common expressions naturally."
    )

    if sentences >= 2:
        coh_band = round_band(5.5 + 0.5 * (avg >= 8) + 0.5 * (avg <= 20 and words >= 20))
    else:
        coh_band = 4.5
    coh_comment = (
        "Organise ideas with ordering and linking words: first, on the other hand, as a result."
        if coh_band <= 6.0
        else "Clear progression of ideas with linking devices; keep the ending tied to the question."
    )

    return [
        {"criterion": "Fluency", "band": flu_band, "comment": flu_comment},
        {"criterion": "Pronunciation", "band": pro_band, "comment": pro_comment},
        {"criterion": "Grammar", "band": gra_band, "comment": gra_comment},
        {"criterion": "Vocabulary", "band": lex_band, "comment": lex_comment},
        {"criterion": "Coherence", "band": coh_band, "comment": coh_comment},
    ]


def _filler_report(text: str) -> str:
    """Advice about fillers, phrased so they are never counted as errors."""
    fillers = [w.strip(".,!?;:()\"'") for w in text.split() if w.strip(".,!?;:()\"'").lower() in FILLERS]
    if not fillers:
        return "No distracting fillers detected — smooth delivery."
    return f"'{fillers[0]}' and similar fillers ({len(fillers)}) were detected. The AI does not penalise them, but reducing them will make your delivery sound more confident."


MOCK_MINUTES = {"listening": 30, "reading": 60, "writing": 60, "speaking": 14}


def _clock(total: int) -> str:
    total = max(0, int(total))
    return f"{total // 3600:02d}:{(total % 3600) // 60:02d}:{total % 60:02d}"


def _clamp_score(value: float) -> int:
    return max(5, min(100, int(round(value))))


def compute_timing_metrics(
    module: str,
    items: list,
    answers: dict[str, str],
    recommended_minutes: int,
    total_seconds: int | None = None,
) -> dict:
    """Examiner metrics for one section: timing detail, speed, time management.

    `total_seconds` is the time the student actually used (from the client
    countdown). When absent, the examiner estimates from the recommended time
    and completion so the report still works offline.
    """
    recommended = max(1, int(recommended_minutes or 1)) * 60
    answered = sum(1 for item in items if (answers.get(str(item.get("id", "")) or "") or "").strip())
    total_items = max(1, len(items))
    completion = answered / total_items
    used = max(0, int(total_seconds or 0)) if total_seconds is not None else None
    effective = used if used is not None and used > 0 else recommended
    over = max(0, effective - recommended)
    minutes = max(0.1, effective / 60)
    words = sum(len((a or "").split()) for a in answers.values())

    if module == "writing":
        wpm = words / minutes
        speed_score = _clamp_score(wpm * 10)
        speed_label = "Fast" if wpm >= 8 else "Balanced" if wpm >= 4.5 else "Slow"
        speed_metric = f"{wpm:.0f} words/min"
        speed_comment = (
            "Writing pace is above target — keep the structure and you can add depth."
            if speed_label == "Fast"
            else "Solid writing pace; plan for 5 minutes, then write without stopping."
            if speed_label == "Balanced"
            else "Pace is slow — plan in 5 minutes and write continuously, checking length at the end."
        )
    elif module == "speaking":
        wpm = words / minutes
        speed_score = _clamp_score(wpm * 1.4)
        speed_label = "Fast" if wpm >= 65 else "Balanced" if wpm >= 35 else "Slow"
        speed_metric = f"{wpm:.0f} words/min"
        speed_comment = (
            "Strong answer flow — use the extra time to develop Part 3 ideas."
            if speed_label == "Fast"
            else "Good flow; keep extending each answer with a reason and example."
            if speed_label == "Balanced"
            else "Answers are short — extend every point with a reason and an example."
        )
    else:
        expected_pace = total_items / (recommended / 60)
        qpm = answered / minutes
        ratio = qpm / expected_pace if expected_pace else 0.0
        speed_score = _clamp_score(ratio * 75)
        speed_label = "Fast" if ratio >= 1.25 else "Balanced" if ratio >= 0.75 else "Slow"
        speed_metric = f"{answered} questions in {minutes:.0f} min"
        speed_comment = (
            "Ahead of the recommended pace — keep the accuracy that comes with it."
            if speed_label == "Fast"
            else "Pace matches the official recommendation; keep scanning, not reading word by word."
            if speed_label == "Balanced"
            else "Falling behind the official pace — move on after 90 seconds per question."
        )

    if used is None:
        tm_score = _clamp_score(50 + completion * 45)
        tm_label = "No timing data"
        tm_comment = "Use the section countdown next time so the examiner can measure your pacing."
    else:
        ratio = effective / recommended
        tm_score = 100.0
        if ratio > 1.1:
            tm_score -= min(55, (ratio - 1.1) * 110)
        if ratio < 0.7 and completion < 1.0:
            tm_score -= min(55, (1 - ratio) * 90)
        tm_score -= (1 - completion) * 25
        tm_score = _clamp_score(tm_score)
        over_budget = ratio > 1.1
        if ratio < 0.7 and completion < 1.0:
            tm_label = "Rushed"
            tm_comment = f"Finished in {_clock(effective)} of {_clock(recommended)} but left questions unanswered — distribute time across all items."
        elif over_budget:
            tm_label = "Slightly over" if tm_score >= 45 else "Over time"
            tm_comment = f"Used {_clock(effective)} of the recommended {_clock(recommended)} — practise moving on after 90 seconds per question."
        elif completion >= 1.0:
            tm_label = "Excellent" if tm_score >= 85 else "On pace"
            tm_comment = f"Completed everything within the recommended {_clock(recommended)} — exactly the pacing the examiner looks for."
        else:
            tm_label = "On pace"
            tm_comment = f"Pacing is good; use remaining time to answer the {total_items - answered} unanswered item(s)."

    return {
        "timing": {
            "recommendedSeconds": recommended,
            "totalSeconds": used,
            "timeTaken": _clock(effective),
            "remaining": _clock(max(0, recommended - effective)),
            "overBudgetSeconds": over,
            "onBudget": effective <= recommended,
        },
        "speed": {"score": speed_score, "label": speed_label, "metric": speed_metric, "comment": speed_comment},
        "timeManagement": {"score": tm_score, "label": tm_label, "comment": tm_comment},
    }


def grade_objective(user_answer: str, correct_answer: str, options: list[str] | None = None) -> tuple[bool, str, float]:
    user = _normalize(user_answer)
    correct = _normalize(correct_answer)
    if not user:
        return False, correct_answer, 0.0
    if options:
        for index, option in enumerate(options):
            if _normalize(option) == user:
                return _normalize(option) == correct, correct_answer, 1.0 if _normalize(option) == correct else 0.0
        if user == correct or correct in user or user in correct:
            return True, correct_answer, 1.0
        return False, correct_answer, 0.0
    return user == correct, correct_answer, 1.0 if user == correct else 0.0


def _writing_criteria(text: str, item: dict) -> list[dict]:
    """Break the writing response into the four official criteria bands."""
    analysis = analyze_text(text)
    words = analysis["wordCount"]
    sentences = analysis["sentenceCount"]
    paragraphs = analysis["paragraphCount"]
    avg = analysis["averageSentenceWords"]
    base = _heuristic_writing_band(text)

    task_low = words and words < 150
    task_mid = words and (150 <= words < 250)
    task_band = round_band(6.0 + 0.5 * (not task_low) + 0.5 * (not task_mid)) if words else 3.5
    task_band = min(task_band, 8.5)
    task_comment = (
        "Below the minimum length — the examiner must assume the task is incomplete."
        if task_low
        else "Meets the length expectation; address every part of the question explicitly for top marks."
        if task_mid
        else "Full response length; demonstrate task coverage in every paragraph."
    )

    if sentences:
        coh_band = round_band(5.5 + 0.5 * (paragraphs >= 4) + 0.5 * (avg <= 20))
    else:
        coh_band = 3.5
    coh_comment = (
        "No paragraphing detected — organise the answer into introduction / body / conclusion."
        if paragraphs < 3
        else "Clear paragraph structure; use topic sentences and linking devices to strengthen cohesion."
    )

    lex_band = round_band(5.5 + 0.5 * (analysis["uniqueWordRatio"] >= 55) + 0.5 * (analysis["uniqueWordRatio"] >= 65))
    lex_comment = (
        "Vocabulary range looks limited — replace generic words with precise, less common alternatives."
        if analysis["uniqueWordRatio"] < 55
        else "Good range of vocabulary; refine collocations for a half-band gain."
    )

    gram_band = round_band(max(3.5, min(8.5, base - 0.5 + 0.5 * (avg >= 12))))
    gram_comment = (
        "Accuracy is the priority here — check verb tenses, articles and subject-verb agreement."
        if gram_band <= 6.0
        else "Grammatical control is solid; vary sentence structures to reach Band 8."
    )

    return [
        {"criterion": "Task Achievement", "band": task_band, "comment": task_comment},
        {"criterion": "Coherence and Cohesion", "band": coh_band, "comment": coh_comment},
        {"criterion": "Lexical Resource (Vocabulary)", "band": lex_band, "comment": lex_comment},
        {"criterion": "Grammatical Range and Accuracy", "band": gram_band, "comment": gram_comment},
    ]


def _subjective_feedback(item: dict, answer: str) -> dict:
    if item.get("type") == "speaking-cue":
        clean_answer = _strip_fillers(answer)
        text_analysis = analyze_text(clean_answer)
        filler_advice = _filler_report(answer)
        band = _heuristic_speaking_band(clean_answer)
        accuracy = round((band / 9) * 100)
        criteria = _speaking_criteria(clean_answer)
        text_analysis["insights"] = (text_analysis.get("insights") or []) + [filler_advice]
        logic_default = "Answer in the Part 1 shape (answer + reason + example), the Part 2 story (4 points), or the Part 3 mini-essay (claim, reason, example)."
        tip_default = "Use linking phrases and keep a steady rhythm; record and listen back once."
        suggestions_default = "Practise the same question again aloud, adding one more reason or example each time."
        band_advice_default = "One band rise follows one focused fix: keep answering, keep linking, keep your rhythm."
    else:
        text_analysis = analyze_text(answer)
        filler_advice = ""
        band = _heuristic_writing_band(answer)
        accuracy = round((band / 9) * 100)
        criteria = _writing_criteria(answer, item)
        logic_default = "State a clear position, support every claim, and check grammar, range and task response."
        tip_default = "Review the section blueprint for structure and scoring criteria."
        suggestions_default = "Rewrite once with the model answer in view, then compare paragraph by paragraph."
        band_advice_default = "Each band rise follows one focused fix: structure, then range, then accuracy."
    model = item.get("correctAnswer") or item.get("explanation") or "A model answer would state a clear position, support it with reasons and examples, and use accurate grammar and vocabulary."
    return {
        "band": band,
        "accuracy": accuracy,
        "modelAnswer": model,
        "sampleHighBandAnswer": model,
        "criteria": criteria,
        "explanation": item.get("explanation", "Compare your response with the model answer and focus on structure, range, and accuracy."),
        "logic": item.get("logic", logic_default),
        "tip": item.get("tip", tip_default),
        "suggestions": item.get("suggestions", suggestions_default),
        "bandAdvice": item.get("bandAdvice", band_advice_default),
        "textAnalysis": text_analysis,
        "fillerAdvice": filler_advice,
    }


def evaluate_item(item: dict, user_answer: str) -> dict:
    """Grade a single item. Returns per-answer feedback the frontend can show."""
    qtype = str(item.get("type") or "multiple-choice")
    if qtype in SUBJECTIVE_TYPES:
        feedback = _subjective_feedback(item, user_answer)
        return {
            "id": item.get("id"),
            "type": qtype,
            "isCorrect": feedback["band"] >= 6.0,
            "score": feedback["accuracy"] / 100,
            "feedback": {
                "verdict": "Good response" if feedback["band"] >= 6.0 else "Needs work",
                "idealAnswer": feedback["modelAnswer"],
                "sampleHighBandAnswer": feedback.get("sampleHighBandAnswer") or feedback["modelAnswer"],
                "criteria": feedback.get("criteria") or [],
                "explanation": feedback["explanation"],
                "logic": feedback["logic"],
                "tip": feedback["tip"],
                "suggestions": feedback["suggestions"],
                "bandAdvice": feedback["bandAdvice"],
                "estimatedBand": feedback["band"],
                "textAnalysis": feedback["textAnalysis"],
                "fillerAdvice": feedback.get("fillerAdvice", ""),
            },
        }
    correct, model, score = grade_objective(user_answer, item.get("correctAnswer", ""), item.get("options"))
    return {
        "id": item.get("id"),
        "type": qtype,
        "isCorrect": correct,
        "score": score,
        "feedback": {
            "verdict": "Correct" if correct else "Incorrect",
            "idealAnswer": model,
            "explanation": item.get("explanation", "Review the section blueprint for the strategy behind this answer."),
            "logic": item.get("logic", "Locate the key sentence, match meaning to the answer, then reject what the text contradicts."),
            "tip": item.get("tip", "Practise this question type, then retry."),
            "suggestions": item.get("suggestions", "Re-read the question, find the exact sentence, and check the word limit or scope words."),
            "bandAdvice": item.get("bandAdvice", "Controlled scanning and paraphrase awareness lift Reading accuracy at every band."),
            "estimatedBand": None,
            "textAnalysis": None,
        },
    }


def _gemini_band_estimate(skill: str, text: str, prompt: str) -> dict | None:
    if not gemini.is_gemini_available():
        return None
    prompt_block = f"""You are an IELTS examiner. Evaluate this {skill} answer for the question below.

Question: {prompt[:500]}

Candidate answer:
{text[:3000]}

Return ONLY JSON, no prose, with keys:
{{"band": number, "summary": "2-3 sentence examiner summary", "strengths": ["..."], "weaknesses": ["..."], "nextPlan": ["..."], "bandDescriptorNotes": ["..."]}}
Band must be a half-band number between 3.5 and 9.0."""
    try:
        data = gemini.generate_json(prompt_block, system_instruction="You are a strict but fair IELTS examiner. Output valid JSON only.")
        if not isinstance(data, dict) or not data.get("band"):
            return None
        data["band"] = float(data["band"])
        for key in ("strengths", "weaknesses", "nextPlan", "bandDescriptorNotes"):
            if not isinstance(data.get(key), list):
                data[key] = [str(data.get(key, ""))]
        return data
    except Exception:
        return None


def evaluate_session(db: Session, user: models.User, profile: models.StudentProfile, session_data: dict, answers: dict[str, str], timing: dict | None = None) -> dict:
    module = str(session_data.get("module") or "reading")
    items = session_data.get("items") or []
    skill_results: list[dict] = []
    wrong_by_type: dict[str, int] = {}
    total_score = 0.0
    scored = 0
    for item in items:
        item_id = str(item.get("id"))
        answer = answers.get(item_id, "")
        graded = evaluate_item(item, answer)
        skill_results.append(graded)
        total_score += float(graded.get("score") or 0.0)
        scored += 1
        if not graded.get("isCorrect") and graded.get("type") in OBJECTIVE_TYPES:
            wrong_by_type[str(graded.get("type"))] = wrong_by_type.get(str(graded.get("type")), 0) + 1

    accuracy = round((total_score / scored) * 100) if scored else 0
    objective_only = [r for r in skill_results if r["type"] in OBJECTIVE_TYPES]
    objective_accuracy = round((sum(1 for r in objective_only if r["isCorrect"]) / len(objective_only)) * 100) if objective_only else accuracy

    predicted_band = band_from_accuracy(objective_accuracy) if module in ("reading", "listening") else _estimated_subjective_band(skill_results)
    predicted_band = round_band(predicted_band)

    text_answers = [a for a in answers.values() if (a or "").strip() and len(a.split()) > 20]
    gemini_data = None
    if module in ("writing", "speaking") and text_answers:
        joined = "\n\n".join(text_answers)[:3000]
        if module == "speaking":
            joined = _strip_fillers(joined)
        gemini_data = _gemini_band_estimate(module, joined, " ".join(str(i.get("prompt", "")) for i in items)[:500])
        if gemini_data:
            predicted_band = round_band(gemini_data.get("band", predicted_band))
            accuracy = round((predicted_band / 9) * 100)

    strengths: list[str] = []
    weaknesses: list[str] = []
    if gemini_data:
        strengths = gemini_data.get("strengths") or []
        weaknesses = gemini_data.get("weaknesses") or []
    if objective_only:
        correct_types = [r["type"] for r in objective_only if r["isCorrect"]]
        if len(correct_types) >= max(1, len(objective_only) // 2):
            strengths.append(f"Strong accuracy on {module} objective questions ({objective_accuracy}%).")
        for qtype, count in wrong_by_type.items():
            weaknesses.append(f"Repeated errors on {qtype} ({count} wrong).")
    if not weaknesses:
        weaknesses.append(f"Keep practising {module} to build speed and consistency.")
    if not strengths:
        strengths.append(f"Consistent attempt: {accuracy}% accuracy on this {module} session.")

    next_plan = [
        f"Practise the weakest {module} question types via Individual Question Types mode.",
        "Review the section blueprint for time management and band tips.",
        "Retry a similar session in 48 hours to measure improvement.",
    ]
    band_notes = list((kb.get_blueprint(module).get("bandTips") or {}).values())[:3]
    if gemini_data and gemini_data.get("bandDescriptorNotes"):
        band_notes = gemini_data["bandDescriptorNotes"]

    result: dict = {
        "sessionId": str(session_data.get("id") or "practice"),
        "module": module,
        "predictedBand": predicted_band,
        "accuracy": accuracy,
        "aiEvaluated": bool(gemini_data),
        "evaluatedBy": gemini.active_provider() if gemini_data else "offline",
        "examinerSummary": gemini_data.get("summary") if gemini_data else f"You scored {accuracy}% and the AI examiner estimates band {predicted_band} for this {module} session.",
        "strengths": strengths,
        "weaknesses": weaknesses,
        "nextPlan": next_plan,
        "bandDescriptorNotes": band_notes,
        "itemFeedback": skill_results,
        "perItemFeedback": skill_results,
    }
    if module in ("writing", "speaking") and skill_results and skill_results[0].get("feedback", {}).get("textAnalysis"):
        result["textAnalysis"] = skill_results[0]["feedback"]["textAnalysis"]

    total_seconds = (timing or {}).get("totalSeconds")
    metrics = compute_timing_metrics(
        module,
        items,
        answers,
        int(session_data.get("durationMinutes") or 0) or kb.mode_duration(module, str(session_data.get("mode") or "Quick Practice")),
        int(total_seconds) if total_seconds is not None else None,
    )
    result.update({"timing": metrics["timing"], "speed": metrics["speed"], "timeManagement": metrics["timeManagement"]})

    _persist_session(db, user, profile, module, session_data, answers, skill_results, predicted_band, accuracy, wrong_by_type)
    return result


def _estimated_subjective_band(skill_results: list[dict]) -> float:
    bands = [r["feedback"].get("estimatedBand") for r in skill_results if r.get("feedback", {}).get("estimatedBand")]
    if not bands:
        return 5.0
    return sum(bands) / len(bands)


def _persist_session(db: Session, user: models.User, profile: models.StudentProfile, module: str, session_data: dict, answers: dict[str, str], skill_results: list[dict], band: float, accuracy: float, wrong_by_type: dict[str, int]) -> None:
    now = datetime.now(timezone.utc)
    mode = str(session_data.get("mode") or "Practice")
    title = str(session_data.get("title") or f"{module.capitalize()} practice")
    session_key = str(session_data.get("id") or f"{module}-{now.timestamp()}")

    for item, graded in zip(session_data.get("items") or [], skill_results):
        item_id = str(item.get("id"))
        question = _get_or_create_question(db, user, item, module)
        db.add(models.Answer(
            user_id=user.id,
            question_id=question.id if question else None,
            session_id=0 if not session_key.isdigit() else int(session_key),
            session_type="practice",
            answer_text=answers.get(item_id, ""),
            is_correct=graded.get("isCorrect"),
            score=graded.get("score"),
            created_at=now,
        ))

    db.add(models.BandScore(user_id=user.id, skill=module, band=band, accuracy=accuracy, source="practice", created_at=now))

    _sync_weaknesses(db, user, profile, module, wrong_by_type, skill_results)

    db.add(models.LearningHistory(
        user_id=user.id,
        event_type="practice_completed",
        skill=module,
        details_json={"session_id": session_key, "mode": mode, "title": title, "band": band, "accuracy": accuracy},
        created_at=now,
    ))
    db.add(models.LearningHistory(
        user_id=user.id,
        event_type="session_completed",
        skill=module,
        details_json={"mode": mode, "title": title, "band": band},
        created_at=now,
    ))

    profile.last_activity_at = now
    profile.completed_hours = float(profile.completed_hours or 0) + float(session_data.get("durationMinutes") or 5) / 60
    profile.confidence = round(max(0.0, min(100.0, float(profile.confidence or 50) + (band - 5.5) * 3)), 1)
    if module == "speaking":
        profile.fluency = round(max(0.0, min(100.0, float(profile.fluency or 50) + (band - 5.5) * 3)), 1)
    if module == "writing":
        profile.coherence = round(max(0.0, min(100.0, float(profile.coherence or 50) + (band - 5.5) * 3)), 1)
    profile.learning_speed = round(float(profile.learning_speed or 0) + 0.1, 2)

    _unlock_achievements(db, user)

    session_count = db.query(models.LearningHistory).filter(models.LearningHistory.user_id == user.id, models.LearningHistory.event_type == "practice_completed").count()
    if session_count >= 1 and profile.study_streak == 0:
        profile.study_streak = 1
    db.commit()


def _get_or_create_question(db: Session, user: models.User, item: dict, module: str) -> models.Question | None:
    prompt = str(item.get("prompt") or "").strip()
    if not prompt:
        return None
    existing = db.query(models.Question).filter(models.Question.user_id == user.id, models.Question.prompt == prompt).first()
    if existing:
        return existing
    question = models.Question(
        user_id=user.id,
        skill=module,
        qtype=str(item.get("type") or "multiple-choice"),
        topic=str(item.get("title") or "General"),
        difficulty=float(item.get("difficultyBand") or 6.0),
        title=str(item.get("title") or "Practice question"),
        prompt=prompt,
        context=str(item.get("context") or ""),
        options_json=list(item.get("options") or []),
        correct_answer=str(item.get("correctAnswer") or ""),
        source=str(item.get("source") or "gemini"),
    )
    db.add(question)
    db.flush()
    return question


def _sync_weaknesses(db: Session, user: models.User, profile: models.StudentProfile, module: str, wrong_by_type: dict[str, int], skill_results: list[dict]) -> None:
    weak_types: list[str] = list(profile.weak_question_types or [])
    weak_topics: list[str] = list(profile.weak_topics or [])
    for qtype, count in wrong_by_type.items():
        if count >= 2 and qtype not in weak_types:
            weak_types.append(qtype)
            db.add(models.Weakness(user_id=user.id, category="question_type", label=qtype, severity=min(1.0, count / 5)))
    for graded in skill_results:
        if graded.get("type") in SUBJECTIVE_TYPES and (graded.get("feedback") or {}).get("estimatedBand", 9) < 6:
            label = f"Writing structure" if graded["type"] == "essay" else "Speaking fluency"
            if label not in weak_types:
                weak_types.append(label)
                db.add(models.Weakness(user_id=user.id, category="skill", label=label, severity=0.6))
    if not weak_types and (profile.weak_question_types or []):
        weak_types = list(profile.weak_question_types)
    if len(weak_types) > 12:
        weak_types = weak_types[-12:]
    profile.weak_question_types = weak_types
    profile.weak_topics = weak_topics


def _unlock_achievements(db: Session, user: models.User) -> None:
    unlocked = {a.code for a in db.query(models.Achievement).filter(models.Achievement.user_id == user.id).all()}
    practice_count = db.query(models.LearningHistory).filter(models.LearningHistory.user_id == user.id, models.LearningHistory.event_type == "practice_completed").count()
    mock_count = db.query(models.MockTest).filter(models.MockTest.user_id == user.id, models.MockTest.overall_band.isnot(None)).count()
    candidates = [
        ("first_session", "First Practice", "Completed your first practice session."),
        ("sessions_5", "Regular Learner", "Completed 5 practice sessions."),
        ("sessions_10", "Dedicated Learner", "Completed 10 practice sessions."),
        ("first_mock", "Mock Warrior", "Completed your first full mock test."),
        ("mocks_3", "Exam Ready", "Completed 3 full mock tests."),
    ]
    for code, title, description in candidates:
        if code in unlocked:
            continue
        if code == "first_session" and practice_count >= 1:
            db.add(models.Achievement(user_id=user.id, code=code, title=title, description=description))
        elif code == "sessions_5" and practice_count >= 5:
            db.add(models.Achievement(user_id=user.id, code=code, title=title, description=description))
        elif code == "sessions_10" and practice_count >= 10:
            db.add(models.Achievement(user_id=user.id, code=code, title=title, description=description))
        elif code == "first_mock" and mock_count >= 1:
            db.add(models.Achievement(user_id=user.id, code=code, title=title, description=description))
        elif code == "mocks_3" and mock_count >= 3:
            db.add(models.Achievement(user_id=user.id, code=code, title=title, description=description))


def _mock_skill_items(skill: str, answers: dict[str, str]) -> list[dict]:
    """Official mock question stubs for timing: 40 numeric items for listening/reading, 2 for writing, 3 for speaking."""
    if skill in ("listening", "reading"):
        return [{"id": f"{skill}-{index}"} for index in range(1, 41)]
    if skill == "writing":
        return [{"id": "writing-task-1"}, {"id": "writing-task-2"}]
    return [{"id": "speaking-part-1"}, {"id": "speaking-part-2"}, {"id": "speaking-part-3"}]


def build_mock_result(
    db: Session,
    user: models.User,
    profile: models.StudentProfile,
    section_results: dict[str, dict],
    answers: dict[str, str] | None = None,
    timing: dict | None = None,
) -> dict:
    answers = answers or {}
    timing = timing or {}
    section_metrics: dict[str, dict] = {}
    for skill in ("listening", "reading", "writing", "speaking"):
        total_seconds = (timing.get(skill) or {}).get("totalSeconds")
        metrics = compute_timing_metrics(
            skill,
            _mock_skill_items(skill, answers),
            answers,
            MOCK_MINUTES[skill],
            int(total_seconds) if total_seconds is not None else None,
        )
        section_metrics[skill] = metrics
    bands: dict[str, float] = {}
    section_feedback: dict[str, str] = {}
    for skill in ("listening", "reading", "writing", "speaking"):
        result = section_results.get(skill) or {}
        band = round_band(float(result.get("predictedBand") or 5.5))
        bands[skill] = band
        section_feedback[skill] = str(result.get("examinerSummary") or f"AI examiner estimate for {skill}: band {band}.")
        db.add(models.BandScore(user_id=user.id, skill=skill, band=band, accuracy=float(result.get("accuracy") or 0), source="mock"))
    overall = round_band(sum(bands.values()) / 4)
    mock = models.MockTest(
        user_id=user.id,
        status="completed",
        listening_band=bands["listening"],
        reading_band=bands["reading"],
        writing_band=bands["writing"],
        speaking_band=bands["speaking"],
        overall_band=overall,
    )
    db.add(mock)
    db.flush()
    db.add(models.LearningHistory(
        user_id=user.id,
        event_type="mock_completed",
        skill="",
        details_json={"mock_id": mock.id, "overall_band": overall, "bands": bands},
    ))
    weakest = min(bands, key=lambda s: bands[s])
    improvement_plan = [
        f"Prioritise {weakest} — it pulls your overall band down to {overall}.",
        "Do a 3-session focused block on your weakest skill this week.",
        "Take another full mock in 7 days to track movement.",
        "Review each section blueprint for question-type strategy.",
    ]
    profile.last_activity_at = datetime.now(timezone.utc)
    _unlock_achievements(db, user)
    db.commit()

    speed_scores = []
    tm_scores = []
    timing_metrics: dict[str, dict] = {}
    for skill in ("listening", "reading", "writing", "speaking"):
        metrics = section_metrics.get(skill) or {}
        speed_scores.append(float((metrics.get("speed") or {}).get("score") or 50))
        tm_scores.append(float((metrics.get("timeManagement") or {}).get("score") or 50))
        timing_metrics[skill] = dict((metrics.get("timing") or {}))
    overall_speed = round(sum(speed_scores) / len(speed_scores)) if speed_scores else 50
    overall_tm = round(sum(tm_scores) / len(tm_scores)) if tm_scores else 50
    accuracy = round((overall / 9) * 100)

    skill_labels = {"listening": "Listening", "reading": "Reading", "writing": "Writing", "speaking": "Speaking"}
    sorted_skills = sorted(bands, key=lambda s: bands[s], reverse=True)
    best_skill = sorted_skills[0]
    worst_skill = sorted_skills[-1]
    starting_bands = {
        "listening": float(profile.listening_band or 5.5),
        "reading": float(profile.reading_band or 5.5),
        "writing": float(profile.writing_band or 5.5),
        "speaking": float(profile.speaking_band or 5.5),
    }

    strengths: list[str] = []
    strengths.append(f"{skill_labels[best_skill]} at {bands[best_skill]:.1f} was your highest section band this mock.")
    for skill in SKILLS:
        if bands[skill] >= starting_bands[skill]:
            strengths.append(f"{skill_labels[skill]} held at or above your starting {starting_bands[skill]:.1f} profile band.")
    if overall_tm >= 65:
        strengths.append("You completed the full exam inside the official section timings.")
    if overall_speed >= 45:
        strengths.append(f"Pacing was {'fast' if overall_speed >= 75 else 'consistent'} across all four sections.")

    weaknesses: list[str] = []
    weaknesses.append(
        f"{skill_labels[worst_skill]} at {bands[worst_skill]:.1f} is pulling your overall band down to {overall}."
    )
    for skill in SKILLS:
        if bands[skill] < starting_bands[skill]:
            weaknesses.append(f"{skill_labels[skill]} dipped below your starting {starting_bands[skill]:.1f} profile band.")
    for skill in SKILLS:
        detail = timing_metrics.get(skill) or {}
        over = float(detail.get("overBudgetSeconds") or 0)
        if over > 0:
            weaknesses.append(f"{skill_labels[skill]} ran over its official limit.")
    if overall_tm < 65:
        weaknesses.append("Time management needs work — a section ran over budget or ended with items still unanswered.")
    if min(bands.values()) < float(profile.target_band or 7.0):
        weaknesses.append(f"No section reached your {profile.target_band:.1f} target this mock.")

    return {
        "id": str(mock.id),
        "listeningBand": bands["listening"],
        "readingBand": bands["reading"],
        "writingBand": bands["writing"],
        "speakingBand": bands["speaking"],
        "overallBand": overall,
        "accuracy": accuracy,
        "speed": {
            "score": overall_speed,
            "label": "Fast" if overall_speed >= 75 else "Balanced" if overall_speed >= 45 else "Slow",
            "comment": "Overall pace across the four official timings — aim to answer every question and keep 2 spare minutes per section.",
        },
        "timeManagement": {
            "score": overall_tm,
            "label": "Excellent" if overall_tm >= 85 else "On pace" if overall_tm >= 65 else "Needs work",
            "comment": "Compare each section's time taken against its official limit (L 30 / R 60 / W 60 / S 14 minutes).",
        },
        "timing": timing_metrics,
        "sectionFeedback": section_feedback,
        "improvementPlan": improvement_plan,
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:4],
    }
