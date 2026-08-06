"""AI Orchestrator.

The frontend sends "give me practice". It never decides anything. This
pipeline decides WHAT to generate, based on the student's stored profile,
then asks Gemini for fresh original questions (or uses the offline bank).

Pipeline: load profile -> history -> analyse bands -> detect weaknesses ->
choose skill/type/topic/difficulty -> consult knowledge base -> build prompt
-> Gemini -> validate -> return session. Every step is visible in `pipeline`."""

import random
import re
from typing import Any

from . import knowledge_base as kb
from . import gemini
from . import reading_bank
from . import listening_bank
from . import writing_bank
from . import speaking_bank

SKILLS = ("reading", "listening", "writing", "speaking")


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def profile_bands(profile: dict | None) -> dict:
    bands = (profile or {}).get("bands") or {}
    return {
        "reading": float(bands.get("reading", 5.5) or 5.5),
        "listening": float(bands.get("listening", 5.5) or 5.5),
        "writing": float(bands.get("writing", 5.5) or 5.5),
        "speaking": float(bands.get("speaking", 5.5) or 5.5),
    }


def profile_test_type(profile: dict | None) -> str:
    value = str((profile or {}).get("testType") or "academic").strip().lower()
    return value if value in ("academic", "general") else "academic"


def overall_band(bands: dict) -> float:
    return round(sum(bands[s] for s in SKILLS) / 4 * 2) / 2


def detect_weaknesses(bands: dict, weak_types: list[str], weak_topics: list[str]) -> list[str]:
    weaknesses: list[str] = []
    weakest = min(bands, key=lambda s: bands[s])
    if bands[weakest] <= 6.5:
        weaknesses.append(f"{weakest.capitalize()} band is lowest at {bands[weakest]}")
    if weak_types:
        weaknesses.append(f"Struggles with {weak_types[0]}")
    for topic in weak_topics[:2]:
        weaknesses.append(f"Weak topic: {topic}")
    if not weaknesses:
        weaknesses.append("Bands are balanced; raising accuracy and speed will lift the overall band")
    return weaknesses


# ---------------------------------------------------------------------------
# Offline question bank (original, IELTS-style). Used when Gemini is off.
# ---------------------------------------------------------------------------

READING_ITEMS = [
    {
        "type": "multiple-choice",
        "title": "Main idea",
        "context": "A short passage explains that traffic congestion in cities has fallen since cycling lanes were expanded, while bus times have stayed the same.",
        "prompt": "According to the text, what has changed in the city?",
        "options": ["Bus times improved", "Congestion decreased", "Cycling lanes were removed", "Car use increased"],
        "correctAnswer": "Congestion decreased",
        "explanation": "The text states congestion 'has fallen' since cycling lanes expanded. Bus times 'stayed the same', so option 1 is wrong.",
        "tip": "Underline the noun + verb (congestion + fallen) and match it to an option. Watch for answers that are true in real life but not in the text.",
    },
    {
        "type": "true-false",
        "title": "Fact check",
        "context": "The museum allows photography but bans flash, while the gallery next door bans photography entirely.",
        "prompt": "The gallery allows photography without a flash.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "False",
        "explanation": "The gallery bans photography 'entirely', so allowing flash photography is the opposite (False).",
        "tip": "True/False is about facts in the text. 'False' means the text contradicts it, not that it is a bad idea.",
    },
    {
        "type": "sentence-completion",
        "title": "One-word gap",
        "context": "Researchers found that children who read daily showed a larger vocabulary by the age of seven, mainly because books introduce words used rarely in conversation.",
        "prompt": "Daily reading gives children a bigger vocabulary by exposing them to words that are rare in everyday ____.",
        "correctAnswer": "conversation",
        "explanation": "The text: 'books introduce words used rarely in conversation'. The gap asks for the noun.",
        "tip": "If the limit is ONE WORD, copy the exact word from the text. Check the part of speech the sentence needs.",
    },
    {
        "type": "short-answer",
        "title": "Find the number",
        "context": "The first solar farm opened in 2011 with 30 panels; after an upgrade in 2018 it generated enough power for 2,400 homes.",
        "prompt": "How many homes could the upgraded solar farm power?",
        "correctAnswer": "2,400",
        "explanation": "The upgraded farm 'generated enough power for 2,400 homes'.",
        "tip": "Scan for the keyword 'homes' and copy the number exactly, including commas if shown.",
    },
    {
        "type": "matching-headings",
        "title": "Paragraph purpose",
        "context": "Paragraph A describes the problem of food waste in supermarkets. Paragraph B explains how reduced prices at closing time cut waste by a third. Paragraph C gives advice for consumers.",
        "prompt": "Choose the heading that best fits Paragraph B.",
        "options": ["The scale of the problem", "A solution that works", "Advice for shoppers", "Future research"],
        "correctAnswer": "A solution that works",
        "explanation": "Paragraph B is about a measure ('reduced prices') that 'cut waste by a third', i.e. a working solution.",
        "tip": "Match the MAIN idea of the whole paragraph, not a single detail. First + last sentence usually carry the main idea.",
    },
    {
        "type": "yes-no-not-given",
        "title": "Writer's opinion",
        "context": "The author writes: 'Remote work has improved productivity for many teams, though it is not suitable for every role.'",
        "prompt": "The author believes remote work benefits all roles.",
        "options": ["Yes", "No", "Not Given"],
        "correctAnswer": "No",
        "explanation": "The author says remote work is 'not suitable for every role', so believing it benefits ALL roles contradicts the text (No).",
        "tip": "Yes/No/Not Given asks about the WRITER'S view. Use 'No' only when the writer says the opposite.",
    },
    {
        "type": "matching",
        "title": "Match the features",
        "context": "Scientists studied three diets: Diet X raised energy levels quickly. Diet Y improved long-term focus. Diet Z reduced sleep quality.",
        "prompt": "Which diet improves long-term focus?",
        "options": ["Diet X", "Diet Y", "Diet Z"],
        "correctAnswer": "Diet Y",
        "explanation": "'Diet Y improved long-term focus' is stated directly in the text.",
        "tip": "Write the letter next to each feature as you read, then transfer answers — this saves re-reading.",
    },
    {
        "type": "summary-completion",
        "title": "Summary gap",
        "context": "Urban trees lower temperatures through shade and by releasing water vapour, which together can cool a street by several degrees on hot days.",
        "prompt": "Trees cool streets because of shade and the release of ____.",
        "correctAnswer": "water vapour",
        "explanation": "The passage: 'shade and by releasing water vapour'. The limit allows two words.",
        "tip": "Check the word limit on the summary. Keep the answer grammatically parallel to the surrounding sentence.",
    },
]

LISTENING_ITEMS = [
    {
        "type": "form-completion",
        "title": "Hotel booking",
        "context": "Woman: I'd like a single room for Friday night. Man: Certainly. That will be 95 pounds with breakfast, or 82 without.",
        "prompt": "Single room with breakfast: £____",
        "correctAnswer": "95",
        "explanation": "The man states '95 pounds with breakfast'.",
        "tip": "Numbers and prices are almost always tested. Listen for the correction (here, the first price is repeated with an option).",
    },
    {
        "type": "map-labelling",
        "title": "Where is the library?",
        "context": "Go past the main entrance, turn left at the fountain, and the library is the second building on your right.",
        "prompt": "The library is on the ____ of the fountain.",
        "options": ["left", "right", "opposite", "corner"],
        "correctAnswer": "right",
        "explanation": "After the fountain you turn left, and the library is the 'second building on your right'.",
        "tip": "Trace the route. The answer is about where the DESTINATION is, not where you turn.",
    },
    {
        "type": "multiple-choice",
        "title": "Why does the student call?",
        "context": "Student: I missed the enrolment deadline, but I was abroad. Could I still join the photography course? Advisor: I'm afraid enrolment has closed, but the waiting list is open.",
        "prompt": "Why does the student call?",
        "options": ["To change courses", "To ask about a late enrolment", "To cancel a booking", "To complain"],
        "correctAnswer": "To ask about a late enrolment",
        "explanation": "The student 'missed the enrolment deadline' and asks to still join, i.e. a late enrolment.",
        "tip": "Listen for the REASON stated by the speaker, not just repeated words. Options often contain words you hear but with a different meaning.",
    },
    {
        "type": "note-completion",
        "title": "Enrolment form",
        "context": "Advisor: What's your surname? Student: Harrison, that's H-A-R-R-I-S-O-N. Advisor: And your phone? Student: 07700 900 214.",
        "prompt": "Phone number: ____",
        "correctAnswer": "07700 900 214",
        "explanation": "The student spells his surname and repeats the number.",
        "tip": "Numbers are often repeated — the second version is the reliable one. Write as you hear.",
    },
    {
        "type": "sentence-completion",
        "title": "Tour date",
        "context": "The guided tour runs every Saturday. Group bookings also open on Wednesday afternoons this month.",
        "prompt": "Guided tours take place on ____.",
        "correctAnswer": "Saturday",
        "explanation": "'The guided tour runs every Saturday'.",
        "tip": "Hear the day, check the spelling, and answer in exactly the word limit.",
    },
    {
        "type": "matching",
        "title": "Match the facilities",
        "context": "The gym is free for all students. The pool is free for staff. The library is free for everyone.",
        "prompt": "Who can use the pool for free?",
        "options": ["Students", "Staff", "Everyone"],
        "correctAnswer": "Staff",
        "explanation": "'The pool is free for staff.'",
        "tip": "With matching, keep a mental list (gym-students, pool-staff, library-everyone) so you can answer quickly.",
    },
    {
        "type": "short-answer",
        "title": "Opening time",
        "context": "The café opens at 8 in the morning and closes at 6, but on Sundays it opens an hour later.",
        "prompt": "What time does the café open on Sundays?",
        "correctAnswer": "9 (a.m.)",
        "explanation": "Sunday opening is one hour later than 8, i.e. 9 a.m.",
        "tip": "The second time mentioned is usually the answer. Always include a.m./p.m. if the context needs it.",
    },
    {
        "type": "table-completion",
        "title": "Prices",
        "context": "Adult tickets cost 12 pounds, children under 12 pay 6, and family passes are 28.",
        "prompt": "Child ticket: £____",
        "correctAnswer": "6",
        "explanation": "'Children under 12 pay 6' pounds.",
        "tip": "Skim the table before the audio to predict the missing column (here: prices).",
    },
]

WRITING_ITEMS = [
    {
        "type": "essay",
        "title": "Task 2 Opinion",
        "prompt": "Some people believe that universities should focus only on academic subjects, while others argue that practical skills are equally important. Discuss both views and give your own opinion.",
        "correctAnswer": "Model answer: universities should teach both, because academic theory builds deep knowledge while practical skills prepare students for work. I agree that a balanced curriculum is best.",
        "explanation": "A strong answer states a clear position, discusses both sides fairly, gives reasons, and uses an example.",
        "tip": "Introduction: paraphrase + your position. Two body paragraphs: one per view. Conclusion: restate your opinion. 250+ words.",
    },
    {
        "type": "essay",
        "title": "Task 2 Discussion",
        "prompt": "Technology has changed the way students learn. Discuss the advantages and disadvantages of this development.",
        "correctAnswer": "Model answer: advantages include instant access to information and personalised feedback; disadvantages include distraction and overdependence. Balance both and conclude with your view.",
        "explanation": "A band 7 answer uses a clear paragraph structure, linking words, and specific examples.",
        "tip": "One paragraph for advantages, one for disadvantages, then a balanced conclusion. Use data language and topic vocabulary.",
    },
    {
        "type": "essay",
        "title": "Task 2 Problem / Solution",
        "prompt": "Traffic congestion is growing in many cities. What are the causes of this problem, and what solutions can you suggest?",
        "correctAnswer": "Model answer: causes are car ownership growth and poor public transport; solutions include congestion pricing, better cycling lanes, and remote work policies.",
        "explanation": "Answer the two-part question: causes AND solutions. Link each solution to a cause.",
        "tip": "Use conditionals ('If cities invest in...') and give a concrete example for each solution.",
    },
    {
        "type": "essay",
        "title": "Task 1 Report",
        "prompt": "The chart shows the number of international students at a university from 2010 to 2025. Summarise the information and make comparisons.",
        "correctAnswer": "Model answer: overall, numbers rose steadily, with the sharpest growth after 2018. Asia contributed the largest share throughout, while Africa, though smallest, doubled over the period.",
        "explanation": "Task 1 needs an overview, grouped data, and comparisons — no opinion.",
        "tip": "Write the overview after the introduction. Compare (highest/lowest, increased/decreased) instead of listing every number.",
        "chart": {
            "type": "bar",
            "title": "International students at a university (2010-2025)",
            "unit": "students",
            "categories": ["2010", "2013", "2016", "2019", "2022", "2025"],
            "values": [3000, 3500, 3800, 4200, 6000, 7500],
        },
    },
    {
        "type": "essay",
        "title": "Task 2 Advantages / Disadvantages",
        "prompt": "Many people work from home today. What are the advantages and disadvantages of remote working?",
        "correctAnswer": "Model answer: advantages are flexibility and no commuting; disadvantages are isolation and blurred work-life boundaries. Conclude with conditions that make remote work succeed.",
        "explanation": "Cover BOTH sides clearly and state a reasoned conclusion.",
        "tip": "Use phrases like 'On the one hand... On the other hand...'. Give one developed example per side.",
    },
    {
        "type": "essay",
        "title": "Task 2 Double Question",
        "prompt": "More people are buying food online. Why is this happening, and is it a positive or negative development?",
        "correctAnswer": "Model answer: convenience and wider choice drive online food shopping; it is largely positive if delivery quality and food safety are managed.",
        "explanation": "Answer BOTH questions in separate paragraphs and link them.",
        "tip": "Plan before writing: 5 minutes. Check that each paragraph answers one specific question.",
    },
]

SPEAKING_ITEMS = [
    {
        "type": "speaking-cue",
        "title": "Part 1 Interview",
        "prompt": "Do you prefer to study in the morning or in the evening? Why?",
        "correctAnswer": "Model answer: I prefer mornings because I focus better before the day gets busy. For example, I review vocabulary right after breakfast when the flat is quiet.",
        "explanation": "Answer directly, add a reason, and give one small example. Avoid one-word answers.",
        "tip": "Structure: answer + reason + example. Use 'because', 'for example', 'actually'.",
    },
    {
        "type": "speaking-cue",
        "title": "Part 2 Cue Card",
        "prompt": "Describe a place where you concentrate best. You should say: where it is, what you do there, and why it helps you focus.",
        "correctAnswer": "Model answer: I concentrate best in a small public library near my apartment. It is quiet but not silent, so I feel calm without feeling isolated. I read articles and plan essays there. It helps because everyone around me is working, which keeps me disciplined.",
        "explanation": "Use the 4 prompt points as paragraph markers and speak for 1-2 minutes.",
        "tip": "Use your 1-minute preparation to write 4 keywords. Keep talking with small details so you never go silent.",
    },
    {
        "type": "speaking-cue",
        "title": "Part 3 Discussion",
        "prompt": "Do you think schools should teach students how to manage their own learning? Why?",
        "correctAnswer": "Model answer: Yes, because many future skills will change. If students learn how to research, test ideas, and improve from feedback, they can adapt to new jobs. For instance, self-managed learners can retrain quickly when industries change.",
        "explanation": "Give an opinion, explain it, and support with an example or comparison.",
        "tip": "Treat Part 3 like a mini essay: claim, reason, example. Use conditionals ('If students learn...').",
    },
    {
        "type": "speaking-cue",
        "title": "Part 1 Interview",
        "prompt": "What kinds of apps do you use most often?",
        "correctAnswer": "Model answer: I use study and transport apps most often because they help me organise my day. The study app reminds me of my practice schedule, and the transport app helps me plan my commute.",
        "explanation": "Name the apps and say why you use them — reason plus detail.",
        "tip": "Extend answers with a second sentence that adds detail. Avoid memorised answers.",
    },
    {
        "type": "speaking-cue",
        "title": "Part 2 Cue Card",
        "prompt": "Describe a habit that helps you stay healthy. You should say: what it is, how often you do it, and why it is important to you.",
        "correctAnswer": "Model answer: A habit that helps me stay healthy is walking after dinner. I do it every evening for about twenty minutes. It helps me digest food, clear my mind, and reduce screen time before bed, so I sleep better.",
        "explanation": "Cover all three prompt points with specific details and time markers.",
        "tip": "Add time and frequency words (every evening, about twenty minutes) — they show fluency and range.",
    },
    {
        "type": "speaking-cue",
        "title": "Part 3 Discussion",
        "prompt": "How has technology changed the way people learn languages?",
        "correctAnswer": "Model answer: Technology has made language learning more accessible because apps, podcasts, and video calls connect learners to native speakers. On the other hand, it can make learners passive if they only watch instead of speaking. I think the best learners combine apps with real conversation.",
        "explanation": "Give a balanced view with a clear final opinion.",
        "tip": "Use contrast markers: 'On the other hand', 'However', 'I think the best...'.",
    },
]

FALLBACK_ITEMS = {
    "reading": READING_ITEMS,
    "listening": LISTENING_ITEMS,
    "writing": WRITING_ITEMS,
    "speaking": SPEAKING_ITEMS,
}

TYPE_FOCUS = {
    "multiple-choice": "Precise option elimination against the source text",
    "true-false": "Logical True / False / Not Given decision",
    "yes-no-not-given": "Writer-opinion logic (Yes / No / Not Given)",
    "matching-headings": "Whole-paragraph main idea",
    "sentence-completion": "Exact word capture with correct part of speech",
    "short-answer": "Keyword scanning and exact copying",
    "matching": "Feature-to-option matching under time pressure",
    "matching-sentence-endings": "Logical sentence completion from text meaning",
    "summary-completion": "Gap prediction and word limit discipline",
    "form-completion": "Detail capture in forms and notes",
    "map-labelling": "Route tracing and direction language",
    "table-completion": "Column prediction before audio",
    "essay": "Task Achievement, Coherence, Lexical Resource, Grammar",
    "speaking-cue": "Fluency, lexical range, grammar, pronunciation",
}


def _build_fallback_session(module: str, mode: str, count: int, bands: dict, test_type: str = "academic") -> dict:
    bank = FALLBACK_ITEMS[module]
    topics = kb.TOPICS[module]
    types = kb.question_types_for(module, mode)
    difficulty = round(bands.get(module, 5.5) + 0.5, 1)
    items: list[dict] = []

    if module == "reading":
        pool = reading_bank.items_for_mode(mode)
        bank = pool if pool else bank
    elif module == "listening":
        pool = listening_bank.items_for_mode(mode)
        bank = pool if pool else bank
    elif module == "writing":
        pool = writing_bank.items_for_mode(mode)
        if mode == "Full Writing Section" and count >= 2:
            data_pool = writing_bank.items_for_type("Task 1 Report (Data)") or pool
            essay_pool = writing_bank.WRITING_BY_TYPE.get("Task 2 Opinion") or pool
            bank = [data_pool[0], essay_pool[0]]
        else:
            bank = pool if pool else bank
    elif module == "speaking":
        pool = speaking_bank.items_for_mode(mode)
        bank = pool if pool else bank

    bank = list(bank)
    random.shuffle(bank)

    for index in range(count):
        base = bank[index % max(1, len(bank))]
        topic = topics[(index * 7 + index // max(1, len(bank))) % len(topics)]
        variant = index // max(1, len(bank))
        title = f"{base['title']} · {topic}"
        prompt = base["prompt"]
        if variant % 3 == 2 and base["type"] not in ("essay", "speaking-cue"):
            prompt = f"{base['prompt']} (Topic: {topic})"
        item = {
            "id": f"{module}-{index + 1}-{base['type'][:4]}",
            "skill": module,
            "type": base["type"],
            "title": title,
            "prompt": prompt,
            "context": base.get("context", ""),
            "options": base.get("options", []),
            "expectedFocus": TYPE_FOCUS.get(base["type"], base["type"]),
            "descriptorFocus": TYPE_FOCUS.get(base["type"], base["type"]),
            "correctAnswer": base.get("correctAnswer", ""),
            "explanation": base.get("explanation", ""),
            "logic": base.get("logic", ""),
            "tip": base.get("tip", "Review this question type in the section blueprint and practise again."),
            "suggestions": base.get("suggestions", ""),
            "bandAdvice": base.get("bandAdvice", ""),
            "chart": base.get("chart") or {},
        }
        items.append(item)

    if module == "writing":
        items = _ensure_writing_chart(items)
    elif module == "reading" and mode == "Full Reading Section":
        passage_texts = list(dict.fromkeys((str(it.get("context") or "").strip() for it in items if str(it.get("context") or "").strip())))
        if not passage_texts:
            passage_texts = ["A short reading passage follows. Read it before answering the questions."]
        for idx, item in enumerate(items):
            passage_index = idx % 3
            item["context"] = passage_texts[passage_index % len(passage_texts)]
            title = str(item.get("title") or "Practice question")
            item["title"] = f"Passage {passage_index + 1} · {title}" if not title.startswith("Passage") else title
    elif module == "listening" and mode == "Full Listening Section":
        part_scripts = list(dict.fromkeys((str(it.get("context") or "").strip() for it in items if str(it.get("context") or "").strip())))
        if not part_scripts:
            part_scripts = ["You will hear a recording. Listen once and answer the questions."]
        for idx, item in enumerate(items):
            part_index = idx % 4
            item["context"] = part_scripts[part_index % len(part_scripts)]
            title = str(item.get("title") or "Practice question")
            item["title"] = f"Part {part_index + 1} · {title}" if not title.startswith("Part") else title
    session_id = f"{module}-{mode.lower().replace(' ', '-')}-{index + 1}"
    test_type = test_type if test_type in ("academic", "general") else "academic"
    return {
        "id": session_id,
        "module": module,
        "mode": mode,
        "title": f"{module.capitalize()} practice — {mode}",
        "subtitle": f"Original {test_type} {module} practice selected by the AI Brain for band {bands.get(module, 5.5)}.",
        "durationMinutes": kb.mode_duration(module, mode),
        "questionCount": len(items),
        "questionTypes": types,
        "difficultyBand": difficulty,
        "examinerIntent": f"Target your {module} weaknesses and lift your band from {bands.get(module, 5.5)} toward your goal.",
        "items": items,
        "source": "offline-brain",
    }


def _gemini_session_prompt(module: str, mode: str, count: int, profile: dict | None) -> str:
    bands = profile_bands(profile)
    weak_types = (profile or {}).get("weakQuestionTypes") or []
    weak_topics = (profile or {}).get("weakTopics") or []
    types = kb.question_types_for(module, mode)
    types_text = ", ".join(types[:6])
    topics_text = ", ".join(kb.TOPICS[module][:6])
    blueprint = kb.get_blueprint(module)
    test_type = profile_test_type(profile)
    test_style = (
        "GENERAL TRAINING style: everyday texts, letters, notices and workplace/social contexts. "
        if test_type == "general"
        else "ACADEMIC style: academic passages, lectures, charts and abstract essay topics. "
    )
    prompt = (
        f"You are the IELTS AI question generator. Generate {count} ORIGINAL, exam-quality {module} practice questions. "
        f"The student is preparing for the {test_type.upper()} IELTS test. {test_style}"
        f"The student's current {module} band is {bands.get(module)} and target band is {(profile or {}).get('targetBand', 7)}. "
        f"Difficulty must be IELTS band {bands.get(module, 5.5) + 0.5} style. Mode: {mode}. "
        f"Use only these official question styles: {types_text}. Use topics like: {topics_text}. "
        f"Never copy copyrighted IELTS questions; write your own original questions that FEEL like IELTS. "
        f"Each question MUST include 'correctAnswer' and 'explanation' and 'tip', plus 'logic' (step-by-step reasoning for the answer), "
        f"'suggestions' (what to do differently next time) and 'bandAdvice' (how this maps to IELTS band level). "
        f"Return ONLY JSON, no prose, in this exact array shape: "
        f'[{{"id":"{module}-1", "type":"<one of: multiple-choice|true-false|sentence-completion|short-answer|matching-headings|yes-no-not-given|matching|matching-sentence-endings|summary-completion|form-completion|map-labelling|table-completion|essay|speaking-cue>", '
        f'"title":"short title", "prompt":"full question", "context":"supporting text or audio script if needed", '
        f'"options":["A","B","C","D"] or [], "correctAnswer":"answer", "explanation":"why", '
        f'"tip":"study tip", "logic":"step-by-step logic", "suggestions":"next-time suggestion", '
        f'"bandAdvice":"band-level advice", "expectedFocus":"skill focus", "descriptorFocus":"band descriptor area"}}]'
        f' Wrap even a single question in the array — always output an array, never a bare object.'
    )
    if module == "writing":
        prompt += (
            " IMPORTANT for WRITING FULL SECTION: you must generate EXACTLY 2 questions: the first is Task 1 (a data report, "
            "type 'essay', title like 'Task 1 ...') and the second is Task 2 (an opinion/discussion essay, type 'essay', "
            "title like 'Task 2 ...'). Every Task 1 item MUST include a "
            '"chart" object with EXACTLY this shape: {"type":"bar","title":"short title","unit":"unit label",'
            '"categories":["A","B","C","D","E","F"],"values":[10,22,18,30,26,41]} (5-6 categories, realistic '
            "rounded numbers). The 'prompt' must reference that chart (e.g. \"The bar chart below shows ...\"). "
            "Task 2 items must NOT include a chart."
        )
    elif module == "speaking":
        prompt += " For the full-section mode, generate a speaking flow: several Part 1 questions, one Part 2 cue card, and a few Part 3 discussion questions, in exam order."
    elif module == "reading":
        prompt += (
            " For the full-section modes, produce a realistic exam layout: exactly 3 distinct passages and "
            "questions grouped by passage (questions in the same passage share the same 'context' string). "
        )
    elif module == "listening":
        prompt += (
            " For the full-section modes, produce a realistic exam layout: exactly 4 parts, each with an audio "
            "'context' script and its questions, in exam order."
        )
    return prompt


_WRITING_CHART_POOL: list[dict] = [
    {"type": "bar", "title": "Household expenditure in six categories", "unit": "Percentage of total spending", "categories": ["Housing", "Food", "Transport", "Health", "Education", "Leisure"], "values": [31, 24, 14, 12, 9, 10]},
    {"type": "bar", "title": "International students studying at a university", "unit": "Number of students", "categories": ["2018", "2019", "2020", "2021", "2022", "2023"], "values": [9800, 11200, 10400, 13100, 14900, 16800]},
    {"type": "bar", "title": "Weekly hours spent on five activities", "unit": "Hours per week", "categories": ["Study", "Work", "Sleep", "Exercise", "Socialising"], "values": [18, 12, 49, 4, 9]},
    {"type": "bar", "title": "Global energy production by source", "unit": "Petajoules", "categories": ["Coal", "Oil", "Gas", "Solar", "Wind", "Nuclear"], "values": [120, 96, 82, 22, 18, 34]},
]


def _is_task1_data(item: dict) -> bool:
    title = str(item.get("title") or "").lower()
    type_label = str(item.get("typeLabel") or "").lower()
    prompt = str(item.get("prompt") or "").lower()
    if "task 2" in title or "task 2" in type_label:
        return False
    if "task 1" in title or "task 1" in type_label or "task1" in type_label:
        return True
    if item.get("type") != "essay":
        return False
    return any(phrase in prompt for phrase in ("bar chart", "chart below", "graph below", "table below", "the chart", "the graph"))


def _ensure_writing_chart(items: list) -> list:
    chart_index = 0
    for item in items:
        if item.get("chart"):
            continue
        if _is_task1_data(item):
            item["chart"] = _WRITING_CHART_POOL[chart_index % len(_WRITING_CHART_POOL)]
            chart_index += 1
        else:
            item["chart"] = {}
    return items


def _validate_items(items: list) -> list:
    valid: list = []
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        if not item.get("prompt"):
            continue
        item["id"] = str(item.get("id") or f"q-{idx + 1}")
        item["type"] = str(item.get("type") or "multiple-choice")
        item.setdefault("title", "Practice question")
        item.setdefault("context", "")
        item.setdefault("options", [])
        item.setdefault("correctAnswer", "")
        item.setdefault("explanation", "Review the section blueprint for the strategy behind this answer.")
        item.setdefault("logic", "Locate the key sentence, match meaning to the answer, then reject options the text contradicts.")
        item.setdefault("tip", "Practise this question type in the blueprint, then retry.")
        item.setdefault("suggestions", "Re-read the question, find the exact sentence, and verify against the word limit or scope words.")
        item.setdefault("bandAdvice", "This question type rewards controlled scanning — one focused session at a time.")
        item.setdefault("expectedFocus", TYPE_FOCUS.get(item["type"], "Skill accuracy"))
        item.setdefault("descriptorFocus", TYPE_FOCUS.get(item["type"], "Skill accuracy"))
        chart = item.get("chart")
        if isinstance(chart, dict):
            if isinstance(chart.get("categories"), str):
                chart["categories"] = [c for c in re.split(r"[,;\s]+", chart["categories"].strip()) if c]
            if isinstance(chart.get("values"), str):
                chart["values"] = [v for v in (int(x) for x in re.split(r"[,;\s]+", chart["values"].strip()) if x.lstrip("-").isdigit())]
            item["chart"] = chart
        valid.append(item)
    return valid


def generate_session(profile: dict | None, module: str, mode: str, count: int | None = None, question_type: str | None = None) -> dict:
    if module not in SKILLS:
        module = "reading"
    if question_type and kb.is_question_type(module, question_type):
        mode = question_type
    if not kb.is_question_type(module, mode):
        mode = mode if mode in kb.MODES[module] else kb.MODES[module][0]
    count = kb.mode_question_count(module, mode, count)
    bands = profile_bands(profile)
    target = float((profile or {}).get("targetBand", 7.0) or 7.0)

    pipeline_steps = [
        "Load student profile",
        "Load learning history",
        "Load previous practice",
        "Load previous mock tests",
        f"Analyse current band ({sum(bands.values()) / 4:.1f})",
        f"Analyse target band ({target})",
        f"Detect weaknesses: {', '.join(detect_weaknesses(bands, (profile or {}).get('weakQuestionTypes') or [], (profile or {}).get('weakTopics') or []))[:120]}",
        f"Choose skill: {module}",
        f"Choose question types: {', '.join(kb.question_types_for(module, mode))}",
        "Consult IELTS knowledge base",
        "Construct structured prompt",
        "Send prompt to Gemini (or offline brain)",
        "Validate questions",
        "Return questions to frontend",
    ]

    session: dict
    if gemini.is_ai_available():
        try:
            items = gemini.generate_json(_gemini_session_prompt(module, mode, count, profile), system_instruction="You generate original IELTS-style practice material only. Output valid JSON.", use_cache=False)
            if isinstance(items, dict):
                items = [items]
            items = _validate_items(items if isinstance(items, list) else [])
            if not items:
                raise RuntimeError("Gemini returned no valid questions")
            items = _ensure_writing_chart(items) if module == "writing" else items
            if len(items) < count:
                fallback_session = _build_fallback_session(module, mode, count, bands, profile_test_type(profile))
                existing_titles = {str(it.get("title") or "").lower() for it in items}
                filler_pool = list(fallback_session.get("items", []))
                random.shuffle(filler_pool)
                filler_index = 0
                while len(items) < count and filler_pool:
                    filler = dict(filler_pool[filler_index % len(filler_pool)])
                    filler_index += 1
                    if str(filler.get("title") or "").lower() in existing_titles:
                        continue
                    if str(filler.get("id") or "") in {str(it.get("id") or "") for it in items}:
                        filler["id"] = f"{module}-fill-{len(items) + 1}-{filler.get('type', 'q')[:4]}"
                    items.append(filler)
                    existing_titles.add(str(filler.get("title") or "").lower())
            items = items[:count]
            provider = gemini.active_provider()
            session = {
                "id": f"{module}-{provider}-{abs(hash((module, mode, count))) % 1000000}",
                "module": module,
                "mode": mode,
                "title": f"{module.capitalize()} practice — {mode}",
                "subtitle": f"Original {profile_test_type(profile)} {module} questions generated fresh by {provider} for your current band.",
                "durationMinutes": kb.mode_duration(module, mode),
                "questionCount": len(items),
                "questionTypes": kb.question_types_for(module, mode),
                "difficultyBand": round(bands.get(module, 5.5) + 0.5, 1),
                "examinerIntent": f"Lift your {module} band from {bands.get(module)}.",
                "items": items[:count],
                "source": provider,
            }
        except Exception:
            session = _build_fallback_session(module, mode, count, bands, profile_test_type(profile))
            session["pipeline"] = pipeline_steps
    else:
        session = _build_fallback_session(module, mode, count, bands, profile_test_type(profile))
        session["pipeline"] = pipeline_steps
    return session


def strip_answers(session: dict) -> dict:
    safe = dict(session)
    safe["items"] = [
        {key: value for key, value in item.items() if key not in ("correctAnswer", "explanation", "tip", "logic", "suggestions", "bandAdvice")}
        for item in session.get("items", [])
    ]
    return safe
