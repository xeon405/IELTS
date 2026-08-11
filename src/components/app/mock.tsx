"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ClipboardList, Eye, Gauge, Headphones, Loader2, Mic, Play, Sparkles, Target, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import { isSkill, moduleConfig, skillOrder, type MockSection } from "@/lib/app-config";
import { CountdownTimer } from "@/components/countdown-timer";
import { AudioPlayer } from "@/components/audio-player";
import { PracticeQuestion } from "@/components/app/practice";
import { VoiceRecorder } from "@/components/voice-recorder";
import { officialMockSections, getSpeakingBlueprint, getWritingBlueprint, type MockExamResult, type PracticeItem, type PracticeSession, type Skill, type TypedGuide } from "@/lib/ielts-brain";
import { formatClock } from "@/lib/timing";
import { useEffect, useState } from "react";

const fallbackAudioScript =
  "Listening audio: The reference is M as in mother, 4, 2, and then double 8. Do not turn left at the tool shed as older maps suggest. Continue past it and the compost area is the second fenced space on your right. Weekend workshops used to cost 12 pounds, but the council subsidy means visitors now pay 7 pounds. Please bring gloves, a water bottle, and proof of registration.";

const LISTENING_INSTRUCTIONS: Record<string, string> = {
  "Form Completion": "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Note Completion": "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Table Completion": "Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Multiple Choice": "Choose the correct letter, A, B or C.",
  "Map / Plan / Diagram Labelling": "Label the plan below. Choose the correct letter, A, B or C.",
  "Short Answer": "Answer the questions below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  Matching: "Match each item with the correct option.",
  "Sentence Completion": "Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Summary Completion": "Complete the summary below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Flow-chart Completion": "Complete the flow-chart below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
};

const READING_INSTRUCTIONS: Record<string, string> = {
  "True / False / Not Given":
    "Do the following statements agree with the information in the passage? Write TRUE if the statement agrees, FALSE if it contradicts the passage, or NOT GIVEN if there is no information on this.",
  "Yes / No / Not Given":
    "Do the following statements agree with the views of the writer? Write YES if the statement agrees with the views of the writer, NO if it contradicts them, or NOT GIVEN if it is impossible to say what the writer thinks.",
  "Matching Headings": "Choose the correct heading for each paragraph from the list of headings below.",
  "Multiple Choice": "Choose the correct letter, A, B, C or D.",
  "Sentence Completion": "Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Short Answer": "Answer the questions below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Summary Completion": "Complete the summary below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Note Completion": "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Table Completion": "Complete the table below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Flow-chart Completion": "Complete the flow-chart below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Diagram Label Completion": "Label the diagram below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "Matching Features": "Look at the list of people and the statements below. Match each statement with the correct person.",
  "Matching Sentence Endings": "Complete each sentence with the correct ending from the list.",
  "Matching Information": "The passage has X paragraphs. Which paragraph contains the following information?",
};

const GENERIC_INSTRUCTION = "Read the instructions carefully and answer each question.";

// Official IELTS guide content — how to answer each task type, including the
// IDP examiner length rules for Speaking. No AI-generated filler.
const SPEAKING_ANSWER_RULES: Record<string, string[]> = {
  "part1": [
    "Official examiner length rule (IDP): if a Part 1 answer is too short, the examiner must prompt you with \"why?\".",
    "Give enough that no prompt is needed: 2–4 sentences — your answer, a reason, and one small detail.",
    "A one-word or one-line answer is too short and triggers the prompt. Answer in full sentences.",
    "Personal questions (name, home, work) expect a short answer plus a reason, not a rehearsed speech.",
  ],
  "part2": [
    "Official examiner length rule (IDP): you are instructed to keep talking for the full 2 minutes.",
    "The examiner will not stop you early — if you finish before 2 minutes, you lose the remaining time.",
    "Use the 1-minute preparation to write 4 keywords, one for each point on the card.",
    "Speak in 4 short paragraphs, following the card in order, and end with a feeling or brief summary.",
  ],
  "followup": [
    "The follow-up question rounds off Part 2 — keep it brief: 2–3 sentences.",
    "Do not re-tell the whole story from the cue card; connect it to the round-off question only.",
  ],
  "part3": [
    "Official examiner length rule (IDP): Part 3 answers are expected in more depth — usually 45–60 seconds each.",
    "The examiner can stop you whenever you have been long enough — keep speaking until they move you on.",
    "Give an answer, then develop it: why it is true, a contrast or consequence, and a wider example.",
    "Treat each Part 3 question like a mini-essay: opinion + reasons + real-world evidence.",
  ],
};

const LISTENING_GENERAL_RULES: string[] = [
  "Each section is played once — you cannot replay the audio.",
  "Type the exact words you hear. Paraphrasing is marked wrong in typed answers.",
  "Spelling and plural endings count, just like on the paper test.",
  "Respect the word limit printed in the instructions (e.g. NO MORE THAN TWO WORDS AND/OR A NUMBER).",
  "Answers follow the order of the recording — write as you listen.",
  "In the computer test you get 2 minutes at the end to check your answers.",
];

const LISTENING_ANSWER_RULES: Record<string, string[]> = {
  "Form Completion": ["Fill the gap with exactly what the speaker says — names, dates and prices are usually spelt or repeated.", "Predict the gap type (name, number, time) before the audio starts."],
  "Note Completion": ["Notes are short — copy the recorded words, not your own paraphrase.", "The answer is usually the word right after the signal phrase in the audio."],
  "Table Completion": ["Read the table row before you listen so you know what is missing (price, time, place).", "Numbers and currency must be copied exactly as heard."],
  "Multiple Choice": ["Distractors repeat words you hear but answer a different question — choose the option that paraphrases the speaker.", "You hear the correct answer once; decide as you listen, one try only."],
  "Map / Plan / Diagram Labelling": ["Follow the speaker's directions in order; the answer places are visited in sequence.", "Write the letter listed on the plan — no extra words."],
  "Short Answer": ["Answer with the exact fact asked for (place, price, time) — usually one or two words.", "Do not add detail the question does not ask for."],
  "Matching": ["Keep track of who says what; first names you hear may belong to someone else.", "Write the letter, exactly as stated — items and letters match in order."],
  "Sentence Completion": ["The gap keeps the grammar of the heard sentence — copy the exact words that fit.", "Check singular/plural and the word limit before the audio plays."],
  "Summary Completion": ["Read the summary before the audio and predict each gap, then listen for the exact words.", "Copy words from the recording — do not 'fix up' the summary with new words."],
  "Flow-chart Completion": ["Follow the arrows: each gap continues the previous stage.", "Answers come in the order they are heard; copy exact words, watch plural endings."],
};

const READING_GENERAL_RULES: string[] = [
  "You may answer the questions in any order — nothing requires strict order except summary gaps.",
  "For completion tasks type the exact words from the passage — paraphrasing is marked wrong.",
  "Respect each printed word limit (e.g. NO MORE THAN TWO WORDS AND/OR A NUMBER).",
  "Base every answer only on the passage — never on what you know from outside.",
  "In the computer test there is no transfer time — type your answer directly.",
];

const READING_ANSWER_RULES: Record<string, string[]> = {
  "True / False / Not Given": ["TRUE if the statement agrees with the information; FALSE if it contradicts it; NOT GIVEN if the passage says nothing about it.", "If the passage does not mention the claim at all, it is NOT GIVEN — not False. Absence is not a contradiction.", "Check the whole claim — one wrong keyword makes the statement False or Not Given."],
  "Yes / No / Not Given": ["These ask about the WRITER'S VIEWS, not facts: YES if it agrees with the writer's opinion, NO if it contradicts it, NOT GIVEN if we cannot tell what the writer thinks.", "Opinion verbs (believes, argues, claims) signal Yes/No questions; fact verbs stay with True/False.", "Never decide from your own opinion — only the writer's."],
  "Multiple Choice": ["Only one option is correct — reject options that are true but do not answer the question.", "Options paraphrase the passage; choose the meaning match, not the word match."],
  "Matching Headings": ["Match the paragraph's main idea, not its most repeated word.", "The last sentence of a paragraph usually carries the controlling idea."],
  "Matching Sentence Endings": ["Read the half-sentence, predict the ending, then match meaning — not exact words.", "One ending fits logically and grammatically; reject the others."],
  "Matching Features": ["Scan for the feature names first, then match each statement to the right one.", "Write the letter given in the list — the exam uses letters, not names."],
  "Matching Information": ["Note the question says you may use a paragraph more than once — check the instruction.", "Paragraphs are scanned for the specific detail, not the general topic."],
  "Sentence Completion": ["Copy the exact words that fit the grammar of the gap sentence.", "Predict the part of speech (noun, verb, phrase) and the word limit before reading."],
  "Summary Completion": ["Read the summary as one paragraph; gaps follow in the text's order.", "Use only words from the passage — the limit tells you how many."],
  "Note Completion": ["Notes are shorter and bullet-like — predict the type (name, number, term) for each gap.", "Copy the text's words exactly."],
  "Table Completion": ["Group the rows and columns before reading; each cell has one exact answer in the text.", "Watch the word limit and keep the text's words."],
  "Flow-chart Completion": ["Follow the arrows: each step depends on the one before it — fill gaps in sequence.", "Copy exact words from the passage."],
  "Diagram Label Completion": ["Relate the description in the text to each part of the diagram, label by label.", "The limit is usually ONE or TWO words — copy them exactly."],
  "Short Answer": ["Answer with exact words from the text; the question word (what/why/when) tells you the fact type.", "Word limits apply: usually NO MORE THAN THREE WORDS AND/OR A NUMBER."],
};

const WRITING_GENERAL_RULES: string[] = [
  "Official weighting: Task 2 (250+ words, 40 minutes) counts two thirds of the Writing band; Task 1 (150+ words, 20 minutes) counts one third.",
  "Plan for 2–3 minutes at the start of each task — never write the first sentence without an outline.",
  "Both tasks are scored on: Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.",
  "Handwriting-analog rule for computer: use a clear structure — introduction, body paragraphs, conclusion.",
];

const WRITING_TASK1_RULES: string[] = [
  "Task 1 assessment criterion: Task Achievement — summarise the information by selecting the main features.",
  "Write an overview paragraph stating the overall trend or main change — it is a requirement, not a choice.",
  "Report and compare (highest, lowest, trends, contrasts) — give NO opinion and no invented figures.",
  "Cover every part of the visual (chart, table, map, process) with data, but do not list every number.",
];

const WRITING_TASK2_RULES: string[] = [
  "Task 2 assessment criterion: Task Response — answer every part of the question with a clear position.",
  "Give reasons for your answer and include relevant examples from your own knowledge or experience.",
  "Three-part structure: introduction with your position, two body paragraphs (view + reason + example), conclusion.",
  "Stay on the topic of every clause in the question — missing one requirement halves your Task Response.",
];

const LISTENING_BAND7_RULES: { label: string; text: string }[] = [
  { label: "Band 7.5 target", text: "33–34 correct answers out of 40 — the official conversion table used across the test." },
  { label: "Time per section", text: "About 7½ minutes of audio per section — played once, never paused — plus 2 minutes at the end to check your answers." },
  { label: "What the examiner is checking", text: "Exact words, spelling, plurals and the printed word limit — not your interpretation." },
];

const READING_BAND7_RULES: { label: string; text: string }[] = [
  { label: "Band 7.5 target", text: "33–34 correct answers out of 40 — the official conversion table used across the test." },
  { label: "Time per passage", text: "About 20 minutes per passage — 60 minutes total with no separate transfer time on computer." },
  { label: "What the examiner is checking", text: "Exact words copied from the passage, the printed word limit, and True/False/Not Given decided only from the text." },
];

const WRITING_BAND7_RULES: { label: string; text: string }[] = [
  { label: "Band 7.5 target", text: "Task 2 (40 min · 250+ words) is two thirds of the Writing band; Task 1 (20 min · 150+ words) is one third." },
  { label: "Criteria split", text: "Task Achievement (Task 1) or Task Response (Task 2): 25% · Coherence & Cohesion: 25% · Lexical Resource: 25% · Grammatical Range & Accuracy: 25%." },
  { label: "What the examiner is checking", text: "Every part of the question answered, a clear position, an overview (Task 1), reasons with examples (Task 2), and a mix of simple and complex sentences." },
];

const SPEAKING_BAND7_RULES: Record<string, { label: string; text: string }[]> = {
  part1: [
    { label: "Band 7.5 length", text: "2–4 sentences per answer (about 10–15 s). Shorter answers trigger the official examiner prompt “why?”." },
  ],
  part2: [
    { label: "Band 7.5 length", text: "The full 2 minutes of talk after 1 minute of preparation — the examiner never stops you early." },
  ],
  followup: [
    { label: "Band 7.5 length", text: "2–3 sentences that connect to the cue-card story — no full retelling of the story." },
  ],
  part3: [
    { label: "Band 7.5 length", text: "45–60 s of depth per answer — keep speaking until the examiner moves you on." },
  ],
};

const IDP_EXAMINER_LENGTH_NOTE =
  "if a Part 1 answer is too short, the examiner is instructed to prompt you with \"why?\" — so give enough that no prompt is needed (2–4 sentences); in Part 2 the official instruction is to keep talking for the full 2 minutes; in Part 3 the examiner expects you to answer \"in more depth\" — longer turns, usually 45–60 s, and they can pause whenever you were long enough (speak until told to move on).";

// Per-type answer guides — same structure as the Speaking guides: official
// pattern, length for 7.5, steps, band-8 move, avoid.
const LISTENING_ANSWER_GUIDES: Record<string, TypedGuide> = {
  "Form Completion": {
    name: "Form Completion",
    relevance: "In nearly every real test — Section 1 opens with form or note completion. Master this first.",
    group: "Listening",
    official: "Official drill: Section 1 records a real conversation — a booking, an enquiry, a registration — and the form is completed in the order of the speakers' words.",
    length: "One gap per 8–10 s of audio · one or two exact words, copied as heard",
    steps: [
      { label: "Answer", text: "Land the box in one go, like the speaker gives it — \"my name is Julie Parks\"." },
      { label: "One light detail", text: "Take what the recording adds — the spelling \"P-A-R-K-S\" and the price \"£25\" — it is said once, for free." },
      { label: "Stop", text: "Typed is done — the next gap is already playing." },
    ],
    band8: "Spelled names and phone numbers are dictated letter-by-letter — write as they spell.",
    tip: "Minute-plan: You cannot pause or rewind — answer in real time; the 2-minute check at the end is your only review.",
    avoid: "Guessing from context after the audio moves on — every answer comes exactly once.",
  },
  "Note Completion": {
    name: "Note Completion",
    relevance: "A Section 1 staple — appears in nearly every real test.",
    group: "Listening",
    official: "Official drill: a monologue (talk, lecture, message) in note form — each bullet gap follows the recording in order.",
    length: "Answer the moment you hear it · exact words, typically one or two words + a number",
    steps: [
      { label: "Take the line", text: "Hear the lead-in and complete it — \"the tour leaves at…\", \"9.30\"." },
      { label: "Keep its shape", text: "Copy the exact words — \"Thursday\", not \"Thursdays\"; \"the library\", not \"a library\"." },
      { label: "Stop", text: "One line per bullet, then the speaker moves on." },
    ],
    band8: "Plurals carry marks — the recording's plural must be your plural.",
    tip: "Minute-plan: Skim the notes in the seconds before the recording starts — predictions are your only head start.",
    avoid: "Your own wording: notes demand the recorded words.",
  },
  "Table Completion": {
    name: "Table Completion",
    relevance: "Regular — pairs with notes in Section 1 or appears in Section 4.",
    group: "Listening",
    official: "Official drill: a table of facts (prices, dates, places, names) — read the row before you listen so you know what is missing.",
    length: "One cell per 8–10 s of audio · exact words and numbers",
    steps: [
      { label: "Slot", text: "Name the empty cell first — \"this column is amounts\", \"this row is dates\"." },
      { label: "Match", text: "The speaker names the row, then gives the fact — \"the single room is 60\"." },
      { label: "Stop", text: "Write it with its unit — \"60 pounds\" — and close the row." },
    ],
    band8: "The order of the table is the order of the recording — never jump rows.",
    tip: "Minute-plan: Tables move in rows — read the whole row once, then listen; never go back up the columns.",
    avoid: "Mixing the units: $20 is not 20, and 'three' is not 'third'.",
  },
  "Multiple Choice": {
    name: "Multiple Choice",
    relevance: "Appears in most real tests (usually Sections 2–3) — often the biggest set.",
    group: "Listening",
    official: "Official drill: three options; the recording paraphrases the correct one and repeats the others' words as distractors.",
    length: "Decide in one pass · about 20–30 s of audio per question, no second chance",
    steps: [
      { label: "Listen", text: "Expect the paraphrase before the words — \"every morning\" for an option that says \"daily\"." },
      { label: "Match meaning", text: "The correct option restates the speaker — the words you hear are the decoy." },
      { label: "Lock", text: "Choose while they are still talking — the next answer begins immediately." },
    ],
    band8: "Anticipate the paraphrase: hear \"every morning\" for an option that says \"daily\".",
    tip: "Minute-plan: Read the options during the section's lead-in, flag your pick, and review only during the 2-minute check.",
    avoid: "Picking the option that repeats the most heard words — that is the distractor.",
  },
  "Map / Plan / Diagram Labelling": {
    name: "Map / Plan / Diagram Labelling",
    relevance: "Appears in many real tests (usually Section 2) — a route or plan comes up often.",
    group: "Listening",
    official: "Official drill: the speaker follows a route or describes a diagram step by step — you write the letter from the plan, not the word.",
    length: "One letter per label · follow the route in order, 5–10 s between labels",
    steps: [
      { label: "Orient", text: "Start where the speaker starts — \"the entrance is at the top of the plan\" fixes your bearings." },
      { label: "Follow", text: "Track the route in order — \"first you'll pass reception, then the cafe on your right\"." },
      { label: "Letter", text: "Answer in the plan's letters — \"H\" for the cafe, not the word \"cafe\"." },
    ],
    band8: "Unlabelled letters tell you where the speaker starts — position yourself before the audio.",
    tip: "Minute-plan: Draw the route mentally as it is spoken — orientate yourself at the start point before the audio.",
    avoid: "Reversing direction: 'past X' is not 'north of X'.",
  },
  "Short Answer": {
    name: "Short Answer",
    relevance: "Less frequent in current tests — but appears in some papers.",
    group: "Listening",
    official: "Official drill: a factual question (who / when / how much) with a word limit printed above the questions.",
    length: "One or two exact words · answer the fact, not the full sentence",
    steps: [
      { label: "Spot", text: "The question word fixes the fact — \"how much\" means a price is coming." },
      { label: "Take", text: "Grab the fact after the topic phrase — \"the deposit is five hundred\"." },
      { label: "Stop", text: "Write it within the limit — \"£500\", not a sentence." },
    ],
    band8: "Check the limit — 'NO MORE THAN TWO WORDS AND/OR A NUMBER' — against your answer.",
    tip: "Minute-plan: Answer as you hear it — the recording never waits and the next question starts immediately.",
    avoid: "Adding articles or detail the limit forbids.",
  },
  "Matching": {
    name: "Matching",
    relevance: "Appears in most real tests (usually Section 3 — speakers to options).",
    group: "Listening",
    official: "Official drill: match items to a lettered list as different speakers are introduced one by one.",
    length: "One letter per question · decide as each speaker finishes, about 15–20 s each",
    steps: [
      { label: "Count", text: "Know who is speaking — \"speakers A, B and C\"." },
      { label: "Track", text: "Note each name and their point — \"A loves the beach, B prefers the lake\"." },
      { label: "Letter", text: "One letter per item as each speaker finishes — \"B\" for the lake." },
    ],
    band8: "First names mislead — confirm the final opinion, not the first mention.",
    tip: "Minute-plan: The recording reads the options once more after the items — use that pass to fix every letter.",
    avoid: "Matching on a single repeated word.",
  },
  "Sentence Completion": {
    name: "Sentence Completion",
    relevance: "Common — often closes Section 2 or Section 4.",
    group: "Listening",
    official: "Official drill: a passage with gaps that keep the exact grammar of the heard sentence.",
    length: "Copy the recorded words that complete the grammar · typically one or two words",
    steps: [
      { label: "Predict", text: "Shape the gap before the audio — \"the tour is ___ on Fridays\" needs a verb form." },
      { label: "Complete", text: "Hear the lead-in finish it — \"the tour is cancelled on Fridays\"." },
      { label: "Copy", text: "Take \"cancelled\" exactly — the grammar as heard." },
    ],
    band8: "Check the word limit and the plural; the sentence must read correctly.",
    tip: "Minute-plan: Complete the sentence in your head in real time — the check time is for spelling, not for finishing.",
    avoid: "Your own wording — grammar must match the sentence as heard.",
  },
  "Summary Completion": {
    name: "Summary Completion",
    relevance: "Occasional — Section 4; read the summary before the audio.",
    group: "Listening",
    official: "Official drill: a summary of the recording with gaps that follow its order.",
    length: "Exact recorded words, one or two per gap, in audio order",
    steps: [
      { label: "Read", text: "Know the summary's story — \"this is about a student's first week\"." },
      { label: "Run", text: "Gaps run with the recording — whisper each answer as it passes, never backwards." },
      { label: "Copy", text: "Take the recorded words — \"Monday\" in the gap, though the summary says \"the first day\"." },
    ],
    band8: "A gap that 'almost fits' in your own words is still wrong — use the recording's words.",
    tip: "Minute-plan: The summary saves you listening twice — read it first, then track your predictions through the audio.",
    avoid: "Repairing the summary with synonyms.",
  },
  "Flow-chart Completion": {
    name: "Flow-chart Completion",
    relevance: "Occasional — appears in some tests.",
    group: "Listening",
    official: "Official drill: a process in stages — each arrow follows the previous step in the recording.",
    length: "One answer per stage, in order · copy exact words",
    steps: [
      { label: "Read the arrows", text: "Follow the stages — \"booking → payment → confirmation\"." },
      { label: "Step", text: "Answer as each stage is announced — \"firstly\", \"the next stage is\"." },
      { label: "Copy", text: "Take the exact words with the right plural — \"confirmation email\"." },
    ],
    band8: "The recording often announces each stage ('firstly', 'the next stage is') — use those cues.",
    tip: "Minute-plan: Say each stage name as the recording announces it and keep your eyes on the next arrow.",
    avoid: "Jumping stages — the arrows are sequential.",
  },
};

const READING_ANSWER_GUIDES: Record<string, TypedGuide> = {
  "True / False / Not Given": {
    name: "True / False / Not Given",
    relevance: "Appears in nearly every real test — usually the largest single set (5–7 statements). Master this one first.",
    group: "Reading",
    official: "Official drill: statements about the passage — TRUE if the statement agrees, FALSE if it contradicts, NOT GIVEN if the passage says nothing about it. Decide from the text only.",
    length: "About 75–90 s per statement · one answer each, NOT GIVEN is a real answer",
    steps: [
      { label: "Scan", text: "Lift the claim's words — \"bicycles\", \"banned\", \"city centre\"." },
      { label: "Locate", text: "Find where the passage treats that claim — paragraph B, line 4." },
      { label: "Judge", text: "Agrees → True. Contradicts → False (\"lorries remain exempt\" vs \"all vehicles banned\"). Silent → Not Given." },
    ],
    band8: "Absence is not a contradiction — if the passage is silent, it is NOT GIVEN.",
    tip: "Minute-plan: Do these first — one scan pass covers 8–10 statements; leave the hard ones for your second read.",
    avoid: "Outside knowledge — the passage is the only source.",
  },
  "Yes / No / Not Given": {
    name: "Yes / No / Not Given",
    relevance: "Regular — appears when a passage carries the writer's views or findings.",
    group: "Reading",
    official: "Official drill: the WRITER'S VIEWS, not facts — YES if the statement agrees with the writer's opinion, NO if it contradicts it, NOT GIVEN if we cannot tell what the writer thinks.",
    length: "About 75–90 s per statement · opinion verbs (believes, argues, claims) mark the author's view",
    steps: [
      { label: "Find the view", text: "Look for the author's judgement verbs — \"the writer believes\", \"it is doubtful\"." },
      { label: "Compare", text: "\"The writer argues the policy failed\" vs the statement \"the policy was a success\" → No." },
      { label: "Judge", text: "Agrees → Yes · contradicts → No · cannot be inferred → Not Given." },
    ],
    band8: "If the view cannot be inferred, it is NOT GIVEN even when the fact appears.",
    tip: "Minute-plan: Opinion markers (believes, argues, doubts) sit in one or two sentences of each paragraph — find the view first.",
    avoid: "Answering from your own opinion.",
  },
  "Multiple Choice": {
    name: "Multiple Choice",
    relevance: "Common — 3–5 questions per test, usually the final block of a passage.",
    group: "Reading",
    official: "Official drill: one option paraphrases the passage; the others either contradict it or are true but answer nothing.",
    length: "About 60–75 s per question · reject by logic, confirm by evidence",
    steps: [
      { label: "Read", text: "Know the ask before scanning — \"why did the town ban bicycles?\"." },
      { label: "Match", text: "The correct option restates the passage — \"cyclists ignored the rules\" = \"the ban answered vandalism\"." },
      { label: "Kill", text: "Drop the false and the off-topic — \"bicycles are cheap\" may be true but answers nothing." },
    ],
    band8: "'All of the above' traps: verify each option individually against the text.",
    tip: "Minute-plan: Read the stem and options, find the paraphrase — if two look close, the text decides; do not skip back later.",
    avoid: "Key-word matching only — options echo passage words as decoys.",
  },
  "Matching Headings": {
    name: "Matching Headings",
    relevance: "Consistently one of the most common in real papers — 4–6 headings per test. The hardest type; drill it early.",
    group: "Reading",
    official: "Official drill: choose the heading that summarises each paragraph's main idea — often one heading is not used.",
    length: "About 4–5 minutes for the whole set · main idea, not a repeated word",
    steps: [
      { label: "Collect", text: "Hold the heading ideas in your head — \"public health\", \"mixed reactions\", \"cost\"." },
      { label: "Skim", text: "First and last sentences carry the idea — \"calls to ban bicycles came from residents\"." },
      { label: "Name", text: "Pick the heading that names the idea, not one that borrows a word." },
    ],
    band8: "A heading that repeats vocabulary but misses the idea is the classic wrong choice.",
    tip: "Minute-plan: Skim each paragraph in under 30 seconds; match 3–4 certain ones, then let the leftover headings decide the rest.",
    avoid: "Reading every paragraph fully — skim for ideas.",
  },
  "Matching Sentence Endings": {
    name: "Matching Sentence Endings",
    relevance: "Least frequent of the full set — appears in a minority of papers.",
    group: "Reading",
    official: "Official drill: complete the sentence halves so they agree with the passage — not with your prediction.",
    length: "About 60–75 s per item · grammatical fit plus textual support",
    steps: [
      { label: "Predict", text: "Complete the half in your head — \"the ban was introduced because…\"." },
      { label: "Verify", text: "Find the passage sentence carrying the idea — \"…repeated accidents on the high street\"." },
      { label: "Match", text: "One ending fits logically and grammatically — reject the rest." },
    ],
    band8: "Two endings may sound similar — grammar and meaning both decide.",
    tip: "Minute-plan: Do the half-sentences with the easiest keywords first; grammar filters the near-synonyms.",
    avoid: "Completing sentences without checking the passage.",
  },
  "Matching Features": {
    name: "Matching Features",
    relevance: "Frequent — 4–6 per test; a letter can repeat.",
    group: "Reading",
    official: "Official drill: statements matched to researchers, theories or periods — you write the letter from the given list.",
    length: "One letter per item, about 60 s each · study the features first, then scan facts",
    steps: [
      { label: "List", text: "Know the lettered options — researchers \"Green\", \"Hall\", \"Ortiz\"." },
      { label: "Scan", text: "Take each statement's fact to the text — \"who linked noise to sleep loss?\"." },
      { label: "Letter", text: "Answer \"G\" for Green, not the name — the exam uses letters." },
    ],
    band8: "A feature may be used more than once — check the printed instruction.",
    tip: "Minute-plan: Underline the feature names first, then scan each statement once — a letter may repeat.",
    avoid: "Guessing from the statement's general topic.",
  },
  "Matching Information": {
    name: "Matching Information",
    relevance: "Common — 4–6 questions per real paper; paragraphs can be used more than once.",
    group: "Reading",
    official: "Official drill: which paragraph contains each fact — 'You may use any letter more than once' is usually printed.",
    length: "About 60–75 s per item · scan, don't read",
    steps: [
      { label: "Convert", text: "Turn the statement into 2–3 searchable words — \"cycle helmets\", \"accident rates\"." },
      { label: "Scan", text: "Search for the fact, not the topic — paragraph D mentions the figures." },
      { label: "Confirm", text: "The paragraph must actually state it — \"accident rates fell by a third\"." },
    ],
    band8: "The repeated-use instruction makes a wrong first find a retry, not a fail.",
    tip: "Minute-plan: Scan each 'which paragraph' item once; never re-read a paragraph fully to answer one fact.",
    avoid: "Reading paragraphs fully.",
  },
  "Sentence Completion": {
    name: "Sentence Completion",
    relevance: "Common in most real tests — 4–6 questions; copy the text's exact words.",
    group: "Reading",
    official: "Official drill: 'Complete the sentences below' with a printed word limit — the gap keeps the grammar of the passage sentence.",
    length: "About 60–75 s per gap · typed exactly from the passage",
    steps: [
      { label: "Shape", text: "Set the gap's grammar — \"the scheme was ___ in 2019\" takes a verb form." },
      { label: "Locate", text: "Scan for the sentence the gap is built from — \"…introduced in 2019\"." },
      { label: "Copy", text: "Type \"introduced\" — the exact passage word, even if you'd say \"launched\"." },
    ],
    band8: "The gap takes the passage's word even when your synonym sounds better.",
    tip: "Minute-plan: Predict the word form before you scan; copy the text's word — never your synonym.",
    avoid: "Paraphrasing into typed answers — marked wrong.",
  },
  "Summary Completion": {
    name: "Summary Completion",
    relevance: "The most frequent of the completion family — a 4–6 gap summary appears in most tests.",
    group: "Reading",
    official: "Official drill: 'Complete the summary using the list of words' or from the passage — gaps follow the text's order.",
    length: "About 75–90 s per gap cluster · keep the text's words",
    steps: [
      { label: "Map", text: "Fit the summary to the passage — \"the summary retells paragraph C on funding\"." },
      { label: "Name", text: "Name each gap before scanning: a figure, a place, a year." },
      { label: "Copy", text: "From the text — \"£2 million\", or the list option \"F\" by meaning and grammar." },
    ],
    band8: "With a word list, eliminate by meaning AND grammar in one pass.",
    tip: "Minute-plan: Read the summary as a unit; its gaps map to the text in order — one scan, done.",
    avoid: "Synonyms — the listed words are usually paraphrases of the text.",
  },
  "Note Completion": {
    name: "Note Completion",
    relevance: "Regular — part of the completion family seen in most papers.",
    group: "Reading",
    official: "Official drill: notes are bullet points of a section — each gap is one exact fact.",
    length: "About 60–75 s per gap · copy, do not rephrase",
    steps: [
      { label: "Map", text: "Headings order the text — \"Costs: ____\" belongs to the cost paragraph." },
      { label: "Spot", text: "Each gap takes one precise sentence — \"the licence fee is £40\"." },
      { label: "Copy", text: "Write \"£40\" exactly — the text's words, within the limit." },
    ],
    band8: "Note order matches reading order — never jump the notes.",
    tip: "Minute-plan: The note headings are the text's map — skim them in 20 seconds before scanning.",
    avoid: "Adding connectors the note doesn't need.",
  },
  "Table Completion": {
    name: "Table Completion",
    relevance: "Regular — appears in many real tests.",
    group: "Reading",
    official: "Official drill: a table of facts with gaps in rows and columns — the word limit is often ONE WORD.",
    length: "About 60–75 s per cell · exact text words",
    steps: [
      { label: "Read", text: "Headers fix the fact — \"Year\" × \"Number of users\" means a year is coming." },
      { label: "Name", text: "Say the fact before you scan — \"2019\"." },
      { label: "Copy", text: "Find \"in 2019, users passed 10,000\" and write \"10,000\"" },
    ],
    band8: "Numbers and units: copy what the passage prints.",
    tip: "Minute-plan: Read the headers once; every cell is one exact fact — no invented links between rows.",
    avoid: "Cell answers taken from a different row.",
  },
  "Flow-chart Completion": {
    name: "Flow-chart Completion",
    relevance: "Occasional — appears in some tests.",
    group: "Reading",
    official: "Official drill: a process diagram in steps — arrows mean sequence.",
    length: "About 60–75 s per stage · exact words, sequence equals text order",
    steps: [
      { label: "Read", text: "Follow the arrows — \"sorting → washing → recycling\"." },
      { label: "Step", text: "Each stage matches one sentence in order — \"the paper is washed\"." },
      { label: "Copy", text: "Write \"washed\" — the passive form exactly as printed." },
    ],
    band8: "Passive forms ('is made') keep the word form intact — copy them as printed.",
    tip: "Minute-plan: Follow the arrows strictly — each stage is one sentence in the text, in order.",
    avoid: "Skipping ahead to a later stage.",
  },
  "Diagram Label Completion": {
    name: "Diagram Label Completion",
    relevance: "Rarer — appears in some papers; cover it last in revision.",
    group: "Reading",
    official: "Official drill: 'Label the diagram' — parts of a figure with a limit usually ONE or TWO WORDS.",
    length: "About 60–75 s per label · find the description, copy the term",
    steps: [
      { label: "Link", text: "Match the description to the part — \"the rotor sits at the top\"." },
      { label: "Locate", text: "The description's position matches the diagram's layout — top of the figure." },
      { label: "Name", text: "Write \"rotor\" — the technical term, within the limit." },
    ],
    band8: "Diagram labels take the technical term, not the general word.",
    tip: "Minute-plan: The description order matches the diagram's layout — top to bottom, left to right.",
    avoid: "Labels beyond the printed limit.",
  },
  "Short Answer": {
    name: "Short Answer",
    relevance: "Occasional — appears in some tests.",
    group: "Reading",
    official: "Official drill: 'Answer the questions with NO MORE THAN THREE WORDS AND/OR A NUMBER' — the question word dictates the fact.",
    length: "About 60–75 s per answer · exact words only",
    steps: [
      { label: "Read", text: "\"How much…\" means a number is coming — \"what colour\" means a noun." },
      { label: "Spot", text: "Find the sentence that carries it — \"the deposit is £500\"." },
      { label: "Copy", text: "Answer \"£500\" — short, exact, within the limit." },
    ],
    band8: "Number formats ($20 or twenty dollars) as printed in the passage.",
    tip: "Minute-plan: Answer with the question word's fact type — the printed limit is the contract.",
    avoid: "Whole-sentence answers — the limit forbids them.",
  },
};

const WRITING_ANSWER_GUIDES: Record<string, TypedGuide> = {
  "Task 1": {
    name: "Task 1 — Academic report",
    group: "Writing",
    official: "Official task: \"The chart below shows… Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\" No opinion allowed.",
    length: "At least 150 words in 20 minutes · under 150 words risks Task Achievement",
    steps: [
      { label: "Overview", text: "One sentence naming the overall trend — \"Overall, sales rose steadily, with a sharp dip in 2020.\"" },
      { label: "Group", text: "Two body paragraphs by idea — \"Electric cars tripled, while petrol models fell by half.\"" },
      { label: "Compare", text: "Put figures against each other — \"By 2025, digital sales were double in-store sales.\"" },
    ],
    band8: "Every visual element covered once, with one clear overview sentence.",
    tip: "Minute-plan: 20 minutes — 2 planning (write the overview sentence first), 15 writing, 3 checking (word count and units).",
    avoid: "Wandering commentary, invented figures, and personal opinion.",
  },
  "Task 2": {
    name: "Task 2 — Essay",
    group: "Writing",
    official: "Official task: \"Write about the following topic… Give reasons for your answer and include any relevant examples from your own knowledge or experience.\"",
    length: "At least 250 words in 40 minutes · one reason and one example per body paragraph",
    steps: [
      { label: "Position", text: "State it in the introduction — \"In my view, remote work should remain an option.\"" },
      { label: "Body", text: "Two paragraphs, each with a reason and an example — \"Flexible hours raise output — my team delivers more from home.\"" },
      { label: "Conclusion", text: "Restate in different words — \"For most roles, a hybrid model is the realistic future.\"" },
    ],
    band8: "A clear position throughout — never a hidden or shifting opinion.",
    tip: "Minute-plan: 40 minutes — 3 planning (position + two ideas), 32 writing, 5 checking (position visible in every paragraph, 250+ words).",
    avoid: "Repetition and memorised templates; every sentence must move the argument.",
  },
};

function matchSpeakingGuide(item: PracticeItem | null, guides: TypedGuide[]): TypedGuide | null {
  if (!item) return null;
  const part = item.examSection === "part2" ? "Part 2" : item.examSection === "part3" ? "Part 3" : "Part 1";
  const group = guides.filter((guide) => guide.group === part);
  if (group.length === 0) return null;
  const hay = `${item.title} ${item.prompt} ${item.typeLabel ?? ""} ${item.topicLabel ?? ""} ${item.context ?? ""} ${item.cardCategory ?? ""}`.toLowerCase();
  if (part === "Part 2") {
    const card = item.cardCategory?.toLowerCase() ?? "";
    const named = (name: string) => group.find((guide) => guide.name === name) ?? null;
    if (/person|teacher|friend|neighbour|family|someone/.test(card)) return named("Person");
    if (/place|house|room|city|town|village|building/.test(card)) return named("Place");
    if (/object|thing|gift|possession|belonging|wallet|item/.test(card)) return named("Object / Thing");
    if (/event|experience|trip|journey|day|time|activity|festival|celebration/.test(card)) return named("Experience / Event");
    return group[0];
  }
  const keywords: Record<string, string[]> = {
    "Personal Information": ["home", "hometown", "house", "live", "where", "name", "country", "city", "town", "born"],
    "Preferences": ["prefer", "would you", "choose", "rather", "favourite", "favorite"],
    "Likes / Dislikes": ["like", "enjoy", "love", "dislike"],
    "Habits / Routines": ["often", "routine", "habit", "usually", "how often"],
    "Past Experiences": ["first", "when did you", "past", "childhood", "once", "remember"],
    "Reasons / Explanations": ["why", "reason", "because"],
    "Opinions about Familiar Topics": ["think", "opinion", "important", "would you say"],
    "Opinion": ["think", "opinion", "view", "agree", "disagree"],
    "Comparison": ["compare", "changed", "change", "since", "past", "before", "different", "old days"],
    "Reasons / Causes": ["why", "cause", "reason"],
    "Advantages / Disadvantages": ["advantage", "disadvantage", "benefit", "drawback", "pros", "cons"],
    "Hypothetical": ["if", "would", "could", "imagine", "suppose"],
    "Prediction / Future": ["future", "will", "predict", "in the future"],
    "Effects / Consequences": ["affect", "effect", "consequence", "impact", "result"],
    "Problem / Solution": ["problem", "solution", "solve", "deal with", "fix", "what can be done"],
  };
  const scored = group.map((guide) => {
    let score = (keywords[guide.name] ?? []).filter((word) => hay.includes(word)).length * 3;
    const nameWords = guide.name.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 3);
    score += nameWords.filter((word) => hay.includes(word)).length * 2;
    return { guide, score };
  });
  const best = scored.sort((a, b) => b.score - a.score)[0];
  if (best.score > 0) return best.guide;
  if (part === "Part 1") return group.find((guide) => guide.name === "Personal Information") ?? group[0];
  return group[0];
}

function matchWritingGuide(item: PracticeItem | null): TypedGuide | null {
  if (!item) return null;
  const taskKey = item.examSection === "Task 2" ? "Task 2" : "Task 1";
  const label = (item.typeLabel ?? "").trim();
  const guides = getWritingBlueprint().typeGuides ?? [];
  if (label) {
    const exact = guides.find((guide) => guide.name === label);
    if (exact) return exact;
    const partial = guides.filter((guide) => guide.name.includes(taskKey));
    const byWord = partial.find((guide) => label.toLowerCase().split(/\s+/).some((word) => guide.name.toLowerCase().includes(word)));
    if (byWord) return byWord;
  }
  return WRITING_ANSWER_GUIDES[taskKey] ?? null;
}

function AnswerGuideCard({ guide }: { guide: TypedGuide | null }) {
  if (!guide) return null;
  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black text-[#17342f]">{guide.name}</p>
        {guide.length ? (
          <span className="rounded-full bg-[#eef2f1] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0e7490]">{guide.length}</span>
        ) : null}
      </div>
      {guide.relevance ? (
        <p className="mt-2 rounded-xl bg-[#f6ecd4]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#8a6a1f]">
          <span className="font-black text-[#a3823c]">Real exam:</span> {guide.relevance}
        </p>
      ) : null}
      <ol className="mt-3 space-y-2">
        {guide.steps.map((step, i) => (
          <li key={step.label} className="flex items-start gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#17342f] text-[11px] font-black text-white">{i + 1}</span>
            <p className="text-xs leading-5 text-[#4f625b]"><span className="font-black text-[#17342f]">{step.label}:</span> {step.text}</p>
          </li>
        ))}
      </ol>
      {guide.band8 ? (
        <p className="mt-2 rounded-xl bg-[#e4f0ea]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#315149]">
          <span className="font-black text-[#2f7151]">Band-8 move:</span> {guide.band8}
        </p>
      ) : null}
      <details className="group mt-2">
        <summary className="cursor-pointer select-none text-[11px] font-black uppercase tracking-[0.14em] text-[#8b6f39]">More: official pattern · minute-plan · avoid</summary>
        <div className="mt-2 space-y-1.5">
          {guide.official ? (
            <p className="rounded-xl bg-[#f4efe2]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#7a6233]">
              <span className="font-black text-[#a3823c]">Official pattern:</span> {guide.official}
            </p>
          ) : null}
          {guide.tip ? (
            <p className="rounded-xl bg-[#eef2f1]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#3f554d]">
              <span className="font-black text-[#0e7490]">Minute-plan:</span> {guide.tip}
            </p>
          ) : null}
          <p className="rounded-xl bg-[#f8e8e2]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#7c4a2c]">
            <span className="font-black">Avoid:</span> {guide.avoid}
          </p>
        </div>
      </details>
    </div>
  );
}

function OfficialGuideCard({ title, rules, band7, note }: { title: string; rules: string[]; band7?: { label: string; text: string }[]; note?: string }) {
  const [open, setOpen] = useState(false);
  if (rules.length === 0 && !band7?.length && !note) return null;
  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-white/60">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">
          <Sparkles className="h-4 w-4" />
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#8b6f39] transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="space-y-3 px-4 pb-4">
          {note ? (
            <p className="rounded-2xl border border-[#e3dac6] bg-[#f4efe2]/70 p-3 text-[11px] leading-5 text-[#4f625b]">
              <span className="font-black text-[#8b6f39]">Examiner length rules (IDP official):</span> {note}
            </p>
          ) : null}
          {band7?.length ? (
            <div className="grid gap-2">
              {band7.map((rule) => (
                <p key={rule.label + rule.text} className="rounded-xl bg-[#eef2f1]/90 px-3 py-2 text-[11px] leading-5 text-[#3f554d]">
                  <span className="font-black text-[#0e7490]">{rule.label}:</span> {rule.text}
                </p>
              ))}
            </div>
          ) : null}
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li key={rule} className="flex gap-2 text-sm leading-6 text-[#4f625b]">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b6f39]" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function mostCommonType(items: PracticeSession["items"]): string {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const type = item.typeLabel ?? "";
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  });
  let best = "";
  let bestCount = 0;
  counts.forEach((count, type) => {
    if (count > bestCount) {
      best = type;
      bestCount = count;
    }
  });
  return best;
}

function ExamQuestionItem({
  item,
  number,
  value,
  onAnswer,
}: {
  item: PracticeItem;
  number: number;
  value: string;
  onAnswer: (id: string, value: string) => void;
}) {
  const options = item.options ?? [];
  const isChoice = options.length > 0;
  const letter = (index: number) => String.fromCharCode(65 + index);
  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#17342f] font-mono text-sm font-black text-white">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6 text-[#17342f]">{item.prompt}</p>
          {isChoice ? (
            <div className="mt-3 grid gap-2">
              {options.map((option, optionIndex) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                    value === option ? "border-[#17342f] bg-[#e4f0ea]" : "border-[#e3dac6] bg-white hover:bg-[#fbf7ec]",
                  )}
                >
                  <input
                    type="radio"
                    name={`q-${item.id}`}
                    checked={value === option}
                    onChange={() => onAnswer(item.id, option)}
                    className="accent-[#17342f]"
                  />
                  <span className="font-mono text-xs font-black text-[#8b6f39]">{letter(optionIndex)}</span>
                  <span className="text-sm leading-5 text-[#4f625b]">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            <input
              value={value}
              onChange={(event) => onAnswer(item.id, event.target.value)}
              placeholder="Type your answer"
              className="mt-3 w-full rounded-xl border border-[#c9bda2] bg-white px-4 py-2.5 text-sm text-[#17342f] outline-none transition focus:border-[#17342f]"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ExamNavigator({
  groups,
  currentIndex,
  answers,
  items,
  onJump,
  onFinish,
  finishLabel,
  onFillDemo,
}: {
  groups: { key: string; start: number; end: number; label: string }[];
  currentIndex: number;
  answers: Record<string, string>;
  items: PracticeSession["items"];
  onJump: (index: number) => void;
  onFinish: () => void;
  finishLabel: string;
  onFillDemo: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-[#fffaf0]/70 p-3">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-wrap items-center gap-1.5">
          <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-[#8b6f39]">
            {group.label}
          </span>
          {items.slice(group.start, group.end + 1).map((item, offset) => {
            const itemIndex = group.start + offset;
            const answered = Boolean((answers[item.id] ?? "").trim());
            return (
              <button
                key={item.id}
                onClick={() => onJump(itemIndex)}
                title={`Question ${itemIndex + 1}`}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg text-xs font-black transition",
                  itemIndex === currentIndex && "ring-2 ring-[#17342f] ring-offset-2 ring-offset-[#fffaf0]",
                  answered ? "bg-[#f5eddc] text-[#8b5732]" : "bg-[#17342f]/8 text-[#315149]",
                )}
              >
                {itemIndex + 1}
              </button>
            );
          })}
        </div>
      ))}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onFillDemo}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
        >
          <ClipboardList className="h-4 w-4" />
          Fill demo exam answers
        </button>
        <button
          onClick={onFinish}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-5 py-3 text-sm font-black text-[#17342f] shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          {finishLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ListeningCheckView({
  items,
  answers,
  onFinish,
}: {
  items: PracticeSession["items"];
  answers: Record<string, string>;
  onFinish: () => void;
}) {
  const [checkSecondsLeft, setCheckSecondsLeft] = useState(120);
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (checkSecondsLeft === 0) onFinish();
  }, [checkSecondsLeft, onFinish]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f6ecd4] text-[#8a6a1f]">
            <Eye className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Listening — answer check</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#17342f]">Check your answers</h2>
            <p className="mt-1 text-sm text-[#66746e]">
              The recording has finished. You have 2 minutes to review your 40 answers before they are submitted.
            </p>
          </div>
        </div>
        <span className="rounded-2xl bg-[#17342f] px-5 py-3 font-mono text-2xl font-black text-[#e3b65f]">
          {formatClock(checkSecondsLeft)}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 rounded-2xl border border-[#e3dac6] bg-white/65 p-4 md:grid-cols-2">
        {items.map((item, itemIndex) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#17342f]/10 font-mono text-xs font-black text-[#17342f]">
              {itemIndex + 1}
            </span>
            <p className="truncate text-sm font-semibold text-[#4f625b]">
              {(answers[item.id] ?? "").trim() || "Not answered"}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={onFinish}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-5 py-3 text-sm font-black text-[#17342f] shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
      >
        Submit listening answers
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ListeningSectionExam({
  items,
  answers,
  groups,
  onAnswer,
  onNext,
  onFillDemo,
}: {
  items: PracticeSession["items"];
  answers: Record<string, string>;
  groups: { key: string; start: number; end: number; label: string }[];
  onAnswer: (id: string, value: string) => void;
  onNext: (elapsedSeconds?: number) => void;
  onFillDemo: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [checking, setChecking] = useState(false);
  const groupIndex = Math.max(0, groups.findIndex((group) => currentIndex >= group.start && currentIndex <= group.end));
  const group = groups[groupIndex];
  const sectionItems = items.slice(group.start, group.end + 1);
  const startNumber = group.start + 1;
  const instruction = LISTENING_INSTRUCTIONS[mostCommonType(sectionItems)] ?? GENERIC_INSTRUCTION;
  const answeredCount = items.filter((entry) => Boolean((answers[entry.id] ?? "").trim())).length;

  if (checking) {
    return <ListeningCheckView items={items} answers={answers} onFinish={() => onNext(elapsed)} />;
  }

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f6ecd4] text-[#8a6a1f]">
            <Headphones className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Listening — computer-delivered</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#17342f]">
              {group.label} · {sectionItems.length} questions
            </h2>
            <p className="mt-1 text-sm text-[#66746e]">
              All questions in this section are on the page — answer as the audio plays (once).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimer minutes={30} resetKey="mock-listening-total" variant="exam" onChange={setElapsed} />
          <MiniStatDark label="Answered" value={`${answeredCount}/40`} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e3dac6] bg-[#fffdf7] px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">
          Questions {startNumber}–{startNumber + sectionItems.length - 1}
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#17342f]">{instruction}</p>
      </div>

      <div className="mt-4">
        <OfficialGuideCard
          title="How to answer — official exam rules"
          band7={LISTENING_BAND7_RULES}
          rules={[
            ...LISTENING_GENERAL_RULES,
            ...(LISTENING_ANSWER_RULES[mostCommonType(sectionItems)] ?? []),
          ]}
        />
      </div>

      <div className="mt-3">
        <AnswerGuideCard guide={LISTENING_ANSWER_GUIDES[mostCommonType(sectionItems)] ?? null} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#e3dac6] bg-[#fffdf7] px-4 py-2">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Section {groupIndex + 1} of 4 · audio plays once</p>
        <span className="rounded-full bg-[#17342f]/5 px-3 py-1 text-xs font-bold text-[#315149]">
          {sectionItems.filter((item) => Boolean((answers[item.id] ?? "").trim())).length}/{sectionItems.length} answered
        </span>
      </div>

      <div className="mt-4">
        <AudioPlayer
          script={[...new Set(sectionItems.map((item) => item.context).filter(Boolean))].join(" ") || fallbackAudioScript}
          examLocked
        />
      </div>

      <div className="mt-4 grid gap-3">
        {sectionItems.map((item, itemOffset) => (
          <ExamQuestionItem
            key={item.id}
            item={item}
            number={startNumber + itemOffset}
            value={answers[item.id] ?? ""}
            onAnswer={onAnswer}
          />
        ))}
      </div>

      <div className="mt-5">
        <ExamNavigator
          groups={groups}
          currentIndex={currentIndex}
          answers={answers}
          items={items}
          onJump={setCurrentIndex}
          onFinish={() => (groupIndex === groups.length - 1 ? setChecking(true) : setCurrentIndex(group.end + 1))}
          finishLabel={
            groupIndex === groups.length - 1
              ? "Finish listening — 2-minute answer check"
              : `Started: questions ${group.end + 2}–${Math.min(group.end + 11, items.length)}`
          }
          onFillDemo={onFillDemo}
        />
      </div>
    </>
  );
}

function ReadingSectionExam({
  items,
  answers,
  groups,
  onAnswer,
  onNext,
  onFillDemo,
}: {
  items: PracticeSession["items"];
  answers: Record<string, string>;
  groups: { key: string; start: number; end: number; label: string }[];
  onAnswer: (id: string, value: string) => void;
  onNext: (elapsedSeconds?: number) => void;
  onFillDemo: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const groupIndex = Math.max(0, groups.findIndex((group) => currentIndex >= group.start && currentIndex <= group.end));
  const group = groups[groupIndex];
  const passageItems = items.slice(group.start, group.end + 1);
  const startNumber = group.start + 1;
  const relativeIndex = Math.min(Math.max(currentIndex - group.start, 0), passageItems.length - 1);
  const currentItem = passageItems[relativeIndex];
  const instruction = READING_INSTRUCTIONS[mostCommonType(passageItems)] ?? GENERIC_INSTRUCTION;
  const answeredCount = items.filter((entry) => Boolean((answers[entry.id] ?? "").trim())).length;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#e4f0ea] text-[#2f7151]">
            <Gauge className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Reading — computer-delivered</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#17342f]">
              {group.label} · {passageItems.length} questions
            </h2>
            <p className="mt-1 text-sm text-[#66746e]">The passage stays on the left while you answer all its questions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimer minutes={60} resetKey="mock-reading-total" variant="exam" onChange={setElapsed} />
          <MiniStatDark label="Answered" value={`${answeredCount}/40`} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#e3dac6] bg-[#fffdf7] px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">
          Questions {startNumber}–{startNumber + passageItems.length - 1}
        </p>
        <p className="mt-1 text-sm font-semibold leading-6 text-[#17342f]">{instruction}</p>
      </div>

      <div className="mt-4">
        <OfficialGuideCard
          title="How to answer — official exam rules"
          band7={READING_BAND7_RULES}
          rules={[
            ...READING_GENERAL_RULES,
            ...(READING_ANSWER_RULES[mostCommonType(passageItems)] ?? []),
          ]}
        />
      </div>

      <div className="mt-3">
        <AnswerGuideCard guide={READING_ANSWER_GUIDES[mostCommonType(passageItems)] ?? null} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="sticky top-4 self-start rounded-2xl border border-[#e3dac6] bg-[#fffdf7]">
          <div className="flex items-center justify-between gap-3 border-b border-[#e3dac6] bg-[#17342f]/5 px-4 py-3">
            <p className="font-black text-[#17342f]">{group.label} — reading passage</p>
            <span className="rounded-full bg-[#f6ecd4] px-3 py-1 font-mono text-xs font-bold text-[#8a6a1f]">
              questions {startNumber}–{startNumber + passageItems.length - 1}
            </span>
          </div>
          <div className="max-h-[62vh] overflow-y-auto px-4 py-4">
            <p className="text-sm leading-7 text-[#4f625b]">
              {items[currentIndex]?.context || "Read the passage, then answer the questions."}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {passageItems.map((item, itemOffset) => (
            <ExamQuestionItem
              key={item.id}
              item={item}
              number={startNumber + itemOffset}
              value={answers[item.id] ?? ""}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <ExamNavigator
          groups={groups}
          currentIndex={currentIndex}
          answers={answers}
          items={items}
          onJump={setCurrentIndex}
          onFinish={() => (groupIndex === groups.length - 1 ? onNext(elapsed) : setCurrentIndex(group.end + 1))}
          finishLabel={groupIndex === groups.length - 1 ? "Finish reading" : `Started: questions ${group.end + 2}–${Math.min(group.end + 15, items.length)}`}
          onFillDemo={onFillDemo}
        />
      </div>
    </>
  );
}

function WritingSectionExam({
  items,
  answers,
  onAnswer,
  onNext,
  onFillDemo,
}: {
  items: PracticeSession["items"];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  onNext: (elapsedSeconds?: number) => void;
  onFillDemo: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const countWords = (value: string) => (value.trim() ? value.trim().split(/\s+/).length : 0);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f7e3de] text-[#9c3a2e]">
            <Target className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Writing — computer-delivered</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#17342f]">Task 1 and Task 2</h2>
            <p className="mt-1 text-sm text-[#66746e]">Spend 20 minutes on Task 1 and 40 minutes on Task 2.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimer minutes={60} resetKey="mock-writing-total" variant="exam" onChange={setElapsed} />
          <MiniStatDark label="Tasks" value={`${items.length}/2`} />
        </div>
      </div>

      <div className="mt-4">
        <OfficialGuideCard
          title="How to answer — official exam rules"
          band7={WRITING_BAND7_RULES}
          rules={[...WRITING_GENERAL_RULES]}
        />
      </div>

      <div className="mt-4 grid gap-4">
        {items.map((item, itemIndex) => {
          const isTaskTwo = item.examSection === "Task 2";
          const target = isTaskTwo ? 250 : 150;
          const liveWords = countWords(answers[item.id] ?? "");
          return (
            <div key={item.id} className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#17342f] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  {item.examSection ?? `Writing task ${itemIndex + 1}`}
                </span>
                <span className="rounded-full bg-[#e4f0ea] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">
                  {isTaskTwo ? "40 minutes" : "20 minutes"}
                </span>
                <span className="rounded-full bg-[#f6ecd4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#8a6a1f]">
                  at least {target} words
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#17342f]">{item.prompt}</p>
              <textarea
                value={answers[item.id] ?? ""}
                onChange={(event) => onAnswer(item.id, event.target.value)}
                rows={12}
                placeholder={`Write your ${isTaskTwo ? "Task 2 essay" : "Task 1 report"} here…`}
                className="mt-4 w-full resize-y rounded-2xl border border-[#c9bda2] bg-[#fffdf7] px-4 py-3 text-sm leading-7 text-[#17342f] outline-none transition focus:border-[#17342f]"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Word counter</p>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 font-mono text-xs font-black",
                    liveWords >= target ? "bg-[#e4f0ea] text-[#2f7151]" : "bg-[#f6ecd4] text-[#8a6a1f]",
                  )}
                >
                  {liveWords} / {target} words {liveWords >= target ? "✓" : ""}
                </span>
              </div>
              <div className="mt-3">
                <OfficialGuideCard
                  title={isTaskTwo ? "How to answer Task 2 — official" : "How to answer Task 1 — official"}
                  rules={isTaskTwo ? WRITING_TASK2_RULES : WRITING_TASK1_RULES}
                />
              </div>
              <div className="mt-3">
                <AnswerGuideCard guide={matchWritingGuide(item)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onFillDemo}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
        >
          <ClipboardList className="h-4 w-4" />
          Fill demo exam answers
        </button>
        <button
          onClick={() => onNext(elapsed)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-5 py-3 text-sm font-black text-[#17342f] shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          Finish writing
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

export function MockExam({
  section,
  answers,
  result,
  loading,
  sections,
  papersCount,
  onStart,
  onAnswer,
  onFillDemo,
  onNext,
}: {
  section: MockSection;
  answers: Record<string, string>;
  result: MockExamResult | null;
  loading: boolean;
  sections: Partial<Record<Skill, PracticeSession | null>>;
  papersCount?: number;
  onStart: (paperNumber?: number) => void;
  onAnswer: (id: string, value: string) => void;
  onFillDemo: () => void;
  onNext: (elapsedSeconds?: number) => void;
}) {
  const [selectedPaper, setSelectedPaper] = useState(1);
  const paperCount = Math.min(Math.max(papersCount ?? 1, 1), 10);

  if (section === "intro") {
    return (
      <div className="space-y-5">
        <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Real exam simulation</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">Full IELTS computer-delivered mock</h2>
            <p className="mt-4 text-sm leading-7 text-[#5c6b64]">
              This mode follows the official IELTS pattern exactly: Listening with 40 questions across 4 sections in 30
              minutes, then 2 minutes to check your answers before they are submitted; Reading with 40 questions across 3 passages in 60 minutes;
              Writing with Task 1 (20 min) and Task 2 (40 min) in 60 minutes; and Speaking in 3 parts over 11–14 minutes,
              including the 1-minute preparation and full 2-minute long turn in Part 2. Ten full papers are available —
              each one is a different exam.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {officialMockSections.map((item) => {
              const skillConfig = isSkill(item.id) ? moduleConfig[item.id] : null;
              return (
                <div key={item.id} className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-5">
                  <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]", skillConfig?.soft)}>
                    {item.label}
                  </span>
                  <p className="mt-3 font-serif text-2xl font-semibold text-[#17342f]">{item.minutes}m</p>
                  <p className="mt-1 text-sm text-[#66746e]">{item.questions} questions</p>
                  <p className="mt-4 text-xs leading-5 text-[#6d756f]">{item.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Pick your paper</p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-[#17342f]">Ten full mock exams — every paper is a different test</h3>
              </div>
              <span className="rounded-full bg-[#17342f]/5 px-3 py-1 text-xs font-bold text-[#315149]">{paperCount} papers</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: paperCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => setSelectedPaper(number)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    number === selectedPaper
                      ? "border-[#17342f] bg-[#17342f] text-white shadow-lg shadow-[#17342f]/20"
                      : "border-[#e3dac6] bg-white/70 hover:-translate-y-0.5 hover:bg-white",
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b6f39]">Test</p>
                  <p className="mt-1 font-serif text-3xl font-semibold">{String(number).padStart(2, "0")}</p>
                  <p className="mt-2 text-xs leading-5 opacity-80">≈ 2 h 45 min timed · all 4 skills</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart(selectedPaper)}
            disabled={loading}
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? "Printing Test " + String(selectedPaper).padStart(2, "0") + "…" : `Start Test ${String(selectedPaper).padStart(2, "0")}`}
          </button>
          {loading ? (
            <p className="mt-3 text-sm font-semibold text-[#8b6f39]">
              The examiner is preparing the Listening paper, Reading passages, Writing tasks and Speaking interview for Test {String(selectedPaper).padStart(2, "0")}.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (section === "result") {
    return <MockResult result={result} answers={answers} onRestart={onStart} />;
  }

  const index = skillOrder.indexOf(section);
  const session = sections[section] ?? null;
  const items = session?.items ?? [];

  const groups = groupItems(items);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.28fr_1fr]">
      <aside className="rounded-[2.2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Exam order</p>
        <div className="mt-5 space-y-3">
          {officialMockSections.map((item, itemIndex) => {
            const skillConfig = isSkill(item.id) ? moduleConfig[item.id] : null;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border p-4",
                  item.id === section
                    ? cn("border-[#17342f] text-white shadow-lg", skillConfig ? skillConfig.accent : "bg-[#17342f]")
                    : itemIndex < index
                      ? cn("border-transparent", skillConfig?.soft ?? "border-[#bdd3c7] bg-[#edf7ef] text-[#2f7151]")
                      : "border-[#e3dac6] bg-white/60 text-[#315149]",
                )}
              >
                <p className="font-bold">{item.label}</p>
                <p className="mt-1 text-xs opacity-75">{item.minutes} min / {item.questions} questions</p>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-6">
        {section === "speaking" ? (
          <SpeakingMockSection
            items={items}
            answers={answers}
            onAnswer={onAnswer}
            onNext={() => onNext(undefined)}
          />
        ) : loading && !session ? (
          <div className="grid min-h-[300px] place-items-center text-center">
            <div>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#8b6f39]" />
              <p className="mt-3 text-sm font-bold text-[#17342f]">The AI Brain is writing this section…</p>
            </div>
          </div>
        ) : !session || items.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-[#e3dac6] bg-white/65 py-8 text-center text-sm font-semibold text-[#66746e]">
            This section could not be generated. Go back to the start and retry the mock exam.
          </p>
        ) : section === "listening" ? (
          <ListeningSectionExam
            items={items}
            answers={answers}
            groups={groups}
            onAnswer={onAnswer}
            onNext={(seconds) => onNext(seconds)}
            onFillDemo={onFillDemo}
          />
        ) : section === "reading" ? (
          <ReadingSectionExam
            items={items}
            answers={answers}
            groups={groups}
            onAnswer={onAnswer}
            onNext={(seconds) => onNext(seconds)}
            onFillDemo={onFillDemo}
          />
        ) : (
          <WritingSectionExam
            items={items}
            answers={answers}
            onAnswer={onAnswer}
            onNext={(seconds) => onNext(seconds)}
            onFillDemo={onFillDemo}
          />
        )}
      </section>
    </div>
  );
}

function groupItems(items: PracticeSession["items"]) {
  const groups: { key: string; start: number; end: number; label: string }[] = [];
  let lastKey: string | null = null;
  items.forEach((item, itemIndex) => {
    const key = (item.examSection ?? item.sectionLabel ?? ((item.context ?? "").trim() || `__none_${itemIndex}`)) as string;
    if (key !== lastKey) {
      groups.push({ key, start: itemIndex, end: itemIndex, label: item.examSection ?? item.sectionLabel ?? "Reading passage" });
      lastKey = key;
    } else {
      groups[groups.length - 1].end = itemIndex;
    }
  });
  return groups;
}

function currentGroupLabel(groups: { key: string; start: number; end: number; label: string }[], currentIndex: number) {
  const group = groups.find((entry) => currentIndex >= entry.start && currentIndex <= entry.end);
  return group ? group.label : "Reading passage";
}

function groupRange(groups: { key: string; start: number; end: number; label: string }[], currentIndex: number) {
  const group = groups.find((entry) => currentIndex >= entry.start && currentIndex <= entry.end);
  return group ? `Questions ${group.start + 1}–${group.end + 1}` : "";
}

function QuestionPalette({
  items,
  currentIndex,
  answers,
  onJump,
}: {
  items: PracticeSession["items"];
  currentIndex: number;
  answers: Record<string, string>;
  onJump: (index: number) => void;
}) {
  const groups = groupItems(items);
  return (
    <div className="mt-2 space-y-2">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-wrap items-center gap-1.5">
          <span className="w-24 shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-[#8b6f39]">
            Q{group.start + 1}–{group.end + 1}
          </span>
          {items.slice(group.start, group.end + 1).map((item, offset) => {
            const itemIndex = group.start + offset;
            const answered = Boolean((answers[item.id] ?? "").trim());
            return (
              <button
                key={item.id}
                onClick={() => onJump(itemIndex)}
                title={`Question ${itemIndex + 1}`}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg text-xs font-black transition",
                  itemIndex === currentIndex && "ring-2 ring-[#17342f] ring-offset-2 ring-offset-[#fffaf0]",
                  answered ? "bg-[#f5eddc] text-[#8b5732]" : "bg-[#17342f]/8 text-[#315149]",
                )}
              >
                {itemIndex + 1}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MiniStatDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e3b65f]">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function useCountdown(seconds: number, running: boolean, onDone: () => void) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!running) return;
    setLeft(seconds);
    const interval = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, seconds]);
  useEffect(() => {
    if (running && left === 0) onDone();
  }, [running, left, onDone]);
  return left;
}

function partLabel(item: PracticeItem | null) {
  if (!item) return "Speaking interview";
  if (item.examSection === "part1") return "Part 1 — Introduction & Interview";
  if (item.examSection === "part2") return "Part 2 — Cue Card / Individual Long Turn";
  if (item.examSection === "followup") return "Part 2 follow-up questions";
  if (item.examSection === "part3") return "Part 3 — Discussion";
  return item.examSection ?? "Speaking interview";
}

function SpeakingMockSection({
  items,
  answers,
  onAnswer,
  onNext,
}: {
  items: PracticeSession["items"];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  onNext: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "prep" | "turn" | "done">("idle");
  const currentItem = items[currentIndex] ?? null;
  const isPart2 = currentItem?.examSection === "part2";
  const isFollowUp = currentItem?.examSection === "followup";
  const isLast = currentIndex >= items.length - 1;
  const prepLeft = useCountdown(60, isPart2 && phase === "prep", () => setPhase("turn"));
  const turnLeft = useCountdown(120, isPart2 && phase === "turn", () => setPhase("done"));
  const speakingGuide = matchSpeakingGuide(currentItem, getSpeakingBlueprint().typeGuides ?? []);

  const advance = () => {
    if (isLast) {
      onNext();
      return;
    }
    setPhase("idle");
    setCurrentIndex((index) => index + 1);
  };

  const partCounts = items.reduce((counts, item) => {
    const key = item.examSection === "followup" ? "Part 2 follow-up" : partLabel(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f6ecd4] text-[#8a6a1f]">
            <Mic className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Speaking — live examiner conversation</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-[#17342f]">{partLabel(currentItem)}</h2>
            <p className="mt-1 text-sm text-[#66746e]">
              {isPart2
                ? "You get 1 minute to prepare and then a full 2 minutes to speak."
                : isFollowUp
                  ? "After the long turn the examiner rounds off Part 2 with one follow-up question."
                  : "Answer with full sentences — the examiner listens for fluency and detail."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimer minutes={14} resetKey="mock-speaking-total" variant="exam" />
          <MiniStatDark label="Question" value={`${Math.min(currentIndex + 1, items.length)}/${items.length}`} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {Object.entries(partCounts).map(([part, count]) => (
          <span key={part} className="rounded-full border border-[#e3dac6] bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#315149]">
            {part} · {count}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <OfficialGuideCard
          title="How to answer naturally · examiner length rules (official)"
          note={IDP_EXAMINER_LENGTH_NOTE}
          band7={
            SPEAKING_BAND7_RULES[
              currentItem?.examSection ?? (isPart2 ? "part2" : isFollowUp ? "followup" : "part1")
            ] ?? SPEAKING_BAND7_RULES["part1"]
          }
          rules={
            SPEAKING_ANSWER_RULES[
              currentItem?.examSection ?? (isPart2 ? "part2" : isFollowUp ? "followup" : "part1")
            ] ?? SPEAKING_ANSWER_RULES["part1"]
          }
        />
      </div>

      <div className="mt-5 rounded-[2rem] border border-[#e3dac6] bg-white/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
            {isPart2 ? "Cue card — read it carefully" : `Question ${Math.min(currentIndex + 1, items.length)} of ${items.length}`}
          </p>
          <span className="rounded-full bg-[#17342f]/5 px-3 py-1 text-xs font-bold text-[#315149]">
            {currentItem?.topicLabel ?? currentItem?.typeLabel ?? "Speaking"}
          </span>
        </div>

        {isPart2 ? (
          <div className="mt-4">
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-[#c9a95c] bg-[#fffdf7] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b6f39]">Paper cue card</p>
                <p className="mt-1 font-mono text-xs font-bold text-[#8a6a1f]">{currentItem?.cardCategory ?? "Topic"}</p>
                <p className="mt-2 font-serif text-lg leading-7 text-[#17342f]">{currentItem?.prompt}</p>
                {currentItem?.bullets?.length ? (
                  <ul className="mt-3 space-y-1.5">
                    {currentItem.bullets.map((bullet) => (
                      <li key={bullet} className="list-inside list-disc text-sm leading-6 text-[#4f625b]">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {phase === "prep" ? (
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#17342f]/96 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e3b65f]">Preparation time</p>
                    <p className="mt-2 font-serif text-7xl font-semibold">{formatClock(prepLeft)}</p>
                    <p className="mt-2 text-sm text-[#d8e4df]">Make notes on the card, then start speaking.</p>
                  </div>
                </div>
              ) : null}
              {phase === "turn" ? (
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#17342f]/96 backdrop-blur-sm">
                  <div className="text-center text-white">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e3b65f]">You are speaking — 2 minutes</p>
                    <p className="mt-2 font-serif text-7xl font-semibold">{formatClock(turnLeft)}</p>
                    <p className="mt-2 text-sm text-[#d8e4df]">Keep talking until the timer hits zero.</p>
                  </div>
                </div>
              ) : null}
              {phase === "done" ? (
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[#e4f0ea]">
                  <div className="text-center text-white">
                    <p className="rounded-full bg-[#2f7151] px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em]">
                      Turn complete — well done
                    </p>
                    <p className="mt-2 rounded-full bg-[#2f7151]/85 px-4 py-1.5 text-sm font-bold">You spoke the full 2 minutes</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              {phase === "idle" ? (
                <button
                  onClick={() => setPhase("prep")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
                >
                  <Timer className="h-4 w-4" />
                  Start my 1-minute preparation
                </button>
              ) : phase === "turn" ? (
                <div className="rounded-2xl bg-[#17342f]/5 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Your 2-minute long turn — record yourself</p>
                  <div className="mt-2">
                    <VoiceRecorder onTranscript={(text) => text && onAnswer(currentItem!.id, text)} />
                  </div>
                </div>
              ) : phase === "done" ? (
                <button
                  onClick={advance}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-5 py-3 text-sm font-black text-[#17342f] shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
                >
                  {isFollowUp ? "Begin Part 3 — Discussion" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="mt-4">
              <AnswerGuideCard guide={speakingGuide} />
            </div>
          </div>
        ) : (
          <>
            <div className="mt-3">
              <PracticeQuestion
                key={currentItem?.id}
                item={currentItem}
                index={currentIndex}
                module="speaking"
                value={currentItem ? (answers[currentItem.id] ?? "") : ""}
                onAnswer={onAnswer}
              />
            </div>
            <div className="mt-3">
              <AnswerGuideCard guide={speakingGuide} />
            </div>
            {isFollowUp ? (
              <p className="mt-3 rounded-2xl bg-[#f6ecd4]/70 p-3 text-xs font-semibold leading-5 text-[#8a6a1f]">
                This follow-up question rounds off Part 2 before the examiner moves you into Part 3.
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <VoiceRecorder onTranscript={(text) => text && currentItem && onAnswer(currentItem.id, text)} />
              </div>
              <button
                onClick={advance}
                disabled={!currentItem || !(answers[currentItem.id] ?? "").trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLast ? "Finish speaking and score my exam" : isFollowUp ? "Enter Part 3" : "Next question"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MockResult({
  result,
  answers,
  onRestart,
}: {
  result: MockExamResult | null;
  answers: Record<string, string>;
  onRestart: () => void;
}) {
  if (!result) {
    return (
      <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-8 text-center shadow-[0_24px_80px_rgba(33,72,67,0.13)]">
        <h2 className="font-serif text-3xl font-semibold text-[#17342f]">No mock result yet</h2>
        <button onClick={onRestart} className="mt-5 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white">
          Start mock exam
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#17342f] p-6 text-white shadow-[0_24px_80px_rgba(33,72,67,0.2)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e3b65f]">Full mock examiner report</p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-serif text-5xl font-semibold">Overall Band {result.overallBand.toFixed(1)}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d8e4df]">
              Listening, Reading, Writing, and Speaking were scored together after the full simulated exam.
            </p>
          </div>
          <button onClick={onRestart} className="rounded-2xl bg-[#e3b65f] px-5 py-3 text-sm font-black text-[#17342f]">
            Run another mock
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BandCard label="Listening" band={result.listeningBand} />
        <BandCard label="Reading" band={result.readingBand} />
        <BandCard label="Writing" band={result.writingBand} />
        <BandCard label="Speaking" band={result.speakingBand} />
      </section>

      <MockTimingResult result={result} />

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f0ea] text-[#2f7151]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Strengths</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What carried the mock</h3>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {result.strengths.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7e3de] text-[#9c3a2e]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Weaknesses</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What cost you band score</h3>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {result.weaknesses.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[#9c3a2e]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Section feedback</p>
          <div className="mt-4 grid gap-3">
            {skillOrder.map((skill) => (
              <div key={skill} className="rounded-2xl bg-white/70 p-4">
                <p className="font-black text-[#17342f]">{skill.charAt(0).toUpperCase() + skill.slice(1)}</p>
                <p className="mt-1 text-sm leading-6 text-[#5b6b63]">{result.sectionFeedback[skill]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Recommendations</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Your next sessions</h3>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {result.improvementPlan.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MockAnswerReview answers={answers} />
    </div>
  );
}

function MockTimingResult({ result }: { result: MockExamResult }) {
  const hasMetrics = result.speed || result.timeManagement;
  return (
    <section className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
          <Gauge className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Pacing across the mock</p>
          <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Accuracy, speed, and time management</h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MockMetricCard label="Overall accuracy" value={result.accuracy != null ? `${result.accuracy}%` : "—"} />
        <MockMetricCard label="Answer speed" value={result.speed ? `${result.speed.score}` : "—"} sub={result.speed?.label} comment={result.speed?.comment} />
        <MockMetricCard label="Time management" value={result.timeManagement ? `${result.timeManagement.score}` : "—"} sub={result.timeManagement?.label} comment={result.timeManagement?.comment} />
      </div>

      {hasMetrics ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {skillOrder.map((skill) => {
            const detail = result.timing?.[skill];
            if (!detail) return null;
            return (
              <div key={skill} className="rounded-xl bg-[#17342f]/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{skill}</p>
                <p className="mt-1 font-mono text-lg font-bold text-[#17342f]">{detail.timeTaken}</p>
                <p className="text-xs text-[#5b6b63]">
                  recommended {detail.recommendedSeconds >= 3600 ? `${Math.round(detail.recommendedSeconds / 60)} min` : formatClock(detail.recommendedSeconds)}
                  {detail.overBudgetSeconds > 0 ? ` · ${formatClock(detail.overBudgetSeconds)} over` : ""}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function MockMetricCard({
  label,
  value,
  sub,
  comment,
}: {
  label: string;
  value: string;
  sub?: string;
  comment?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#17342f]/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-mono text-4xl font-bold text-[#17342f]">{value}</p>
        {sub ? (
          <span className="rounded-full bg-[#e4f0ea] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7151]">{sub}</span>
        ) : null}
      </div>
      {comment ? <p className="mt-2 text-xs leading-5 text-[#5b6b63]">{comment}</p> : null}
    </div>
  );
}

function MockAnswerReview({ answers }: { answers: Record<string, string> }) {
  const numericIds = Object.keys(answers).filter((id) => id.startsWith("listening-") || id.startsWith("reading-"));
  const answeredNumeric = numericIds.filter((id) => (answers[id] ?? "").trim()).length;
  const writtenIds = Object.keys(answers).filter((id) => !id.startsWith("listening-") && !id.startsWith("reading-"));

  return (
    <section className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Submitted answers</p>
            <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Review what you wrote</h3>
          </div>
        </div>
        <span className="rounded-full bg-[#17342f]/5 px-4 py-2 font-mono text-sm font-bold text-[#315149]">
          {answeredNumeric}/{numericIds.length} listening & reading · {writtenIds.length} written
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniScore label="Listening" value={numericIds.filter((id) => id.startsWith("listening-")).filter((id) => (answers[id] ?? "").trim()).length} suffix={` / ${numericIds.filter((id) => id.startsWith("listening-")).length}`} />
        <MiniScore label="Reading" value={numericIds.filter((id) => id.startsWith("reading-")).filter((id) => (answers[id] ?? "").trim()).length} suffix={` / ${numericIds.filter((id) => id.startsWith("reading-")).length}`} />
        {writtenIds.map((id) => (
          <MiniScore key={id} label="Written" value={(answers[id] ?? "").trim() ? 1 : 0} suffix=" filled" />
        ))}
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-2">
        {writtenIds.map((id) => {
          const value = answers[id] ?? "";
          return (
            <div key={id} className="rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
              <p className="font-black text-[#17342f]">{id}</p>
              <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-[#4f625b]">
                {value.trim() || <span className="italic text-[#8b8f88]">No answer submitted.</span>}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BandCard({ label, band }: { label: string; band: number }) {
  const skillId = label.toLowerCase() as Skill;
  const skillConfig = skillOrder.includes(skillId) ? moduleConfig[skillId] : null;
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]", skillConfig?.soft ?? "bg-[#17342f]/5 text-[#8b6f39]")}>
        {label}
      </span>
      <p className="mt-3 font-mono text-5xl font-bold text-[#17342f]">{band.toFixed(1)}</p>
      <div className="mt-4 h-2 rounded-full bg-[#d8c8a8]/70">
        <div className={cn("h-full rounded-full", skillConfig?.accent ?? "bg-[#17342f]")} style={{ width: `${(band / 9) * 100}%` }} />
      </div>
    </div>
  );
}

function MiniScore({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const display = Number.isInteger(value) ? `${value}${suffix}` : `${value.toFixed(1)}${suffix}`;
  return (
    <div className="rounded-xl bg-[#17342f]/5 px-2 py-2">
      <p className="text-xs font-black text-[#8b6f39]">{label}</p>
      <p className="font-mono text-lg font-bold text-[#17342f]">{display}</p>
    </div>
  );
}
