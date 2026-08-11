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
    ("Map / Plan / Diagram Labelling", "map-labelling"),
    ("Form Completion", "form-completion"),
    ("Note Completion", "note-completion"),
    ("Table Completion", "table-completion"),
    ("Flow-chart Completion", "flow-chart-completion"),
    ("Summary Completion", "summary-completion"),
    ("Sentence Completion", "sentence-completion"),
    ("Short Answer", "short-answer"),
    ("Matching", "matching"),
]

_TIPS = {
    "Multiple Choice": ["Listen for the REASON stated, not just repeated words.", "Distractors repeat heard words with a different meaning.", "The answer is usually the option that paraphrases the speaker."],
    "Map / Plan / Diagram Labelling": ["Identify the visual (map, plan or diagram) and trace the route or the part labels.", "Listen for left/right/opposite/next to.", "The last place mentioned is often the answer."],
    "Form Completion": ["Numbers and names are repeated — the second version is reliable.", "Write as you hear; copy the spelling exactly.", "The field label tells you what to listen for."],
    "Note Completion": ["Notes are short: predict the missing type (name, number, time).", "Copy the exact recorded words.", "Each note follows the order of the recording."],
    "Table Completion": ["Read the row and column headers to predict the missing cell.", "Answers are usually copied exactly from the recording.", "Work through the table in the order of the audio."],
    "Flow-chart Completion": ["Read the steps and arrows: each gap continues the previous stage.", "Answers come in the order they are heard.", "Copy exact words, watch plural endings."],
    "Summary Completion": ["Read the summary before the audio and predict each gap.", "Keep to the word limit.", "The summary follows the recording order."],
    "Sentence Completion": ["Respect the word limit.", "Copy exact words, do not paraphrase.", "Underline the key word in the gap sentence first."],
    "Short Answer": ["Read the question and predict the fact type (place, price, time).", "Answers are usually one or two words.", "Do not add detail the question does not ask for."],
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

_MCQ_EXTRA = [
    ("the single room costs ninety-five pounds for a night", "The single room price is ninety-five pounds", ["It costs eighty-two pounds", "It costs ninety-five pounds", "It costs one hundred and ten pounds", "It costs seventy pounds"]),
    ("the workshop begins at half past nine", "The workshop starts at half past nine", ["It starts at nine o'clock", "It starts at half past nine", "It starts at quarter to ten", "It starts at ten o'clock"]),
    ("payment is taken at the reception desk afterwards", "Payment is made at reception", ["Payment is online", "Payment is at reception", "Payment is by post", "Payment is at the café"]),
    ("the first session is on Saturday morning", "The first session is on Saturday", ["The first session is Sunday", "The first session is Saturday", "The first session is Monday", "The first session is Friday"]),
]

_FLOW_SETS = [
    ("entering the hall", "finding the seat", "collecting the programme"),
    ("booking online", "receiving a confirmation", "paying at the desk"),
    ("choosing the room", "signing the form", "meeting the tutor"),
    ("checking the map", "walking to the gate", "showing the pass"),
    ("filling the tray", "selecting the oil", "fitting the filter"),
    ("pressing the button", "heating the water", "pouring the coffee"),
    ("locking the bike", "attaching the helmet", "switching the lamp"),
    ("sorting the clothes", "loading the drum", "starting the cycle"),
    ("watering the garden", "installing the timer", "checking the drip line"),
    ("fitting the mirror", "plugging the cable", "testing the sensor"),
    ("entering the venue", "finding the seat", "registering the ticket"),
    ("opening the door", "entering the code", "saving the changes"),
    ("loading the trolley", "weighing the items", "printing the label"),
    ("turning the key", "lifting the lid", "opening the gate"),
    ("mixing the powder", "adding the water", "stirring the mixture"),
    ("closing the timer", "boiling the water", "steeping the tea"),
    ("inserting the card", "entering the pin", "collecting the cash"),
    ("kneading the dough", "shaping the rolls", "baking the bread"),
    ("trimming the plants", "cutting the lawn", "mulching the beds"),
    ("assembling the frame", "fixing the wheels", "tightening the bolts"),
    ("scanning the ticket", "walking through the gate", "boarding the coach"),
    ("selecting the yarn", "loading the loom", "starting the weave"),
    ("checking the tyre", "pumping the air", "sealing the valve"),
    ("washing the tanks", "filling the vat", "starting the brew"),
    ("choosing the seat", "fastening the belt", "lowering the tray"),
    ("raising the ladder", "fixing the hooks", "testing the weight"),
    ("peeling the cable", "connecting the joints", "testing the signal"),
    ("uploading the file", "checking the names", "sending the invite"),
    ("harvesting the pods", "drying the beans", "packing the sacks"),
    ("cleaning the lenses", "adjusting the focus", "catching the image"),
    ("folding the paper", "gluing the edges", "pressing the fold"),
    ("watering the soil", "placing the seeds", "covering the tray"),
    ("tying the ropes", "hoisting the sail", "securing the cleat"),
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
                item_obj = _mk("Form Completion", "form-completion", f"{_part(i)} · Form detail",
                               scene, prompt, [], answer, _TIPS["Form Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for name in _NAMES:
            if len(made_form) >= _TARGET:
                break
            i += 1
            scene = f"Receptionist: What's your surname, please? Customer: It's {name}. Receptionist: Thank you, and your membership will be ready next week."
            item_obj = _mk("Form Completion", "form-completion", f"{_part(i)} · Surname",
                           scene, "Surname: ____.", [], name, _TIPS["Form Completion"][i % 3])
            if item_obj:
                made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for phrase, numeric in _TIMEPHRASE:
            for day in ("Monday", "Wednesday", "Friday", "Saturday"):
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Guide: The market opens at {phrase} every {day}. The workshop begins an hour later."
                item_obj = _mk("Form Completion", "form-completion", f"{_part(i)} · Opening time",
                               scene, f"The market opens at ____ on {day}.", [], numeric, _TIPS["Form Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for name in _NAMES:
            for phone in _PHONES:
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Advisor: I need a contact number, please. Student: It's {name}, surname {_NAMES[(hash(name) % len(_NAMES))]}, and my mobile is {phone}. Advisor: {phone}, thank you."
                item_obj = _mk("Form Completion", "form-completion", f"{_part(i)} · Contact detail",
                               scene, f"{name}'s mobile number: ____.", [], phone, _TIPS["Form Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for name in _NAMES:
            for addr in _ADDRESSES:
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Clerk: And where shall we send it, {name}? Caller: To {addr}, please. Clerk: {addr}? Noted."
                item_obj = _mk("Form Completion", "form-completion", f"{_part(i)} · Address",
                               scene, f"The delivery address is ____.", [], addr, _TIPS["Form Completion"][i % 3])
                if item_obj:
                    made_form.append(item_obj)
    if len(made_form) < _TARGET:
        for phrase, numeric in _DATES:
            for name in _NAMES:
                if len(made_form) >= _TARGET:
                    break
                i += 1
                scene = f"Nurse: When does the appointment suit you, {name}? Caller: {phrase} would work. Nurse: {phrase}, confirmed."
                item_obj = _mk("Form Completion", "form-completion", f"{_part(i)} · Appointment",
                               scene, f"{name}'s appointment is on ____.", [], numeric, _TIPS["Form Completion"][i % 3])
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
                item_obj = _mk("Map / Plan / Diagram Labelling", "map-labelling", f"{_part(i)} · Route detail",
                               scene, f"Relative to {ref}, where is the {dest} located?", _DIRWORDS, where,
                               _TIPS["Map / Plan / Diagram Labelling"][(d + r + k) % 3])
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
    for detail, prompt, options in _MCQ_EXTRA:
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

# --- Note Completion: short notes from names x items x times ---
    made_note: list[Item] = []
    i = 0
    for name in _NAMES:
        if len(made_note) >= _TARGET:
            break
        for item, unit, pa, pb in _ITEMS[:10]:
            if len(made_note) >= _TARGET:
                break
            i += 1
            scene = f"Clerk: Booking the {item} for {name}? The rate is {pa} per {unit}. Student: That matches my notes."
            item_obj = _mk("Note Completion", "note-completion", f"{_part(i)} · Note",
                           scene, f"Notes · {name} · {item}: rate ____ per {unit}.", [], pa,
                           _TIPS["Note Completion"][i % 3])
            if item_obj:
                made_note.append(item_obj)
    for phrase, numeric in _TIMEPHRASE:
        if len(made_note) >= _TARGET:
            break
        for venue in _VENUES:
            if len(made_note) >= _TARGET:
                break
            i += 1
            scene = f"Announcer: {venue} today starts at {phrase} and runs for one hour."
            item_obj = _mk("Note Completion", "note-completion", f"{_part(i)} · Note",
                           scene, f"Notes · {venue}: starts at ____.", [], numeric,
                           _TIPS["Note Completion"][i % 3])
            if item_obj:
                made_note.append(item_obj)
    if len(made_note) < _TARGET:
        for name in _NAMES:
            if len(made_note) >= _TARGET:
                break
            i += 1
            scene = f"Receptionist: Surname, please. Guest: It's {name}. I'm here for the Geology course."
            item_obj = _mk("Note Completion", "note-completion", f"{_part(i)} · Note",
                           scene, "Notes · surname ____ · course Geology.", [], name,
                           _TIPS["Note Completion"][i % 3])
            if item_obj:
                made_note.append(item_obj)

    # --- Table Completion: fee tables with venues x items x fields ---
    made_table: list[Item] = []
    i = 0
    for venue in _VENUES:
        if len(made_table) >= _TARGET:
            break
        for item, unit, pa, pb in _ITEMS:
            if len(made_table) >= _TARGET:
                break
            i += 1
            scene = f"{venue}: standard {item} {pa} per {unit}, premium {pb} per {unit}."
            item_obj = _mk("Table Completion", "table-completion", f"{_part(i)} · Table row",
                           scene, f"Complete the table · {venue} — {item}: standard ____; premium {pb}.",
                           [], pa, _TIPS["Table Completion"][i % 3])
            if item_obj:
                made_table.append(item_obj)
            if len(made_table) >= _TARGET:
                break
            i += 1
            item_obj = _mk("Table Completion", "table-completion", f"{_part(i)} · Table row",
                           scene, f"Complete the table · {venue} — {item}: premium ____ (fill the right column).",
                           [], pb, _TIPS["Table Completion"][i % 3])
            if item_obj:
                made_table.append(item_obj)
    if len(made_table) < _TARGET:
        for day in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "New Year", "Bank holiday", "Sale week"):
            if len(made_table) >= _TARGET:
                break
            for item, unit, pa, pb in _ITEMS:
                if len(made_table) >= _TARGET:
                    break
                i += 1
                scene = f"On {day} the {item} rate shifts: standard {pa}, premium {pb} per {unit}."
                item_obj = _mk("Table Completion", "table-completion", f"{_part(i)} · Table row",
                               scene, f"Table · {day}: {item} · standard ____ · premium {pb} ({unit}).",
                               [], pa, _TIPS["Table Completion"][i % 3])
                if item_obj:
                    made_table.append(item_obj)

    # --- Flow-chart Completion: stage sequences x people x options ---
    made_flow: list[Item] = []
    i = 0
    for stages in _FLOW_SETS:
        if len(made_flow) >= _TARGET:
            break
        for venue in _VENUES:
            if len(made_flow) >= _TARGET:
                break
            i += 1
            scene = f"At the {venue}: {stages[0]}, then {stages[1]} and finally {stages[2]}."
            item_obj = _mk("Flow-chart Completion", "flow-chart-completion", f"{_part(i)} · Flow step",
                           scene,
                           f"Complete the flow-chart for the {venue}: start → {stages[0]} → {stages[1]} → ____",
                           [], stages[2], _TIPS["Flow-chart Completion"][i % 3])
            if item_obj:
                made_flow.append(item_obj)
            if len(made_flow) >= _TARGET:
                break
            i += 1
            item_obj = _mk("Flow-chart Completion", "flow-chart-completion", f"{_part(i)} · Flow step",
                           scene,
                           f"Complete the flow-chart for the {venue}: start → ____ → {stages[1]} → {stages[2]}",
                           [], stages[0], _TIPS["Flow-chart Completion"][i % 3])
            if item_obj:
                made_flow.append(item_obj)

    # --- Summary Completion: one-gap summaries over bank scenes ---
    made_summary: list[Item] = []
    i = 0
    for scene, title in pool_scenes:
        if len(made_summary) >= _TARGET:
            break
        words = scene.split()
        if len(words) < 6:
            continue
        for k in range(2):
            if len(made_summary) >= _TARGET:
                break
            pos = 3 + ((i * 11 + k * 5) % (len(words) - 3))
            gap_word = words[pos].strip(".,:?")
            if len(gap_word) < 3 or not gap_word[0].isalpha():
                continue
            i += 1
            gapped = list(words)
            gapped[pos] = "____"
            item_obj = _mk("Summary Completion", "summary-completion", f"{_part(i)} · Summary",
                           scene, "Complete the summary with ONE word: " + " ".join(gapped) + ".",
                           [], gap_word.lower(), _TIPS["Summary Completion"][i % 3])
            if item_obj:
                made_summary.append(item_obj)

    # --- Short Answer: one/two-word factual questions from the same pools ---
    made_sa: list[Item] = []
    i = 0
    for name in _NAMES:
        if len(made_sa) >= _TARGET:
            break
        for phone in _PHONES:
            if len(made_sa) >= _TARGET:
                break
            i += 1
            scene = f"Advisor: Contact details, please. Student: I'm {name} and my mobile is {phone}."
            item_obj = _mk("Short Answer", "short-answer", f"{_part(i)} · Short answer",
                           scene, f"What is {name}'s mobile number?", [], phone,
                           _TIPS["Short Answer"][i % 3])
            if item_obj:
                made_sa.append(item_obj)
    if len(made_sa) < _TARGET:
        for phrase, numeric in _TIMEPHRASE:
            if len(made_sa) >= _TARGET:
                break
            for venue in _VENUES:
                if len(made_sa) >= _TARGET:
                    break
                i += 1
                scene = f"The {venue} opens at {phrase} on weekdays and an hour later at weekends."
                item_obj = _mk("Short Answer", "short-answer", f"{_part(i)} · Short answer",
                               scene, f"What time does the {venue} open on weekdays?", [], numeric,
                               _TIPS["Short Answer"][i % 3])
                if item_obj:
                    made_sa.append(item_obj)
    if len(made_sa) < _TARGET:
        for item, unit, pa, pb in _ITEMS:
            if len(made_sa) >= _TARGET:
                break
            for day in ("Friday", "Saturday"):
                if len(made_sa) >= _TARGET:
                    break
                i += 1
                scene = f"The {item} is {pa} per {unit} on weekdays and {pb} on {day}."
                item_obj = _mk("Short Answer", "short-answer", f"{_part(i)} · Short answer",
                               scene, f"On {day}, the usual market rate for the {item} is how much per {unit}?", [], pb,
                               _TIPS["Short Answer"][i % 3])
                if item_obj:
                    made_sa.append(item_obj)
    for phrase, numeric in _TIMEPHRASE:
        if len(made_sa) >= _TARGET:
            break
        i += 1
        item_obj = _mk("Short Answer", "short-answer", f"{_part(i)} · Short answer",
                       f"The library opens at {phrase} on weekdays.",
                       "What time does the library open on weekdays?",
                       [], numeric, _TIPS["Short Answer"][i % 3])
        if item_obj:
            made_sa.append(item_obj)

    _bank.extend(made_mcq)
    _bank.extend(made_map)
    _bank.extend(made_form)
    _bank.extend(made_note)
    _bank.extend(made_table)
    _bank.extend(made_flow)
    _bank.extend(made_summary)
    _bank.extend(made_sa)
    _bank.extend(made_sc)
    _bank.extend(made_match)
    return list(_bank)


LISTENING_LARGE_BANK = build()

LISTENING_LARGE_BY_TYPE: dict[str, list[Item]] = {}
for _item in LISTENING_LARGE_BANK:
    LISTENING_LARGE_BY_TYPE.setdefault(_item["typeLabel"], []).append(_item)
