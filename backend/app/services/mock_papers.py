"""Full IELTS mock exam papers composed from the SAME practice banks.

Every paper mirrors the real computer-delivered test exactly:

* Listening — 40 questions across 4 sections (10 each), 30 minutes, then
  2 minutes to check answers before they are submitted.
* Reading — 40 questions across 3 passages (13 / 13 / 14), 60 minutes.
  Each passage is a long (~700-900 word) text, close to a genuine IELTS
  passage, assembled from the reading bank's fact threads for one topic;
  the questions are the SAME bank items the separate practice modules use,
  arranged in blocks by question type exactly like a real paper.
* Writing — Task 1 (20 min, 150+ words) and Task 2 (40 min, 250+ words).
  Task 1 keeps its chart / table / map / process / diagram data so the
  computer-delivered interface renders the visual like the practice mode.
* Speaking — 11-14 minutes: Part 1 (12 questions), Part 2 (one cue card:
  1 minute preparation + a full 2-minute long turn), a round-off question,
  then Part 3 (6 abstract discussion questions).

Papers are composed FRESH on every request: topics, passages and every
question are drawn at random from the large practice pools (500-800 items
per question type, 378-464 items per reading topic), so every paper -- and
every re-open -- is a different exam, while remaining the same syllabus the
student practises every day.

Item ids are stamped with the SAME pool positions as /brain/bank
(``bank-<module>-<type>-<n>``) so the check/evaluate endpoints can
re-enrich correct answers server-side from the identical item records.
"""

import random
import re
from typing import Any

from . import large_bank as bank

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

P2_CARD_TYPES = ["Person", "Place", "Object / Thing", "Experience / Event", "Activity", "Future Plan"]

P3_FOLLOWUP_LANES = ["Reasons / Causes", "Opinion"]

Item = dict[str, Any]

# Official IELTS Reading question types, in the order a real paper would use
# them. Reading passages are built as BLOCKS of the same type (5 True/False,
# then 6 Multiple Choice, then a completion block) -- never interleaved
# question-by-question.
_READING_BLOCK_TYPES = [
    "Multiple Choice",
    "True / False / Not Given",
    "Yes / No / Not Given",
    "Matching Information",
    "Matching Headings",
    "Matching Features",
    "Matching Sentence Endings",
    "Summary Completion",
    "Sentence Completion",
    "Note Completion",
    "Table Completion",
    "Flow-chart Completion",
    "Diagram Label Completion",
    "Short Answer",
]

# Real IELTS Listening sections follow type patterns: Section 1 is a form /
# note-taking conversation, Section 2 a guided monologue, Section 3 a
# 2-4 person academic conversation, Section 4 an academic talk.
LISTENING_SECTION_PLAN: list[tuple[str, list[tuple[str, int]]]] = [
    ("Section 1", [("Form Completion", 8), ("Note Completion", 2)]),
    ("Section 2", [("Multiple Choice", 4), ("Map / Plan / Diagram Labelling", 2), ("Short Answer", 4)]),
    ("Section 3", [("Multiple Choice", 3), ("Matching", 4), ("Sentence Completion", 3)]),
    ("Section 4", [("Summary Completion", 4), ("Flow-chart Completion", 3), ("Sentence Completion", 3)]),
]

_TRANSITION_STARTERS = [
    "According to the report,",
    "The survey also found that",
    "Researchers point out that",
    "One notable example is that",
    "In practice,",
    "Over the past decade,",
    "Official figures show that",
    "The evidence suggests that",
    "Commentators note that",
    "It is also worth noting that",
]

_INTRO_TEMPLATES = [
    "The passage below examines a topic that has received growing attention in recent years. The information draws on surveys, official reports and expert analysis, and every question refers back to the text.",
    "The following text discusses {topic} in some detail. Read it carefully before answering the questions; the answers are all contained in the passage.",
    "Reading research and field data together give a fuller picture of {topic}. The passage that follows brings together reliable findings, and the questions all draw on it directly.",
]


def _slug(value: str) -> str:
    return "".join(ch if ch.isalnum() else "-" for ch in value.lower()).strip("-") or "type"


def _rotated(pool: list, offset: int) -> list:
    if not pool:
        return []
    offset %= len(pool)
    return pool[offset:] + pool[:offset]


def _passage_topic(item: Item) -> str:
    """Topic segment of a reading-bank title ("Passage 2 · Urban cycling — Detail")."""
    segment = str(item.get("title") or "").split("\u00b7")
    rest = segment[1] if len(segment) > 1 else segment[0]
    return rest.split("\u2014")[0].strip() or str(item.get("title") or "").strip()


def _reading_topics() -> dict[str, list[tuple[str, int, Item]]]:
    """topic -> (type label, pool position, item) for the whole reading bank."""
    topics: dict[str, list[tuple[str, int, Item]]] = {}
    for label, pool in bank.LARGE_BY_TYPE.get("reading", {}).items():
        for index, item in enumerate(pool):
            topic = _passage_topic(item)
            if not topic:
                continue
            topics.setdefault(topic, []).append((label, index, item))
    return topics


def _take_block(lane_type: str, lane: list[tuple[int, Item]], size: int, used_slots: set) -> list[tuple[int, Item]]:
    """Take up to ``size`` distinct pool records from one type lane of a topic.

    Bank items are distinct RECORDS even when they share a prompt template
    (each completion item has its own fact and answer), so reuse is blocked
    by pool position, never by prompt text.
    """
    picked: list[tuple[int, Item]] = []
    for index, item in lane:
        if len(picked) >= size:
            break
        if (lane_type, index) in used_slots:
            continue
        used_slots.add((lane_type, index))
        picked.append((index, item))
    return picked


def _compose_passage_text(seed_facts: list[str], fillers: list[str], topic: str) -> str:
    """Build a realistic long IELTS passage (~700-900 words).

    The seed facts (the questions' answer sentences) are always included
    verbatim; filler facts from the same topic pad the text to genuine
    IELTS length, mirroring how real passages contain more prose than the
    questions use.
    """
    seen: set[str] = set()
    sentences: list[str] = []
    for fact in seed_facts:
        if fact and fact not in seen:
            seen.add(fact)
            sentences.append(fact)
    for fact in fillers:
        if fact and fact not in seen:
            seen.add(fact)
            sentences.append(fact)
        if sum(len(sentence.split()) for sentence in sentences) >= 860:
            break

    words = sum(len(sentence.split()) for sentence in sentences)
    if words > 950:
        sentences = sentences[: max(len(seed_facts), 55)]

    paragraphs: list[str] = []
    index = 0
    while index < len(sentences):
        chunk_size = 5 + (index // 12) % 2
        chunk = sentences[index:index + chunk_size]
        lead = _TRANSITION_STARTERS[(index // chunk_size) % len(_TRANSITION_STARTERS)] if index else None
        paragraphs.append(f"{lead} {' '.join(chunk)}" if lead else " ".join(chunk))
        index += chunk_size

    intro = random.choice(_INTRO_TEMPLATES).format(topic=topic)
    return f"{intro}\n\n" + "\n\n".join(paragraphs)


def _compose_passage(topic: str, topic_pool: list[tuple[str, int, Item]], need: int, used_slots: set) -> tuple[str, list[Item]]:
    """One reading passage: `need` questions in type blocks + a long shared text."""
    by_type: dict[str, list[tuple[int, Item]]] = {}
    for label, index, item in topic_pool:
        by_type.setdefault(label, []).append((index, item))

    available = [label for label in _READING_BLOCK_TYPES if by_type.get(label)]
    block_count = min(3, len(available))
    if block_count == 0:
        return "", []

    base = need // block_count
    extra = need % block_count
    sizes = [base + (1 if i < extra else 0) for i in range(block_count)]
    types = random.sample(available, block_count)

    blocks: list[tuple[str, list[tuple[int, Item]]]] = []
    for lane_type, size in zip(types, sizes):
        chosen = _take_block(lane_type, by_type[lane_type], size, used_slots)
        if len(chosen) < size:
            for other in available:
                if other == lane_type:
                    continue
                if len(chosen) >= size:
                    break
                chosen.extend(_take_block(other, by_type[other], size - len(chosen), used_slots))
        if chosen:
            blocks.append((lane_type, chosen))

    stanza: list[Item] = []
    seed_facts: list[str] = []
    fillers_done: set[str] = set()
    fillers: list[str] = []
    for lane_type, chosen in blocks:
        for index, item in chosen:
            it = dict(item)
            it["id"] = f"bank-reading-{_slug(lane_type)}-{index + 1}"
            stanza.append(it)
            fact = str(it.get("context") or "").strip()
            if fact:
                seed_facts.append(fact)
    for _, _, item in topic_pool:
        fact = str(item.get("context") or "").strip()
        if fact and fact not in seed_facts and fact not in fillers_done:
            fillers_done.add(fact)
            fillers.append(fact)

    passage = _compose_passage_text(seed_facts, fillers, topic)
    for it in stanza:
        it["context"] = passage
    return passage, stanza


def _reading(paper_no: int) -> list[Item]:
    topics = _reading_topics()
    names = [name for name, pool in topics.items() if len(pool) >= 14]
    if len(names) < 3:
        names = list(topics)
    random.shuffle(names)
    selected = names[:3]

    sizes = [13, 13, 14]
    used_slots: set[tuple[str, int]] = set()
    items: list[Item] = []
    for passage_index, topic in enumerate(selected):
        _, stanza = _compose_passage(topic, topics[topic], sizes[passage_index], used_slots)
        for it in stanza:
            it["examSection"] = f"Passage {passage_index + 1}"
            it["sectionLabel"] = f"Passage {passage_index + 1}"
        items.extend(stanza)
    return items


def _listening(paper_no: int) -> list[Item]:
    items: list[Item] = []
    for section_index, (section_label, plan) in enumerate(LISTENING_SECTION_PLAN):
        if section_index > 0:
            plan = list(plan)
            random.shuffle(plan)
        for label, count in plan:
            lane = list(enumerate(bank.items_for_type("listening", label)))
            if not lane:
                continue
            pool = _rotated(lane, random.randrange(len(lane)))[:count]
            for abs_index, item in pool:
                it = dict(item)
                it["id"] = f"bank-listening-{_slug(label)}-{abs_index + 1}"
                it["examSection"] = section_label
                it["sectionLabel"] = section_label
                items.append(it)
    return items


def _writing(paper_no: int) -> list[Item]:
    t1_labels = [label for label in bank.LARGE_BY_TYPE["writing"] if label.startswith("Task 1")]
    t2_labels = [label for label in bank.LARGE_BY_TYPE["writing"] if label.startswith("Task 2")]

    def _task(labels: list[str], exam_section: str, minutes: int) -> Item | None:
        if not labels:
            return None
        label = random.choice(labels)
        lane = list(enumerate(bank.items_for_type("writing", label)))
        if not lane:
            return None
        abs_index, item = random.choice(lane)
        it = dict(item)
        it["id"] = f"bank-writing-{_slug(label)}-{abs_index + 1}"
        it["examSection"] = exam_section
        it["suggestedMinutes"] = minutes
        return it

    out = [
        task
        for task in [
            _task(t1_labels, "Task 1", WRITING_TASK1_MINUTES),
            _task(t2_labels, "Task 2", WRITING_TASK2_MINUTES),
        ]
        if task is not None
    ]
    return out


def _card_bullets(prompt: str) -> list[str]:
    match = re.search(r"You should say:\s*(.*)$", prompt, re.IGNORECASE)
    if not match:
        return []
    rest = match.group(1).strip().rstrip(".")
    return [part.strip() for part in re.split(r"\.\s*and\s+|,\s*", rest) if part.strip()]


def _speaking(paper_no: int) -> list[Item]:
    p1 = list(enumerate(bank.items_for_type("speaking", "Part 1")))
    p2 = list(enumerate(bank.items_for_type("speaking", "Part 2")))
    p3 = list(enumerate(bank.items_for_type("speaking", "Part 3")))

    items: list[Item] = []
    used_slots: set[tuple[str, int]] = set()
    used_prompts: set[str] = set()

    def pick(pool: list[tuple[int, Item]], section: str, limit: int, type_name: str | None = None, id_prefix: str = "part-1") -> None:
        taken = 0
        for abs_index, item in _rotated(pool, random.randrange(len(pool)) if pool else 0):
            if taken >= limit:
                break
            if abs_index in used_slots:
                continue
            if type_name and item.get("typeName") != type_name:
                continue
            prompt = str(item.get("prompt") or "")
            if prompt in used_prompts:
                continue
            used_slots.add(abs_index)
            used_prompts.add(prompt)
            it = dict(item)
            it["id"] = f"bank-speaking-{id_prefix}-{abs_index + 1}"
            it["examSection"] = section
            items.append(it)
            taken += 1

    pick(p1, "part1", 4, "Personal Information", "part-1")

    cats = sorted({str(item.get("typeName") or "") for _, item in p1 if str(item.get("typeName") or "") != "Personal Information"})
    random.shuffle(cats)
    for cat in cats[:2]:
        pick(p1, "part1", 4, cat, "part-1")

    card_cat = random.choice(P2_CARD_TYPES)
    for abs_index, item in _rotated(p2, random.randrange(len(p2)) if p2 else 0):
        if item.get("typeName") != card_cat:
            continue
        prompt = str(item.get("prompt") or "")
        if prompt in used_prompts:
            continue
        used_slots.add(abs_index)
        used_prompts.add(prompt)
        it = dict(item)
        it["id"] = f"bank-speaking-part-2-{abs_index + 1}"
        it["examSection"] = "part2"
        it["cardCategory"] = card_cat
        it["bullets"] = _card_bullets(prompt)
        items.append(it)
        break

    followup_cats = sorted({str(item.get("typeName") or "") for _, item in p3 if str(item.get("typeName") or "") in P3_FOLLOWUP_LANES})
    if followup_cats:
        pick(p3, "followup", 1, random.choice(followup_cats), "part-3")

    p3_cats = sorted({str(item.get("typeName") or "") for _, item in p3 if str(item.get("typeName") or "")})
    random.shuffle(p3_cats)
    for cat in p3_cats[:2]:
        pick(p3, "part3", 3, cat, "part-3")

    return items


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
            f"Task 1: {WRITING_TASK1_MINUTES} min (150+ words) · Task 2: {WRITING_TASK2_MINUTES} min (250+ words)",
            WRITING_MINUTES, writing,
        ),
        "speaking": _session(
            paper_no, "speaking", "Full Speaking Section", f"Mock Test {paper_no} — Speaking",
            f"3 parts · {SPEAKING_MINUTES} min · Part 2 includes 1 min preparation and a 2 min long turn",
            SPEAKING_MINUTES, speaking,
        ),
    }
    return {
        "id": f"mock-paper-{paper_no}",
        "number": paper_no,
        "title": f"Mock Test {paper_no}",
        "totalMinutes": LISTENING_MINUTES + READING_MINUTES + WRITING_MINUTES + SPEAKING_MINUTES,
        "sections": sections,
    }