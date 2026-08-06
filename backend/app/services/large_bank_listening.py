"""Large offline Listening bank: ~500 distinct items per question type.

Deterministic combinatorial generator: question templates filled from slot
pools (names, items, prices, times, places, routes, reasons, concerns)
produce 500+ unique items per official listening question type, so offline
sessions never repeat. Schema matches listening_bank items.
"""

from typing import Any

Item = dict[str, Any]

_TARGET = 500

_TYPES = [
    ("Multiple Choice", "multiple-choice"),
    ("Map Labelling", "map-labelling"),
    ("Form / Note Completion", "form-completion"),
    ("Sentence Completion", "sentence-completion"),
    ("Matching", "matching"),
]

_TIPS = {
    "Multiple Choice": ["Listen for the REASON stated, not just repeated words.", "Distractors repeat heard words with a different meaning.", "The answer is usually the option that paraphrases the speaker."],
    "Map Labelling": ["Trace the route; the answer is about the DESTINATION.", "Listen for left/right/opposite/next to.", "The last place mentioned is often the answer."],
    "Form / Note Completion": ["Numbers and names are repeated — the second version is reliable.", "Write as you hear; copy the spelling exactly.", "The field label tells you what to listen for."],
    "Sentence Completion": ["Respect the word limit.", "Copy exact words, do not paraphrase.", "Underline the key word in the gap sentence first."],
    "Matching": ["Keep a running list of who does what.", "First words you hear may belong to someone else.", "Write the letter next to each name as stated."],
}

_NAMES = [
    "Whitaker", "O'Donnell", "Harrison", "Park", "Kowalski", "Moretti", "Larsen", "Nakamura",
    "Okafor", "Silva", "Bauer", "Rossi", "Novak", "Mendez", "Ivanov", "Chen", "Yilmaz", "Haddad",
    "Duval", "Sorensen", "Petrov", "Tanaka", "Weber", "Fontana", "Diallo", "Reyes",
    "Lindqvist", "Mariani", "Bakker", "Costa", "Dubois", "Fischer", "Garcia", "Hansen",
    "Johansson", "Keller", "Lopez", "Muller", "Nguyen", "Osei", "Perez", "Quinn", "Rasmussen",
    "Schmidt", "Torres", "Ueda", "Vargas", "Walker", "Xavier", "Yamada", "Zimmer", "Abadi",
    "Berg", "Cole", "Doyle", "Erickson", "Farrell", "Grant", "Hayes", "Iqbal", "Jacobs", "King",
]

_ITEMS = [
    ("single room", "night", "95 pounds", "82 pounds"),
    ("double room", "night", "140 pounds", "120 pounds"),
    ("small car", "day", "40 dollars", "55 dollars"),
    ("large car", "day", "70 dollars", "95 dollars"),
    ("adult ticket", "person", "12 pounds", "18 pounds"),
    ("child ticket", "person", "6 pounds", "9 pounds"),
    ("family pass", "family", "28 pounds", "42 pounds"),
    ("student pass", "term", "180 dollars", "240 dollars"),
    ("gym membership", "year", "300 dollars", "450 dollars"),
    ("bike rental", "hour", "8 dollars", "12 dollars"),
    ("helmet", "unit", "40 pounds", "55 pounds"),
    ("camera", "unit", "220 pounds", "310 pounds"),
    ("phone plan", "month", "15 pounds", "25 pounds"),
    ("broadband plan", "month", "32 pounds", "48 pounds"),
    ("bus pass", "month", "45 dollars", "65 dollars"),
    ("train pass", "month", "120 dollars", "180 dollars"),
    ("concert ticket", "person", "35 pounds", "50 pounds"),
    ("museum entry", "person", "10 pounds", "16 pounds"),
    ("gym class", "session", "9 pounds", "14 pounds"),
    ("swimming lesson", "session", "12 pounds", "18 pounds"),
]

_OPENERS = [
    "Woman: I'd like to book the {item} for this {unit}. Man: Certainly, that will be {price_a}, or {price_b} with the premium option. Woman: I'll take the {price_a} version.",
    "Clerk: Good afternoon. The {item} is {price_a} per {unit}, or {price_b} if you prefer the larger package. Customer: I'll go with {price_a}.",
    "Receptionist: The {item} costs {price_a} for each {unit}, and {price_b} with everything included. Caller: Let me take the {price_a} option.",
    "Agent: For the {item}, the standard rate is {price_a} per {unit} and the full rate is {price_b}. Client: I'll choose {price_a}.",
]

_TIMEPHRASE = [
    ("half past nine", "9:30"), ("quarter past two", "2:15"), ("quarter to twelve", "11:45"),
    ("twenty past ten", "10:20"), ("ten to six", "5:50"), ("five past three", "3:05"),
    ("twenty-five past eight", "8:25"), ("quarter to five", "4:45"), ("seven o'clock", "7:00"),
    ("ten past eleven", "11:10"), ("twenty to nine", "8:40"), ("half past four", "4:30"),
]

_DESTINATIONS = ["library", "café", "gym", "pharmacy", "gift shop", "toilets", "car park", "post office", "laundry room", "meeting room", "print shop", "nursery", "clinic", "booking office"]
_REFERENCE = ["the main entrance", "the fountain", "the ticket desk", "the coatroom", "the café", "the lifts", "the gift shop", "the reception desk", "the garden", "the car park", "the pond", "the staircase", "the bank", "the newsagent"]
_DIRWORDS = ["on your left", "on your right", "opposite", "next to", "behind", "beyond"]

_REASONS = [
    ("the room was too small", "The room was too small"),
    ("the speaker's availability changed", "The speaker's availability changed"),
    ("students requested it", "Students requested it"),
    ("the equipment was not ready", "The equipment was not ready"),
    ("the hall was double-booked", "The hall was double-booked"),
    ("the survey results came in", "The survey results came in"),
    ("the schedule clashed with lectures", "The schedule clashed with lectures"),
    ("the budget was reduced", "The budget was reduced"),
    ("the train strike delayed staff", "The train strike delayed staff"),
    ("the building was being renovated", "The building was being renovated"),
]
_VENUES = ["the workshop", "the seminar", "the clinic", "the meeting", "the class", "the tour", "the talk", "the session", "the drop-in", "the briefing"]

_TOPICS = [
    ("pollinator decline", "habitat fragmentation", "pesticide use"),
    ("household recycling", "collection costs", "lack of bins"),
    ("urban flooding", "surface drainage", "river depth"),
    ("school attendance", "meal programmes", "bus routes"),
    ("ocean pollution", "plastic fishing gear", "tourist litter"),
    ("energy savings", "insulation", "heating hours"),
    ("traffic safety", "protected lanes", "fines for speed"),
    ("library usage", "digital loans", "opening hours"),
]

_NEEDED_ITEMS = ["a whistle", "a stopwatch", "a banner", "sunscreen", "a first-aid kit", "water bottles", "spare batteries", "a map", "a notebook", "gloves"]

_PHONES = [
    "07700 900 214", "07981 222 431", "07780 123 456", "0208 544 1020", "0161 333 4570",
    "07812 990 345", "07769 452 118", "0207 118 2091", "07905 672 330", "0151 220 8871",
    "07971 654 220", "0204 556 7890", "07730 118 452", "0164 220 9091", "07890 401 295",
]
_ADDRESSES = [
    "12 Maple Road", "45 Kingsway", "8 Station Lane", "23 Rosewood Drive", "7 Orchard Close",
    "156 Cedar Street", "3 Harbour Square", "29 Alder Avenue", "71 Pine Walk", "14 Brook Lane",
]
_DATES = [
    ("the sixteenth of May", "16 May"), ("the second of April", "2 April"), ("the twenty-first of July", "21 July"),
    ("the ninth of March", "9 March"), ("the thirtieth of June", "30 June"), ("the fourth of December", "4 December"),
    ("the eighteenth of August", "18 August"), ("the fifth of September", "5 September"),
]

_PEOPLE = _NAMES
_CONCERNS = [
    ("the pool capacity", "booking earlier"),
    ("noisy study rooms", "wearing headphones"),
    ("the cost of materials", "buying in bulk"),
    ("the rigid schedule", "flexible hours"),
    ("the unreliable bus", "carpooling"),
    ("the parking", "riding a bike"),
    ("the food options", "cooking at home"),
    ("the lighting", "bringing a lamp"),
    ("the heating", "layering clothes"),
    ("the queue at the desk", "using the app"),
    ("the wifi signal", "moving to another floor"),
    ("the room size", "using the hall next door"),
]

_used: set[str] = set()
_bank: list[Item] = []
_ids = 0


def _mk(type_label: str, type_name: str, title: str, context: str, prompt: str,
        options: list[str], answer: str, tip: str) -> Item | None:
    global _ids
    key = type_label + "|" + prompt + "|" + answer
    if key in _used:
        return None
    _used.add(key)
    _ids += 1
    return {
        "id": f"lb-listening-{_ids:05d}-{type_name[:4]}",
        "type": type_name,
        "typeLabel": type_label,
        "title": title,
        "context": context,
        "prompt": prompt,
        "options": options,
        "correctAnswer": answer,
        "explanation": f"From the recording: \"{context}\" The required detail is {answer}.",
        "logic": "1. Identify the question keyword (time, place, price, name). 2. Listen for the correction or confirmation. 3. Write the last confirmed detail.",
        "tip": tip,
        "suggestions": "Practise the same field type (numbers, names, places) until capture is instant.",
        "bandAdvice": "Listening rewards focused attention on fixed words: numbers, places, names and times.",
    }


def _part(i: int) -> str:
    return f"Part {i % 4 + 1}"


def build() -> list[Item]:
    if _bank:
        return list(_bank)

    # --- Form / Note Completion: item openers x names x time phrases ---
    made_form: list[Item] = []
    i = 0
    for item, unit, pa, pb in _ITEMS:
        for oi, opener in enumerate(_OPENERS):
            if len(made_form) >= _TARGET:
                break
            i += 1
            scene = opener.format(item=item, unit=unit, price_a=pa, price_b=pb)
            prompts = (
                (f"According to the {oi + 1} call, the premium option for the {item} costs ____ per {unit}.", pb),
                (f"In this booking (call {oi + 1}), the {item} is booked with the ____ option per {unit}.", pa),
            )
            for prompt, answer in prompts:
                if len(made_form) >= _TARGET:
                    break
                item_obj = _mk("Form / Note Completion", "form-completion", f"{_part(i)} · Form detail",
                               scene, prompt, [], answer, _TIPS["Form / Note Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for name in _NAMES:
            if len(made_form) >= _TARGET:
                break
            i += 1
            scene = f"Receptionist: What's your surname, please? Customer: It's {name}. Receptionist: Thank you, and your membership will be ready next week."
            item_obj = _mk("Form / Note Completion", "form-completion", f"{_part(i)} · Surname",
                           scene, "Surname: ____.", [], name, _TIPS["Form / Note Completion"][i % 3])
            if item_obj:
                made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for phrase, numeric in _TIMEPHRASE:
            for day in ("Monday", "Wednesday", "Friday", "Saturday"):
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Guide: The market opens at {phrase} every {day}. The workshop begins an hour later."
                item_obj = _mk("Form / Note Completion", "form-completion", f"{_part(i)} · Opening time",
                               scene, f"The market opens at ____ on {day}.", [], numeric, _TIPS["Form / Note Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for name in _NAMES:
            for phone in _PHONES:
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Advisor: I need a contact number, please. Student: It's {name}, surname {_NAMES[(hash(name) % len(_NAMES))]}, and my mobile is {phone}. Advisor: {phone}, thank you."
                item_obj = _mk("Form / Note Completion", "form-completion", f"{_part(i)} · Contact detail",
                               scene, f"{name}'s mobile number: ____.", [], phone, _TIPS["Form / Note Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for name in _NAMES:
            for addr in _ADDRESSES:
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Clerk: And where shall we send it, {name}? Caller: To {addr}, please. Clerk: {addr}? Noted."
                item_obj = _mk("Form / Note Completion", "form-completion", f"{_part(i)} · Address",
                               scene, f"The delivery address is ____.", [], addr, _TIPS["Form / Note Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for phrase, numeric in _DATES:
            for name in _NAMES:
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Nurse: When does the appointment suit you, {name}? Caller: {phrase} would work. Nurse: {phrase}, confirmed."
                item_obj = _mk("Form / Note Completion", "form-completion", f"{_part(i)} · Appointment",
                               scene, f"{name}'s appointment is on ____.", [], numeric, _TIPS["Form / Note Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)

    # --- Map Labelling: destinations x reference points x directions ---
    made_map: list[Item] = []
    i = 0
    for d, dest in enumerate(_DESTINATIONS):
        for r, ref in enumerate(_REFERENCE):
            if len(made_map) >= _TARGET:
                break
            for k, where in enumerate(_DIRWORDS):
                if len(made_map) >= _TARGET:
                    break
                i += 1
                scene = f"Go past {ref}, and the {dest} is {where} of the entrance."
                item_obj = _mk("Map Labelling", "map-labelling", f"{_part(i)} · Route detail",
                               scene, f"Relative to {ref}, where is the {dest} located?", _DIRWORDS, where,
                               _TIPS["Map Labelling"][(d + r + k) % 3])
                if item_obj:
                    made_map.append(item_obj)

    # --- Multiple Choice: reasons, topics, recommendations, missing items ---
    made_mcq: list[Item] = []
    i = 0
    for reason, answer in _REASONS:
        for venue in _VENUES:
            if len(made_mcq) >= _TARGET:
                break
            i += 1
            scene = f"Announcement: {venue} moves to Thursday because {reason}, and the room was booked Friday anyway."
            item_obj = _mk("Multiple Choice", "multiple-choice", f"{_part(i)} · Change of plan",
                           scene, f"Why was {venue} moved?", ["The room was booked", "The speaker's availability changed", "Students requested it", "The venue closed"], answer,
                           _TIPS["Multiple Choice"][i % 3])
            if item_obj:
                made_mcq.append(item_obj)
    for topic, cause, wrong in _TOPICS:
        if len(made_mcq) >= _TARGET:
            break
        i += 1
        scene = f"Professor: Today we look at {topic}. The biggest driver is {cause}, not {wrong} as most assume."
        for prompt, answer, options in (
            ("What is the main topic of the lecture?", topic, [wrong, cause, "The history of the region", "New technologies"]),
            (f"What does the speaker say is the main cause of {topic}?", cause, [wrong, cause, "Climate change", "Public opinion"]),
        ):
            if len(made_mcq) >= _TARGET:
                break
            item_obj = _mk("Multiple Choice", "multiple-choice", f"{_part(i)} · Lecture focus",
                           scene, prompt, options, answer, _TIPS["Multiple Choice"][i % 3])
            if item_obj:
                made_mcq.append(item_obj)
    for name in _NAMES:
        if len(made_mcq) >= _TARGET:
            break
        for item, unit, pa, pb in _ITEMS:
            if len(made_mcq) >= _TARGET:
                break
            i += 1
            scene = f"Student {name}: Should I book the {item} for a {unit} now? Tutor: It fits your timetable, so I'd choose it today."
            item_obj = _mk("Multiple Choice", "multiple-choice", f"{_part(i)} · Recommendation",
                           scene, f"On {name}'s enquiry about the {item}, what does the tutor recommend?", [f"Book the {item} now", "Wait a month", "Choose another service", "Cancel the plan"],
                           f"Book the {item} now", _TIPS["Multiple Choice"][i % 3])
            if item_obj:
                made_mcq.append(item_obj)
    for k, item in enumerate(_NEEDED_ITEMS):
        if len(made_mcq) >= _TARGET:
            break
        i += 1
        provided = ", ".join(_NEEDED_ITEMS[:k % 4]) if k % 4 else "the basics"
        scene = f"Leader: Each team has {provided} provided. Oh, and someone please bring {item} — the forecast is hot."
        item_obj = _mk("Multiple Choice", "multiple-choice", f"{_part(i)} · What to bring",
                       scene, "Which item must the group still bring?", _NEEDED_ITEMS, item, _TIPS["Multiple Choice"][i % 3])
        if item_obj:
            made_mcq.append(item_obj)

    # Extra breadth: confirm which stated detail matches across item scenes.
    _mcq_extra = [
        ("the single room costs ninety-five pounds for a night", "The single room price is ninety-five pounds", ["It costs eighty-two pounds", "It costs ninety-five pounds", "It costs one hundred and ten pounds", "It costs seventy pounds"]),
        ("the workshop begins at half past nine", "The workshop starts at half past nine", ["It starts at nine o'clock", "It starts at half past nine", "It starts at quarter to ten", "It starts at ten o'clock"]),
        ("payment is taken at the reception desk afterwards", "Payment is made at reception", ["Payment is online", "Payment is at reception", "Payment is by post", "Payment is at the café"]),
        ("the first session is on Saturday morning", "The first session is on Saturday", ["The first session is Sunday", "The first session is Saturday", "The first session is Monday", "The first session is Friday"]),
    ]
    for detail, prompt, options in _mcq_extra:
        for k in range(12):
            if len(made_mcq) >= _TARGET:
                break
            i += 1
            scene = f"Announcer: {detail}. This applies to all applicants this month."
            answer = options[1]
            item_obj = _mk("Multiple Choice", "multiple-choice", f"{_part(i)} · Confirm the detail",
                           scene, prompt, options, answer, _TIPS["Multiple Choice"][i % 3])
            if item_obj:
                made_mcq.append(item_obj)

    # --- Matching: people x concerns ---
    made_match: list[Item] = []
    i = 0
    n = len(_PEOPLE)
    for k in range(len(_CONCERNS) * 30):
        if len(made_match) >= _TARGET:
            break
        a = _PEOPLE[k % n]
        b = _PEOPLE[(k + 5) % n]
        ca, cta = _CONCERNS[k % len(_CONCERNS)]
        cb, cta_b = _CONCERNS[(k + 7) % len(_CONCERNS)]
        i += 1
        scene = f"{a}: The main problem for me is {ca}. {b}: For me it's {cb}, so I'm {cta_b}."
        for prompt, answer in (
            (f"What is {a}'s main concern?", ca),
            (f"What does {b} plan to do about {cb}?", cta_b),
            (f"How does {a} handle {ca}?", cta),
        ):
            if len(made_match) >= _TARGET:
                break
            item_obj = _mk("Matching", "matching", f"{_part(i)} · Matching",
                           scene, prompt, [], answer, _TIPS["Matching"][i % 3])
            if item_obj:
                made_match.append(item_obj)

    # --- Sentence Completion: gap any scene in the bank ---
    made_sc: list[Item] = []
    i = 0
    pool_scenes = (
        [(it["context"], it["title"]) for it in made_form]
        + [(it["context"], it["title"]) for it in made_map]
        + [(it["context"], it["title"]) for it in made_mcq]
        + [(it["context"], it["title"]) for it in made_match]
    )
    for scene, title in pool_scenes:
        if len(made_sc) >= _TARGET:
            break
        words = scene.split()
        if len(words) < 4:
            continue
        for k in range(2):
            if len(made_sc) >= _TARGET:
                break
            pos = 2 + ((i + k * 7) % (len(words) - 2))
            removed = words[pos].strip(".,:?")
            if not removed:
                continue
            gapped = list(words)
            gapped[pos] = "____"
            i += 1
            item_obj = _mk("Sentence Completion", "sentence-completion", f"{_part(i)} · Complete the note",
                           scene, "Complete the sentence with ONE word: " + " ".join(gapped), [], removed,
                           _TIPS["Sentence Completion"][i % 3])
            if item_obj:
                made_sc.append(item_obj)

    _bank.extend(made_mcq)
    _bank.extend(made_map)
    _bank.extend(made_form)
    _bank.extend(made_sc)
    _bank.extend(made_match)
    return list(_bank)


LISTENING_LARGE_BANK = build()

LISTENING_LARGE_BY_TYPE: dict[str, list[Item]] = {}
for _item in LISTENING_LARGE_BANK:
    LISTENING_LARGE_BY_TYPE.setdefault(_item["typeLabel"], []).append(_item)
