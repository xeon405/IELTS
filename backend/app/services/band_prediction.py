"""Band Prediction Engine.

Pure functions that estimate, round and project IELTS bands from accuracy,
text responses, history and skill bands. The single source of truth for band
math used by the Evaluation, Adaptive and Recommendation engines."""

from __future__ import annotations

from typing import Any

# Accuracy (%) -> band. Objective skills (reading/listening).
ACCURACY_BANDS: list[tuple[float, float]] = [
    (95, 9.0),
    (90, 8.5),
    (85, 8.0),
    (80, 7.5),
    (75, 7.0),
    (70, 6.5),
    (60, 6.0),
    (50, 5.5),
    (40, 5.0),
    (30, 4.5),
    (20, 4.0),
    (0, 3.5),
]

# Official-style marks-per-section conversion (out of 40).
COUNT_BANDS: dict[str, list[tuple[int, float]]] = {
    "reading": [
        (39, 9.0), (37, 8.5), (33, 8.0), (30, 7.5), (27, 7.0),
        (23, 6.5), (19, 6.0), (15, 5.5), (13, 5.0), (10, 4.5),
        (8, 4.0), (6, 3.5), (4, 3.0), (0, 2.5),
    ],
    "listening": [
        (39, 9.0), (37, 8.5), (35, 8.0), (32, 7.5), (30, 7.0),
        (26, 6.5), (23, 6.0), (18, 5.5), (16, 5.0), (13, 4.5),
        (11, 4.0), (10, 3.5), (9, 3.0), (0, 2.5),
    ],
}

LINKERS = ("because", "however", "therefore", "for example", "actually", "on the other hand", "in conclusion", "although", "despite", "whereas")
CONDITIONALS = ("if", "would", "could", "should", "might", "may")

MIN_BAND = 2.5
MAX_BAND = 9.0


def round_to_half(value: float) -> float:
    """Round to the nearest 0.5 within the official 1.0-9.0 scale.

    IELTS rounds averages ending in .25 up to the next half band and .75 up to
    the next whole band, so a plain `round()` (banker's rounding) is wrong."""
    import math

    return math.floor(max(0.0, min(MAX_BAND, value)) * 2 + 0.5) / 2


def clamp_band(value: float) -> float:
    return max(MIN_BAND, min(MAX_BAND, round_to_half(value)))


def overall_band(bands: dict[str, float]) -> float:
    if not bands:
        return 0.0
    return round_to_half(sum(bands.values()) / len(bands))


def band_from_accuracy(accuracy: float) -> float:
    for threshold, band in ACCURACY_BANDS:
        if accuracy >= threshold:
            return band
    return 3.5


def band_from_count(skill: str, correct: int, total: int | None = None) -> float:
    table = COUNT_BANDS.get(skill, COUNT_BANDS["reading"])
    if total is not None and total > 0:
        return band_from_accuracy((correct / total) * 100)
    for threshold, band in table:
        if correct >= threshold:
            return band
    return table[-1][1]


def _word_stats(text: str) -> dict:
    words = (text or "").strip().split()
    sentences = [s.strip() for s in __import__("re").split(r"[.!?]+", (text or "").strip()) if s.strip()]
    unique = {w.lower() for w in words}
    return {
        "words": len(words),
        "sentences": len(sentences),
        "avg_sentence": round(len(words) / len(sentences) * 10) / 10 if sentences else 0,
        "unique_ratio": round(len(unique) / len(words) * 100) if words else 0,
        "paragraphs": len([p for p in (text or "").split("\n\n") if p.strip()]),
        "linkers": sum(1 for w in (text or "").lower().split() if w in LINKERS),
        "conditionals": sum(1 for w in (text or "").lower().split() if w in CONDITIONALS),
    }


def band_from_text(text: str, skill: str) -> float:
    """Heuristic band for subjective answers (writing/speaking)."""
    stats = _word_stats(text)
    words = stats["words"]
    if words == 0:
        return 0.0
    if skill == "writing":
        band = 5.0
        if words >= 250:
            band += 1.0
        elif words >= 150:
            band += 0.5
        elif words < 60:
            band = 3.5
        if stats["avg_sentence"] >= 14:
            band += 0.5
        if stats["paragraphs"] >= 3:
            band += 0.5
        if stats["unique_ratio"] >= 55:
            band += 0.5
        elif stats["unique_ratio"] < 45:
            band -= 0.5
        return clamp_band(band)
    band = 5.0
    if words >= 60:
        band += 1.0
    elif words >= 30:
        band += 0.5
    else:
        band -= 0.5
    if stats["linkers"] >= 2:
        band += 0.5
    if stats["conditionals"] >= 1:
        band += 0.5
    return clamp_band(band)


def accuracy_from_band(band: float) -> float:
    return round(min(100.0, max(0.0, (clamp_band(band) / 9) * 100)))


def project_band(state: dict[str, Any]) -> float:
    """Projected overall band from recent per-skill band history (weighted)."""
    bands = dict(state.get("bands") or {})
    recent = state.get("bandScores") or []
    current = {s: bands.get(s, 5.5) for s in ("reading", "listening", "writing", "speaking")}
    if recent:
        for row in recent:
            skill = row.get("skill")
            if skill in current:
                current[skill] = float(row.get("band") or current[skill])
    return overall_band(current)


def band_trend(state: dict[str, Any]) -> str:
    """Human-readable trend from practice history."""
    history = [h for h in state.get("practiceHistory") or [] if h.get("band")]
    if len(history) < 2:
        return "no trend yet"
    first = float(history[-1]["band"])
    last = float(history[0]["band"])
    delta = round((last - first) * 2) / 2
    if delta > 0:
        return f"improving (+{delta})"
    if delta < 0:
        return f"slipping ({delta})"
    return "stable"


def band_confidence(samples: list[float]) -> float:
    """Confidence 0-100 based on how many band samples exist."""
    if not samples:
        return 0.0
    return round(min(100.0, 20 + len(samples) * 10), 0)


def band_to_label(band: float) -> str:
    if band >= 8:
        return "Expert user"
    if band >= 7:
        return "Good user"
    if band >= 6:
        return "Competent user"
    if band >= 5:
        return "Modest user"
    return "Limited user"
