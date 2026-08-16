"""Full IELTS mock exam papers composed from the large banks.

Every paper mirrors the real test exactly:

* Listening — 40 questions across 4 sections (10 each), 30 minutes, then
  10 minutes to transfer answers (official: 40 min wall-clock).
* Reading — 40 questions across 3 passages (13 / 13 / 14), 60 minutes.
* Writing — Task 1 (20 min, 150+ words) and Task 2 (40 min, 250+ words),
  60 minutes total.
* Speaking — 11-14 minutes: Part 1 (12 short questions), Part 2 (one cue
  card: 1 minute preparation + a full 2-minute long turn), a round-off
  follow-up question, then Part 3 (6 abstract discussion questions).

Papers are assembled FRESH on every request: each lane is entered at a
random offset, and every Reading passage is built as 2-4 consecutive blocks
of questions (one block per type, random block order and sizes) exactly like
a real paper - question types are never interleaved question-by-question.
Item ids are stamped with pool positions so the check/evaluate endpoints can
re-enrich correct answers server-side (same scheme as /brain/bank).

Reading, listening, Writing and Speaking draw ONLY from the dedicated mock
banks (``large_bank_mock``), whose content pools (topics, names, prices,
places, subjects, charts, interview/discussion questions...) are entirely
separate from the portal's practice banks - a mock question is never part
of the practice syllabus.
"""

import random
import re
from typing import Any

from . import large_bank
from .large_bank_mock import MOCK_LARGE_BY_TYPE
from .large_bank_mock import MOCK_SPEAKING_BY_TYPE

MOCK_EXAM_COUNT = 10

LISTENING_QUESTIONS = 40
LISTENING_SECTIONS = 4
LISTENING_MINUTES = 30
LISTENING_TRANSFER_MINUTES = 10

READING_QUESTIONS = 40
READING_PASSAGES = 3
READING_MINUTES = 60

WRITING_MINUTES = 60
WRITING_TASK1_MINUTES = 20
WRITING_TASK2_MINUTES = 40

SPEAKING_MINUTES = 14
SPEAKING_PART1_QUESTIONS = 12
SPEAKING_PART2_PREP_SECONDS = 60
SPEAKING_PART2_TURN_SECONDS = 120
SPEAKING_PART3_QUESTIONS = 6

P1_LABEL = "Part 1 \u2014 Introduction & Interview (personal questions)"
P2_LABEL = "Part 2 \u2014 Cue Card / Individual Long Turn"
P3_LABEL = "Part 3 \u2014 Discussion (abstract questions)"

P2_CARD_TYPES = ["Person", "Place", "Object / Thing", "Experience / Event", "Activity", "Future Plan"]

P3_FOLLOWUP_LANES = ["Reasons / Causes", "Opinion"]

Item = dict[str, Any]

_OFFICIAL_SPEAKING_LABELS = {
    "Part 1": P1_LABEL,
    "Part 2": P2_LABEL,
    "Part 3": P3_LABEL,
}


def _slug(value: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in value.lower()).strip("-") or "type"


def _stamp(item: Item, module: str, lane_label: str, lane_index: int, prefix: str = "bank") -> Item:
    """Deterministic id = pool position, exactly like /brain/bank.

    ``prefix`` lets mock-exam items carry a ``mock-`` namespace so practice
    and mock banks can never collide id-space.
    """
    item["id"] = f"{prefix}-{module}-{_slug(lane_label)}-{lane_index + 1}"
    return item


def _rotated(pool: list, offset: int) -> list:
    if not pool:
        return []
    offset %= len(pool)
    return pool[offset:] + pool[:offset]


def _lanes(module: str, labels: list[str], by_type: dict | None = None, prefix: str = "bank") -> dict[str, list[Item]]:
    """id-stamped copies of each requested type lane (official labels resolved).

    ``by_type`` defaults to the practice large banks; mock exams pass
    ``MOCK_LARGE_BY_TYPE`` so their questions never come from the portal's
    practice pools. ``prefix`` namespaces the ids (``bank`` vs ``mock``).
    """
    by_type = by_type or large_bank.LARGE_BY_TYPE
    lanes: dict[str, list[Item]] = {}
    for label in labels:
        resolved = _OFFICIAL_SPEAKING_LABELS.get(label, label) if module == "speaking" else label
        raw = by_type.get(module, {}).get(resolved, [])
        lanes[label] = [_stamp(dict(item), module, resolved, index, prefix) for index, item in enumerate(raw)]
    return lanes


def _mixed(lanes: dict[str, list[Item]], start_lane: int, need: int) -> list[Item]:
    """Round-robin across lanes so groups contain a spread of question types."""
    keys = list(lanes)
    picked: list[Item] = []
    lane_step = 0
    while len(picked) < need:
        label = keys[(start_lane + lane_step) % len(keys)]
        pool = lanes[label]
        if pool:
            picked.append(pool.pop(0))
        lane_step += 1
        if lane_step % len(keys) == 0 and not any(lanes.values()):
            break
    return picked


LISTENING_SECTION_PLAN: list[tuple[str, list[tuple[str, int]]]] = [
    # Real IELTS Listening sections follow type patterns: Section 1 is a form/
    # note-taking conversation, Section 2 a guided monologue, Section 3 a
    # 2-4 person academic conversation, Section 4 an academic talk.
    ("Section 1", [("Form Completion", 8), ("Note Completion", 2)]),
    ("Section 2", [("Multiple Choice", 4), ("Map / Plan / Diagram Labelling", 2), ("Short Answer", 4)]),
    ("Section 3", [("Multiple Choice", 3), ("Matching", 4), ("Sentence Completion", 3)]),
    ("Section 4", [("Summary Completion", 4), ("Flow-chart Completion", 3), ("Sentence Completion", 3)]),
]


def _listening(paper_no: int) -> list[Item]:
    items: list[Item] = []
    for section_index, (section_label, plan) in enumerate(LISTENING_SECTION_PLAN):
        if section_index > 0:
            plan = list(plan)
            random.shuffle(plan)
        for label, count in plan:
            lane = _lanes("listening", [label], MOCK_LARGE_BY_TYPE, prefix="mock")[label]
            if not lane:
                continue
            # (absolute pool position, item) pairs survive rotation so ids stay
            # pool-position based and re-enrichable server-side.
            pairs = list(enumerate(lane))
            pool = _rotated(pairs, random.randrange(len(pairs)))[:count]
            for abs_index, item in pool:
                item["id"] = f"mock-listening-{_slug(label)}-s{section_index + 1}-{abs_index + 1}"
                item["examSection"] = section_label
                item["sectionLabel"] = section_label
                items.append(item)
    return items


def _reading(paper_no: int) -> list[Item]:
    labels = [k for k in MOCK_LARGE_BY_TYPE.get("reading", {})]
    lanes: dict[str, list] = {}
    for label in labels:
        lane = _lanes("reading", [label], MOCK_LARGE_BY_TYPE, prefix="mock")[label]
        pairs = list(enumerate(lane))
        lanes[label] = _rotated(pairs, random.randrange(len(pairs)) if pairs else 0)
    sizes = [13, 13, 14]
    items: list[Item] = []
    for group, size in enumerate(sizes):
        available = [label for label in labels if lanes[label]]
        if not available:
            break
        if len(available) < 2:
            block_count = 1
        else:
            block_count = max(3, size // 4)
            block_count = min(block_count, len(available), size // 3)
            block_count = max(block_count, 2)
        random.shuffle(available)
        parts = [size // block_count] * block_count
        for i in range(size % block_count):
            parts[i] += 1
        for part_size, label in zip(parts, available[:block_count]):
            pool = lanes[label]
            for _ in range(part_size):
                if not pool:
                    break
                abs_index, item = pool.pop(0)
                item["id"] = f"mock-reading-{_slug(label)}-p{group + 1}-{abs_index + 1}"
                item["examSection"] = f"Passage {group + 1}"
                item["sectionLabel"] = f"Passage {group + 1}"
                items.append(item)
    return items


def _writing(paper_no: int) -> list[Item]:
    t1_labels = [k for k in MOCK_LARGE_BY_TYPE["writing"] if k.startswith("Task 1")]
    t2_labels = [k for k in MOCK_LARGE_BY_TYPE["writing"] if k.startswith("Task 2")]
    t1_lanes = {label: list(_rotated(pool, random.randrange(len(pool)) if pool else 0)) for label, pool in _lanes("writing", t1_labels, MOCK_LARGE_BY_TYPE, prefix="mock").items()}
    t2_lanes = {label: list(_rotated(pool, random.randrange(len(pool)) if pool else 0)) for label, pool in _lanes("writing", t2_labels, MOCK_LARGE_BY_TYPE, prefix="mock").items()}
    t1 = _mixed(t1_lanes, random.randrange(len(t1_labels)) if t1_labels else 0, 1)
    t2 = _mixed(t2_lanes, random.randrange(len(t2_labels)) if t2_labels else 0, 1)
    if not t1 or not t2:
        return []
    task1, task2 = t1[0], t2[0]
    task1["examSection"] = "Task 1"
    task1["suggestedMinutes"] = WRITING_TASK1_MINUTES
    task2["examSection"] = "Task 2"
    task2["suggestedMinutes"] = WRITING_TASK2_MINUTES
    return [task1, task2]


def _p1_cats() -> list[str]:
    cats: list[str] = []
    for item in MOCK_SPEAKING_BY_TYPE.get(P1_LABEL, []):
        cat = item.get("typeName", "")
        if cat and cat not in cats:
            cats.append(cat)
    return cats


def _speaking(paper_no: int) -> list[Item]:
    cats = _p1_cats()
    p1_lane = _lanes("speaking", ["Part 1"], MOCK_LARGE_BY_TYPE, prefix="mock")["Part 1"]
    p2_lane = _lanes("speaking", ["Part 2"], MOCK_LARGE_BY_TYPE, prefix="mock")["Part 2"]
    p3_lane = _lanes("speaking", ["Part 3"], MOCK_LARGE_BY_TYPE, prefix="mock")["Part 3"]

    items: list[Item] = []

    def pick(pool: list[Item], limit: int, section: str, cat: str | None = None) -> None:
        for item in _rotated(pool, random.randrange(len(pool)) if pool else 0)[:limit]:
            item["examSection"] = section
            if cat:
                item["topicLabel"] = cat
            items.append(item)

    pick([i for i in p1_lane if i.get("typeName") == "Personal Information"], 4, "part1")

    topic_pool = [c for c in cats if c != "Personal Information"]
    random.shuffle(topic_pool)
    for cat in topic_pool[:2]:
        pick([i for i in p1_lane if i.get("typeName") == cat], 4, "part1", cat)

    card_cat = random.choice(P2_CARD_TYPES)
    card_pool = [i for i in p2_lane if i.get("typeName") == card_cat]
    if card_pool:
        card = _rotated(card_pool, random.randrange(len(card_pool)))[0]
        card["examSection"] = "part2"
        card["cardCategory"] = card_cat
        card["bullets"] = _card_bullets(card.get("prompt", ""))
        items.append(card)

    followup_pool = [i for i in p3_lane if i.get("typeName") in P3_FOLLOWUP_LANES]
    if followup_pool:
        followup = _rotated(followup_pool, random.randrange(len(followup_pool)))[0]
        followup["examSection"] = "followup"
        items.append(followup)

    p3_cats = sorted({i.get("typeName", "") for i in p3_lane if i.get("typeName")})
    random.shuffle(p3_cats)
    for cat in p3_cats[:2]:
        pick([i for i in p3_lane if i.get("typeName") == cat], 3, "part3", cat)

    seen: set[str] = set()
    unique: list[Item] = []
    for item in items:
        key = str(item.get("prompt") or "")
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique


def _card_bullets(prompt: str) -> list[str]:
    match = re.search(r"You should say:\s*(.*)$", prompt, re.IGNORECASE)
    if not match:
        return []
    rest = match.group(1).strip().rstrip(".")
    return [p.strip() for p in re.split(r"\.\s*and\s+|,\s*", rest) if p.strip()]


def _session(paper_no: int, skill: str, mode: str, title: str, subtitle: str, minutes: int, items: list[Item]) -> dict:
    for item in items:
        item.setdefault("difficultyBand", 5.5)
    from .question_generator import strip_answers

    return {
        "id": f"mock-{paper_no}-{skill}",
        "module": skill,
        "mode": mode,
        "title": title,
        "subtitle": subtitle,
        "durationMinutes": minutes,
        "questionCount": len(items),
        "questionTypes": [],
        "difficultyBand": 5.5,
        "examinerIntent": f"Mock test {paper_no}, {skill.capitalize()} — official format and timing.",
        "items": strip_answers({"items": items})["items"],
        "source": "offline",
    }


def build_paper(paper_no: int) -> dict:
    listening = _listening(paper_no)
    reading = _reading(paper_no)
    writing = _writing(paper_no)
    speaking = _speaking(paper_no)

    sections = {
        "listening": _session(
            paper_no, "listening", "Full Listening Section", f"Mock Test {paper_no} — Listening",
            f"{LISTENING_QUESTIONS} questions · 4 sections · {LISTENING_MINUTES} min + 2 min to check answers (audio plays once)",
            LISTENING_MINUTES, listening,
        ),
        "reading": _session(
            paper_no, "reading", "Full Reading Section", f"Mock Test {paper_no} — Reading",
            f"{READING_QUESTIONS} questions · 3 passages · {READING_MINUTES} min",
            READING_MINUTES, reading,
        ),
        "writing": _session(
            paper_no, "writing", "Full Writing Section", f"Mock Test {paper_no} — Writing",
            f"Task 1 ({WRITING_TASK1_MINUTES} min) + Task 2 ({WRITING_TASK2_MINUTES} min) · {WRITING_MINUTES} min total",
            WRITING_MINUTES, writing,
        ),
        "speaking": _session(
            paper_no, "speaking", "Full Speaking Section", f"Mock Test {paper_no} — Speaking",
            f"Part 1 (12 Qs) · Part 2 (1 min prep + 2 min turn) · follow-up · Part 3 (6 Qs) · {SPEAKING_MINUTES} min",
            SPEAKING_MINUTES, speaking,
        ),
    }

    total = LISTENING_MINUTES + READING_MINUTES + WRITING_MINUTES + SPEAKING_MINUTES + LISTENING_TRANSFER_MINUTES
    return {
        "id": f"mock-paper-{paper_no}",
        "number": paper_no,
        "title": f"Mock Test {paper_no}",
        "totalMinutes": total,
        "sections": sections,
    }


def build_all_papers() -> list[dict]:
    return [build_paper(n) for n in range(1, MOCK_EXAM_COUNT + 1)]