"""IELTS knowledge base: official-style question types, strategies, band
descriptors and section blueprints. This is the "conscience" the AI
Orchestrator consults before asking Gemini to generate questions."""


QUESTION_TYPES = {
    "reading": [
        "Multiple Choice",
        "Matching Headings",
        "Matching Features",
        "True / False / Not Given",
        "Yes / No / Not Given",
        "Summary Completion",
        "Sentence Completion",
        "Short Answer",
        "Matching Sentence Endings",
        "Table / Flow Chart Completion",
    ],
    "listening": [
        "Multiple Choice",
        "Map Labelling",
        "Form / Note Completion",
        "Sentence Completion",
        "Matching",
    ],
    "writing": [
        "Task 1 Report (Data)",
        "Task 1 Process / Map",
        "Task 2 Opinion",
        "Task 2 Discussion",
        "Task 2 Advantages / Disadvantages",
        "Task 2 Problem / Solution",
        "Task 2 Double Question",
    ],
    "speaking": [
        "Part 1 Interview (personal questions)",
        "Part 2 Cue Card (long turn)",
        "Part 3 Discussion (abstract questions)",
    ],
}

TOPICS = {
    "reading": [
        "Urban planning",
        "Environmental policy",
        "History of science",
        "Education systems",
        "Health and nutrition",
        "Technology and society",
        "Transport and infrastructure",
        "Wildlife conservation",
        "Work and economy",
        "Art and culture",
    ],
    "listening": [
        "Booking and reservations",
        "Enrolment and courses",
        "University facilities",
        "Tour and directions",
        "Job interviews",
        "Research projects",
        "Health services",
        "Accommodation",
        "Transport enquiries",
        "Museum and events",
    ],
    "writing": [
        "Education",
        "Environment",
        "Technology",
        "Health",
        "Work and careers",
        "Cities and housing",
        "Globalisation",
        "Media and advertising",
    ],
    "speaking": [
        "Work and study",
        "Home and family",
        "Free time and hobbies",
        "Travel and places",
        "Food and culture",
        "Technology in daily life",
        "Cities and public space",
        "Health and habits",
        "Environment and daily habits",
        "Education and learning",
    ],
}

DIFFICULTY = {
    "easy": 5.5,
    "medium": 6.5,
    "hard": 7.5,
    "expert": 8.0,
}


def difficulty_for_band(band: float) -> str:
    if band < 6.0:
        return "easy"
    if band < 7.0:
        return "medium"
    if band < 7.5:
        return "hard"
    return "expert"


MODES = {
    "reading": ["Full Reading Section", "Passage 1", "Passage 2", "Passage 3", "Individual Question Types", "Question by Question", "Quick Practice"],
    "listening": ["Full Listening Section", "Part 1", "Part 2", "Part 3", "Part 4", "Individual Question Types", "Question by Question", "Quick Practice"],
    "writing": ["Full Writing Section", "Task 1", "Task 2", "Essay Types", "Question by Question", "Quick Practice"],
    "speaking": ["Full Speaking Section", "Part 1", "Part 2", "Part 3", "Topic Practice", "Question by Question", "Quick Practice"],
}


def is_question_type(module: str, mode: str) -> bool:
    """True if the requested mode is one of the official question-type names."""
    return mode in QUESTION_TYPES.get(module, [])


def question_type_mode_duration(module: str) -> int:
    if module == "reading":
        return 12
    if module == "listening":
        return 10
    if module == "writing":
        return 40
    return 5


def question_type_mode_count(module: str) -> int:
    if module in ("writing", "speaking"):
        return 1
    return 10 if module == "reading" else 8


def mode_duration(module: str, mode: str) -> int:
    if is_question_type(module, mode):
        if module == "writing":
            return 40 if "Task 2" in mode else 20
        if module == "speaking":
            return 4 if "Part 2" in mode else 5
        return question_type_mode_duration(module)
    if module == "reading":
        if mode == "Full Reading Section":
            return 60
        if mode in ("Passage 1", "Passage 2", "Passage 3"):
            return 20
        return 5 if mode == "Quick Practice" else 12
    if module == "listening":
        if mode == "Full Listening Section":
            return 30
        if mode in ("Part 1", "Part 2", "Part 3", "Part 4"):
            return 8
        return 5 if mode == "Quick Practice" else 10
    if module == "writing":
        return 60 if mode == "Full Writing Section" else 40 if mode == "Task 2" else 20
    if module == "speaking":
        return {"Full Speaking Section": 14, "Part 2": 4, "Part 3": 5, "Topic Practice": 8}.get(mode, 5) if mode not in ("Question by Question",) else 5
    return 14 if mode == "Full Speaking Section" else 5


def mode_question_count(module: str, mode: str, requested: int | None = None) -> int:
    if requested and requested > 0:
        return min(requested, 500)
    if mode == "Question by Question":
        return 1
    if mode == "Quick Practice":
        return 3
    if is_question_type(module, mode):
        return question_type_mode_count(module)
    if module == "reading":
        return {"Full Reading Section": 40, "Passage 1": 13, "Passage 2": 13, "Passage 3": 14}.get(mode, 10)
    if module == "listening":
        return {"Full Listening Section": 40, "Part 1": 10, "Part 2": 10, "Part 3": 10, "Part 4": 10}.get(mode, 8)
    if module == "writing":
        return 2 if mode in ("Full Writing Section",) else 1
    if module == "speaking":
        return {"Full Speaking Section": 12, "Part 1": 5, "Part 2": 1, "Part 3": 5, "Topic Practice": 5}.get(mode, 1)
    return 8


def question_types_for(module: str, mode: str) -> list[str]:
    if is_question_type(module, mode):
        return [mode]
    types = list(QUESTION_TYPES[module])
    if mode == "Individual Question Types":
        return types
    if mode == "Question by Question":
        return types[:1]
    return types[:4]


# ---------------------------------------------------------------------------
# Section blueprints (strategy content served to the frontend)
# ---------------------------------------------------------------------------

BLUEPRINTS = {
    "reading": {
        "title": "Reading Blueprint",
        "tagline": "How to read strategically and earn more marks.",
        "color": "#2b6cb0",
        "structure": [
            {"name": "Passage 1", "detail": "Usually the easiest. Factual texts, 13 questions. Spend ~15-18 minutes.", "topic": "Descriptive / factual"},
            {"name": "Passage 2", "detail": "Medium difficulty. Argument and description, 13 questions. Spend ~20 minutes.", "topic": "Argumentative / discursive"},
            {"name": "Passage 3", "detail": "Hardest. Dense academic prose, 14 questions. Spend ~22-25 minutes.", "topic": "Abstract / academic"},
        ],
        "scoring": [
            {"correct": "39-40", "band": "Band 9"},
            {"correct": "37-38", "band": "Band 8.5"},
            {"correct": "35-36", "band": "Band 8"},
            {"correct": "33-34", "band": "Band 7.5"},
            {"correct": "30-32", "band": "Band 7"},
            {"correct": "27-29", "band": "Band 6.5"},
            {"correct": "23-26", "band": "Band 6"},
            {"correct": "19-22", "band": "Band 5.5"},
            {"correct": "15-18", "band": "Band 5"},
        ],
        "score_breakdown": [
            {"name": "Academic passage questions", "share": "100%", "detail": "3 passages, 40 questions, 60 minutes total."},
            {"name": "Marks per question", "share": "1 each", "detail": "All 40 questions are worth 1 mark."},
            {"name": "Band conversion", "share": "39-40 → Band 9", "detail": "Roughly: 30/40 ≈ Band 7, 23/40 ≈ Band 6, 15/40 ≈ Band 5."},
        ],
        "question_types": [
            {"name": "True / False / Not Given", "strategy": "Find the exact sentence. True = same meaning; False = contradicts; Not Given = not mentioned.", "time": "~90 seconds each", "mistakes": "Confusing False with Not Given; using outside knowledge."},
            {"name": "Matching Headings", "strategy": "Read the first and last sentence of each paragraph first, then the heading list.", "time": "~60 seconds each", "mistakes": "Matching a heading that only fits one detail, not the whole paragraph."},
            {"name": "Multiple Choice", "strategy": "Skim the passage for keywords from each option before deciding.", "time": "~60 seconds each", "mistakes": "Choosing an option that is true in the text but does not answer the question."},
            {"name": "Summary / Sentence Completion", "strategy": "Predict the part of speech and word limit (e.g. ONE WORD ONLY) before reading.", "time": "~75 seconds each", "mistakes": "Using more than the word limit or copying extra words."},
            {"name": "Short Answer", "strategy": "Scan for the question words and copy exact words from the text.", "time": "~60 seconds each", "mistakes": "Answering in your own words instead of the words in the text."},
            {"name": "Yes / No / Not Given", "strategy": "Decide based on the writer's view, not facts you know from outside.", "time": "~90 seconds each", "mistakes": "Answering True/False instead of Yes/No; judging by your own opinion."},
            {"name": "Matching Features", "strategy": "Track names, dates and claims in a quick table as you read.", "time": "~90 seconds each", "mistakes": "Confusing which researcher/group said what."},
            {"name": "Matching Sentence Endings", "strategy": "Read the half-sentence, predict the end, then match meaning not exact words.", "time": "~75 seconds each", "mistakes": "Choosing an ending from a similar sentence that does not complete the logic."},
            {"name": "Table / Flow Chart Completion", "strategy": "Read the row/column headers first and predict the missing cell.", "time": "~60 seconds each", "mistakes": "Answering the wrong row or copying beyond the word limit."},
        ],
        "time_management": [
            "Passage 1 is usually easiest: spend 15 minutes.",
            "Passage 2: 20 minutes. Passage 3: 25 minutes (often hardest).",
            "Never spend more than 2 minutes on one question.",
            "Transfer answers as you go — there is no extra transfer time in the computer test.",
            "Do not stop to read every word: skim for structure, scan for answers.",
        ],
        "common_mistakes": [
            "Reading the whole passage before looking at the questions — questions should guide your reading.",
            "Choosing False instead of Not Given when the text is simply silent on the claim.",
            "Exceeding the word limit on completion tasks (ONE WORD means ONE word).",
            "Answering completion tasks in your own words instead of copying the text's words.",
            "Confusing True/False (facts) with Yes/No (writer's opinion) answer sets.",
            "Spending too long on one hard question and running out of time on easy marks later.",
        ],
        "band_tips": {
            "5": "Build vocabulary by topic and practise scanning for keywords.",
            "6": "Master True/False/Not Given logic — the most common question type.",
            "7": "Practise matching headings and summary completion under 20-minute limits.",
            "8": "Read academic articles to build speed and infer writer opinion (Yes/No).",
        },
        "tips_to_improve": [
            "Complete one full 60-minute reading test every week and review every wrong answer by question type.",
            "Learn question type strategy before speed — accuracy comes first, then pace.",
            "Practise skimming: read only the first and last sentence of each paragraph in 2 minutes per passage.",
            "Keep a notebook of paraphrase pairs (e.g. 'not suitable for every role' ~ 'does not benefit all roles').",
            "Do 5-question type-focused sets daily instead of only full tests.",
        ],
        "grammar_vocab": "Learn collocations for technology, environment, and health topics. Paraphrase in your head as you read — this builds the synonyms IELTS uses.",
    },
    "listening": {
        "title": "Listening Blueprint",
        "tagline": "How to hear the answer, not just the words.",
        "color": "#2f9e63",
        "structure": [
            {"name": "Part 1", "detail": "Easiest. A conversation in an everyday context (booking, enquiry), 10 questions. ~8 minutes.", "topic": "Everyday conversation"},
            {"name": "Part 2", "detail": "A monologue on a topic like a tour, guide or announcement, 10 questions. ~8 minutes.", "topic": "Monologue / announcement"},
            {"name": "Part 3", "detail": "A conversation between up to four people, often academic (discussion, tutorial), 10 questions. ~8 minutes.", "topic": "Academic conversation"},
            {"name": "Part 4", "detail": "Hardest. An academic lecture or talk, 10 questions. ~8 minutes.", "topic": "Academic lecture"},
        ],
        "scoring": [
            {"correct": "39-40", "band": "Band 9"},
            {"correct": "37-38", "band": "Band 8.5"},
            {"correct": "35-36", "band": "Band 8"},
            {"correct": "33-34", "band": "Band 7.5"},
            {"correct": "30-32", "band": "Band 7"},
            {"correct": "27-29", "band": "Band 6.5"},
            {"correct": "23-26", "band": "Band 6"},
            {"correct": "19-22", "band": "Band 5.5"},
            {"correct": "15-18", "band": "Band 5"},
        ],
        "score_breakdown": [
            {"name": "Four parts", "share": "10 questions each", "detail": "Part 1 easiest (conversation), Part 4 hardest (lecture)."},
            {"name": "Marks per question", "share": "1 each", "detail": "40 questions, 1 mark each, played ONCE only."},
            {"name": "Band conversion", "share": "35-36 → Band 8", "detail": "Roughly: 30/40 ≈ Band 7, 23/40 ≈ Band 6, 16/40 ≈ Band 5."},
        ],
        "question_types": [
            {"name": "Form / Note Completion", "strategy": "Read the gaps before the audio starts and predict word type (name, number, time).", "time": "~10 seconds each", "mistakes": "Missing a plural 's' — it still counts."},
            {"name": "Map Labelling", "strategy": "Trace the route with your finger. Listen for 'turn left', 'opposite', 'past the X'.", "time": "~10 seconds each", "mistakes": "Choosing a label heard earlier, not the one at the destination."},
            {"name": "Multiple Choice", "strategy": "Underline the difference between options before each section plays.", "time": "~15 seconds each", "mistakes": "Picking an option with a word you heard even if it was said negatively."},
            {"name": "Matching", "strategy": "Write down letters for each option as you hear them, then match at the end.", "time": "~15 seconds each", "mistakes": "Answering from memory instead of the recording."},
            {"name": "Sentence Completion", "strategy": "Predict how many words are allowed (e.g. ONE WORD ONLY) and keep the grammar correct.", "time": "~10 seconds each", "mistakes": "Adding a preposition the sentence does not need."},
        ],
        "time_management": [
            "Use the 30 seconds before each section to read ALL the questions.",
            "Use the gap between questions to predict the next answer type.",
            "Keep pace: you get exactly one chance to hear each answer.",
            "Write answers immediately in capital letters if that is faster for you.",
            "Never pause on a missed answer — keep listening for the next question.",
        ],
        "common_mistakes": [
            "Reading the options and stopping to think — the audio keeps moving and the answer is missed.",
            "Writing an answer you heard in the first mention when the speaker corrects it later.",
            "Missing plural 's' or wrong letter case on completion and note answers.",
            "Answering completion tasks from memory or general knowledge instead of the exact words.",
            "Spending too long re-reading one question during the gap between sections.",
            "Confusing distractors: options that contain heard words but answer a different question.",
        ],
        "band_tips": {
            "5": "Practise number and date dictation daily.",
            "6": "Learn to identify distractors: answers are usually said twice with a change.",
            "7": "Train map labelling by tracing routes on real maps.",
            "8": "Listen to academic lectures (TED, BBC Ideas) and take notes in English.",
        },
        "tips_to_improve": [
            "Complete one full 30-minute listening test weekly and review every wrong answer by question type.",
            "Practise predicting answer types: is the gap a name, number, date, direction or adjective?",
            "Dictate phone numbers, dates, prices and postcodes until capture is automatic.",
            "Listen to the same clip twice: once for answers, once for every distractor you missed.",
            "Do 5-question type-focused sets daily instead of only full tests.",
        ],
        "grammar_vocab": "Learn spelling of common words (accommodation, environment, separate). Grammar must fit the gap: noun, verb form, or plural.",
    },
    "writing": {
        "title": "Writing Blueprint",
        "tagline": "How to structure essays that examiners score highly.",
        "color": "#e57f2b",
        "structure": [
            {"name": "Task 1", "detail": "Report on a chart, table, process or map. At least 150 words, 20 minutes, 1/3 of the Writing mark.", "topic": "Data report / process / map"},
            {"name": "Task 2", "detail": "Essay on a social topic. At least 250 words, 40 minutes, 2/3 of the Writing mark.", "topic": "Academic / opinion essay"},
            {"name": "Four criteria", "detail": "Each task is marked equally on Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammar.", "topic": "25% each"},
        ],
        "scoring": [
            {"correct": "Task 1", "band": "1/3 of Writing band"},
            {"correct": "Task 2", "band": "2/3 of Writing band"},
            {"correct": "Task Achievement", "band": "25%"},
            {"correct": "Coherence & Cohesion", "band": "25%"},
            {"correct": "Lexical Resource", "band": "25%"},
            {"correct": "Grammatical Range & Accuracy", "band": "25%"},
        ],
        "score_breakdown": [
            {"name": "Task 1", "share": "1/3 of Writing mark", "detail": "150+ words, report on a chart/process. 20 minutes."},
            {"name": "Task 2", "share": "2/3 of Writing mark", "detail": "250+ words, essay. 40 minutes. Weighs double — prioritise it."},
            {"name": "Four criteria", "share": "equal 25%", "detail": "Task Achievement, Coherence & Cohesion, Lexical Resource, Grammar."},
        ],
        "question_types": [
            {"name": "Task 1 Report (Data)", "strategy": "Overview paragraph first, then groups: highest/lowest/change. No opinions.", "time": "20 min", "mistakes": "Listing every number instead of comparing groups."},
            {"name": "Task 1 Process / Map", "strategy": "Report the sequence or the before/after change using sequencing and the passive.", "time": "20 min", "mistakes": "Describing the diagram instead of the process it represents."},
            {"name": "Task 2 Opinion", "strategy": "Clear position in the introduction, one idea per paragraph, examples.", "time": "40 min", "mistakes": "A vague position that wavers between paragraphs."},
            {"name": "Task 2 Discussion", "strategy": "Discuss BOTH views fairly, then give your own view.", "time": "40 min", "mistakes": "Arguing one side and ignoring the other."},
            {"name": "Task 2 Advantages / Disadvantages", "strategy": "Weigh benefits and drawbacks with equal depth, then decide the balance.", "time": "40 min", "mistakes": "A one-sided list that never reaches a judgement."},
            {"name": "Task 2 Problem / Solution", "strategy": "State causes and effects, then one solution paragraph with a real example.", "time": "40 min", "mistakes": "Solutions that do not connect to the problems stated."},
            {"name": "Task 2 Double Question", "strategy": "Answer BOTH parts with equal word depth and link them in the conclusion.", "time": "40 min", "mistakes": "Answering one part at length and rushing the second."},
        ],
        "time_management": [
            "Task 2 first: 5 min plan, 30 min write, 5 min check — it is worth 2x Task 1.",
            "Task 1: 3 min plan, 15 min write, 2 min check.",
            "Always leave 2 minutes to correct grammar and spelling mistakes.",
            "Watch the word counter: under-length answers automatically cap the band.",
        ],
        "common_mistakes": [
            "No overview in Task 1 — the big picture sentence is expected immediately.",
            "Task 2 position that wavers or appears only in the conclusion.",
            "Listing data instead of comparing in Task 1.",
            "Memorised paragraphs that do not answer the actual question.",
            "Ignoring the word limit: 150 and 250 are minimums, not suggestions.",
            "Weak paragraphing: run-on walls of text collapse coherence marks.",
        ],
        "band_tips": {
            "5": "Learn basic paragraph structure and linking words (however, therefore).",
            "6": "Add a clear overview to Task 1 and an example to every Task 2 body paragraph.",
            "7": "Use precise, less common vocabulary and vary sentence structures.",
            "8": "Develop complex ideas fully and control tone for formal writing.",
        },
        "tips_to_improve": [
            "Write one Task 2 essay weekly and rewrite the weakest paragraph with the model answer in view.",
            "Plan before writing: 5 minutes of outlining raises every criterion.",
            "Track your band by criterion (task, coherence, vocabulary, grammar), not just overall.",
            "Practise 150-word and 250-word length control with the word counter in every session.",
            "Keep a notebook of collocations per topic (environment, technology, education).",
        ],
        "grammar_vocab": "Master: present/past simple, comparatives, conditionals, and 'the majority of / a significant proportion of' data language.",
    },
    "speaking": {
        "title": "Speaking Blueprint",
        "tagline": "How to sound fluent, confident, and organised.",
        "color": "#8053c7",
        "structure": [
            {"name": "Part 1", "detail": "Interview. Personal questions on familiar topics (work, home, hobbies). 4-5 minutes, about 12 questions.", "topic": "Familiar / personal"},
            {"name": "Part 2", "detail": "Long turn. A cue card with four bullet points; 1 minute to prepare, then speak for 1-2 minutes.", "topic": "Story / experience"},
            {"name": "Part 3", "detail": "Discussion. Abstract questions linked to the Part 2 topic. Deeper opinions with reasons and examples. 4-5 minutes.", "topic": "Abstract / critical"},
        ],
        "scoring": [
            {"correct": "Fluency", "band": "20%"},
            {"correct": "Pronunciation", "band": "20%"},
            {"correct": "Grammar (Range and Accuracy)", "band": "20%"},
            {"correct": "Vocabulary (Lexical Resource)", "band": "20%"},
            {"correct": "Coherence", "band": "20%"},
        ],
        "score_breakdown": [
            {"name": "Part 1", "share": "4-5 minutes", "detail": "Personal questions. Answer in 2-3 sentences."},
            {"name": "Part 2", "share": "3-4 minutes", "detail": "Cue card: 1 min to prepare, speak 1-2 minutes."},
            {"name": "Part 3", "share": "4-5 minutes", "detail": "Abstract discussion linked to Part 2 topic. Deeper answers."},
            {"name": "Five criteria", "share": "equal 20%", "detail": "Fluency, Pronunciation, Grammar, Vocabulary, Coherence."},
        ],
        "question_types": [
            {"name": "Part 1 Interview (personal questions)", "strategy": "Answer directly, add a reason or example, then stop. Never one word.", "time": "~20 sec per answer", "mistakes": "Memorised answers that do not fit the question."},
            {"name": "Part 2 Cue Card (long turn)", "strategy": "Use the 1 minute to write 4 keywords and tell the story with structure (what/when/where/why).", "time": "1-2 minutes", "mistakes": "Speaking for 30 seconds and stopping. Keep talking with details."},
            {"name": "Part 3 Discussion (abstract questions)", "strategy": "Give an opinion, explain it, and give an example or compare.", "time": "~60 sec per answer", "mistakes": "Giving one-sentence answers to abstract questions."},
        ],
        "time_management": [
            "Part 1: do not over-answer; 2-3 sentences is enough.",
            "Part 2: use the 1-minute preparation to write 4 keywords, then speak each one as a paragraph.",
            "Part 3: treat it like a mini essay — claim, reason, example.",
            "Never chase a perfect answer; fluency beats perfection in the real test.",
        ],
        "common_mistakes": [
            "One-word answers in Part 1 — always add a reason or example.",
            "Memorised answers that ignore the actual question.",
            "Stopping early in Part 2; keep talking with small details.",
            "Repeating the question and adding nothing new.",
            "Punishing yourself for fillers like 'umm' — natural pauses are fine; the AI ignores them.",
        ],
        "band_tips": {
            "5": "Practise speaking for 1 minute non-stop on any topic.",
            "6": "Use linking phrases: 'Actually...', 'The main reason is...'.",
            "7": "Vary vocabulary and use conditionals and complex sentences naturally.",
            "8": "Use idiomatic language, precise vocabulary, and natural rhythm.",
        },
        "tips_to_improve": [
            "Record one Part 2 answer daily and listen back for rhythm, not just content.",
            "Create 5 reusable stories (place, person, habit, meal, skill) that fit many cue cards.",
            "Learn topic collocations weekly (work, environment, education, technology).",
            "Practise reframing: answer with a twist ('attention has not disappeared; it has become selective').",
        ],
        "grammar_vocab": "Use present/past/future correctly, conditionals, and question tags. Pronunciation: stress content words and keep a steady rhythm — fillers like 'umm' do not lower your score.",
    },
}


def camelize(value):
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            parts = key.split("_")
            result[parts[0] + "".join(p.title() for p in parts[1:])] = camelize(item)
        return result
    if isinstance(value, list):
        return [camelize(item) for item in value]
    return value


def get_blueprint(module: str) -> dict:
    blueprint = BLUEPRINTS.get(module, BLUEPRINTS["reading"])
    clean = {key: value for key, value in blueprint.items() if key not in ("color", "score_breakdown")}
    return camelize(clean)


VOCAB_FALLBACKS: list[dict] = [
    {"id": "fb-1", "word": "mitigate", "pos": "verb", "meaning": "to make something less harmful, serious, or painful", "example": "Governments can mitigate the effects of traffic congestion by investing in public transport.", "topic": "Environment"},
    {"id": "fb-2", "word": "innovation", "pos": "noun", "meaning": "a new idea, method, or product that improves something", "example": "Innovation in renewable energy has made solar panels affordable for households.", "topic": "Technology"},
    {"id": "fb-3", "word": "sedentary", "pos": "adjective", "meaning": "involving a lot of sitting and little physical activity", "example": "Office workers often lead a sedentary lifestyle, which increases health risks.", "topic": "Health"},
    {"id": "fb-4", "word": "disparity", "pos": "noun", "meaning": "a noticeable and unfair difference between groups or things", "example": "There is a wide disparity in internet access between rural and urban areas.", "topic": "Society"},
    {"id": "fb-5", "word": "remuneration", "pos": "noun", "meaning": "payment for work or services", "example": "Many graduates value job satisfaction more than high remuneration.", "topic": "Work"},
    {"id": "fb-6", "word": "pedagogy", "pos": "noun", "meaning": "the method and practice of teaching", "example": "Modern pedagogy encourages discussion and project work rather than passive listening.", "topic": "Education"},
]
