"""Large offline Speaking bank: ~500 distinct items per speaking part.

Deterministic combinatorial generator: question templates filled from topic
and follow-up pools produce 500+ unique Part 1, Part 2 and Part 3 items so
offline sessions never repeat. Schema matches speaking_bank items.
"""

import random
from typing import Any

Item = dict[str, Any]

_TARGET = 500
_rnd = random.Random(13)

_TYPES = [
    ("Part 1", "speaking-cue"),
    ("Part 2", "speaking-cue"),
    ("Part 3", "speaking-cue"),
]

_TIPS = {
    "Part 1": ["Answer directly, add a reason, and give one small example.", "Use 'because', 'for example', 'actually'.", "Extend answers with a second sentence that adds detail."],
    "Part 2": ["Use the 4 prompt points as paragraph markers.", "Speak for 1-2 minutes without stopping.", "Write 4 keywords in your one-minute preparation."],
    "Part 3": ["Treat Part 3 like a mini essay: claim, reason, example.", "Use conditionals: 'If students learn...'.", "Give a balanced view with a clear final opinion."],
}

_TOPICS_P1 = [
    "your morning routine", "the apps on your phone", "your commute to work or study",
    "the weather where you live", "cooking at home", "public holidays in your country",
    "your daily reading habits", "family meals", "the town or city you grew up in",
    "languages you would like to learn", "your weekend plans", "sports you enjoy watching",
    "the music you listen to", "your favourite shops", "morning versus evening exercise",
    "household chores", "the seasons you like most", "your neighbours",
    "diet and eating out", "the books on your shelf", "your study or workspace",
    "walking in the city", "the pictures on your phone", "your favourite drink",
    "your school days", "gifts you give", "the bus you take", "your first mobile phone",
    "bicycle riding", "the food you eat for breakfast", "your hometown market", "saving money",
    "being late", "the television you watch", "birthday celebrations", "your morning drink",
    "handwritten letters", "the park near your home", "helping neighbours", "summer holidays",
    "your hobbies as a child", "car ownership", "the library in your area", "dressing for the weather",
    "online video calls", "your favourite smell", "taking photographs", "the newspaper or news app you use",
]

_TEMPLATES_P1 = [
    "Do you prefer {topic} in the morning or in the evening? Why?",
    "How has {topic} changed for you in recent years?",
    "What role does {topic} play in your daily life?",
    "Would you recommend {topic} to a visitor? Why or why not?",
    "How often do you think about {topic} these days?",
    "Is {topic} important to young people in your country?",
    "What do you enjoy most about {topic}?",
    "Has {topic} become easier or harder for you lately?",
    "When did you last do something related to {topic}?",
    "Who usually helps you with {topic}, if anyone?",
    "Do you think {topic} will change in the next ten years?",
    "What does {topic} teach you about other people?",
]

_TOPICS_P2 = [
    "concentration", "relaxing", "learning", "hard work", "a happy memory",
    "an important decision", "a useful skill", "a friend you admire", "a place you love",
    "a meal you remember", "a goal you reached", "a helpful habit", "a recent purchase",
    "a job you would like", "a lesson you learned", "a natural place", "an invention",
    "a journey you made", "a tradition in your family", "a change you would make",
    "a person who helped you", "a book that changed your mind", "a piece of advice",
    "an interesting building", "a quiet moment", "a celebration you enjoyed",
    "a new sport you tried", "a volunteer activity", "a childhood toy", "a course you took",
    "a conversation you remember", "a song that means something to you", "an act of kindness",
    "a shop you visit often", "a view you like", "a repair you made", "an old photograph",
    "a project you finished", "a place you would defend", "a habit you dropped",
    "a film you saw twice", "a family member you admire", "a team you were part of",
    "a festival you attended", "a plant you care for", "a tool you use often",
    "a timetable you follow", "a route you know by heart", "a friend you made recently",
    "a promise you kept", "a meal you cooked", "an early memory", "a rule you appreciate",
    "a chair you like to sit in", "a sound that calms you", "a neighbour you know",
    "a weekend trip", "a mistake that taught you", "a service you use weekly",
    "a window you look out of", "a hand you have shaken", "an email you wrote carefully",
    "a toy you kept", "a way you help at home", "a market stall you visit",
    "a thank-you note you wrote", "a sign you see every day", "a lesson outside school",
    "a place you would show a visitor", "a phrase you use often", "a person who is always punctual",
    "a small shop in your area", "a night you remember", "a dish from your childhood",
]

_TEMPLATES_P2 = [
    "Describe {topic}. You should say: what it is, how you became involved with it, and why it matters to you.",
    "Describe an experience related to {topic}. You should say: when it happened, what you did, and how you felt about it.",
    "Talk about {topic}. Say: what it is, when it first mattered to you, and what happened as a result.",
    "Describe a time when {topic} made a difference in your life. You should say: what it was, how long it lasted, and what you learnt.",
    "Describe {topic} in detail. Say: what it looks like or sounds like, who else was involved, and why you remember it.",
    "Tell me about {topic}. You should say: where it happened, what you did first, and how it ended.",
    "Describe your best memory of {topic}. Say: when it was, who was there, and why it stays with you.",
    "Describe a future plan related to {topic}. Say: what it is, why you made it, and what steps you will take.",
    "Describe a change that {topic} brought. Say: what changed, how you responded, and what you learned.",
    "Describe {topic} as if you were introducing it to someone new. Say: what makes it special and why others would enjoy it.",
]

_TOPICS_P3 = [
    "schools and how they teach", "the role of parents", "government responsibility",
    "technology and daily life", "changes in society", "the future of work",
    "consumer habits", "young people today", "cities and travel", "health and wellbeing",
    "media and news", "the environment",
    "education funding", "public transport", "urban planning", "family structures",
    "language policy", "the arts", "sports in schools", "digital privacy",
    "international cooperation", "food culture", "retirement age", "community life",
    "crime prevention", "tourism", "artificial intelligence", "public health advice",
    "teacher training", "university access", "early childhood care",
    "the news industry", "social housing", "green cities", "rural livelihoods",
    "local government", "consumer safety", "cultural heritage", "space research",
    "oil and energy policy", "water supply", "food security", "charities and NGOs",
    "the entertainment industry", "music education", "religion and society", "dating and marriage",
]

_TEMPLATES_P3 = [
    "Do you think {topic} should be planned, or should it be left to develop naturally? Why?",
    "How has {topic} changed in your lifetime?",
    "What could cause {topic} to change again in the future?",
    "Some people say the state, not individuals, should improve {topic}. Do you agree?",
    "How do older and younger generations disagree about {topic}?",
    "What would be the likely results if {topic} improved sharply?",
    "In what ways could {topic} be misused by governments or companies?",
    "Who benefits most when {topic} goes well, and why?",
    "What traditions connected to {topic} are worth keeping?",
    "How would a teacher or parent explain {topic} to a child?",
    "Is {topic} a question of money, of attitude, or of both?",
    "What is the biggest misunderstanding people have about {topic}?",
]

_used: set[str] = set()
_bank: list[Item] = []
_ids = 0


def _mk(part: str, title: str, prompt: str, model: str, tip: str) -> Item | None:
    global _ids
    key = part + "|" + prompt
    if key in _used:
        return None
    _used.add(key)
    _ids += 1
    return {
        "id": f"lb-speaking-{_ids:05d}",
        "type": "speaking-cue",
        "typeLabel": part,
        "title": title,
        "context": "",
        "prompt": prompt,
        "options": [],
        "correctAnswer": model,
        "explanation": "Answer directly, add a reason, and give one small example. Avoid one-word answers.",
        "logic": "1. Structure your answer: point, reason, example. 2. For Part 2, follow the four prompt points. 3. For Part 3, treat it as a mini-essay with a claim and support.",
        "tip": tip,
        "suggestions": "Practise the same question again aloud, adding one more reason or example each time.",
        "bandAdvice": "One band rise follows one focused fix: keep answering, keep linking, keep a steady rhythm.",
    }


def build() -> list[Item]:
    if _bank:
        return list(_bank)
    i = 0
    # Part 1
    made = 0
    t = 0
    while made < _TARGET and t < 5000:
        t += 1
        for j, template in enumerate(_TEMPLATES_P1):
            if made >= _TARGET:
                break
            topic = _TOPICS_P1[(t + j * 3) % len(_TOPICS_P1)]
            i += 1
            prompt = template.format(topic=topic)
            model = (f"Model answer: a direct answer, one reason, and a short example about {topic}. "
                     f"For example: 'I prefer X because... For instance, ...'")
            item = _mk("Part 1", f"Part 1 Interview · {topic}", prompt, model, _TIPS["Part 1"][made % 3])
            if item:
                _bank.append(item)
                made += 1
    # Part 2
    made = 0
    t = 0
    while made < _TARGET and t < 5000:
        t += 1
        for j, template in enumerate(_TEMPLATES_P2):
            if made >= _TARGET:
                break
            topic = _TOPICS_P2[(t + j * 4) % len(_TOPICS_P2)]
            i += 1
            prompt = template.format(topic=topic)
            model = (f"Model answer: cover the prompt points step by step, keep speaking for 1-2 minutes, "
                    f"and add one personal detail about {topic} to avoid going silent.")
            item = _mk("Part 2", f"Part 2 Cue Card · {topic}", prompt, model, _TIPS["Part 2"][made % 3])
            if item:
                _bank.append(item)
                made += 1
    # Part 3
    made = 0
    t = 0
    while made < _TARGET and t < 5000:
        t += 1
        for j, template in enumerate(_TEMPLATES_P3):
            if made >= _TARGET:
                break
            topic = _TOPICS_P3[(t + j * 5) % len(_TOPICS_P3)]
            i += 1
            # avoid double-replacing the same placeholder {topic} twice
            if "{topic} {topic}" in template:
                template = template.replace("{topic} {topic}", "{topic}")
            prompt = template.format(topic=topic)
            model = (f"Model answer: give a clear opinion on {topic}, then a reason and a concrete example, "
                    f"using contrast markers and conditionals.")
            item = _mk("Part 3", f"Part 3 Discussion · {topic}", prompt, model, _TIPS["Part 3"][made % 3])
            if item:
                _bank.append(item)
                made += 1
    return list(_bank)


SPEAKING_LARGE_BANK = build()

SPEAKING_LARGE_BY_TYPE: dict[str, list[Item]] = {}
for _item in SPEAKING_LARGE_BANK:
    SPEAKING_LARGE_BY_TYPE.setdefault(_item["typeLabel"], []).append(_item)