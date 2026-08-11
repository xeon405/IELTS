"""IELTS knowledge base: official-style question types, strategies, band
descriptors and section blueprints. This is the "conscience" the AI
Orchestrator consults before asking Gemini to generate questions."""


QUESTION_TYPES = {
    "reading": [
        "Multiple Choice",
        "True / False / Not Given",
        "Yes / No / Not Given",
        "Matching Information",
        "Matching Headings",
        "Matching Features",
        "Matching Sentence Endings",
        "Sentence Completion",
        "Summary Completion",
        "Note Completion",
        "Table Completion",
        "Flow-chart Completion",
        "Diagram Label Completion",
        "Short Answer",
    ],
    "listening": [
        "Multiple Choice",
        "Matching",
        "Map / Plan / Diagram Labelling",
        "Form Completion",
        "Note Completion",
        "Table Completion",
        "Flow-chart Completion",
        "Summary Completion",
        "Sentence Completion",
        "Short Answer",
    ],
    "writing": [
        "Task 1 Charts & Graphs",
        "Task 1 Tables",
        "Task 1 Mixed Charts",
        "Task 1 Process",
        "Task 1 Maps / Plans",
        "Task 1 Diagrams",
        "Task 2 Opinion",
        "Task 2 Discussion",
        "Task 2 Advantages / Disadvantages",
        "Task 2 Problem / Solution",
        "Task 2 Double Question",
        "Task 2 Mixed / Combined Question",
    ],
    "speaking": [
        "Part 1 — Introduction & Interview (personal questions)",
        "Part 2 — Cue Card / Individual Long Turn",
        "Part 3 — Discussion (abstract questions)",
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


def canonical_question_type(module: str, mode: str) -> str:
    """Map blueprint/legacy labels onto the official question-type names.

    The speaking blueprint chips use short hyphen names while the official
    type list uses long em-dash labels; every other module's chips already
    match the official list, so only speaking needs remapping.
    """
    if module == "speaking":
        return SPEAKING_TYPE_ALIASES.get(mode, mode)
    return mode


SPEAKING_TYPE_ALIASES: dict[str, str] = {
    "Part 1 - Introduction & Interview": "Part 1 — Introduction & Interview (personal questions)",
    "Part 1 — Introduction & Interview": "Part 1 — Introduction & Interview (personal questions)",
    "Part 1 - Introduction & Interview (personal questions)": "Part 1 — Introduction & Interview (personal questions)",
    "Part 2 - Cue Card / Individual Long Turn": "Part 2 — Cue Card / Individual Long Turn",
    "Part 2 — Cue Card / Individual Long Turn": "Part 2 — Cue Card / Individual Long Turn",
    "Part 3 - Discussion": "Part 3 — Discussion (abstract questions)",
    "Part 3 — Discussion": "Part 3 — Discussion (abstract questions)",
    "Part 3 - Discussion (abstract questions)": "Part 3 — Discussion (abstract questions)",
    "Part 3 — Discussion (abstract questions)": "Part 3 — Discussion (abstract questions)",
}


def is_question_type(module: str, mode: str) -> bool:
    """True if the requested mode is one of the official question-type names."""
    return canonical_question_type(module, mode) in QUESTION_TYPES.get(module, [])


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
        return {"Full Speaking Section": 18, "Part 1": 12, "Part 2": 1, "Part 3": 5, "Topic Practice": 5}.get(mode, 1)
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
            {"name": "Multiple Choice", "strategy": "Skim the passage for keywords from each option before deciding.", "time": "~60 seconds each", "mistakes": "Choosing an option that is true in the text but does not answer the question."},
            {"name": "True / False / Not Given", "strategy": "Find the exact sentence. True = same meaning; False = contradicts; Not Given = not mentioned.", "time": "~90 seconds each", "mistakes": "Confusing False with Not Given; using outside knowledge."},
            {"name": "Yes / No / Not Given", "strategy": "Decide based on the writer's view, not facts you know from outside.", "time": "~90 seconds each", "mistakes": "Answering True/False instead of Yes/No; judging by your own opinion."},
            {"name": "Matching Information", "strategy": "Decide which paragraph/section contains each piece of information before matching the letter.", "time": "~90 seconds each", "mistakes": "Matching a repeated word instead of the paragraph that actually contains the information."},
            {"name": "Matching Headings", "strategy": "Read the first and last sentence of each paragraph first, then the heading list.", "time": "~60 seconds each", "mistakes": "Matching a heading that only fits one detail, not the whole paragraph."},
            {"name": "Matching Features", "strategy": "Track names, dates and claims in a quick table as you read.", "time": "~90 seconds each", "mistakes": "Confusing which researcher/group said what."},
            {"name": "Matching Sentence Endings", "strategy": "Read the half-sentence, predict the end, then match meaning not exact words.", "time": "~75 seconds each", "mistakes": "Choosing an ending from a similar sentence that does not complete the logic."},
            {"name": "Sentence Completion", "strategy": "Predict the part of speech and word limit (e.g. ONE WORD ONLY) before reading.", "time": "~75 seconds each", "mistakes": "Using more than the word limit or copying extra words."},
            {"name": "Summary Completion", "strategy": "Read the summary paragraph, predict each gap in order, then scan the text.", "time": "~75 seconds each", "mistakes": "Using words from outside the passage or exceeding the word limit."},
            {"name": "Note Completion", "strategy": "Notes are shorter and bullet-like — predict the note type (name, number, term) for each gap.", "time": "~60 seconds each", "mistakes": "Writing more than the word limit or not copying the text's words."},
            {"name": "Table Completion", "strategy": "Read the row/column headers first and predict the missing cell.", "time": "~60 seconds each", "mistakes": "Answering the wrong row or copying beyond the word limit."},
            {"name": "Flow-chart Completion", "strategy": "Follow the arrows: each step depends on the one before it — fill gaps in sequence.", "time": "~60 seconds each", "mistakes": "Jumping steps or swapping the order of two stages."},
            {"name": "Diagram Label Completion", "strategy": "Relate the description in the text to the parts of the diagram, label by label.", "time": "~75 seconds each", "mistakes": "Matching labels to the wrong part of the diagram or missing the word limit."},
            {"name": "Short Answer", "strategy": "Scan for the question words and copy exact words from the text.", "time": "~60 seconds each", "mistakes": "Answering in your own words instead of the words in the text."},
        ],
        "type_guides": [
            {
                "name": "True / False / Not Given",
                "priority": 1,
                "relevance": "Appears in nearly every real test - usually the largest single set (5-7 statements). Master this one first.",
                "group": "Reading question types",
                "official": "Official drill: statements about the passage - TRUE if the statement agrees, FALSE if it contradicts, NOT GIVEN if the passage says nothing about it. Decide from the text only.",
                "length": "About 75-90 s per statement - one answer each, NOT GIVEN is a real answer",
                "steps": [
                    {"label": "Scan", "text": "Lift the claim's words - \"bicycles\", \"banned\", \"city centre\"."},
                    {"label": "Locate", "text": "Find where the passage treats that claim - paragraph B, line 4."},
                    {"label": "Judge", "text": "Agrees to True. Contradicts to False (\"lorries remain exempt\" vs \"all vehicles banned\"). Silent to Not Given."},
                ],
                "band8": "Absence is not a contradiction - if the passage is silent, it is NOT GIVEN.",
                "tip": "Minute-plan: Do these first - one scan pass covers 8-10 statements; leave the hard ones for your second read.",
                "avoid": "Outside knowledge - the passage is the only source.",
            },
            {
                "name": "Yes / No / Not Given",
                "priority": 10,
                "relevance": "Regular - appears when a passage carries the writer's views or findings.",
                "group": "Reading question types",
                "official": "Official drill: the WRITER'S VIEWS, not facts - YES if the statement agrees with the writer's opinion, NO if it contradicts it, NOT GIVEN if we cannot tell what the writer thinks.",
                "length": "About 75-90 s per statement - opinion verbs (believes, argues, claims) mark the author's view",
                "steps": [
                    {"label": "Find the view", "text": "Look for the author's judgement verbs - \"the writer believes\", \"it is doubtful\"."},
                    {"label": "Compare", "text": "\"The writer argues the policy failed\" vs the statement \"the policy was a success\" to No."},
                    {"label": "Judge", "text": "Agrees to Yes - contradicts to No - cannot be inferred to Not Given."},
                ],
                "band8": "If the view cannot be inferred, it is NOT GIVEN even when the fact appears.",
                "tip": "Minute-plan: Opinion markers (believes, argues, doubts) sit in one or two sentences of each paragraph - find the view first.",
                "avoid": "Answering from your own opinion.",
            },
            {
                "name": "Multiple Choice",
                "priority": 5,
                "relevance": "Common - 3-5 questions per test, usually the final block of a passage.",
                "group": "Reading question types",
                "official": "Official drill: one option paraphrases the passage; the others either contradict it or are true but answer nothing.",
                "length": "About 60-75 s per question - reject by logic, confirm by evidence",
                "steps": [
                    {"label": "Read", "text": "Know the ask before scanning - \"why did the town ban bicycles?\"."},
                    {"label": "Match", "text": "The correct option restates the passage - \"cyclists ignored the rules\" = \"the ban answered vandalism\"."},
                    {"label": "Kill", "text": "Drop the false and the off-topic - \"bicycles are cheap\" may be true but answers nothing."},
                ],
                "band8": "'All of the above' traps: verify each option individually against the text.",
                "tip": "Minute-plan: Read the stem and options, find the paraphrase - if two look close, the text decides; do not skip back later.",
                "avoid": "Key-word matching only - options echo passage words as decoys.",
            },
            {
                "name": "Matching Headings",
                "priority": 2,
                "relevance": "Consistently one of the most common in real papers - 4-6 headings per test. The hardest type; drill it early.",
                "group": "Reading question types",
                "official": "Official drill: choose the heading that summarises each paragraph's main idea - often one heading is not used.",
                "length": "About 4-5 minutes for the whole set - main idea, not a repeated word",
                "steps": [
                    {"label": "Collect", "text": "Hold the heading ideas in your head - \"public health\", \"mixed reactions\", \"cost\"."},
                    {"label": "Skim", "text": "First and last sentences carry the idea - \"calls to ban bicycles came from residents\"."},
                    {"label": "Name", "text": "Pick the heading that names the idea, not one that borrows a word."},
                ],
                "band8": "A heading that repeats vocabulary but misses the idea is the classic wrong choice.",
                "tip": "Minute-plan: Skim each paragraph in under 30 seconds; match 3-4 certain ones, then let the leftover headings decide the rest.",
                "avoid": "Reading every paragraph fully - skim for ideas.",
            },
            {
                "name": "Matching Sentence Endings",
                "priority": 14,
                "relevance": "Least frequent of the full set - appears in a minority of papers.",
                "group": "Reading question types",
                "official": "Official drill: complete the sentence halves so they agree with the passage - not with your prediction.",
                "length": "About 60-75 s per item - grammatical fit plus textual support",
                "steps": [
                    {"label": "Predict", "text": "Complete the half in your head - \"the ban was introduced because...\"."},
                    {"label": "Verify", "text": "Find the passage sentence carrying the idea - \"...repeated accidents on the high street\"."},
                    {"label": "Match", "text": "One ending fits logically and grammatically - reject the rest."},
                ],
                "band8": "Two endings may sound similar - grammar and meaning both decide.",
                "tip": "Minute-plan: Do the half-sentences with the easiest keywords first; grammar filters the near-synonyms.",
                "avoid": "Completing sentences without checking the passage.",
            },
            {
                "name": "Matching Features",
                "priority": 9,
                "relevance": "Frequent - 4-6 per test; a letter can repeat.",
                "group": "Reading question types",
                "official": "Official drill: statements matched to researchers, theories or periods - you write the letter from the given list.",
                "length": "One letter per item, about 60 s each - study the features first, then scan facts",
                "steps": [
                    {"label": "List", "text": "Know the lettered options - researchers \"Green\", \"Hall\", \"Ortiz\"."},
                    {"label": "Scan", "text": "Take each statement's fact to the text - \"who linked noise to sleep loss?\"."},
                    {"label": "Letter", "text": "Answer \"G\" for Green, not the name - the exam uses letters."},
                ],
                "band8": "A feature may be used more than once - check the printed instruction.",
                "tip": "Minute-plan: Underline the feature names first, then scan each statement once - a letter may repeat.",
                "avoid": "Guessing from the statement's general topic.",
            },
            {
                "name": "Matching Information",
                "priority": 4,
                "relevance": "Common - 4-6 questions per real paper; paragraphs can be used more than once.",
                "group": "Reading question types",
                "official": "Official drill: which paragraph contains each fact - 'You may use any letter more than once' is usually printed.",
                "length": "About 60-75 s per item - scan, don't read",
                "steps": [
                    {"label": "Convert", "text": "Turn the statement into 2-3 searchable words - \"cycle helmets\", \"accident rates\"."},
                    {"label": "Scan", "text": "Search for the fact, not the topic - paragraph D mentions the figures."},
                    {"label": "Confirm", "text": "The paragraph must actually state it - \"accident rates fell by a third\"."},
                ],
                "band8": "The repeated-use instruction makes a wrong first find a retry, not a fail.",
                "tip": "Minute-plan: Scan each 'which paragraph' item once; never re-read a paragraph fully to answer one fact.",
                "avoid": "Reading paragraphs fully.",
            },
            {
                "name": "Sentence Completion",
                "priority": 3,
                "relevance": "Common in most real tests - 4-6 questions; copy the text's exact words.",
                "group": "Reading question types",
                "official": "Official drill: 'Complete the sentences below' with a printed word limit - the gap keeps the grammar of the passage sentence.",
                "length": "About 60-75 s per gap - typed exactly from the passage",
                "steps": [
                    {"label": "Shape", "text": "Set the gap's grammar - \"the scheme was ___ in 2019\" takes a verb form."},
                    {"label": "Locate", "text": "Scan for the sentence the gap is built from - \"...introduced in 2019\"."},
                    {"label": "Copy", "text": "Type \"introduced\" - the exact passage word, even if you'd say \"launched\"."},
                ],
                "band8": "The gap takes the passage's word even when your synonym sounds better.",
                "tip": "Minute-plan: Predict the word form before you scan; copy the text's word - never your synonym.",
                "avoid": "Paraphrasing into typed answers - marked wrong.",
            },
            {
                "name": "Summary Completion",
                "priority": 6,
                "relevance": "The most frequent of the completion family - a 4-6 gap summary appears in most tests.",
                "group": "Reading question types",
                "official": "Official drill: 'Complete the summary using the list of words' or from the passage - gaps follow the text's order.",
                "length": "About 75-90 s per gap cluster - keep the text's words",
                "steps": [
                    {"label": "Map", "text": "Fit the summary to the passage - \"the summary retells paragraph C on funding\"."},
                    {"label": "Name", "text": "Name each gap before scanning: a figure, a place, a year."},
                    {"label": "Copy", "text": "From the text - \"2 million\", or the list option \"F\" by meaning and grammar."},
                ],
                "band8": "With a word list, eliminate by meaning AND grammar in one pass.",
                "tip": "Minute-plan: Read the summary as a unit; its gaps map to the text in order - one scan, done.",
                "avoid": "Synonyms - the listed words are usually paraphrases of the text.",
            },
            {
                "name": "Note Completion",
                "priority": 7,
                "relevance": "Regular - part of the completion family seen in most papers.",
                "group": "Reading question types",
                "official": "Official drill: notes are bullet points of a section - each gap is one exact fact.",
                "length": "About 60-75 s per gap - copy, do not rephrase",
                "steps": [
                    {"label": "Map", "text": "Headings order the text - \"Costs: ____\" belongs to the cost paragraph."},
                    {"label": "Spot", "text": "Each gap takes one precise sentence - \"the licence fee is 40\"."},
                    {"label": "Copy", "text": "Write \"40\" exactly - the text's words, within the limit."},
                ],
                "band8": "Note order matches reading order - never jump the notes.",
                "tip": "Minute-plan: The note headings are the text's map - skim them in 20 seconds before scanning.",
                "avoid": "Adding connectors the note doesn't need.",
            },
            {
                "name": "Table Completion",
                "priority": 8,
                "relevance": "Regular - appears in many real tests.",
                "group": "Reading question types",
                "official": "Official drill: a table of facts with gaps in rows and columns - the word limit is often ONE WORD.",
                "length": "About 60-75 s per cell - exact text words",
                "steps": [
                    {"label": "Read", "text": "Headers fix the fact - \"Year\" x \"Number of users\" means a year is coming."},
                    {"label": "Name", "text": "Say the fact before you scan - \"2019\"."},
                    {"label": "Copy", "text": "Find \"in 2019, users passed 10,000\" and write \"10,000\"."},
                ],
                "band8": "Numbers and units: copy what the passage prints.",
                "tip": "Minute-plan: Read the headers once; every cell is one exact fact - no invented links between rows.",
                "avoid": "Cell answers taken from a different row.",
            },
            {
                "name": "Flow-chart Completion",
                "priority": 11,
                "relevance": "Occasional - appears in some tests.",
                "group": "Reading question types",
                "official": "Official drill: a process diagram in steps - arrows mean sequence.",
                "length": "About 60-75 s per stage - exact words, sequence equals text order",
                "steps": [
                    {"label": "Read", "text": "Follow the arrows - \"sorting - washing - recycling\"."},
                    {"label": "Step", "text": "Each stage matches one sentence in order - \"the paper is washed\"."},
                    {"label": "Copy", "text": "Write \"washed\" - the passive form exactly as printed."},
                ],
                "band8": "Passive forms ('is made') keep the word form intact - copy them as printed.",
                "tip": "Minute-plan: Follow the arrows strictly - each stage is one sentence in the text, in order.",
                "avoid": "Skipping ahead to a later stage.",
            },
            {
                "name": "Diagram Label Completion",
                "priority": 12,
                "relevance": "Rarer - appears in some papers; cover it last in revision.",
                "group": "Reading question types",
                "official": "Official drill: 'Label the diagram' - parts of a figure with a limit usually ONE or TWO WORDS.",
                "length": "About 60-75 s per label - find the description, copy the term",
                "steps": [
                    {"label": "Link", "text": "Match the description to the part - \"the rotor sits at the top\"."},
                    {"label": "Locate", "text": "The description's position matches the diagram's layout - top of the figure."},
                    {"label": "Name", "text": "Write \"rotor\" - the technical term, within the limit."},
                ],
                "band8": "Diagram labels take the technical term, not the general word.",
                "tip": "Minute-plan: The description order matches the diagram's layout - top to bottom, left to right.",
                "avoid": "Labels beyond the printed limit.",
            },
            {
                "name": "Short Answer",
                "priority": 13,
                "relevance": "Occasional - appears in some tests.",
                "group": "Reading question types",
                "official": "Official drill: 'Answer the questions with NO MORE THAN THREE WORDS AND/OR A NUMBER' - the question word dictates the fact.",
                "length": "About 60-75 s per answer - exact words only",
                "steps": [
                    {"label": "Read", "text": "\"How much...\" means a number is coming - \"what colour\" means a noun."},
                    {"label": "Spot", "text": "Find the sentence that carries it - \"the deposit is 500\"."},
                    {"label": "Copy", "text": "Answer \"500\" - short, exact, within the limit."},
                ],
                "band8": "Number formats ($20 or twenty dollars) as printed in the passage.",
                "tip": "Minute-plan: Answer with the question word's fact type - the printed limit is the contract.",
                "avoid": "Whole-sentence answers - the limit forbids them.",
            },
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
            {"name": "Multiple Choice", "strategy": "Underline the difference between options before each section plays.", "time": "~15 seconds each", "mistakes": "Picking an option with a word you heard even if it was said negatively."},
            {"name": "Matching", "strategy": "Write down letters for each option as you hear them, then match at the end.", "time": "~15 seconds each", "mistakes": "Answering from memory instead of the recording."},
            {"name": "Map / Plan / Diagram Labelling", "strategy": "Identify the visual type (map, plan of a building, or diagram of equipment) and trace directions or labels in the recording.", "time": "~10 seconds each", "mistakes": "Choosing a label heard earlier, not the one at the destination."},
            {"name": "Form Completion", "strategy": "Read the field labels (name, phone, date) before the audio starts and predict the word type.", "time": "~10 seconds each", "mistakes": "Missing a plural 's' — it still counts."},
            {"name": "Note Completion", "strategy": "Predict each note gap (name, number, time) and copy the exact words heard.", "time": "~10 seconds each", "mistakes": "Writing your own paraphrase instead of the recorded words."},
            {"name": "Table Completion", "strategy": "Read the row/column headers first and predict the missing cell type.", "time": "~10 seconds each", "mistakes": "Putting an answer in the wrong row or column."},
            {"name": "Flow-chart Completion", "strategy": "Follow the arrows — each stage links to the next one in order.", "time": "~10 seconds each", "mistakes": "Skipping a stage or reversing the order of two steps."},
            {"name": "Summary Completion", "strategy": "Read the summary before the audio and predict each gap, then listen for the exact words.", "time": "~10 seconds each", "mistakes": "Exceeding the word limit in the instructions."},
            {"name": "Sentence Completion", "strategy": "Predict how many words are allowed (e.g. ONE WORD ONLY) and keep the grammar correct.", "time": "~10 seconds each", "mistakes": "Adding a preposition the sentence does not need."},
            {"name": "Short Answer", "strategy": "Turn the question into a prompt: listen for the specific fact (place, price, time) it asks about.", "time": "~10 seconds each", "mistakes": "Giving two answers when the question asks for one."},
        ],
        "type_guides": [
            {
                "name": "Form Completion",
                "priority": 1,
                "relevance": "In nearly every real test - Section 1 opens with form or note completion. Master this first.",
                "group": "Listening question types",
                "official": "Official drill: Section 1 records a real conversation - a booking, an enquiry, a registration - and the form is completed in the order of the speakers' words.",
                "length": "One gap per 8-10 s of audio - one or two exact words, copied as heard",
                "steps": [
                    {"label": "Answer", "text": "Land the box in one go, like the speaker gives it - \"my name is Julie Parks\"."},
                    {"label": "One light detail", "text": "Take what the recording adds - the spelling \"P-A-R-K-S\" and the price \"25\" - it is said once, for free."},
                    {"label": "Stop", "text": "Typed is done - the next gap is already playing."},
                ],
                "band8": "Spelled names and phone numbers are dictated letter-by-letter - write as they spell.",
                "tip": "Minute-plan: You cannot pause or rewind - answer in real time; the 2-minute check at the end is your only review.",
                "avoid": "Guessing from context after the audio moves on - every answer comes exactly once.",
            },
            {
                "name": "Note Completion",
                "priority": 2,
                "relevance": "A Section 1 staple - appears in nearly every real test.",
                "group": "Listening question types",
                "official": "Official drill: a monologue (talk, lecture, message) in note form - each bullet gap follows the recording in order.",
                "length": "Answer the moment you hear it - exact words, typically one or two words + a number",
                "steps": [
                    {"label": "Take the line", "text": "Hear the lead-in and complete it - \"the tour leaves at...\", \"9.30\"."},
                    {"label": "Keep its shape", "text": "Copy the exact words - \"Thursday\", not \"Thursdays\"; \"the library\", not \"a library\"."},
                    {"label": "Stop", "text": "One line per bullet, then the speaker moves on."},
                ],
                "band8": "Plurals carry marks - the recording's plural must be your plural.",
                "tip": "Minute-plan: Skim the notes in the seconds before the recording starts - predictions are your only head start.",
                "avoid": "Your own wording - notes demand the recorded words.",
            },
            {
                "name": "Table Completion",
                "priority": 6,
                "relevance": "Regular - pairs with notes in Section 1 or appears in Section 4.",
                "group": "Listening question types",
                "official": "Official drill: a table of facts (prices, dates, places, names) - read the row before you listen so you know what is missing.",
                "length": "One cell per 8-10 s of audio - exact words and numbers",
                "steps": [
                    {"label": "Slot", "text": "Name the empty cell first - \"this column is amounts\", \"this row is dates\"."},
                    {"label": "Match", "text": "The speaker names the row, then gives the fact - \"the single room is 60\"."},
                    {"label": "Stop", "text": "Write it with its unit - \"60 pounds\" - and close the row."},
                ],
                "band8": "The order of the table is the order of the recording - never jump rows.",
                "tip": "Minute-plan: Tables move in rows - read the whole row once, then listen; never go back up the columns.",
                "avoid": "Mixing the units: $20 is not 20, and 'three' is not 'third'.",
            },
            {
                "name": "Multiple Choice",
                "priority": 3,
                "relevance": "Appears in most real tests (usually Sections 2-3) - often the biggest set.",
                "group": "Listening question types",
                "official": "Official drill: three options; the recording paraphrases the correct one and repeats the others' words as distractors.",
                "length": "Decide in one pass - about 20-30 s of audio per question, no second chance",
                "steps": [
                    {"label": "Listen", "text": "Expect the paraphrase before the words - \"every morning\" for an option that says \"daily\"."},
                    {"label": "Match meaning", "text": "The correct option restates the speaker - the words you hear are the decoy."},
                    {"label": "Lock", "text": "Choose while they are still talking - the next answer begins immediately."},
                ],
                "band8": "Anticipate the paraphrase: hear \"every morning\" for an option that says \"daily\".",
                "tip": "Minute-plan: Read the options during the section's lead-in, flag your pick, and review only during the 2-minute check.",
                "avoid": "Picking the option that repeats the most heard words - that is the distractor.",
            },
            {
                "name": "Map / Plan / Diagram Labelling",
                "priority": 4,
                "relevance": "Appears in many real tests (usually Section 2) - a route or plan comes up often.",
                "group": "Listening question types",
                "official": "Official drill: the speaker follows a route or describes a diagram step by step - you write the letter from the plan, not the word.",
                "length": "One letter per label - follow the route in order, 5-10 s between labels",
                "steps": [
                    {"label": "Orient", "text": "Start where the speaker starts - \"the entrance is at the top of the plan\" fixes your bearings."},
                    {"label": "Follow", "text": "Track the route in order - \"first you'll pass reception, then the cafe on your right\"."},
                    {"label": "Letter", "text": "Answer in the plan's letters - \"H\" for the cafe, not the word \"cafe\"."},
                ],
                "band8": "Unlabelled letters tell you where the speaker starts - position yourself before the audio.",
                "tip": "Minute-plan: Draw the route mentally as it is spoken - orientate yourself at the start point before the audio.",
                "avoid": "Reversing direction: 'past X' is not 'north of X'.",
            },
            {
                "name": "Short Answer",
                "priority": 10,
                "relevance": "Less frequent in current tests - but appears in some papers.",
                "group": "Listening question types",
                "official": "Official drill: a factual question (who / when / how much) with a word limit printed above the questions.",
                "length": "One or two exact words - answer the fact, not the full sentence",
                "steps": [
                    {"label": "Spot", "text": "The question word fixes the fact - \"how much\" means a price is coming."},
                    {"label": "Take", "text": "Grab the fact after the topic phrase - \"the deposit is five hundred\"."},
                    {"label": "Stop", "text": "Write it within the limit - \"500\", not a sentence."},
                ],
                "band8": "Check the limit - 'NO MORE THAN TWO WORDS AND/OR A NUMBER' - against your answer.",
                "tip": "Minute-plan: Answer as you hear it - the recording never waits and the next question starts immediately.",
                "avoid": "Adding articles or detail the limit forbids.",
            },
            {
                "name": "Matching",
                "priority": 5,
                "relevance": "Appears in most real tests (usually Section 3 - speakers to options).",
                "group": "Listening question types",
                "official": "Official drill: match items to a lettered list as different speakers are introduced one by one.",
                "length": "One letter per question - decide as each speaker finishes, about 15-20 s each",
                "steps": [
                    {"label": "Count", "text": "Know who is speaking - \"speakers A, B and C\"."},
                    {"label": "Track", "text": "Note each name and their point - \"A loves the beach, B prefers the lake\"."},
                    {"label": "Letter", "text": "One letter per item as each speaker finishes - \"B\" for the lake."},
                ],
                "band8": "First names mislead - confirm the final opinion, not the first mention.",
                "tip": "Minute-plan: The recording reads the options once more after the items - use that pass to fix every letter.",
                "avoid": "Matching on a single repeated word.",
            },
            {
                "name": "Sentence Completion",
                "priority": 7,
                "relevance": "Common - often closes Section 2 or Section 4.",
                "group": "Listening question types",
                "official": "Official drill: a passage with gaps that keep the exact grammar of the heard sentence.",
                "length": "Copy the recorded words that complete the grammar - typically one or two words",
                "steps": [
                    {"label": "Predict", "text": "Shape the gap before the audio - \"the tour is ___ on Fridays\" needs a verb form."},
                    {"label": "Complete", "text": "Hear the lead-in finish it - \"the tour is cancelled on Fridays\"."},
                    {"label": "Copy", "text": "Take \"cancelled\" exactly - the grammar as heard."},
                ],
                "band8": "Check the word limit and the plural; the sentence must read correctly.",
                "tip": "Minute-plan: Complete the sentence in your head in real time - the check time is for spelling, not for finishing.",
                "avoid": "Your own wording - grammar must match the sentence as heard.",
            },
            {
                "name": "Summary Completion",
                "priority": 8,
                "relevance": "Occasional - Section 4; read the summary before the audio.",
                "group": "Listening question types",
                "official": "Official drill: a summary of the recording with gaps that follow its order.",
                "length": "Exact recorded words, one or two per gap, in audio order",
                "steps": [
                    {"label": "Read", "text": "Know the summary's story - \"this is about a student's first week\"."},
                    {"label": "Run", "text": "Gaps run with the recording - whisper each answer as it passes, never backwards."},
                    {"label": "Copy", "text": "Take the recorded words - \"Monday\" in the gap, though the summary says \"the first day\"."},
                ],
                "band8": "A gap that 'almost fits' in your own words is still wrong - use the recording's words.",
                "tip": "Minute-plan: The summary saves you listening twice - read it first, then track your predictions through the audio.",
                "avoid": "Repairing the summary with synonyms.",
            },
            {
                "name": "Flow-chart Completion",
                "priority": 9,
                "relevance": "Occasional - appears in some tests.",
                "group": "Listening question types",
                "official": "Official drill: a process in stages - each arrow follows the previous step in the recording.",
                "length": "One answer per stage, in order - copy exact words",
                "steps": [
                    {"label": "Read the arrows", "text": "Follow the stages - \"booking - payment - confirmation\"."},
                    {"label": "Step", "text": "Answer as each stage is announced - \"firstly\", \"the next stage is\"."},
                    {"label": "Copy", "text": "Take the exact words with the right plural - \"confirmation email\"."},
                ],
                "band8": "The recording often announces each stage ('firstly', 'the next stage is') - use those cues.",
                "tip": "Minute-plan: Say each stage name as the recording announces it and keep your eyes on the next arrow.",
                "avoid": "Jumping stages - the arrows are sequential.",
            },
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
            {"name": "Task 1 Charts & Graphs", "strategy": "Overview paragraph first, then groups: highest/lowest/change. No opinions.", "time": "20 min", "mistakes": "Listing every number instead of comparing groups."},
            {"name": "Task 1 Tables", "strategy": "Group rows/columns (totals, highest/lowest cells) and describe them in 2-3 paragraphs.", "time": "20 min", "mistakes": "Reporting every cell instead of the main patterns."},
            {"name": "Task 1 Mixed Charts", "strategy": "Describe each chart separately, then compare the overall picture across both.", "time": "20 min", "mistakes": "Only describing one of the two visuals."},
            {"name": "Task 1 Process", "strategy": "Report the sequence of stages using sequencing language and the passive.", "time": "20 min", "mistakes": "Describing the diagram instead of the process it represents."},
            {"name": "Task 1 Maps / Plans", "strategy": "Describe the before/after layout change using comparison and location language.", "time": "20 min", "mistakes": "Ignoring one of the two time periods shown."},
            {"name": "Task 1 Diagrams", "strategy": "Describe components and how they work/structure the object — not an opinion.", "time": "20 min", "mistakes": "Treating an object diagram like a process or map."},
            {"name": "Task 2 Opinion", "strategy": "Clear position in the introduction, one idea per paragraph, examples.", "time": "40 min", "mistakes": "A vague position that wavers between paragraphs."},
            {"name": "Task 2 Discussion", "strategy": "Discuss BOTH views fairly, then give your own view.", "time": "40 min", "mistakes": "Arguing one side and ignoring the other."},
            {"name": "Task 2 Advantages / Disadvantages", "strategy": "Weigh benefits and drawbacks with equal depth, then decide the balance.", "time": "40 min", "mistakes": "A one-sided list that never reaches a judgement."},
            {"name": "Task 2 Problem / Solution", "strategy": "State causes and effects, then one solution paragraph with a real example.", "time": "40 min", "mistakes": "Solutions that do not connect to the problems stated."},
            {"name": "Task 2 Double Question", "strategy": "Answer BOTH parts with equal word depth and link them in the conclusion.", "time": "40 min", "mistakes": "Answering one part at length and rushing the second."},
            {"name": "Task 2 Mixed / Combined Question", "strategy": "Map each clause of the prompt to a paragraph — discuss views AND give opinion AND problems.", "time": "40 min", "mistakes": "Missing one requirement of a combined task."},
        ],
        "type_guides": [
            {
                "name": "Task 1 Charts & Graphs",
                "priority": 1,
                "group": "Writing tasks",
                "relevance": "The most common Task 1 type - a line or bar chart appears in most test series. Learn this one first.",
                "official": "Official task: \"The chart below shows... Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\" No opinion allowed.",
                "length": "At least 150 words in 20 minutes - under 150 words risks Task Achievement",
                "steps": [
                    {"label": "Overview", "text": "One sentence naming the overall trend - \"Overall, sales rose steadily, with a sharp dip in 2020.\""},
                    {"label": "Group", "text": "Two body paragraphs by idea or time - \"Electric cars tripled, while petrol models fell by half.\""},
                    {"label": "Compare", "text": "Put figures against each other - \"By 2025, digital sales were double in-store sales.\""},
                ],
                "band8": "Every key feature covered once, with one clear overview sentence and no invented figures.",
                "tip": "Minute-plan: 20 minutes - 2 planning (write the overview sentence first), 15 writing, 3 checking (word count and units).",
                "avoid": "Listing every number, wandering commentary, and personal opinion.",
            },
            {
                "name": "Task 1 Tables",
                "priority": 2,
                "group": "Writing tasks",
                "relevance": "Common - nearly every test series includes a table at some point. Prepare the row-and-column grouping.",
                "official": "Official task: \"The table below shows... Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"",
                "length": "At least 150 words in 20 minutes - group rows, never list every cell",
                "steps": [
                    {"label": "Overview", "text": "Name the biggest and smallest values first - \"Overall, the lowest figures were in 2015, across every region.\""},
                    {"label": "Group", "text": "Two body paragraphs by rows - \"Urban areas grew fastest, while rural figures stayed flat.\""},
                    {"label": "Cross-compare", "text": "Compare across rows and columns - \"The north doubled the south's total.\""},
                ],
                "band8": "Two or three body paragraphs that group the data instead of itemising it.",
                "tip": "Minute-plan: 20 minutes - 2 planning, 15 writing, 3 checking (every row mentioned once).",
                "avoid": "A cell-by-cell list and comments about whether the data is good or bad.",
            },
            {
                "name": "Task 1 Maps / Plans",
                "priority": 3,
                "group": "Writing tasks",
                "relevance": "A fixture of recent test series - appears in roughly one test in three. Must-prepare.",
                "official": "Official task: \"The maps below show a town centre in 2000 and today. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"",
                "length": "At least 150 words in 20 minutes - both time periods must appear",
                "steps": [
                    {"label": "Orient", "text": "Name the place and both periods - \"The maps show the town centre in 2000 and today.\""},
                    {"label": "Change", "text": "One paragraph per map, biggest changes first - \"The car park became a pedestrian square.\""},
                    {"label": "Locate", "text": "Place the changes precisely - \"a new hotel went up to the north of the station.\""},
                ],
                "band8": "Position words (north of, opposite, adjacent to) used naturally, every change named once.",
                "tip": "Minute-plan: 20 minutes - 2 planning (list 4-5 changes per map), 15 writing, 3 checking (both maps covered).",
                "avoid": "Describing the maps' appearance instead of what changed between the periods.",
            },
            {
                "name": "Task 1 Process",
                "priority": 4,
                "group": "Writing tasks",
                "relevance": "Less frequent than charts, but appears regularly in some test series. Learn the passive flow.",
                "official": "Official task: \"The diagram below shows the process for... Summarise the information by selecting and reporting the main features.\"",
                "length": "At least 150 words in 20 minutes - one to two sentences per stage",
                "steps": [
                    {"label": "Name", "text": "Say what the process produces - \"The diagram shows how glass is recycled.\""},
                    {"label": "Passive", "text": "Describe stages in order with the passive - \"The glass is crushed and then melted at 1,400 degrees.\""},
                    {"label": "Link", "text": "Connect stages naturally - \"After sorting, the bottles are washed before crushing.\""},
                ],
                "band8": "A clear stage count and sequencing words (first, next, once, finally) with no steps missed.",
                "tip": "Minute-plan: 20 minutes - 2 planning (number the stages), 15 writing, 3 checking (stage order exact).",
                "avoid": "Commentary, opinions, and skipping any stage of the cycle.",
            },
            {
                "name": "Task 1 Mixed Charts",
                "priority": 5,
                "group": "Writing tasks",
                "relevance": "Occasional - two visuals in one question. Appears in some series; balance both visuals evenly.",
                "official": "Official task: \"The charts below show... Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"",
                "length": "At least 150 words in 20 minutes - both visuals in equal depth",
                "steps": [
                    {"label": "Each visual", "text": "One body paragraph per visual - \"The bar chart shows... Meanwhile, the table records...\""},
                    {"label": "One overview", "text": "A single sentence covering both - \"Both visuals point to a steady shift towards streaming.\""},
                    {"label": "Span", "text": "Connect the two sets of data - \"The rise in the chart matches the table's higher totals.\""},
                ],
                "band8": "Equal paragraph weight across both visuals and one overview that touches both.",
                "tip": "Minute-plan: 20 minutes - 2 planning, 15 writing (half the time per visual), 3 checking.",
                "avoid": "Describing one visual in detail and dismissing the other in one line.",
            },
            {
                "name": "Task 1 Diagrams",
                "priority": 6,
                "group": "Writing tasks",
                "relevance": "The least common Task 1 - appears rarely. Cover it last, and only if the other types are solid.",
                "official": "Official task: \"The diagram below shows how... Summarise the information by selecting and reporting the main features.\"",
                "length": "At least 150 words in 20 minutes - parts ordered by location, not time",
                "steps": [
                    {"label": "Parts", "text": "Name the components in the diagram's order - \"The filter is fixed at the top of the tank.\""},
                    {"label": "Location", "text": "Describe position to position - \"pipes run from the inlet along the left wall.\""},
                    {"label": "Function", "text": "One sentence on how it works - \"water enters here and passes through the filter.\""},
                ],
                "band8": "Every labelled part identified once, with the working explained cleanly in order.",
                "tip": "Minute-plan: 20 minutes - 2 planning, 15 writing, 3 checking (every label covered).",
                "avoid": "Narrating a time sequence the diagram does not show.",
            },
            {
                "name": "Task 2 Opinion",
                "priority": 7,
                "group": "Writing tasks",
                "relevance": "The single most common Task 2 - around a quarter of all essays in most series. Learn this one first.",
                "official": "Official task: \"To what extent do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.\"",
                "length": "At least 250 words in 40 minutes - one reason and one example per body paragraph",
                "steps": [
                    {"label": "Position", "text": "State it in the introduction - \"In my view, remote work should remain an option.\""},
                    {"label": "Body", "text": "Two paragraphs, each with a reason and an example - \"Flexible hours raise output - my team delivers more from home.\""},
                    {"label": "Conclusion", "text": "Restate in different words - \"For most roles, a hybrid model is the realistic future.\""},
                ],
                "band8": "A clear position throughout - never a hidden or shifting opinion.",
                "tip": "Minute-plan: 40 minutes - 3 planning (position + two ideas), 32 writing, 5 checking (position visible in every paragraph, 250+ words).",
                "avoid": "Repetition and memorised templates; every sentence must move the argument.",
            },
            {
                "name": "Task 2 Discussion",
                "priority": 8,
                "group": "Writing tasks",
                "relevance": "Very common - appears alongside Opinion in most series. Discuss both views fairly.",
                "official": "Official task: \"Discuss both views and give your own opinion. Give reasons for your answer and include any relevant examples.\"",
                "length": "At least 250 words in 40 minutes - roughly 80 words per view plus your opinion",
                "steps": [
                    {"label": "Both sides", "text": "One paragraph per view, fairly - \"Supporters argue that... Critics counter that...\""},
                    {"label": "Your view", "text": "Give your own position with a reason - \"On balance, I side with... because...\""},
                    {"label": "Conclusion", "text": "Settle it in one sentence - \"A blend of both approaches would serve most countries best.\""},
                ],
                "band8": "Both views developed with examples, and a personal opinion that is clearly expressed.",
                "tip": "Minute-plan: 40 minutes - 3 planning (covers both views), 32 writing, 5 checking (both sides present).",
                "avoid": "Straw-manning one view or disappearing behind 'some people say'.",
            },
            {
                "name": "Task 2 Advantages / Disadvantages",
                "priority": 9,
                "group": "Writing tasks",
                "relevance": "Common - one of the most repeated themes across test series.",
                "official": "Official task: \"What are the advantages and disadvantages of...? Give reasons for your answer and include any relevant examples.\"",
                "length": "At least 250 words in 40 minutes - cover both sides, then a verdict",
                "steps": [
                    {"label": "One side", "text": "Advantages with an example - \"On the one hand, remote work cuts commuting time.\""},
                    {"label": "Other side", "text": "Disadvantages with an example - \"On the other hand, it weakens team culture.\""},
                    {"label": "Verdict", "text": "A reasoned conclusion - \"The benefits outweigh the drawbacks when companies invest in team building.\""},
                ],
                "band8": "Balanced development of both sides and a clear reasoned judgement in the conclusion.",
                "tip": "Minute-plan: 40 minutes - 3 planning (2 advantages + 2 disadvantages), 32 writing, 5 checking.",
                "avoid": "One long side and a token flipped paragraph; keep parity.",
            },
            {
                "name": "Task 2 Problem / Solution",
                "priority": 10,
                "group": "Writing tasks",
                "relevance": "Regular - appears in nearly every test series in some form.",
                "official": "Official task: \"What problems does... cause, and what solutions can you suggest? Give reasons for your answer and include any relevant examples.\"",
                "length": "At least 250 words in 40 minutes - at least one problem and one solution, fully linked",
                "steps": [
                    {"label": "Problem", "text": "One paragraph naming the problem and its cause - \"Urban traffic congestion worsens as cities grow.\""},
                    {"label": "Solution", "text": "One paragraph with a realistic fix - \"Congestion charging, as seen in several capitals, cuts car use.\""},
                    {"label": "Result", "text": "Show what the solution achieves - \"Within a decade, commuting times could fall by a third.\""},
                ],
                "band8": "Every problem matched by a workable solution, each supported with a concrete example.",
                "tip": "Minute-plan: 40 minutes - 3 planning (1-2 problems, 1-2 solutions), 32 writing, 5 checking.",
                "avoid": "Listing problems without ever solving them, or vague fixes like 'the government should act'.",
            },
            {
                "name": "Task 2 Double Question",
                "priority": 11,
                "group": "Writing tasks",
                "relevance": "Occasional - two linked questions in one prompt. Some series feature it; answer BOTH fully.",
                "official": "Official task: \"Why is... becoming more common? Do you think it is a positive or negative development? Give reasons for your answer.\"",
                "length": "At least 250 words in 40 minutes - one paragraph per question",
                "steps": [
                    {"label": "First question", "text": "Answer it directly - \"It is becoming common because travel and remote tools got cheaper.\""},
                    {"label": "Second question", "text": "Answer it directly - \"Overall I see it as positive, since it widens access to jobs.\""},
                    {"label": "Link", "text": "Tie both answers in the conclusion - \"As the causes persist, its advantages are likely to grow.\""},
                ],
                "band8": "Both halves of the prompt answered fully - missing one question caps the band.",
                "tip": "Minute-plan: 40 minutes - 3 planning (one idea per question), 32 writing, 5 checking (both answered).",
                "avoid": "Answering only the first half or answering the second one vaguely.",
            },
            {
                "name": "Task 2 Mixed / Combined Question",
                "priority": 12,
                "group": "Writing tasks",
                "relevance": "The least common Task 2 - a combined prompt. Appears in a few series; map each clause to a paragraph.",
                "official": "Official task: \"Some people think... while others think... Discuss both views, give your opinion, and say what the implications would be.\"",
                "length": "At least 250 words in 40 minutes - every clause of the prompt gets a paragraph",
                "steps": [
                    {"label": "Split", "text": "Map each clause of the prompt - \"this question asks for both views, my opinion, and the consequences.\""},
                    {"label": "Cover", "text": "One requirement per paragraph - \"First the two views, then my position, then the outcomes.\""},
                    {"label": "Close", "text": "Tie everything together - \"Either way, the effect on planning is what we must weigh.\""},
                ],
                "band8": "Every requirement of the combined prompt handled - skipping one caps the band.",
                "tip": "Minute-plan: 40 minutes - 3 planning (requirements inventory first), 32 writing, 5 checking against the prompt.",
                "avoid": "Treating it as a single question and missing half the task.",
            },
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
            {"correct": "Fluency and Coherence", "band": "25%"},
            {"correct": "Lexical Resource", "band": "25%"},
            {"correct": "Grammatical Range and Accuracy", "band": "25%"},
            {"correct": "Pronunciation", "band": "25%"},
        ],
        "score_breakdown": [
            {"name": "Part 1", "share": "4-5 minutes", "detail": "Personal questions. Answer in 2-3 sentences."},
            {"name": "Part 2", "share": "3-4 minutes", "detail": "Cue card: 1 min to prepare, speak 1-2 minutes."},
            {"name": "Part 3", "share": "4-5 minutes", "detail": "Abstract discussion linked to Part 2 topic. Deeper answers."},
            {"name": "Four criteria", "share": "equal 25%", "detail": "Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, Pronunciation."},
        ],
        "question_types": [
            {"name": "Part 1 - Introduction & Interview", "strategy": "Answer directly, add a reason or example, then stop. Never one word.", "time": "~20 sec per answer", "mistakes": "Memorised answers that do not fit the question."},
            {"name": "Part 2 - Cue Card / Individual Long Turn", "strategy": "Use the 1 minute to write 4 keywords and tell the story with structure (what/when/where/why).", "time": "1-2 minutes", "mistakes": "Speaking for 30 seconds and stopping. Keep talking with details."},
            {"name": "Part 3 - Discussion", "strategy": "Give an opinion, explain it, and give an example or compare.", "time": "~60 sec per answer", "mistakes": "Giving one-sentence answers to abstract questions."},
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
