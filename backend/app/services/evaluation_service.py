"""Evaluation engine.

Grades every submitted answer, produces the EvaluationResult/MockExamResult
the frontend renders, and persists the outcome to the database (answers, band
scores, weaknesses, learning history, achievements). Writing and speaking
answers get a Gemini band estimate when available, otherwise a transparent
heuristic based on length, structure and vocabulary range."""

import difflib
import hashlib
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from . import band_prediction as bp
from . import gemini
from . import knowledge_base as kb

SKILLS = ("reading", "listening", "writing", "speaking")

# Bounded cache for AI speaking spot-corrections (see _speaking_spot_teach).
_SPEAK_TEACH_CACHE: dict[str, tuple[float, dict]] = {}
_SPEAK_TEACH_LOCK = threading.Lock()
_SPEAK_TEACH_TTL = 30 * 60
_SPEAK_TEACH_MAX = 200

# Exact sentence plans for the Speaking question types (mirrors the app's
# Speaking Blueprint). The "corrected" teaching answer must follow these.
_TYPE_LENGTHS: dict[str, str] = {
    # Part 1
    "Personal Information": "25-30 s · 2-3 sentences: the fact, one detail, stop",
    "Preferences": "30 s · 3-4 sentences: choose + why + one contrast",
    "Likes / Dislikes": "30 s · 3 sentences: name + feeling + one small line",
    "Habits / Routines": "30 s · 3-4 sentences: habit + rhythm + why",
    "Past Experiences": "30-40 s · 3-4 sentences: memory + detail + consequence",
    "Reasons / Explanations": "30 s · 3 sentences: honest reason + the proof",
    "Opinions about Familiar Topics": "30 s · 3-4 sentences: position + why + concession",
    # Part 2
    "Person": "full 2 min · 12-15 sentences (3-4 per point); give the 'why' point 4-5",
    "Place": "full 2 min · 12-15 sentences (3-4 per point); senses carry the last point",
    "Object / Thing": "full 2 min · 12-15 sentences; 3-4 per point, more on origin + why",
    "Experience / Event": "full 2 min · 12-15 sentences; the feeling must come back in the 'why'",
    "Activity": "full 2 min · 12-15 sentences: what, when, where, with whom, why",
    "Future Plan": "full 2 min · 12-15 sentences: plan + steps + why it matters",
    # Part 3
    "Opinion": "45-60 s · 4-6 sentences: position + 2 supports + example",
    "Comparison": "45-75 s · 5-7 sentences: past + now + reason + verdict",
    "Reasons / Causes": "45-60 s · 4-6 sentences: visible + deeper + evidence + ripple",
    "Advantages / Disadvantages": "45-60 s · 5-6 sentences: pro + con + verdict",
    "Hypothetical": "45-60 s · 4-6 sentences: conditional + picture + personal",
    "Prediction / Future": "45-60 s · 4-6 sentences: forecast + why + sign + consequence",
    "Effects / Consequences": "45-60 s · 4-6 sentences: immediate + slow + chain + who",
    "Problem / Solution": "45-60 s · 4-6 sentences: root + why + small fix + who",
}

OBJECTIVE_TYPES = ("multiple-choice", "true-false", "yes-no-not-given", "sentence-completion", "short-answer", "matching", "matching-information", "matching-headings", "matching-sentence-endings", "summary-completion", "form-completion", "note-completion", "map-labelling", "flow-chart-completion", "diagram-label-completion", "table-completion")
SUBJECTIVE_TYPES = ("essay", "speaking-cue")


def _as_text(value: object) -> str:
    """Coerce a stored answer value (str, list of letters, or dict) to text."""
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        return " ".join(str(v) for v in value)
    if isinstance(value, dict):
        return str(value.get("value") or value.get("text") or value.get("label") or value)
    return str(value or "")


def _normalize(text: str) -> str:
    text = _as_text(text).strip().lower()
    return re.sub(r"\s+", " ", re.sub(r"[.,;:'\"!?()\[\]]", "", text)).strip()


band_from_count = bp.band_from_count
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

LINKER_PHRASES = {
    "firstly", "first", "secondly", "finally", "moreover", "furthermore",
    "however", "therefore", "consequently", "although", "while", "whereas",
    "despite", "in addition", "for example", "for instance", "on the other hand",
    "in conclusion", "as a result", "because", "but", "also", "thus", "hence",
    "likewise", "similarly", "in contrast", "nevertheless", "nonetheless",
}

SUBORDINATORS = {
    "because", "although", "while", "whereas", "despite", "since", "unless",
    "provided", "when", "if", "which", "who", "whose", "that", "where",
    "after", "before", "as soon as",
}


def _linker_count(text: str) -> int:
    """Distinct cohesive devices actually used (word/phrase boundaries)."""
    lowered = (" " + (text or "").lower().replace("\n", " ") + " ").replace(",", " ").replace(".", " ").replace(";", " ").replace("(", " ").replace(")", " ")
    found: set[str] = set()
    for phrase in LINKER_PHRASES:
        if re.search(r"\b" + re.escape(phrase) + r"\b", lowered):
            found.add(phrase)
    return len(found)


def _complex_sentence_ratio(text: str) -> float:
    sentences = _segment_sentences(text)
    if not sentences:
        return 0.0
    complex_count = 0
    for sentence in sentences:
        lowered = " " + sentence.lower() + " "
        if any(re.search(r"\b" + re.escape(sub) + r"\b", lowered) for sub in SUBORDINATORS):
            complex_count += 1
    return complex_count / len(sentences)


def _avg_word_length(text: str) -> float:
    words = (text or "").split()
    if not words:
        return 0.0
    return round(sum(len(word.strip(".,!?;:()\"'")) for word in words) / len(words), 1)


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
    """Score a spoken response on the four official IELTS speaking criteria.

    Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, and
    Pronunciation. The pronunciation band is a rhythm proxy derived from the
    written transcript (it cannot be exact without hearing the recording) and
    its comment always says so.
    """
    analysis = analyze_text(text)
    words = analysis["wordCount"]
    sentences = analysis["sentenceCount"]
    avg = analysis["averageSentenceWords"]
    unique = analysis["uniqueWordRatio"]
    long_sentences = analysis["longSentenceCount"]
    linkers = _linker_count(text)
    complex_ratio = _complex_sentence_ratio(text)

    if words and words >= 40:
        fc_band = round_band(min(8.5, 5.5 + 0.5 * (words >= 60) + 0.5 * (linkers >= 2) + 0.5 * (long_sentences >= 1)))
    else:
        fc_band = round_band(5.0 + 0.5 * (words >= 15))
    fc_band = min(fc_band, 5.0) if words < 25 else fc_band
    fc_comment = (
        "Short answer — extend each idea with a reason and an example so the answer keeps flowing."
        if words < 25
        else "Answers flow with linked ideas and some longer sentences; keep a steady, natural pace."
    )

    lr_band = round_band(min(8.5, 5.5 + 0.5 * (unique >= 55) + 0.5 * (unique >= 62) + 0.5 * (_avg_word_length(text) >= 4.5)))
    lr_band = min(lr_band, 5.0) if words < 25 else lr_band
    lr_comment = (
        "Replace generic words with precise, topic-specific vocabulary."
        if unique < 55
        else "Good lexical range; use idiomatic or less common expressions naturally."
    )

    if not sentences:
        gra_band = 3.5
    else:
        gra_band = round_band(min(8.5, max(3.5, 5.5 + 0.5 * (complex_ratio >= 0.35) + 0.5 * (avg >= 8) + 0.5 * (words >= 45))))
    gra_band = min(gra_band, 5.0) if words < 25 else gra_band
    gra_comment = (
        "Check verb tenses, articles and subject-verb agreement while you speak."
        if gra_band <= 6.0
        else "Good range of structures; add conditionals and relative clauses for a half-band gain."
    )

    pro_band = round_band(max(4.0, min(8.0, 0.6 * gra_band + 0.4 * fc_band)))
    pro_comment = (
        "Pronunciation is estimated from the written transcript — record and listen back, stressing content words, for an exact band."
        if pro_band <= 6.0
        else "Clear rhythm and sentence stress in the transcript; Pronunciation bands are confirmed by listening, not by text."
    )

    return [
        {"criterion": "Fluency & Coherence", "band": fc_band, "comment": fc_comment},
        {"criterion": "Lexical Resource", "band": lr_band, "comment": lr_comment},
        {"criterion": "Grammatical Range & Accuracy", "band": gra_band, "comment": gra_comment},
        {"criterion": "Pronunciation", "band": pro_band, "comment": pro_comment},
    ]


def _speaking_band_from_criteria(text: str) -> float:
    """Official speaking band: the mean of the four criteria, rounded to 0.5."""
    bands = [criterion["band"] for criterion in _speaking_criteria(text)]
    return round_band(sum(bands) / len(bands))


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


def _match_tolerant(user: str, correct: str) -> bool:
    """Exact IELTS-style answer match with only harmless tolerance.

    No substring containment ("plan" must never count as "planning").
    Tolerance is limited to leading articles and trailing plurals, which
    examiners routinely accept.
    """
    if not user or not correct:
        return False
    if user == correct:
        return True
    u, c = user, correct
    for prefix in ("the ", "a ", "an "):
        if u.startswith(prefix) and not c.startswith(prefix):
            u = u[len(prefix):]
        elif c.startswith(prefix) and not u.startswith(prefix):
            c = c[len(prefix):]
    if u == c:
        return True
    if len(u) > 3 and u.endswith("s") and not c.endswith("s") and u[:-1] == c:
        return True
    if len(c) > 3 and c.endswith("s") and not u.endswith("s") and c[:-1] == u:
        return True
    return False


def grade_objective(user_answer: str, correct_answer: str, options: list[str] | None = None) -> tuple[bool, str, float]:
    user = _normalize(user_answer)
    correct = _normalize(correct_answer)
    if not user:
        return False, correct_answer, 0.0
    if options:
        for index, option in enumerate(options):
            if _normalize(option) == user:
                return _normalize(option) == correct, correct_answer, 1.0 if _normalize(option) == correct else 0.0
        if _match_tolerant(user, correct):
            return True, correct_answer, 1.0
        return False, correct_answer, 0.0
    return _match_tolerant(user, correct), correct_answer, 1.0 if _match_tolerant(user, correct) else 0.0


def _is_task1_writing(item: dict) -> bool:
    exam = str(item.get("examSection") or "").lower()
    title = str(item.get("title") or "").lower()
    type_label = str(item.get("questionType") or "").lower()
    return "task 1" in exam or "task 1" in title or "task1" in type_label


def _writing_criteria(text: str, item: dict) -> list[dict]:
    """Score the response on the four official IELTS writing criteria.

    Task Achievement is judged against THIS task's minimum length (150 for
    Task 1, 250 for Task 2): under the word count caps TA at Band 5, exactly
    as the official marking scheme does.
    """
    analysis = analyze_text(text)
    words = analysis["wordCount"]
    sentences = analysis["sentenceCount"]
    paragraphs = analysis["paragraphCount"]
    avg = analysis["averageSentenceWords"]
    unique = analysis["uniqueWordRatio"]
    linkers = _linker_count(text)
    complex_ratio = _complex_sentence_ratio(text)
    is_task1 = _is_task1_writing(item)
    required = 150 if is_task1 else 250

    if not words:
        task_band = 3.0
    else:
        ratio = words / required
        if ratio >= 1.15:
            task_band = 7.0
        elif ratio >= 1.0:
            task_band = 6.0
        elif ratio >= 0.85:
            task_band = 5.5
        elif ratio >= 0.7:
            task_band = 5.0
        elif ratio >= 0.4:
            task_band = 4.0
        else:
            task_band = 3.5
        if ratio >= 1.0:
            if paragraphs >= (3 if not is_task1 else 2):
                task_band += 0.5
            if ratio >= 1.3 and words >= required + 60:
                task_band = 7.5
        else:
            task_band = min(task_band, 5.0)
    task_band = round_band(max(3.0, min(8.5, task_band)))
    task_comment = (
        "No response submitted — write at least the minimum length for this task."
        if not words
        else "Below the minimum length — official marking caps Task Achievement at Band 5 for under-length answers."
        if words < required
        else "Meets the length expectation; address every part of the question explicitly for top marks."
        if ratio < 1.15
        else "Full, comfortably over-length response; keep every paragraph tied to the task."
    )

    if sentences:
        paragraphs_ok = paragraphs >= 3 if not is_task1 else paragraphs >= 2
        coh_band = round_band(min(8.5, 4.5 + 0.5 * (paragraphs_ok) + 0.5 * (8 <= avg <= 20) + 0.5 * (linkers >= 4)))
    else:
        coh_band = 3.5
    coh_comment = (
        "No paragraphing detected — organise the answer into introduction / body / conclusion."
        if paragraphs < (3 if not is_task1 else 2)
        else "Clear paragraph structure; use topic sentences and a variety of linking devices for stronger cohesion."
        if linkers < 4
        else "Well-organised with a clear range of cohesive devices; the progression of ideas reads naturally."
    )

    lex_band = round_band(min(8.5, 5.5 + 0.5 * (unique >= 55) + 0.5 * (unique >= 65) + 0.5 * (_avg_word_length(text) >= 4.8)))
    if words < 60:
        lex_band = min(lex_band, 5.0)
    lex_comment = (
        "Vocabulary range looks limited — replace generic words with precise, less common alternatives."
        if unique < 55
        else "Good range of vocabulary; refine collocations and add topic-specific terms for a half-band gain."
    )

    if not sentences:
        gram_band = 3.5
    else:
        gram_band = round_band(min(8.5, max(3.5, 5.5 + 0.5 * (complex_ratio >= 0.4) + 0.5 * (avg >= 12) + 0.5 * (sentences >= 6))))
    if words < 60:
        gram_band = min(gram_band, 5.0)
    gram_comment = (
        "Accuracy is the priority here — check verb tenses, articles and subject-verb agreement."
        if gram_band <= 6.0
        else "Grammatical control is solid; mix complex and simple sentences to reach Band 8."
    )

    return [
        {"criterion": "Task Achievement", "band": task_band, "comment": task_comment},
        {"criterion": "Coherence and Cohesion", "band": coh_band, "comment": coh_comment},
        {"criterion": "Lexical Resource", "band": lex_band, "comment": lex_comment},
        {"criterion": "Grammatical Range and Accuracy", "band": gram_band, "comment": gram_comment},
    ]


def _writing_band_from_criteria(text: str, item: dict) -> float:
    """Official writing band: the mean of the four criteria, rounded to 0.5.

    Under-length responses are handled at criterion level exactly like the
    official scheme: Task Achievement is capped at Band 5 below the task's
    minimum word count, and responses too short to demonstrate range cannot
    score above 5 on Lexical Resource or Grammatical Range.
    """
    criteria = _writing_criteria(text, item)
    return round_band(sum(c["band"] for c in criteria) / len(criteria))


def _subjective_feedback(item: dict, answer: str) -> dict:
    if item.get("type") == "speaking-cue":
        clean_answer = _strip_fillers(answer)
        text_analysis = analyze_text(clean_answer)
        filler_advice = _filler_report(answer)
        band = _speaking_band_from_criteria(clean_answer)
        accuracy = round((band / 9) * 100)
        criteria = _speaking_criteria(clean_answer)
        text_analysis["insights"] = (text_analysis.get("insights") or []) + [filler_advice]
        speaking_teach = _speaking_spot_teach(item, clean_answer) if clean_answer.strip() else None
        spot_correction = (speaking_teach or {}).get("corrected", "") or ""
        logic_default = "Answer in the Part 1 shape (answer + reason + example), the Part 2 story (4 points), or the Part 3 mini-essay (claim, reason, example)."
        tip_default = "Use linking phrases and keep a steady rhythm; record and listen back once."
        suggestions_default = "Practise the same question again aloud, adding one more reason or example each time."
        band_advice_default = "One band rise follows one focused fix: keep answering, keep linking, keep your rhythm."
    else:
        text_analysis = analyze_text(answer)
        filler_advice = ""
        band = _writing_band_from_criteria(answer, item)
        accuracy = round((band / 9) * 100)
        criteria = _writing_criteria(answer, item)
        speaking_teach = None
        spot_correction = ""
        logic_default = "State a clear position, support every claim, and check grammar, range and task response."
        tip_default = "Review the section blueprint for structure and scoring criteria."
        suggestions_default = "Rewrite once with the model answer in view, then compare paragraph by paragraph."
        band_advice_default = "Each band rise follows one focused fix: structure, then range, then accuracy."
    model = item.get("correctAnswer") or item.get("explanation") or "A model answer would state a clear position, support it with reasons and examples, and use accurate grammar and vocabulary."
    sample_high_band = spot_correction or model if item.get("type") == "speaking-cue" else model
    return {
        "band": band,
        "accuracy": accuracy,
        "modelAnswer": model,
        "sampleHighBandAnswer": sample_high_band,
        "spotCorrection": spot_correction,
        "speakingTeach": speaking_teach,
        "criteria": criteria,
        "explanation": item.get("explanation", "Compare your response with the model answer and focus on structure, range, and accuracy."),
        "logic": item.get("logic", logic_default),
        "tip": item.get("tip", tip_default),
        "suggestions": item.get("suggestions", suggestions_default),
        "bandAdvice": item.get("bandAdvice", band_advice_default),
        "textAnalysis": text_analysis,
        "fillerAdvice": filler_advice,
    }


def _segment_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [part.strip() for part in parts if part.strip()]


def _segments_from_diff(student_text: str, corrected_text: str) -> tuple[list[dict], list[dict]]:
    """Deterministic fallback passages: split both answers into sentences and
    tag with similarity (good keep / improve changed)."""
    student_sentences = _segment_sentences(student_text)
    corrected_sentences = _segment_sentences(corrected_text)
    original: list[dict] = []
    passage: list[dict] = []
    if not student_sentences or not corrected_sentences:
        return original, passage
    for sentence in student_sentences:
        best, best_ratio = "", 0.0
        for candidate in corrected_sentences:
            ratio = difflib.SequenceMatcher(None, sentence.lower(), candidate.lower()).ratio()
            if ratio > best_ratio:
                best, best_ratio = candidate, ratio
        good = best_ratio >= 0.72
        original.append(
            {
                "text": sentence,
                "tag": "good" if good else "improve",
                "tip": "" if good else f"Say it as: {best}",
            }
        )
    for candidate in corrected_sentences:
        best_student, best_ratio = "", 0.0
        for sentence in student_sentences:
            ratio = difflib.SequenceMatcher(None, sentence.lower(), candidate.lower()).ratio()
            if ratio > best_ratio:
                best_student, best_ratio = sentence, ratio
        good = best_ratio >= 0.72
        passage.append(
            {
                "text": candidate,
                "tag": "good" if good else "improve",
                "tip": "" if good else f"Fix in \"{best_student}\"",
            }
        )
    return original, passage


def _speaking_spot_teach(item: dict, clean_answer: str) -> dict:
    """AI spot correction for speaking answers, cached per (item, answer):
    re-checking the same spoken answer returns instantly and identical
    answers across users of the same item never burn AI quota. The cache is
    bounded and short-lived so genuine re-edits still get fresh feedback."""
    if not clean_answer.strip():
        return _speaking_teach_empty()
    key = hashlib.sha256(f"{item.get('id')}|{item.get('prompt') or item.get('question')}|{clean_answer.strip().lower()}".encode("utf-8")).hexdigest()
    with _SPEAK_TEACH_LOCK:
        entry = _SPEAK_TEACH_CACHE.get(key)
        if entry is not None and time.monotonic() - entry[0] <= _SPEAK_TEACH_TTL:
            return entry[1]
    result = _speaking_spot_teach_ai(item, clean_answer)
    with _SPEAK_TEACH_LOCK:
        _SPEAK_TEACH_CACHE[key] = (time.monotonic(), result)
        if len(_SPEAK_TEACH_CACHE) > _SPEAK_TEACH_MAX:
            oldest = min(_SPEAK_TEACH_CACHE, key=lambda k: _SPEAK_TEACH_CACHE[k][0])
            _SPEAK_TEACH_CACHE.pop(oldest, None)
    return result


def _speaking_spot_teach_ai(item: dict, clean_answer: str) -> dict:
    """Teach a speaking answer 'on the spot' like an official IELTS tutor:
    a corrected/refined Band-7 version of the student's OWN answer — shown even
    when the answer was already good — plus line-by-line pointers (exact
    sentence + problem + fix), grammar and vocabulary fixes, filler notes, and
    a short quick-change list. One AI call, strict JSON."""
    empty = {
        "corrected": "",
        "lengthRule": "",
        "passage": [],
        "originalPassage": [],
        "lines": [],
        "grammar": [],
        "vocabulary": [],
        "fillers": [],
        "changes": [],
    }
    if not clean_answer.strip() or not gemini.is_gemini_available():
        return empty
    prompt_text = str(item.get("prompt") or item.get("question") or "")
    part_label = str(item.get("typeLabel") or "").strip()
    type_name = str(item.get("typeName") or "").strip()
    length_rule = _TYPE_LENGTHS.get(type_name, "")
    if length_rule:
        length_guide_sentence = (
            "- The corrected answer MUST follow this question type's exact length and sentence plan: "
            f"\"{length_rule}\". Write exactly the sentence count the plan names; every sentence does "
            "its planned role in order (e.g. the fact, one detail, then stop) and the whole answer "
            "fits the seconds stated. Do not add extra sentences.\n"
        )
    else:
        length_guide_sentence = ""
    part_guide = {
        "Part 1": "2-4 short spoken sentences: direct answer + reason + one small detail",
        "Part 2": "cover the cue-card points as a story and keep talking for about 2 minutes",
        "Part 3": "position + reason + evidence + a nuance (around four to six sentences)",
    }.get(part_label, "the natural length for that part of the IELTS Speaking test")
    numbered = "\n".join(
        f"[{i}] {line.strip()}" for i, line in enumerate(clean_answer.splitlines(), 1) if line.strip()
    ) or clean_answer[:1200]
    teach_prompt = (
        "You are an official IELTS Speaking tutor correcting a student live exactly the way "
        "official IELTS guides and examiner advice teach: answer the question directly, keep the "
        "student's own ideas, stay natural, never sound like written or AI text.\n\n"
        f"Question (IELTS Speaking {part_label}):\n{prompt_text[:500]}\n\n"
        f"Student's running answer (numbered lines):\n{numbered[:1400]}\n\n"
        "Return ONLY JSON with exactly these keys:\n"
        '- "corrected": the corrected natural Band-7 version of the WHOLE answer following: '
        f'{part_guide}. Spoken English with contractions, no headings, no quotes. '
        "If the student's answer is already good then keep it whole, pay only tiny polish (flow, "
        "one better word, one stronger ending) — the corrected answer is ALWAYS given.\n"
        '- "lines": one entry PER weak line ONLY — when the answer is already good this list is empty: '
        '{"n": line number, "quote": "the exact words from that line", '
        '"problem": "what is wrong (grammar / vocabulary / tense / not answering / too short) ", '
        '"fix": "exactly how to say that line correctly"}.\n'
        '- "grammar": [{"sentence": "exact original fragment", "issue": "the rule broken", '
        '"say": "correct version"}] — empty when nothing to fix.\n'
        '- "vocabulary": [{"word": "original word", "better": "more official natural word or phrase", '
        '"why": "one line"}] — only when the word is weak, never to decorate.\n'
        '- "fillers": [{"word": "um/you know/er", "line": line number}] for every filler you spot.\n'
        '- "changes": short list of the 3-4 exact changes to make in THIS answer (what + where); '
        'for a good answer give the small refinements only, never fake problems.\n'
        '- "passage": the corrected/refined answer split into segments in reading order, covering the '
        'final answer from start to finish with NO gaps: {"text": "segment text", '
        '"tag": "good" when the student already wrote it exactly right, "improve" when you changed or '
        'fixed it, "tip": for improve segments a short logic tip — why and how to improve (for good '
        'segments keep "tip" short or empty)}.\n'
        '- "originalPassage": the STUDENT\'s OWN answer verbatim, split into segments in the same '
        'reading order, keeping their exact words (never rewrite them here — only split): '
        '{"text": "the student\'s exact words", "tag": "good" when the student wrote that part '
        'correctly, "improve" when that part has a mistake, "tip": for improve entries the short '
        'logic tip — what the mistake is and how to correct it}.',
        "Use ONLY official IELTS guide style. No generic advice, no extra sections, no markdown.\n"
        "The \"passage\" and \"originalPassage\" arrays are MANDATORY: always split the passage into "
        "segments (at least at every sentence boundary) even for a short answer, and \"originalPassage\" "
        "must always mirror the student's answer verbatim with its split plus tags.\n"
        f"{length_guide_sentence}"
    )
    data = None
    for _attempt in range(2):
        try:
            data = gemini.generate_json(
                teach_prompt,
                system_instruction="You are an official IELTS examiner teaching on the spot. Output valid JSON only.",
                use_cache=False,
                temperature=0.4,
            )
        except Exception:
            data = None
        if isinstance(data, dict) and (data.get("passage") or data.get("originalPassage")):
            break
    if not isinstance(data, dict):
        data = {}
    corrected = str(data.get("corrected") or "").strip()
    if not corrected:
        try:
            fallback = gemini.generate_text(
                "You are an official IELTS Speaking tutor. Rewrite this student's answer into the "
                "correct natural way to say it for Band 7 — keep their own ideas, fix every error, "
                "spoken English with contractions. " + part_guide + "\n\n"
                f"Question (IELTS Speaking {part_label}):\n{prompt_text[:500]}\n\n"
                f"Student's answer:\n{clean_answer[:1200]}\n\n"
                "OUTPUT ONLY the corrected answer.",
                use_cache=False,
                temperature=0.4,
            )
        except Exception:
            fallback = ""
        corrected = (fallback or "").strip()
    if not data.get("passage") or not data.get("originalPassage"):
        diff_original, diff_passage = _segments_from_diff(clean_answer, corrected)
        if not data.get("originalPassage") and diff_original:
            data["originalPassage"] = diff_original
        if not data.get("passage") and diff_passage:
            data["passage"] = diff_passage
    return {
        "corrected": corrected[:1500],
        "lengthRule": length_rule,
        "passage": [
            p
            for p in (data.get("passage") or [])
            if isinstance(p, dict) and str(p.get("text") or "").strip() and str(p.get("tag") or "") in ("good", "improve")
        ][:40],
        "originalPassage": [
            p
            for p in (data.get("originalPassage") or [])
            if isinstance(p, dict) and str(p.get("text") or "").strip() and str(p.get("tag") or "") in ("good", "improve")
        ][:40],
        "lines": [l for l in (data.get("lines") or []) if isinstance(l, dict)][:10],
        "grammar": [g for g in (data.get("grammar") or []) if isinstance(g, dict)][:10],
        "vocabulary": [v for v in (data.get("vocabulary") or []) if isinstance(v, dict)][:8],
        "fillers": [f for f in (data.get("fillers") or []) if isinstance(f, dict)][:8],
        "changes": [str(c).strip() for c in (data.get("changes") or [])][:5],
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
                "spotCorrection": feedback.get("spotCorrection", ""),
                "speakingTeach": feedback.get("speakingTeach") or None,
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


def _gemini_judge(
    skill: str,
    text: str,
    prompt: str,
    temperature: float,
    judge_label: str,
) -> dict | None:
    """One independent examiner pass. Each judge gets a slightly different
    instruction flavour + temperature so the ensemble sees real variance."""
    if not gemini.is_gemini_available():
        return None
    focus = {
        "writing": "assess Task Achievement, Coherence & Cohesion, Lexical Resource and Grammatical Range and Accuracy",
        "speaking": "assess Fluency & Coherence, Lexical Resource, Grammatical Range and Accuracy and Pronunciation",
    }.get(skill, "assess accuracy, skill and IELTS readiness")
    prompt_block = f"""You are an independent IELTS examiner ({judge_label}) on a verification panel.

Evaluate this {skill} answer for the question below. {focus.capitalize()}.

Question: {prompt[:500]}

Candidate answer:
{text[:3000]}

Return ONLY JSON, no prose, with keys:
{{"band": number, "summary": "2-3 sentence examiner summary", "strengths": ["..."], "weaknesses": ["..."], "nextPlan": ["..."], "bandDescriptorNotes": ["..."]}}
Band must be a half-band number between 3.5 and 9.0."""
    try:
        data = gemini.generate_json(
            prompt_block,
            system_instruction="You are a strict but fair IELTS examiner on a verification panel. Output valid JSON only.",
            temperature=temperature,
        )
        if not isinstance(data, dict) or not data.get("band"):
            return None
        data["band"] = float(data["band"])
        for key in ("strengths", "weaknesses", "nextPlan", "bandDescriptorNotes"):
            if not isinstance(data.get(key), list):
                data[key] = [str(data.get(key, ""))]
        data["judge"] = judge_label
        return data
    except Exception:
        return None


def _ensemble_subjective(skill: str, text: str, prompt: str) -> dict | None:
    """Run N independent examiner judges and return a consensus verdict.

    Mirrors how real assessment platforms de-risk a single AI verdict:
    multiple judges -> median band -> agreement/confidence score -> report.
    Judges run in parallel so a 3-judge panel takes ~1 call's latency.
    """
    judge_specs = [
        (0.35, "Judge A"),
        (0.7, "Judge B"),
        (1.0, "Judge C"),
    ]
    count = max(1, min(settings.AI_JUDGES or 3, 3))
    specs = judge_specs[:count]
    with ThreadPoolExecutor(max_workers=len(specs)) as pool:
        judges = list(pool.map(lambda spec: _gemini_judge(skill, text, prompt, spec[0], spec[1]), specs))
    valid = [judge for judge in judges if judge]
    if not valid:
        return None
    bands = sorted(judge["band"] for judge in valid)
    median = round_band(bands[len(bands) // 2] if len(bands) % 2 == 1 else (bands[len(bands) // 2 - 1] + bands[len(bands) // 2]) / 2)
    spread = bands[-1] - bands[0]
    agreement = round(max(0.0, min(100.0, 100 - (spread / 2.5) * 100)))
    consensus = {
        "band": median,
        "summary": _blend_summaries(valid, median),
        "strengths": _merge_insights(valid, "strengths"),
        "weaknesses": _merge_insights(valid, "weaknesses"),
        "nextPlan": _merge_insights(valid, "nextPlan"),
        "bandDescriptorNotes": _merge_insights(valid, "bandDescriptorNotes"),
        "judges": [{"judge": judge["judge"], "band": judge["band"]} for judge in valid],
        "judgeCount": len(valid),
        "agreement": agreement,
        "confidence": round(agreement * (len(valid) / 3)),
    }
    return consensus


def _blend_summaries(judges: list[dict], band: float) -> str:
    summaries = [str(judge.get("summary") or "").strip() for judge in judges if str(judge.get("summary") or "").strip()]
    if not summaries:
        return f"Panel consensus: Band {band:.1f}."
    combined = " ".join(summaries)
    return combined[:420] + ("…" if len(combined) > 420 else "")


def _merge_insights(judges: list[dict], key: str) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for judge in judges:
        for item in judge.get(key) or []:
            text = str(item or "").strip()
            if text and text.lower() not in seen:
                seen.add(text.lower())
                merged.append(text)
        if len(merged) >= 6:
            break
    return merged[:6]


def _gemini_objective_estimate(
    module: str,
    accuracy: int,
    objective_accuracy: int,
    wrong_by_type: dict[str, int],
    skill_results: list[dict],
) -> dict | None:
    """AI examiner pass for objective skills (reading/listening) that blends
    the measured accuracy with a human-style band estimate and feedback."""
    if not gemini.is_gemini_available():
        return None
    wrong_types = ", ".join(f"{t} ({c})" for t, c in sorted(wrong_by_type.items(), key=lambda kv: -kv[1])) or "none"
    prompt_block = f"""You are an IELTS examiner. Evaluate a completed IELTS {module} practice session scored objectively.

Session performance:
- Overall accuracy: {accuracy}%
- Objective question accuracy: {objective_accuracy}%
- Question types with errors: {wrong_by_type or 'none'}
- Questions attempted: {len(skill_results)}

The objective score is authoritative. Your job is to confirm or refine the band and
explain WHY the student performed this way so they can improve.

Return ONLY JSON, no prose, with keys:
{{"band": number, "summary": "2-3 sentence examiner summary", "strengths": ["..."], "weaknesses": ["..."], "nextPlan": ["..."], "bandDescriptorNotes": ["..."]}}
Band must be a half-band number between 3.5 and 9.0, and should stay close to the objective accuracy (e.g. 65% object accuracy ≈ Band 6.0)."""
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
    answered_ids = {
        item_id
        for item_id, raw in (answers or {}).items()
        if str(raw or "").strip()
    }
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

    if not scored or not answered_ids:
        # Nothing was actually answered (e.g. accidental submit). Do NOT grade
        # every item as wrong, write a BandScore or drag the profile down.
        return {
            "sessionId": str(session_data.get("id") or "practice"),
            "module": module,
            "predictedBand": None,
            "accuracy": 0,
            "aiEvaluated": False,
            "evaluatedBy": "offline",
            "examinerSummary": "You didn't answer any questions, so there's nothing to evaluate yet. Submit the section once you've attempted it.",
            "strengths": [],
            "weaknesses": [],
            "nextPlan": [],
            "itemFeedback": skill_results,
            "perItemFeedback": skill_results,
            "persisted": False,
        }

    accuracy = round((total_score / scored) * 100) if scored else 0
    objective_only = [r for r in skill_results if r["type"] in OBJECTIVE_TYPES]
    objective_correct = sum(1 for r in objective_only if r["isCorrect"])
    objective_accuracy = round((objective_correct / len(objective_only)) * 100) if objective_only else accuracy

    # Objective skills use the official IELTS raw-score curve (scaled to the
    # 40-mark paper), never a blunt percentage table.
    if module in ("reading", "listening"):
        predicted_band = band_from_count(module, objective_correct, len(objective_only))
    elif module == "writing":
        predicted_band = _writing_weighted_band(items, skill_results)
    else:
        predicted_band = _estimated_subjective_band(skill_results)
    predicted_band = round_band(predicted_band)

    text_answers = [a for a in answers.values() if (a or "").strip() and len(a.split()) > 20]
    gemini_data = None
    judges: list[dict] = []
    agreement: int | None = None
    confidence: int | None = None
    if module in ("writing", "speaking") and text_answers:
        joined = "\n\n".join(text_answers)[:3000]
        if module == "speaking":
            joined = _strip_fillers(joined)
        gemini_data = _ensemble_subjective(module, joined, " ".join(str(i.get("prompt", "")) for i in items)[:500])
        if gemini_data:
            predicted_band = round_band(gemini_data.get("band", predicted_band))
            accuracy = round((predicted_band / 9) * 100)
            judges = gemini_data.get("judges") or []
            agreement = gemini_data.get("agreement")
            confidence = gemini_data.get("confidence")
    elif module in ("reading", "listening") and scored:
        # Hybrid evaluation: the objective accuracy is authoritative, and the
        # AI examiner panel confirms the band and explains the result.
        gemini_data = _gemini_objective_estimate(module, accuracy, objective_accuracy, wrong_by_type, skill_results)
        if gemini_data:
            ai_band = round_band(float(gemini_data.get("band", predicted_band)))
            blend = round_band(0.5 * predicted_band + 0.5 * ai_band)
            predicted_band = blend
            accuracy = round((predicted_band / 9) * 100)
            agreement = 100 - round(abs(predicted_band - ai_band) * 40)
            confidence = round(max(50, min(100, agreement)))

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
        "judges": judges,
        "judgeAgreement": agreement,
        "confidence": confidence if confidence is not None else (90 if not gemini_data else None),
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

    total_seconds = (timing or {}).get("totalSeconds") if timing else None
    mode = str(session_data.get("mode") or "Quick Practice")
    default_minutes = kb.mode_duration(module, mode)
    try:
        claimed = int(session_data.get("durationMinutes") or 0) or default_minutes
        # The client never decides how long a session "counts": clamp its
        # claim to the official mode duration (and never below 5 minutes) so
        # completed-hours and speed metrics can't be inflated.
        duration_minutes = max(5, min(claimed, max(default_minutes * 2, 30)))
        total_seconds_i = int(total_seconds) if total_seconds is not None else None
    except (TypeError, ValueError):
        duration_minutes = default_minutes
        total_seconds_i = None
    metrics = compute_timing_metrics(
        module,
        items,
        answers,
        duration_minutes,
        total_seconds_i,
    )
    result.update({"timing": metrics["timing"], "speed": metrics["speed"], "timeManagement": metrics["timeManagement"]})

    _persist_session(db, user, profile, module, session_data, answers, skill_results, predicted_band, accuracy, wrong_by_type)
    return result


def _estimated_subjective_band(skill_results: list[dict]) -> float:
    bands = [r["feedback"].get("estimatedBand") for r in skill_results if r.get("feedback", {}).get("estimatedBand")]
    if not bands:
        return 5.0
    return round_band(sum(bands) / len(bands))


def _writing_weighted_band(items: list[dict], skill_results: list[dict]) -> float:
    """Official Writing band for a two-task response.

    IELTS weights Task 2 at two-thirds of the Writing score, so a full mock
    scores (Task 1 + 2 x Task 2) / 3. Task identity comes from the paper's
    examSection/title; any unresolvable item counts as Task 2 (the default
    assumption of the national standard exam design).
    """
    bands: dict[str, list[float]] = {"task1": [], "task2": []}
    for item, graded in zip(items, skill_results):
        band = (graded.get("feedback") or {}).get("estimatedBand")
        if not band:
            continue
        key = "task1" if _is_task1_writing(item) else "task2"
        bands[key].append(float(band))
    task1 = _average_bands(bands["task1"])
    task2 = _average_bands(bands["task2"])
    if task1 is None and task2 is None:
        return 5.0
    if task1 is None:
        return round_band(task2)
    if task2 is None:
        return round_band(task1)
    return round_band((task1 + 2 * task2) / 3)


def _average_bands(values: list[float]) -> float | None:
    if not values:
        return None
    return round_band(sum(values) / len(values))


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
    try:
        claimed = int(session_data.get("durationMinutes") or 5) or 5
    except (TypeError, ValueError):
        claimed = 5
    profile.completed_hours = float(profile.completed_hours or 0) + min(max(claimed, 5), 120) / 60
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
