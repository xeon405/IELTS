"""Large offline question banks aggregator.

Exposes the same API shape as the small banks (items_for_type / items_for_mode)
for all four skills, but draws from the deterministic large banks (~500 items
per official question type). The fallback session builder prefers these pools,
so offline sessions never repeat.
"""

from typing import Any

from . import large_bank_reading
from . import large_bank_listening
from . import large_bank_writing
from . import large_bank_speaking

Item = dict[str, Any]

LARGE_BY_TYPE: dict[str, dict[str, list[Item]]] = {
    "reading": large_bank_reading.READING_LARGE_BY_TYPE,
    "listening": large_bank_listening.LISTENING_LARGE_BY_TYPE,
    "writing": large_bank_writing.WRITING_LARGE_BY_TYPE,
    "speaking": large_bank_speaking.SPEAKING_LARGE_BY_TYPE,
}

LARGE_BANK: dict[str, list[Item]] = {
    "reading": large_bank_reading.READING_LARGE_BANK,
    "listening": large_bank_listening.LISTENING_LARGE_BANK,
    "writing": large_bank_writing.WRITING_LARGE_BANK,
    "speaking": large_bank_speaking.SPEAKING_LARGE_BANK,
}


def items_for_type(module: str, type_label: str) -> list[Item]:
    """All large-bank items for one official question type label."""
    return list(LARGE_BY_TYPE.get(module, {}).get(type_label, []))


def items_for_mode(module: str, mode: str) -> list[Item]:
    """Item pool for a mode: a type label, a part/passage slot, or everything."""
    if module == "writing":
        # Writing modes are type labels already; map Task slots to their labels.
        task1 = [
            "Task 1 Charts & Graphs", "Task 1 Tables", "Task 1 Mixed Charts",
            "Task 1 Process", "Task 1 Maps / Plans", "Task 1 Diagrams",
        ]
        task2 = [
            "Task 2 Opinion", "Task 2 Discussion", "Task 2 Advantages / Disadvantages",
            "Task 2 Problem / Solution", "Task 2 Double Question",
            "Task 2 Mixed / Combined Question",
        ]
        if "Task 1" in mode and "Task 2" not in mode:
            labels = task1
        elif "Task 2" in mode:
            labels = task2
        else:
            labels = task1 + task2
        pool: list[Item] = []
        for label in labels:
            pool.extend(LARGE_BY_TYPE["writing"].get(label, []))
        return pool
    by_type = LARGE_BY_TYPE.get(module, {})
    if mode in by_type:
        return list(by_type[mode])
    return list(LARGE_BANK.get(module, []))


def counts() -> dict[str, dict[str, int]]:
    out: dict[str, dict[str, int]] = {}
    for module, by_type in LARGE_BY_TYPE.items():
        out[module] = {label: len(items) for label, items in by_type.items()}
    return out


def total() -> int:
    return sum(len(items) for items in LARGE_BANK.values())
