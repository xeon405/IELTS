"""Original IELTS-style Reading question bank.

Organised by official question type. Every item carries the full teaching
set the AI Brain can reveal after evaluation: answer, explanation, logic,
tip, suggestions and band advice. Around 70 hand-written items; Gemini
generates fresh equivalents on top when it is available, so practice volume
is effectively unlimited ("~500 questions or AI-generated equivalents").
"""

from typing import Any

READING_QUESTION_TYPES = [
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
]

# Question types typically used on each official passage slot.
PASSAGE_TYPES = {
    "Full Reading Section": READING_QUESTION_TYPES,
    "Passage 1": ["True / False / Not Given", "Sentence Completion", "Short Answer", "Multiple Choice"],
    "Passage 2": ["Matching Headings", "Summary Completion", "Table Completion", "Flow-chart Completion", "Multiple Choice"],
    "Passage 3": ["Yes / No / Not Given", "Matching Sentence Endings", "Matching Features", "Matching Information", "Diagram Label Completion", "Short Answer"],
    "Quick Practice": ["Short Answer", "True / False / Not Given", "Multiple Choice"],
    "Individual Question Types": READING_QUESTION_TYPES,
}

READING_BY_TYPE: dict[str, list[dict[str, Any]]] = {}

Item = dict[str, Any]


def _register(*items: Item) -> None:
    for item in items:
        READING_BY_TYPE.setdefault(item["typeLabel"], []).append(item)


# ---------------------------------------------------------------------------
# Multiple Choice
# ---------------------------------------------------------------------------

_register(
    {
        "type": "multiple-choice",
        "typeLabel": "Multiple Choice",
        "title": "Why were woodlands planted?",
        "context": "The reforestation programme began after a decade of declining rainfall. Officials planted fast-growing species along riverbanks to stabilise the soil, while slower native trees were reserved for higher ground where flooding was rare.",
        "prompt": "According to the text, why were fast-growing species planted along riverbanks?",
        "options": ["To reduce flooding on higher ground", "To stabilise the soil", "To replace native trees", "To increase rainfall"],
        "correctAnswer": "To stabilise the soil",
        "explanation": "The text states fast-growing species were planted 'along riverbanks to stabilise the soil'. The other options either reverse the detail (flooding is rare on higher ground) or are not stated.",
        "logic": "1. Underline the question keywords: 'fast-growing species' and 'riverbanks'. 2. Scan the text for both in one sentence. 3. Match the verb: planted to stabilise. 4. Reject options that are true elsewhere in the text but not in that sentence.",
        "tip": "An option can be factually true AND still be the wrong answer. Match the exact reason the question asks for.",
        "suggestions": "Before choosing, cover the options and say the answer in your own words, then find the option that matches your phrasing.",
        "bandAdvice": "At Band 6, distractors are usually paraphrased copies of other sentences. At Band 7+, they combine two true details in a false relationship — check the linking logic.",
    },
    {
        "type": "multiple-choice",
        "typeLabel": "Multiple Choice",
        "title": "The writer's main concern",
        "context": "Although battery storage is improving quickly, the writer argues that grid infrastructure remains the real bottleneck: without new transmission lines, renewable electricity cannot reach the cities that need it most.",
        "prompt": "What is the writer's main concern?",
        "options": ["Battery technology is developing too slowly", "Transmission lines cannot move renewable power to demand", "Cities consume too much electricity", "Renewables are more expensive than coal"],
        "correctAnswer": "Transmission lines cannot move renewable power to demand",
        "explanation": "The writer states the real bottleneck is 'grid infrastructure': new transmission lines are needed 'without which renewable electricity cannot reach the cities'. The concern is delivery, not generation or cost.",
        "logic": "1. Notice the signal phrase 'the writer argues'. 2. Find the claim: grid infrastructure is the real bottleneck. 3. Check the explanation clause that follows 'without'. 4. The option must restate the cause, not a supporting detail.",
        "tip": "'Main concern' questions test the controlling idea. Ignore examples that merely illustrate it.",
        "suggestions": "Practise paraphrasing the writer's argument in one sentence before looking at options.",
        "bandAdvice": "For Band 7+, examiners expect you to distinguish the writer's argument (claim) from its evidence (support).",
    },
    {
        "type": "multiple-choice",
        "typeLabel": "Multiple Choice",
        "title": "What did the survey show?",
        "context": "A survey of 4,000 office workers found that 71% said natural light improved their mood, but only 38% reported that it improved their concentration, a figure that fell further among workers near windows.",
        "prompt": "According to the survey, what effect did natural light have on workers?",
        "options": ["It improved concentration for most workers", "It improved mood more than concentration", "It had no measurable effect", "It reduced concentration near windows"],
        "correctAnswer": "It improved mood more than concentration",
        "explanation": "71% reported better mood versus 38% better concentration, so the light improved mood more than concentration. The survey does not claim concentration fell — it only stopped improving.",
        "logic": "1. Locate the two percentages and what each measures. 2. Compare: 71% (mood) > 38% (concentration). 3. Reject 'no effect' (the survey shows effects) and 'reduced concentration' (not stated).",
        "tip": "With statistics, draw a mental comparison before reading the options. 'Fell further' refers to the percentage, not to concentration itself.",
        "suggestions": "Highlight every number with its referent (71% -> mood) so you can compare them under time pressure.",
        "bandAdvice": "Number-heavy texts are classic Band 6.5-7 passages: examiners check precise referent matching, not just number recall.",
    },
    {
        "type": "multiple-choice",
        "typeLabel": "Multiple Choice",
        "title": "Purpose of the second paragraph",
        "context": "Paragraph two recounts how early mapmakers deliberately exaggerated coastlines to protect trade routes, a practice that historians now read as evidence of economic rivalry rather than simple error.",
        "prompt": "What is the purpose of the second paragraph?",
        "options": ["To explain why mapmaking was inaccurate", "To argue that map errors reveal commercial competition", "To describe modern navigation tools", "To praise early cartographers"],
        "correctAnswer": "To argue that map errors reveal commercial competition",
        "explanation": "The paragraph presents deliberate exaggeration as 'evidence of economic rivalry rather than simple error' — an argument about what the mistakes mean, not just that they existed.",
        "logic": "1. Read the paragraph's first and last sentence. 2. Spot the contrast: 'deliberately' vs 'rather than simple error'. 3. The purpose is the interpretation, i.e. economic rivalry.",
        "tip": "'Purpose' questions are about WHY the author wrote it. Ask: what claim is this paragraph making?",
        "suggestions": "For every paragraph you read in practice, write one sentence stating its purpose. This builds automaticity for purpose and heading questions.",
        "bandAdvice": "Identifying paragraph purpose is the core Band 7 reading skill; it feeds Matching Headings and Multiple Choice 'purpose' items alike.",
    },
    {
        "type": "multiple-choice",
        "typeLabel": "Multiple Choice",
        "title": "Which solution is proposed?",
        "context": "To reduce plastic packaging, the report recommends a deposit scheme for reusable containers, noting that voluntary pledges by supermarkets had achieved only a five percent reduction.",
        "prompt": "Which solution does the report propose?",
        "options": ["Banning plastic containers entirely", "A deposit scheme for reusable containers", "Voluntary supermarket pledges", "Higher taxes on packaging"],
        "correctAnswer": "A deposit scheme for reusable containers",
        "explanation": "The report 'recommends a deposit scheme for reusable containers'. Voluntary pledges are mentioned as the failed alternative, not as the proposal.",
        "logic": "1. Find the recommendation verb: 'recommends'. 2. Read what follows it. 3. Check the other options: one is rejected by the text (pledges produced only 5%).",
        "tip": "Verbs of recommendation (proposes, recommends, argues) mark the answer sentence. Options that were previously tried and failed are usually distractors.",
        "suggestions": "Underline recommendation verbs as you scan; they are the anchors for 'solution' questions.",
        "bandAdvice": "Scanning for one strong verb saves 30 seconds per question — essential for completing 40 questions in 60 minutes.",
    },
    {
        "type": "multiple-choice",
        "typeLabel": "Multiple Choice",
        "title": "Night-time economy study",
        "context": "The study measured footfall across twelve districts and found that the extension of late-night transport added little to total spending, although it did shift spending later in the evening and spread crowds across more venues.",
        "prompt": "What did the study find about the extension of late-night transport?",
        "options": ["It increased total spending significantly", "It moved spending to later hours without increasing it", "It reduced crowding at venues", "It had no effect on spending patterns"],
        "correctAnswer": "It moved spending to later hours without increasing it",
        "explanation": "The extension 'added little to total spending' but 'did shift spending later in the evening'. So it changed when and where people spent, not how much.",
        "logic": "1. Mark the two clauses joined by 'although'. 2. The first clause gives the quantity finding; the second gives the pattern finding. 3. The answer must contain BOTH halves.",
        "tip": "'Although' signals a contrast — the true answer often combines both sides of the contrast.",
        "suggestions": "When a passage links findings with 'although/while/however', write the two halves as A and B; examiners love testing that pairing.",
        "bandAdvice": "Combined-clause answers are a Band 7+ differentiator: single-half options are designed to trap faster readers.",
    },
)

# ---------------------------------------------------------------------------
# Matching Headings
# ---------------------------------------------------------------------------

_register(
    {
        "type": "matching-headings",
        "typeLabel": "Matching Headings",
        "title": "Paragraph B heading",
        "context": "Paragraph A describes the rapid growth of rooftop gardens in city centres. Paragraph B explains that maintenance costs, not installation, decide whether these gardens survive, because watering and structural inspection continue for decades. Paragraph C proposes sharing maintenance across neighbourhood co-ops.",
        "prompt": "Choose the best heading for Paragraph B.",
        "options": ["The rise of rooftop gardens", "Why maintenance is the deciding factor", "Community solutions to gardening costs", "Structural dangers of green roofs"],
        "correctAnswer": "Why maintenance is the deciding factor",
        "explanation": "Paragraph B's controlling idea is that long-term maintenance decides survival. 'Community solutions' belongs to Paragraph C; 'The rise' belongs to Paragraph A.",
        "logic": "1. Read the first and last sentence of the paragraph. 2. Identify what is being claimed: maintenance decides survival. 3. Compare the claim against each heading's key noun — 'maintenance' and 'deciding factor' match.",
        "tip": "Never choose a heading that covers only a detail or another paragraph's idea. The heading must summarise the whole paragraph.",
        "suggestions": "Skim all headings first and write their key nouns. Then read each paragraph's first sentence and match on the key noun, not the vocabulary.",
        "bandAdvice": "Matching Headings is the most common Band 6.5-7 question type. Mastery of first-sentence scanning is worth 5-6 marks per test.",
    },
    {
        "type": "matching-headings",
        "typeLabel": "Matching Headings",
        "title": "Paragraph D heading",
        "context": "Paragraph D presents evidence from three cities where congestion pricing was abandoned within a year, and argues that public acceptance is built through gradual pilot phases rather than sudden policy shifts.",
        "prompt": "Choose the best heading for Paragraph D.",
        "options": ["Why pricing schemes are rejected", "The benefits of congestion pricing", "How acceptance depends on gradual introduction", "A comparison of transport costs"],
        "correctAnswer": "How acceptance depends on gradual introduction",
        "explanation": "The paragraph's argument is that acceptance is built 'through gradual pilot phases'. The failed schemes are supporting evidence, not the main idea.",
        "logic": "1. Split the paragraph into evidence (three failures) and argument (gradual pilots build acceptance). 2. The heading must name the argument, not the evidence. 3. 'Rejected' headings trap you because the evidence mentions rejection.",
        "tip": "If a heading matches only the examples, it is wrong. Ask: what claim is the writer making with these examples?",
        "suggestions": "Train yourself to underline the sentence where the writer steps back and generalises — usually the last sentence of an evidence-heavy paragraph.",
        "bandAdvice": "Evidence vs claim discrimination is exactly what separates Band 6.5 from Band 7.5 in Reading.",
    },
    {
        "type": "matching-headings",
        "typeLabel": "Matching Headings",
        "title": "Paragraph F heading",
        "context": "Paragraph F traces how bird migration routes shifted as coastal wetlands were drained, then recovered when one country restored a chain of feeding grounds along the old flyway.",
        "prompt": "Choose the best heading for Paragraph F.",
        "options": ["The disappearance of wetlands", "How migration routes adapted and returned", "A study of bird feeding habits", "The economics of land restoration"],
        "correctAnswer": "How migration routes adapted and returned",
        "explanation": "The paragraph narrates a change: routes shifted, then 'recovered' when feeding grounds were restored. The heading must capture both the adaptation and the return.",
        "logic": "1. Identify the time sequence: drained -> shifted -> restored -> recovered. 2. The heading that covers the full sequence is correct. 3. Single-stage headings (only the disappearance) are incomplete.",
        "tip": "For narrative paragraphs, the correct heading usually covers the whole arc — beginning AND end.",
        "suggestions": "After skimming, say the sequence of events in three words ('lost, shifted, returned') before scanning headings.",
        "bandAdvice": "Process paragraphs with 'then/recovered/after' markers are frequent at Band 7; practice tracking causal chains, not single facts.",
    },
    {
        "type": "matching-headings",
        "typeLabel": "Matching Headings",
        "title": "Paragraph H heading",
        "context": "Paragraph H lists the components of a smart irrigation system: soil sensors, weather feeds, valve controllers, and an app that alerts farmers when a field needs water.",
        "prompt": "Choose the best heading for Paragraph H.",
        "options": ["The benefits of smart farming", "Parts of an irrigation system", "How sensors measure soil", "Problems with water supply"],
        "correctAnswer": "Parts of an irrigation system",
        "explanation": "The paragraph is a list of components (sensors, feeds, controllers, app). It does not discuss benefits or problems.",
        "logic": "1. Notice the enumeration: 'sensors, feeds, controllers, and an app'. 2. The heading naming the category 'parts of' matches the structure. 3. 'Benefits' and 'problems' are evaluations the paragraph never makes.",
        "tip": "List paragraphs are matched by structure, not meaning: look for the heading that names the category being listed.",
        "suggestions": "Underline every noun in a list paragraph; the common heading is usually the umbrella term for those nouns.",
        "bandAdvice": "Fast list-paragraph recognition buys time for the harder inference questions later in the test.",
    },
)

# ---------------------------------------------------------------------------
# Matching Features
# ---------------------------------------------------------------------------

_register(
    {
        "type": "matching",
        "typeLabel": "Matching Features",
        "title": "Match researcher to claim",
        "context": "Dr. Vasquez argues that soundscapes shape how neighbourhoods are remembered. Professor Ito links acoustic design to religious ritual. Dr. Alder treats noise levels as a marker of social class.",
        "prompt": "Which researcher connects sound design to worship?",
        "options": ["Dr. Vasquez", "Professor Ito", "Dr. Alder"],
        "correctAnswer": "Professor Ito",
        "explanation": "Professor Ito 'links acoustic design to religious ritual' — the only researcher connected to worship.",
        "logic": "1. Find the claim word: 'worship'. 2. Scan for its synonyms: 'religious ritual'. 3. Read the sentence backwards to the researcher's name.",
        "tip": "Feature matching questions paraphrase the features (worship = religious ritual). Scan for meaning, not exact words.",
        "suggestions": "As you read the passage first time, jot a two-word note per researcher (Vasquez-memory, Ito-ritual, Alder-class). It makes matching instant.",
        "bandAdvice": "Passage 3 matching features test your ability to track multiple referents across dense text — a Band 7.5+ skill.",
    },
    {
        "type": "matching",
        "typeLabel": "Matching Features",
        "title": "Match species to behaviour",
        "context": "The honeyguide bird leads humans to beehives and then feeds on the wax. The drongo mimics the alarm calls of other species to scare them away from food. The hornbill cements itself into a tree cavity for nesting.",
        "prompt": "Which species imitates other birds' warning sounds?",
        "options": ["The honeyguide", "The drongo", "The hornbill"],
        "correctAnswer": "The drongo",
        "explanation": "The drongo 'mimics the alarm calls of other species' — imitation of warning sounds.",
        "logic": "1. Decompose the question: species + imitates + warning sounds. 2. Scan for 'mimics' (imitation) and 'alarm calls' (warnings). 3. Both appear in the drongo sentence only.",
        "tip": "Translate the question into two or three search keys (species, mimics, alarm) and find the sentence containing all of them.",
        "suggestions": "Practice this two-key scanning: one key often appears in every option, so only the second key discriminates.",
        "bandAdvice": "Discriminating keys in feature matching reduces wrong answers from about 50% to near zero — a reliable band lift.",
    },
    {
        "type": "matching",
        "typeLabel": "Matching Features",
        "title": "Match era to practice",
        "context": "In the 17th century, mapmakers hid accurate coastlines to protect trade. In the 19th, railway companies exaggerated distances to inflate ticket prices. In the 20th, advertisers distorted maps to sell locations.",
        "prompt": "Which period saw maps used to raise ticket prices?",
        "options": ["17th century", "19th century", "20th century"],
        "correctAnswer": "19th century",
        "explanation": "Railway companies of the 19th century exaggerated distances to 'inflate ticket prices'.",
        "logic": "1. Key 1: 'ticket prices'. 2. Scan for price/railway vocabulary. 3. The century and the practice appear in the same clause — no inference needed.",
        "tip": "When options are time periods, scan for the century number and read the clause attached to it.",
        "suggestions": "In matching feature questions, always check the year first — time is the fastest anchor.",
        "bandAdvice": "Time-anchored matching rewards fast scanning; doing it in under a minute per question protects your 60-minute budget.",
    },
    {
        "type": "matching",
        "typeLabel": "Matching Features",
        "title": "Match expert to recommendation",
        "context": "Dr. Chen recommends shorter school days with deeper breaks. Professor Silva recommends starting school later for teenagers. Dr. Okafor recommends exercise before academic lessons.",
        "prompt": "Which expert suggests teenagers begin classes later?",
        "options": ["Dr. Chen", "Professor Silva", "Dr. Okafor"],
        "correctAnswer": "Professor Silva",
        "explanation": "Professor Silva recommends 'starting school later for teenagers' — the only recommendation about the school day start time.",
        "logic": "1. Key: 'begin classes later' = starting school later. 2. Match to the recommendation phrase. 3. Reject experts whose recommendations concern other variables (breaks, exercise).",
        "tip": "Paraphrase the question once before scanning: 'later start for teens'.",
        "suggestions": "Cover the options and rewrite the question in 4-5 words; then the scan is fast and targeted.",
        "bandAdvice": "Explicit recommendation matching is Band 6 level; the time pressure is the real test — read once, answer immediately.",
    },
)

# ---------------------------------------------------------------------------
# Matching Sentence Endings
# ---------------------------------------------------------------------------

_register(
    {
        "type": "matching-sentence-endings",
        "typeLabel": "Matching Sentence Endings",
        "title": "Complete: soil erosion",
        "context": "Soil erosion accelerates when ground cover is removed. The loss is fastest on slopes steeper than ten degrees, where rain strikes bare soil directly.",
        "prompt": "Complete the sentence: Soil erosion is fastest on land that ____.",
        "options": [
            "has ground cover removed and slopes over ten degrees",
            "lies completely flat and well drained",
            "is covered by dense forest",
            "receives little seasonal rain",
        ],
        "correctAnswer": "has ground cover removed and slopes over ten degrees",
        "explanation": "The text states erosion accelerates with ground cover removed and is fastest on slopes steeper than ten degrees — both conditions appear in one option.",
        "logic": "1. Read the half-sentence stem and predict what completes it: a condition of the land. 2. Scan for 'steep' and 'ten degrees'. 3. Combine with the first condition (ground cover removed) to get the full option.",
        "tip": "Sentence endings often combine TWO conditions from the text. An ending with only one is a distractor.",
        "suggestions": "Underline the two nouns/conditions in the stem, then look for an ending that satisfies both.",
        "bandAdvice": "Compound conditions are the Band 7 signature of sentence-ending tasks — always check option length and detail count.",
    },
    {
        "type": "matching-sentence-endings",
        "typeLabel": "Matching Sentence Endings",
        "title": "Complete: elephant memory",
        "context": "Elephants remember watering holes visited decades earlier. This memory appears strongest for routes used during seasonal droughts, when the survival value of the information is highest.",
        "prompt": "Complete the sentence: Elephant memory for watering holes is strongest when ____.",
        "options": [
            "the route was used during seasonal droughts",
            "the watering holes are located near villages",
            "the elephants are young calves",
            "the dry season is unusually short",
        ],
        "correctAnswer": "the route was used during seasonal droughts",
        "explanation": "The passage says memory is strongest for routes used 'during seasonal droughts, when the survival value is highest'.",
        "logic": "1. Stem keyword: 'strongest'. 2. Scan for 'strongest' in the text — it appears as 'appears strongest'. 3. Read the condition that follows.",
        "tip": "Superlatives (strongest, most, least) in the stem usually appear verbatim or as paraphrases in the text — scan for them directly.",
        "suggestions": "When the stem contains a superlative, search the passage for that superlative's paraphrase before reading any ending.",
        "bandAdvice": "Superlative anchoring is a fast, reliable strategy that reduces completion time on Passage 3 texts.",
    },
    {
        "type": "matching-sentence-endings",
        "typeLabel": "Matching Sentence Endings",
        "title": "Complete: sleep research",
        "context": "Researchers found that sleep consolidates procedural skills, but only when the training and the sleep are separated by a full waking day.",
        "prompt": "Complete the sentence: Sleep consolidates procedural skills only if ____.",
        "options": [
            "a full waking day separates training and sleep",
            "the training occurs during the night",
            "skills are practised immediately before sleep",
            "sleep lasts more than nine hours",
        ],
        "correctAnswer": "a full waking day separates training and sleep",
        "explanation": "The condition is explicit: consolidation works 'only when the training and the sleep are separated by a full waking day'.",
        "logic": "1. The stem ends with 'only if' — the text contains 'only when'. 2. Copy the condition verbatim. 3. Reject endings that reverse the timing.",
        "tip": "Restrictive conditions ('only when', 'provided that', 'unless') signal the answer sentence. Read the full clause.",
        "suggestions": "Highlight every restrictive condition in the passage while skimming; sentence endings usually target them.",
        "bandAdvice": "Restrictive-condition sentences are examiners' favourite raw material — they test precise clause reading.",
    },
    {
        "type": "matching-sentence-endings",
        "typeLabel": "Matching Sentence Endings",
        "title": "Complete: literacy study",
        "context": "The study compared children who read on paper with those who read on screens and found that paper readers recalled plot details better, while screen readers answered comprehension questions faster.",
        "prompt": "Complete the sentence: The study found that screen readers ____.",
        "options": [
            "recalled plot details less accurately but answered faster",
            "recalled plot details more accurately than paper readers",
            "were slower in every measure",
            "could not answer comprehension questions",
        ],
        "correctAnswer": "recalled plot details less accurately but answered faster",
        "explanation": "Paper readers recalled plot details better (so screen readers did worse on that measure), and screen readers answered comprehension questions faster.",
        "logic": "1. Break the findings into two clauses: paper->better recall; screen->faster answers. 2. Derive the screen side: worse recall + faster answers. 3. Combine both halves in the option.",
        "tip": "Two-clause findings produce two-half endings. Verify that BOTH halves of your chosen ending match the text.",
        "suggestions": "Make a quick two-column note (paper vs screen) during skimming; comparison questions then answer themselves.",
        "bandAdvice": "Comparison tasks reward organised note-taking — a habit that pays off across all four Reading passages.",
    },
)

# ---------------------------------------------------------------------------
# True / False / Not Given
# ---------------------------------------------------------------------------

_register(
    {
        "type": "true-false",
        "typeLabel": "True / False / Not Given",
        "title": "Museum photography",
        "context": "The museum allows photography without flash, while the gallery next door bans photography entirely.",
        "prompt": "The gallery allows photography without a flash.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "False",
        "explanation": "The gallery bans photography 'entirely', which directly contradicts allowing it without a flash.",
        "logic": "1. Extract the claim: gallery + allows + no flash. 2. Find the text about the gallery: bans photography entirely. 3. The claim contradicts the text -> False.",
        "tip": "False means the text SAYS the opposite. Not Given means the text is silent. Never use outside knowledge.",
        "suggestions": "Before answering, underline the claim's three parts (subject, verb, detail) and check each against the text.",
        "bandAdvice": "T/F/NG is worth 6-8 marks in every test; 80% of errors come from choosing False when the text is actually silent (Not Given).",
    },
    {
        "type": "true-false",
        "typeLabel": "True / False / Not Given",
        "title": "Cycling lanes trial",
        "context": "A three-year trial found that protected cycling lanes increased rider numbers by 40%, but the report did not measure changes in shop revenue.",
        "prompt": "The trial proved that protected cycling lanes increased shop revenue.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "Not Given",
        "explanation": "The text states revenue was NOT measured, so it neither confirms nor contradicts the claim — the claim cannot be decided from the text.",
        "logic": "1. Claim keywords: shop revenue. 2. The text explicitly says revenue 'was not measured'. 3. Not measured = not stated = Not Given (NOT False, because nothing contradicts it).",
        "tip": "'The report did not measure X' is the classic Not Given trap — the absence of measurement is not a contradiction.",
        "suggestions": "When the text says a topic was NOT studied, mark Not Given instantly. False requires an explicit opposite statement.",
        "bandAdvice": "Distinguishing 'not measured' from 'contradicted' is the single most valuable T/F/NG distinction for Band 7.",
    },
    {
        "type": "true-false",
        "typeLabel": "True / False / Not Given",
        "title": "Desalination plants",
        "context": "Desalination plants supply drinking water to coastal cities, but their energy costs remain roughly double those of conventional treatment.",
        "prompt": "Desalination plants are more energy-intensive than conventional water treatment.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "True",
        "explanation": "The text says desalination's energy costs are 'roughly double those of conventional treatment' — a direct statement of higher energy intensity.",
        "logic": "1. Claim: desalination + higher energy + vs conventional. 2. Text: energy costs double those of conventional. 3. Same meaning in different words -> True.",
        "tip": "Paraphrase the claim into one idea and find its paraphrase in the text. Same idea, different words = True.",
        "suggestions": "Learn common paraphrase families: 'roughly double' ~ 'more energy-intensive', 'X but not Y' ~ 'only X'.",
        "bandAdvice": "True answers are almost always paraphrased, never copied. If the claim's exact words appear in the text, check again for subtle difference.",
    },
    {
        "type": "true-false",
        "typeLabel": "True / False / Not Given",
        "title": "Coffee exports",
        "context": "Vietnam overtook Brazil as the world's largest exporter of robusta coffee in 2015, while Brazil continued to lead in arabica production.",
        "prompt": "Brazil remains the world's largest exporter of all coffee varieties.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "False",
        "explanation": "Brazil 'continued to lead in arabica production' but lost the overall robusta lead; 'all varieties' contradicts the text, which limits Brazil's lead to arabica.",
        "logic": "1. Decompose: largest + ALL varieties + Brazil. 2. Text: Brazil leads only arabica; Vietnam leads robusta. 3. 'All varieties' contradicts the scope -> False.",
        "tip": "Watch scope words: 'all', 'every', 'only', 'never'. A claim that widens the text's scope is usually False, not Not Given.",
        "suggestions": "Circle every scope word in the claim; if the text covers less than the claim, it is False.",
        "bandAdvice": "Scope-word traps dominate Band 6.5+ T/F/NG items — mastering them often adds a full band in Reading.",
    },
    {
        "type": "true-false",
        "typeLabel": "True / False / Not Given",
        "title": "Penguin colonies",
        "context": "The survey counted 1.2 million breeding pairs of Adélie penguins along the eastern coast, a number that surprised researchers who had expected a decline.",
        "prompt": "Researchers were surprised by the number of Adélie penguins counted.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "True",
        "explanation": "The count 'surprised researchers who had expected a decline' — the text states surprise directly.",
        "logic": "1. Claim: researchers + surprised + by the count. 2. Text: count 'surprised researchers'. 3. Direct match -> True.",
        "tip": "Emotion words (surprised, alarmed, welcomed) are often copied directly into True statements — verify the owner of the emotion.",
        "suggestions": "For 'who felt what' claims, match the emotion word AND the person/group attached to it.",
        "bandAdvice": "Quick True wins build time reserves for the Not Given traps at the end of the passage.",
    },
    {
        "type": "true-false",
        "typeLabel": "True / False / Not Given",
        "title": "Ancient irrigation",
        "context": "The qanat system carried water for hundreds of kilometres using only gravity and underground tunnels. Modern engineers studying the system have begun adapting its principles for arid regions.",
        "prompt": "The qanat system requires pumps to move water long distances.",
        "options": ["True", "False", "Not Given"],
        "correctAnswer": "False",
        "explanation": "The text states the system carried water 'using only gravity', which directly contradicts the need for pumps.",
        "logic": "1. Claim: qanat + pumps + long distances. 2. Text: 'using only gravity and underground tunnels'. 3. 'Only gravity' excludes pumps -> False.",
        "tip": "The words 'only', 'solely', 'without' in the text are contradiction generators — pair them with the claim's technology word.",
        "suggestions": "Highlight mechanism words (gravity, pump, electricity) in your skim notes; T/F/NG claims often swap mechanisms.",
        "bandAdvice": "Mechanism-swap claims are standard at Band 7: the wrong answer feels 'right' if you only skimmed the topic word.",
    },
)

# ---------------------------------------------------------------------------
# Yes / No / Not Given
# ---------------------------------------------------------------------------

_register(
    {
        "type": "yes-no-not-given",
        "typeLabel": "Yes / No / Not Given",
        "title": "Remote work opinion",
        "context": "The author writes: 'Remote work has improved productivity for many teams, though it is not suitable for every role.'",
        "prompt": "The author believes remote work benefits all roles.",
        "options": ["Yes", "No", "Not Given"],
        "correctAnswer": "No",
        "explanation": "The author says remote work is 'not suitable for every role', directly contradicting the claim that it benefits all roles.",
        "logic": "1. Identify the writer's view: suitable for many, not every role. 2. The claim says 'all roles'. 3. 'Not every role' contradicts 'all roles' -> No.",
        "tip": "Yes/No questions ask about the WRITER'S view. Use No only when the writer explicitly rejects the claim.",
        "suggestions": "Answer as if you were the writer: 'Would I agree with this statement?' If the text shows you would not, choose No.",
        "bandAdvice": "Yes/No/Not Given appears on Passage 3; mixing it up with True/False costs marks — always check which answer set the task uses.",
    },
    {
        "type": "yes-no-not-given",
        "typeLabel": "Yes / No / Not Given",
        "title": "University funding view",
        "context": "The columnist argues that public funding for universities should prioritise research over teaching, a position she defends with examples of breakthrough discoveries.",
        "prompt": "The columnist believes research should receive more funding than teaching.",
        "options": ["Yes", "No", "Not Given"],
        "correctAnswer": "Yes",
        "explanation": "The columnist 'argues that public funding should prioritise research over teaching' — a direct statement of the view.",
        "logic": "1. Find the opinion verbs: 'argues that'. 2. Read the opinion: prioritise research over teaching. 3. The claim restates it -> Yes.",
        "tip": "Opinion verbs (argues, believes, insists, claims) mark the writer's view. Facts around the view are evidence, not the view itself.",
        "suggestions": "Underline every sentence where the writer's own judgment appears (argues, I believe, should).",
        "bandAdvice": "View vs evidence separation is the core Passage 3 skill; examiners deliberately mix the two in Yes/No tasks.",
    },
    {
        "type": "yes-no-not-given",
        "typeLabel": "Yes / No / Not Given",
        "title": "Automation prediction",
        "context": "An economist predicts that automation will eliminate few jobs but change most of them, requiring continuous retraining. She does not discuss the impact on wages.",
        "prompt": "The economist believes automation will raise wages.",
        "options": ["Yes", "No", "Not Given"],
        "correctAnswer": "Not Given",
        "explanation": "The economist discusses jobs and retraining, but the text states she 'does not discuss the impact on wages' — the claim about wages is undecidable.",
        "logic": "1. Claim topic: wages. 2. Text: wages are explicitly not discussed. 3. No statement about wages -> Not Given.",
        "tip": "When the text says a topic is NOT discussed, any claim about that topic is Not Given — no matter how plausible.",
        "suggestions": "Track what the writer did NOT mention; examiners reward knowing the gaps as much as the content.",
        "bandAdvice": "Not-discussed signals ('does not discuss', 'no mention of') are worth 2-3 easy marks if you recognise them instantly.",
    },
    {
        "type": "yes-no-not-given",
        "typeLabel": "Yes / No / Not Given",
        "title": "City park view",
        "context": "The planner concedes that small pocket parks cost more to maintain per visitor than large parks, but still insists they are essential because they serve residents who cannot travel far.",
        "prompt": "The planner believes pocket parks are not worth their maintenance cost.",
        "options": ["Yes", "No", "Not Given"],
        "correctAnswer": "No",
        "explanation": "The planner 'insists they are essential' despite the cost, which directly opposes the claim that they are not worth it.",
        "logic": "1. The writer concedes a cost but insists on value. 2. The claim selects only the concession. 3. The writer's final view contradicts the claim -> No.",
        "tip": "'Concedes X but insists Y' — the writer's true view is Y. Claims built on X alone are usually No.",
        "suggestions": "When you see 'although/concede/despite', write the writer's final position in the margin; it decides the answer.",
        "bandAdvice": "Concession-reversal is a recurring Passage 3 pattern; recognising it instantly is a Band 7.5 differentiator.",
    },
)

# ---------------------------------------------------------------------------
# Summary Completion
# ---------------------------------------------------------------------------

_register(
    {
        "type": "summary-completion",
        "typeLabel": "Summary Completion",
        "title": "Summary: urban trees",
        "context": "Urban trees lower temperatures through shade and by releasing water vapour, which together can cool a street by several degrees on hot days. The effect depends on tree density: a single tree barely changes the microclimate.",
        "prompt": "Complete the summary with ONE word: Trees cool streets because of shade and the release of ____.",
        "correctAnswer": "vapour",
        "explanation": "The passage mentions 'shade and by releasing water vapour'. The word limit is ONE word, so the summary needs only 'vapour', not the full phrase.",
        "logic": "1. Read the summary sentence and predict the missing part of speech (noun). 2. Locate the source sentence. 3. Apply the word limit: take the exact words, trimming to the allowed number.",
        "tip": "Respect the word limit exactly — 'water vapour' is wrong when the limit says ONE WORD.",
        "suggestions": "Check the limit BEFORE reading: ONE WORD means strip articles and qualifiers if needed.",
        "bandAdvice": "Word-limit discipline is a free mark: examiners score answers wrong solely for exceeding the limit.",
    },
    {
        "type": "summary-completion",
        "typeLabel": "Summary Completion",
        "title": "Summary: migration",
        "context": "Monarch butterflies rely on magnetic sensing and the position of the sun to navigate. Each autumn they return to the same forest in Mexico, guided partly by scent markers left by previous generations.",
        "prompt": "Complete the summary with NO MORE THAN TWO WORDS: Butterflies navigate using magnetic sensing, the sun, and ____ left by earlier generations.",
        "correctAnswer": "scent markers",
        "explanation": "The text says they are 'guided partly by scent markers left by previous generations'. The summary asks for what is 'left by earlier generations' — scent markers, two words.",
        "logic": "1. The summary lists navigation aids; the third is 'guided by...'. 2. Find 'guided' in the text: 'guided partly by scent markers'. 3. Copy exactly: scent markers.",
        "tip": "Copy exact words from the text. Paraphrasing is a mark lost — IELTS summary completion wants the text's own language.",
        "suggestions": "Underline the summary's linking words that appear in the passage (guided, left, generations) to locate the sentence fast.",
        "bandAdvice": "Copy-exact answers are the Band 6 requirement; at Band 7 the challenge is grammar fit inside the summary sentence.",
    },
    {
        "type": "summary-completion",
        "typeLabel": "Summary Completion",
        "title": "Summary: coral reefs",
        "context": "Coral bleaching occurs when rising water temperatures expel the algae that give corals their colour and most of their energy. Recovery is possible if temperatures return to normal within a few weeks.",
        "prompt": "Complete the summary with NO MORE THAN TWO WORDS: Bleaching happens because high temperatures force out the ____ that corals depend on for colour and energy.",
        "correctAnswer": "algae",
        "explanation": "The text: temperatures 'expel the algae that give corals their colour and most of their energy'. One word answers it — 'algae'.",
        "logic": "1. Predict the noun: something expelled that provides colour + energy. 2. Scan for 'expel' and its synonym 'force out'. 3. Answer: algae.",
        "tip": "The summary usually rephrases one verb (expel -> force out); find that paraphrase and the noun follows.",
        "suggestions": "Build a habit of predicting content before scanning — predictions make locating the answer sentence twice as fast.",
        "bandAdvice": "Prediction before scanning is the meta-skill behind Band 7 summary performance; practise it on every item.",
    },
    {
        "type": "summary-completion",
        "typeLabel": "Summary Completion",
        "title": "Summary: glacier study",
        "context": "The team drilled ice cores at three depths and found that the oldest layers trapped air from the last ice age. Analysis of that air showed methane concentrations far lower than today's levels.",
        "prompt": "Complete the summary with ONE WORD: The oldest ice trapped ____ from the last ice age.",
        "correctAnswer": "air",
        "explanation": "The text: 'the oldest layers trapped air from the last ice age' — a direct copy for the ONE word gap.",
        "logic": "1. Gap asks: what did the oldest ice trap? 2. Text: 'trapped air'. 3. Copy 'air' (one word).",
        "tip": "When the summary mirrors the passage order, answer as you read — later gaps often sit in the following sentences.",
        "suggestions": "Summary completion usually follows the passage order; do the questions in sequence as you read.",
        "bandAdvice": "Order-following summaries reward sequential reading; jumping around costs twice the time.",
    },
    {
        "type": "summary-completion",
        "typeLabel": "Summary Completion",
        "title": "Summary: beekeeping",
        "context": "Beekeepers introduced a hybrid bee that produced more honey but proved aggressive in colder weather, attacking neighbouring hives. Many apiarists returned to their original local breed within two seasons.",
        "prompt": "Complete the summary with NO MORE THAN TWO WORDS: The hybrid bee was aggressive in ____ and attacked other hives.",
        "correctAnswer": "colder weather",
        "explanation": "The text says the hybrid 'proved aggressive in colder weather, attacking neighbouring hives'. The summary needs the two-word condition: colder weather.",
        "logic": "1. The gap is a condition of aggression. 2. Locate 'aggressive' in the text. 3. Copy the following phrase within the limit: 'colder weather'.",
        "tip": "Adjectives plus nouns ('colder weather') count as two words — fit the limit, then match grammar.",
        "suggestions": "When two words are allowed, the answer is usually an adjective + noun pair from the text.",
        "bandAdvice": "Answer grammar must complete the summary sentence; check it reads naturally after the gap before moving on.",
    },
)

# ---------------------------------------------------------------------------
# Sentence Completion
# ---------------------------------------------------------------------------

_register(
    {
        "type": "sentence-completion",
        "typeLabel": "Sentence Completion",
        "title": "Sentence: reading habit",
        "context": "Researchers found that children who read daily showed a larger vocabulary by the age of seven, mainly because books introduce words used rarely in conversation.",
        "prompt": "Complete the sentence with ONE WORD ONLY: Daily reading builds vocabulary because books use words that are rare in everyday ____.",
        "correctAnswer": "conversation",
        "explanation": "The text: 'words used rarely in conversation'. The gap needs the noun, and the limit allows one word.",
        "logic": "1. Check the word limit: ONE WORD ONLY. 2. Predict the noun: where rare words appear (conversation). 3. Copy the exact noun.",
        "tip": "Match the part of speech the sentence needs — after 'everyday' you need a noun, not a verb.",
        "suggestions": "Cover the gap and say the missing word type aloud (noun/verb/adjective) before scanning.",
        "bandAdvice": "Grammar-fit (part of speech) plus word limit is the whole test of this question type — both are free marks when controlled.",
    },
    {
        "type": "sentence-completion",
        "typeLabel": "Sentence Completion",
        "title": "Sentence: solar farm",
        "context": "The first solar farm opened in 2011 with 30 panels; after an upgrade in 2018 it generated enough power for 2,400 homes.",
        "prompt": "Complete the sentence with ONE WORD AND/OR A NUMBER: The upgraded farm produced electricity for ____ homes.",
        "correctAnswer": "2,400",
        "explanation": "The upgrade meant the farm 'generated enough power for 2,400 homes' — the number is the answer.",
        "logic": "1. Keyword: 'homes'. 2. Scan for the number next to 'homes'. 3. Copy exactly, including the comma: 2,400.",
        "tip": "Copy numbers exactly as written — commas and zeros matter ('2,400' not '2400' if the text uses the comma).",
        "suggestions": "In number gaps, re-read the sentence twice to confirm you copied the right figure, not the older one.",
        "bandAdvice": "Old vs new numbers are a deliberate trap (30 panels vs 2,400 homes); date anchors help you choose.",
    },
    {
        "type": "sentence-completion",
        "typeLabel": "Sentence Completion",
        "title": "Sentence: heat policies",
        "context": "Researchers warned that heat policies fail when they are treated as seasonal emergency measures rather than year-round planning responsibilities.",
        "prompt": "Complete the sentence with NO MORE THAN TWO WORDS: Heat policies should be treated as year-round ____.",
        "correctAnswer": "planning responsibilities",
        "explanation": "The text contrasts 'seasonal emergency measures' with 'year-round planning responsibilities' — the gap requires the two-word opposite.",
        "logic": "1. The gap mirrors a contrast ('rather than'). 2. The text gives the opposite pair. 3. Copy the positive side within the limit.",
        "tip": "'Rather than', 'instead of', 'not...but' all create contrast pairs — the gap usually needs the side the sentence argues for.",
        "suggestions": "Underline contrast pairs while reading; sentence completion items frequently draw the answer from them.",
        "bandAdvice": "Contrast-driven completions are common at Band 7 — recognising the pair structure answers them in seconds.",
    },
    {
        "type": "sentence-completion",
        "typeLabel": "Sentence Completion",
        "title": "Sentence: postage stamps",
        "context": "Early collectors often soaked stamps off letters, which damaged the paper underneath, so postal services began printing stamps with perforated edges.",
        "prompt": "Complete the sentence with ONE WORD ONLY: Postal services printed perforated edges because collectors were ____.",
        "correctAnswer": "damaging",
        "explanation": "Collectors 'soaked stamps off letters, which damaged the paper' — the cause is the damaging behaviour; the text's exact word fits the grammar.",
        "logic": "1. The gap is the reason for perforation. 2. 'So' marks the consequence: perforated edges were printed BECAUSE of the damage. 3. Convert the cause to the text's word form: damaging.",
        "tip": "Cause-consequence sentences ('so', 'because', 'therefore') hide the answer in the cause clause.",
        "suggestions": "Circle cause markers in the text; the answer to 'why' questions always lives on the cause side.",
        "bandAdvice": "Causal reading is the Band 7 grammar skill behind both sentence completion and matching endings.",
    },
    {
        "type": "sentence-completion",
        "typeLabel": "Sentence Completion",
        "title": "Sentence: archaeology",
        "context": "Excavations show that many ceremonial buildings were positioned to amplify the human voice, which suggests the design was deliberate rather than accidental.",
        "prompt": "Complete the sentence with NO MORE THAN TWO WORDS: The alignment of ceremonial buildings suggests deliberate ____.",
        "correctAnswer": "design",
        "explanation": "The text concludes the alignment 'suggests deliberate architectural choice' — the sentence asks for the noun that was deliberate: design.",
        "logic": "1. The sentence restates the conclusion. 2. Find the conclusion clause: 'suggests... deliberate architectural choice'. 3. Reduce to the noun within two words: design.",
        "tip": "When the summary compresses a conclusion, the answer is usually its key noun — cut adjectives to fit the limit.",
        "suggestions": "Practise compressing a sentence to its core noun in two words or fewer; it is exactly what this task asks.",
        "bandAdvice": "Compression is the mechanism behind many Passage 3 completions; verbatim copies become rarer at higher bands.",
    },
    {
        "type": "sentence-completion",
        "typeLabel": "Sentence Completion",
        "title": "Sentence: sleep study",
        "context": "Participants who slept eight hours after learning a route performed better the next morning, while those restricted to five hours showed no improvement at all.",
        "prompt": "Complete the sentence with ONE WORD ONLY: Participants restricted to five hours of sleep showed no ____ at all.",
        "correctAnswer": "improvement",
        "explanation": "The text: five-hour sleepers 'showed no improvement at all' — an exact one-word copy.",
        "logic": "1. Locate the group: 'those restricted to five hours'. 2. Read the clause attached. 3. Copy the noun: improvement.",
        "tip": "Groups with different outcomes (while, whereas) — the gap usually tests one group's outcome word.",
        "suggestions": "Mark group names (A vs B) during skimming; completion questions then direct you to the right clause immediately.",
        "bandAdvice": "Comparison sentences yield 2-3 sentence-completion items per test; group-marking makes them one-read answers.",
    },
)

# ---------------------------------------------------------------------------
# Short Answer
# ---------------------------------------------------------------------------

_register(
    {
        "type": "short-answer",
        "typeLabel": "Short Answer",
        "title": "How many homes?",
        "context": "The first solar farm opened in 2011 with 30 panels; after an upgrade in 2018 it generated enough power for 2,400 homes.",
        "prompt": "How many homes could the upgraded solar farm power?",
        "options": [],
        "correctAnswer": "2,400",
        "explanation": "The upgraded farm 'generated enough power for 2,400 homes'.",
        "logic": "1. Question word: How many -> number. 2. Scan for 'homes'. 3. Copy the number exactly.",
        "tip": "Short answers must be copied from the text — writing '2400' when the text says '2,400' is still accepted, but copying exactly is safest.",
        "suggestions": "Note the question word (What/How many/When/Who) — it dictates the answer type before you scan.",
        "bandAdvice": "Short answer is the fastest question type when scanned correctly: 40 seconds per question keeps you on schedule.",
    },
    {
        "type": "short-answer",
        "typeLabel": "Short Answer",
        "title": "Who pays?",
        "context": "The pool is free for staff, while students receive a half-price membership. Visiting swimmers pay the full daily rate.",
        "prompt": "Who uses the pool for free?",
        "options": [],
        "correctAnswer": "Staff",
        "explanation": "The text states 'the pool is free for staff'.",
        "logic": "1. Question word: Who -> a person/group. 2. Scan for 'free'. 3. The group attached to 'free' is staff.",
        "tip": "Scan for the answer's key word ('free') and read the subject of that sentence.",
        "suggestions": "In Who questions, the answer is always the subject of the sentence containing the key word.",
        "bandAdvice": "Subject identification is quick at Band 6; at Band 7 the trap is answering with a detail from a neighbouring sentence.",
    },
    {
        "type": "short-answer",
        "typeLabel": "Short Answer",
        "title": "Which year?",
        "context": "The university introduced its first evening degree programme in 2004, extended it to online delivery in 2011, and surpassed 10,000 enrolled students in 2019.",
        "prompt": "In which year did the university begin offering evening degrees?",
        "options": [],
        "correctAnswer": "2004",
        "explanation": "The 'first evening degree programme' was introduced in 2004.",
        "logic": "1. Question word: In which year. 2. Key: 'first evening degree programme'. 3. The year attached is 2004.",
        "tip": "'First/introduced' anchors the earliest event — earlier dates in the passage belong to other facts.",
        "suggestions": "When several years appear, list each with its event in the margin before answering.",
        "bandAdvice": "Multi-year texts are designed to make you grab the wrong date; event-year pairing is the Band 6.5 requirement.",
    },
    {
        "type": "short-answer",
        "typeLabel": "Short Answer",
        "title": "Which measure?",
        "context": "To reduce traffic, the city first tested congestion pricing, then switched to parking fees, and finally introduced bus-only lanes that cut journey times by a third.",
        "prompt": "Which measure eventually reduced journey times by a third?",
        "options": [],
        "correctAnswer": "Bus-only lanes",
        "explanation": "'Bus-only lanes... cut journey times by a third' — the measure and its effect share one sentence.",
        "logic": "1. Key: 'reduced journey times by a third'. 2. Find the number in the text. 3. Read backwards to the measure name.",
        "tip": "Search the number first; the answer is the noun phrase in the same clause.",
        "suggestions": "Numbers and percentages are the fastest scan anchors in short answer tasks.",
        "bandAdvice": "Measure-effect pairs are common at Band 7; scanning the effect and reading backwards is the reliable pattern.",
    },
    {
        "type": "short-answer",
        "typeLabel": "Short Answer",
        "title": "Which component?",
        "context": "The instrument records temperature, humidity, and wind speed every minute, but it cannot measure air pressure.",
        "prompt": "Which component cannot be measured by the instrument?",
        "options": [],
        "correctAnswer": "Air pressure",
        "explanation": "The text explicitly says the instrument 'cannot measure air pressure'.",
        "logic": "1. Key: 'cannot measure'. 2. Find the negative clause. 3. Copy its object: air pressure.",
        "tip": "Negatives ('cannot', 'does not', 'fails to') in the question point directly at negative clauses in the text.",
        "suggestions": "Underline the negative in the question first — it tells you the exact clause to find.",
        "bandAdvice": "Negative matching rewards careful reading; at Band 7+ examiners hide the negative in a synonym ('unable to record').",
    },
)

# ---------------------------------------------------------------------------
# Table / Flow Chart Completion
# ---------------------------------------------------------------------------

_register(
    {
        "type": "table-completion",
        "typeLabel": "Table / Flow Chart Completion",
        "title": "Table: transport modes",
        "context": "The table summarises the trial. Trains carried 12,000 passengers daily. Buses carried 9,000. Shared bikes recorded 3,000 trips, and the ferry service carried 1,500 passengers each day.",
        "prompt": "Complete the table: Mode — Shared bikes; Daily figure — ____.",
        "options": [],
        "correctAnswer": "3,000",
        "explanation": "The text: 'shared bikes recorded 3,000 trips'.",
        "logic": "1. Read the row: you need the figure for shared bikes. 2. Scan for 'shared bikes'. 3. Copy the adjacent number.",
        "tip": "Tables organise the text's data; use the row and column headers as scan keys.",
        "suggestions": "Before reading the text, predict which cells the table will fill — usually the numbers and nouns.",
        "bandAdvice": "Table completion is Band 6 level scanning; the real test is speed, so skim headers first.",
    },
    {
        "type": "table-completion",
        "typeLabel": "Table / Flow Chart Completion",
        "title": "Flow: paper recycling",
        "context": "Recycled paper is first sorted by grade, then soaked into pulp, screened to remove ink, and finally pressed and dried into new sheets.",
        "prompt": "Complete the flow chart: Sort by grade → Soak into pulp → ____ to remove ink → Press and dry.",
        "options": [],
        "correctAnswer": "Screen",
        "explanation": "The sequence is: sorted, soaked, screened to remove ink, pressed. The missing step is screening.",
        "logic": "1. Read the flow: two steps are already given. 2. Find the sequence in the text ('then...screened...finally'). 3. Fill the missing verb in the text's form: Screen.",
        "tip": "Flow charts follow the passage's sequence markers (first, then, finally) exactly.",
        "suggestions": "Underline sequence adverbs in the text — they are the skeleton of every flow chart task.",
        "bandAdvice": "Process texts (how things are made/do) produce flow charts at Band 7; sequence-marker reading is the key skill.",
    },
    {
        "type": "table-completion",
        "typeLabel": "Table / Flow Chart Completion",
        "title": "Table: museum visits",
        "context": "Admissions rose steadily. Monday to Friday the museum welcomed about 800 visitors daily; Saturdays peaked at 1,600; Sundays, with extended hours, reached 1,400.",
        "prompt": "Complete the table: Day — Saturday; Visitors — ____.",
        "options": [],
        "correctAnswer": "1,600",
        "explanation": "The text: 'Saturdays peaked at 1,600'.",
        "logic": "1. Row key: Saturday. 2. Scan for 'Saturday'. 3. Copy the number: 1,600.",
        "tip": "Peak/record words ('peaked at') flag the number the table usually asks for.",
        "suggestions": "Circle peak and low words in number texts; table cells almost always contain them.",
        "bandAdvice": "Peak-minimum questions test the same skill as Task 1 Writing overviews — a nice cross-skill bonus.",
    },
    {
        "type": "table-completion",
        "typeLabel": "Table / Flow Chart Completion",
        "title": "Flow: honey production",
        "context": "Bees collect nectar and store it in honeycombs, where water evaporates until the honey reaches 18% moisture. Beekeepers then extract the honey and heat it to prevent crystallisation.",
        "prompt": "Complete the flow chart: Collect nectar → Store in ____ → Evaporate water → Extract → Heat.",
        "options": [],
        "correctAnswer": "honeycombs",
        "explanation": "The nectar is 'stored in honeycombs' where evaporation occurs — the missing storage location.",
        "logic": "1. The flow names two verbs but not the location. 2. Locate 'store' in the text. 3. Copy its object: honeycombs.",
        "tip": "When a step's object is missing, the text's store/put/hold verb carries the answer.",
        "suggestions": "Read each given step as a question: 'Where? When? How?' — the text answers one of them per step.",
        "bandAdvice": "Flow charts reward active question-asking per step; passive reading misses half the answers.",
    },
)

# ---------------------------------------------------------------------------
# Quick mixed pool (kept aligned with the type banks above)
# ---------------------------------------------------------------------------

QUICK_MIX = [
    READING_BY_TYPE["True / False / Not Given"][0],
    READING_BY_TYPE["Short Answer"][0],
    READING_BY_TYPE["Multiple Choice"][0],
    READING_BY_TYPE["Sentence Completion"][0],
]


_TYPED_ALIASES = {
    "Table Completion": "Table / Flow Chart Completion",
    "Flow-chart Completion": "Table / Flow Chart Completion",
    "Matching Information": "Matching Information",
    "Note Completion": "Note Completion",
    "Diagram Label Completion": "Diagram Label Completion",
}


def items_for_type(type_label: str) -> list[Item]:
    items = list(READING_BY_TYPE.get(type_label, []))
    if not items and type_label in _TYPED_ALIASES:
        items = list(READING_BY_TYPE.get(_TYPED_ALIASES[type_label], []))
    return items


def mixed_items() -> list[Item]:
    flat: list[Item] = []
    for type_label in READING_QUESTION_TYPES:
        flat.extend(items_for_type(type_label))
    return flat


def items_for_mode(mode: str) -> list[Item]:
    """Official-style item pool for a reading mode (passage slot or type)."""
    if mode in READING_QUESTION_TYPES:
        return items_for_type(mode)
    if mode == "Quick Practice":
        return QUICK_MIX
    types = PASSAGE_TYPES.get(mode, READING_QUESTION_TYPES)
    flat: list[Item] = []
    for type_label in types:
        flat.extend(items_for_type(type_label))
    return flat
    return flat


# ---------------------------------------------------------------------------
# Second registration round — balances the smaller type banks
# ---------------------------------------------------------------------------

_register(
    {
        "type": "matching-headings",
        "typeLabel": "Matching Headings",
        "title": "Paragraph J heading",
        "context": "Paragraph J describes a library that increased its opening hours, added study rooms, and began lending laptops, concluding that such spaces must keep reinventing themselves to stay relevant.",
        "prompt": "Choose the best heading for Paragraph J.",
        "options": ["The decline of print books", "Why libraries must keep reinventing", "The cost of new technology", "A history of library buildings"],
        "correctAnswer": "Why libraries must keep reinventing",
        "explanation": "The paragraph lists changes and concludes that libraries 'must keep reinventing themselves' — the concluding claim is the main idea.",
        "logic": "1. Identify the conclusion marker: 'concluding that'. 2. The conclusion is the main idea. 3. Match the heading to the conclusion verb: reinventing.",
        "tip": "Concluding sentences ('concluding that', 'in short', 'the lesson is') almost always carry the heading's answer.",
        "suggestions": "When skimming, underline the first and last sentence of every paragraph — they resolve 70% of heading items.",
        "bandAdvice": "First/last sentence reading is the essential Band 6.5 heading technique; it becomes faster with daily practice.",
    },
    {
        "type": "matching-headings",
        "typeLabel": "Matching Headings",
        "title": "Paragraph L heading",
        "context": "Paragraph L compares soil temperature records from three decades, showing that readings taken in deep soil rose far less than surface readings, which the writer links to changes in land cover.",
        "prompt": "Choose the best heading for Paragraph L.",
        "options": ["Why surface soil warms faster than deep soil", "Methods for measuring soil", "The role of rainfall in soil health", "A history of land use"],
        "correctAnswer": "Why surface soil warms faster than deep soil",
        "explanation": "The paragraph compares surface and deep readings and explains the difference via land cover — a cause-based comparison.",
        "logic": "1. Note the comparative structure: surface rose more, deep rose less. 2. The writer adds the cause: land cover. 3. The heading needs the comparison plus cause.",
        "tip": "Comparative headings ('faster than', 'more than') must be chosen only when the paragraph actually compares those two items.",
        "suggestions": "Scan headings for comparative or causal words; they are the strongest clues to paragraph type.",
        "bandAdvice": "Cause-comparison paragraphs are the hardest heading items at Band 7.5 — decode the structure before matching.",
    },
    {
        "type": "matching",
        "typeLabel": "Matching Features",
        "title": "Match theory to founder",
        "context": "The spaced-repetition theory was formalised by Ebbinghaus. The testing effect was described by Roediger. The forgetting-curve model was also developed by Ebbinghaus.",
        "prompt": "Which researcher developed the forgetting-curve model?",
        "options": ["Ebbinghaus", "Roediger", "Neither researcher"],
        "correctAnswer": "Ebbinghaus",
        "explanation": "The forgetting-curve model was 'also developed by Ebbinghaus'.",
        "logic": "1. Key: forgetting curve. 2. Scan for the phrase. 3. The sentence credits Ebbinghaus ('also developed by').",
        "tip": "'Also', 'as well', 'in addition' tell you one researcher has multiple contributions — a common matching trap.",
        "suggestions": "If one name recurs, draw a tally; questions about multiple contributions of one researcher become obvious.",
        "bandAdvice": "Repeated-name tracking is the Band 7 version of feature matching; tallies eliminate guesswork.",
    },
    {
        "type": "matching",
        "typeLabel": "Matching Features",
        "title": "Match district to scheme",
        "context": "Northgate introduced a car-free square. Eastfield trialled park-and-ride. Southport installed traffic-calming humps. Only Eastfield's scheme was extended city-wide.",
        "prompt": "Which district's scheme was extended city-wide?",
        "options": ["Northgate", "Eastfield", "Southport"],
        "correctAnswer": "Eastfield",
        "explanation": "The final sentence states 'Only Eastfield's scheme was extended city-wide'.",
        "logic": "1. Key: extended city-wide. 2. Scan for 'city-wide'. 3. Read backwards to the district name.",
        "tip": "The last sentence of a list often holds the differentiating detail — read it even if the names are earlier.",
        "suggestions": "In list paragraphs, always read the closing sentence; examiners put the discriminating fact there.",
        "bandAdvice": "Closing-sentence facts convert three-name lists into one-read answers at any band level.",
    },
    {
        "type": "matching-sentence-endings",
        "typeLabel": "Matching Sentence Endings",
        "title": "Complete: vitamin D",
        "context": "Vitamin D synthesis depends on direct sunlight, which is scarce in northern winters, so dietary sources become essential during those months.",
        "prompt": "Complete the sentence: Dietary sources of vitamin D become essential when ____.",
        "options": [
            "direct sunlight is scarce in winter",
            "sunlight exposure is maximum",
            "the diet is rich in fish",
            "winter temperatures are mild",
        ],
        "correctAnswer": "direct sunlight is scarce in winter",
        "explanation": "The text: because sunlight is scarce in northern winters, dietary sources become essential — the condition is direct sunlight scarcity.",
        "logic": "1. Stem ends with 'when' — the answer is a condition. 2. The text joins the condition with 'so' (cause -> effect). 3. The condition side is the answer.",
        "tip": "'So/therefore' sentences: effect ends in the stem, condition ends in the option.",
        "suggestions": "For cause-effect sentences, always test whether your option is the cause of the given effect.",
        "bandAdvice": "Cause-effect matching sentence endings reward cause-side reading — the same logic used in T/F/NG scope checks.",
    },
    {
        "type": "matching-sentence-endings",
        "typeLabel": "Matching Sentence Endings",
        "title": "Complete: cheese ripening",
        "context": "Cheese ripening is speeded by higher temperature, but the flavour deepens most when maturation happens slowly at low temperatures.",
        "prompt": "Complete the sentence: The flavour of cheese deepens most when ____.",
        "options": [
            "maturation is slow and cool",
            "ripening is fast and warm",
            "the milk is pasteurised",
            "the cheese is salted early",
        ],
        "correctAnswer": "maturation is slow and cool",
        "explanation": "The text: flavour 'deepens most when maturation happens slowly at low temperatures' — slow and cool.",
        "logic": "1. Superlative anchor: 'deepens most'. 2. Read the condition clause after 'when'. 3. Translate 'slowly at low temperatures' into the option's words.",
        "tip": "Match the option's adjectives to the text's adverbs: slowly=slow, at low temperatures=cool.",
        "suggestions": "When a stem has a superlative, locate it in the text first — the condition is always in the same clause.",
        "bandAdvice": "Adverb-adjective translation is a Band 7 paraphrase skill; practise converting one to the other.",
    },
    {
        "type": "table-completion",
        "typeLabel": "Table / Flow Chart Completion",
        "title": "Table: exam scores",
        "context": "Reading scores averaged 27 out of 40; listening averaged 29. Writing averaged 24, and speaking was the strongest at 32.",
        "prompt": "Complete the table: Skill — Writing; Average score — ____.",
        "options": [],
        "correctAnswer": "24",
        "explanation": "The text states 'Writing averaged 24'.",
        "logic": "1. Row key: Writing. 2. Scan for 'Writing'. 3. Copy the number that follows.",
        "tip": "Skill-by-skill data tables reward exact number copying; read the row header before scanning.",
        "suggestions": "Read the table row and column headers twice — most errors come from answering the wrong row.",
        "bandAdvice": "Row confusion is a silent mark-loser; header-first reading prevents it entirely.",
    },
    {
        "type": "table-completion",
        "typeLabel": "Table / Flow Chart Completion",
        "title": "Flow: coffee roasting",
        "context": "Green beans are dried, then roasted until they double in size. After roasting, the beans are cooled rapidly, rested for 24 hours, and finally ground.",
        "prompt": "Complete the flow chart: Dry → Roast → Cool rapidly → ____ → Grind.",
        "options": [],
        "correctAnswer": "Rest",
        "explanation": "The sequence after rapid cooling is 'rested for 24 hours, and finally ground' — the missing step is resting.",
        "logic": "1. Count the given steps against the text's sequence. 2. The missing step sits between 'cooled rapidly' and 'ground'. 3. Copy its verb: Rest.",
        "tip": "Gap counting (matching given steps to the text sequence) resolves every flow chart item.",
        "suggestions": "Number the text's steps 1-5 in the margin; the flow chart then fills itself.",
        "bandAdvice": "Step numbering is a 10-second habit that removes all flow-chart guesswork.",
    },
    {
        "type": "yes-no-not-given",
        "typeLabel": "Yes / No / Not Given",
        "title": "Housing view",
        "context": "The author supports building on brownfield land but rejects the suggestion that green-belt land must be opened to developers, calling that option a last resort.",
        "prompt": "The author believes green-belt land should be opened to developers.",
        "options": ["Yes", "No", "Not Given"],
        "correctAnswer": "No",
        "explanation": "The author 'rejects the suggestion' that green-belt land be opened, calling it a last resort — the opposite of the claim.",
        "logic": "1. Claim: author supports opening green belt. 2. Text: author 'rejects' it. 3. Direct opposition -> No.",
        "tip": "Reject/reject the suggestion/opposes are negative view verbs — they produce No, not Not Given.",
        "suggestions": "Learn the negative view verb family (rejects, opposes, warns against) — each is an automatic No signal.",
        "bandAdvice": "Negative view verbs are the fastest Yes/No anchor; recognising them saves 20 seconds per item.",
    },
    {
        "type": "summary-completion",
        "typeLabel": "Summary Completion",
        "title": "Summary: migration of herring",
        "context": "Herring migrate in response to temperature and food availability. Warm currents push the shoals north, while cooler years see them return to southern spawning grounds.",
        "prompt": "Complete the summary with NO MORE THAN TWO WORDS: Warm currents drive the herring shoals ____.",
        "correctAnswer": "north",
        "explanation": "The text: 'Warm currents push the shoals north' — one word answers the gap.",
        "logic": "1. The summary rephrases the first sentence. 2. Locate 'warm currents'. 3. Copy the direction: north.",
        "tip": "Direction words (north, inland, offshore) are common one-word summary answers — scan for compass terms.",
        "suggestions": "Circle all compass and position words during skim-reading; summary gaps love them.",
        "bandAdvice": "Position-vocabulary prediction is a fast Band 6 win in summary tasks.",
    },
)
