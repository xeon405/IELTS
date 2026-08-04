import { GoogleGenAI } from "@google/genai";
import {
  buildMockUpdatedProfile,
  buildPracticeUpdatedProfile,
  calculateOverallBand,
  clampBand,
  formatSkill,
  getAdaptiveRecommendation,
  type AdaptiveRecommendation,
  type BandMap,
  type EvaluationResult,
  type MockExamResult,
  type PracticeItem,
  type PracticeItemType,
  type PracticeSession,
  type Skill,
  type StudentLearningProfile,
} from "./ielts-brain";

const sessionItemTypes: PracticeItemType[] = [
  "multiple-choice",
  "short-answer",
  "matching",
  "essay",
  "speaking-cue",
];

const skills: Skill[] = ["listening", "reading", "writing", "speaking"];

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getGenAI(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
}

function getModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const items = value.map((item) => (typeof item === "string" ? item : String(item))).filter(Boolean);
    if (items.length) return items;
  }
  return fallback;
}

async function generateJson(
  prompt: string,
  schemaDescription: string,
  fallback: () => unknown,
): Promise<Record<string, unknown>> {
  const ai = getGenAI();
  try {
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: undefined,
      },
    });

    const text = response.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? "{}") as Record<string, unknown>;

    if (!parsed || Object.keys(parsed).length === 0) {
      throw new Error("Empty or invalid JSON from Gemini.");
    }

    return parsed;
  } catch (error) {
    console.error(`[gemini] ${schemaDescription} failed:`, error);
    fallback();
    return {};
  }
}

function profileBrief(profile: StudentLearningProfile): string {
  return [
    `Student: ${profile.name}`,
    `Current overall band: ${profile.currentBand.toFixed(1)}`,
    `Target band: ${profile.targetBand.toFixed(1)}`,
    `Skill bands: Reading ${profile.bands.reading}, Listening ${profile.bands.listening}, Writing ${profile.bands.writing}, Speaking ${profile.bands.speaking}`,
    `Weak question types: ${profile.weakQuestionTypes.join(", ")}`,
    `Weak topics: ${profile.weakTopics.join(", ")}`,
    `Strong signals: ${profile.strongSignals.join(", ")}`,
    `Recent practice: ${profile.practiceHistory.map((entry) => `${entry.module} ${entry.mode} (${entry.band.toFixed(1)})`).join("; ") || "none"}`,
    `Recent mocks: ${profile.mockHistory.length} completed`,
  ].join("\n");
}

function answersBrief(session: PracticeSession, answers: Record<string, string>): string {
  return session.items
    .map((item, index) => {
      const answer = answers[item.id]?.trim();
      if (!answer) return `${index + 1}. [${item.type}] ${item.title} — NO ANSWER`;
      const preview = answer.length > 500 ? `${answer.slice(0, 500)}...` : answer;
      return `${index + 1}. [${item.type}] ${item.title}:\n${preview}`;
    })
    .join("\n\n");
}

export async function aiRecommendation(profile: StudentLearningProfile): Promise<AdaptiveRecommendation | null> {
  const prompt = `You are the AI Orchestrator for an elite IELTS examiner platform. The website is the interface; you decide the next best learning path.

Student learning profile:
${profileBrief(profile)}

Decide the single most impactful next practice module and mode. Choose module strictly from: ${skills.join(", ")}. For mode, choose an official section label such as "Full Reading Section", "Passage 2", "Part 2", "Task 2", "Full Speaking Section" — it must match the module.

Respond ONLY with JSON using this schema:
{
  "module": "reading|listening|writing|speaking",
  "mode": "section label for that module",
  "priority": "Critical path|High value",
  "reason": "2-3 sentences explaining the decision from the profile",
  "targetWeakness": "the single weakest question type to attack",
  "expectedBandLift": "e.g. +0.5 after 3 focused sessions",
  "difficultyBand": number between 6 and 8
}`;

  const parsed = await generateJson(prompt, "recommendation", () => {});
  if (Object.keys(parsed).length === 0) return null;

  const module = skills.includes(parsed.module as Skill) ? (parsed.module as Skill) : null;
  if (!module) return null;

  return {
    module,
    mode: asString(parsed.mode, "Full Section"),
    priority: asString(parsed.priority, "High value"),
    reason: asString(parsed.reason, `${formatSkill(module)} is the current priority based on the learning profile.`),
    targetWeakness: asString(parsed.targetWeakness, profile.weakQuestionTypes[0] ?? "Band descriptor consistency"),
    expectedBandLift: asString(parsed.expectedBandLift, "+0.5 after 3 focused sessions"),
    difficultyBand: clampBand(Math.max(6, Math.min(8, asNumber(parsed.difficultyBand, 7)))),
  };
}

export async function aiPracticeEvaluation(
  profile: StudentLearningProfile,
  session: PracticeSession,
  answers: Record<string, string>,
): Promise<{ evaluation: EvaluationResult; updatedProfile: StudentLearningProfile } | null> {
  const prompt = `You are a Principal IELTS Examiner. Evaluate the completed ${formatSkill(session.module)} section below strictly against official public IELTS band descriptors (4.0-9.0 in 0.5 steps).

Section mode: ${session.mode}
Examiner intent: ${session.examinerIntent}
Target band: ${profile.targetBand.toFixed(1)}
Current ${formatSkill(session.module)} band in memory: ${profile.bands[session.module].toFixed(1)}

Student answers:
${answersBrief(session, answers)}

Respond ONLY with JSON using this schema:
{
  "predictedBand": number,
  "accuracy": number between 40 and 98,
  "examinerSummary": "2-3 sentence examiner-style summary",
  "strengths": ["specific strength"],
  "weaknesses": ["specific weakness tied to a quoted phrase"],
  "nextPlan": ["3 actionable steps"],
  "bandDescriptorNotes": ["2-3 notes referencing the band descriptors"]
}`;

  const parsed = await generateJson(prompt, "practice evaluation", () => {});
  if (Object.keys(parsed).length === 0) return null;

  const predictedBand = clampBand(asNumber(parsed.predictedBand, profile.bands[session.module]));
  const accuracy = Math.round(Math.max(40, Math.min(98, asNumber(parsed.accuracy, 70))));
  const strengths = asStringArray(parsed.strengths, []).slice(0, 5);
  const weaknesses = asStringArray(parsed.weaknesses, []).slice(0, 5);
  const nextPlan = asStringArray(parsed.nextPlan, []).slice(0, 5);
  const bandDescriptorNotes = asStringArray(parsed.bandDescriptorNotes, []).slice(0, 4);

  const updatedProfile = buildPracticeUpdatedProfile(
    profile,
    session,
    predictedBand,
    accuracy,
    weaknesses,
    strengths,
  );

  const evaluation: EvaluationResult = {
    sessionId: session.id,
    module: session.module,
    predictedBand,
    accuracy,
    examinerSummary: asString(parsed.examinerSummary, `${formatSkill(session.module)} performance is around Band ${predictedBand}.`),
    strengths,
    weaknesses,
    nextPlan,
    bandDescriptorNotes,
  };

  return { evaluation, updatedProfile };
}

export async function aiMockEvaluation(
  profile: StudentLearningProfile,
  answers: Record<string, string>,
): Promise<{ result: MockExamResult; updatedProfile: StudentLearningProfile } | null> {
  const prompt = `You are a Principal IELTS Examiner grading a full computer-delivered IELTS mock exam. Grade each skill strictly against official public band descriptors (4.0-9.0 in 0.5 steps).

Student learning profile:
${profileBrief(profile)}

Student mock answers (listening-1..40, reading-1..40, writing-task-1/2, speaking-part-1/2/3):
${Object.entries(answers)
    .map(([key, value]) => {
      const preview = value.trim().length > 300 ? `${value.trim().slice(0, 300)}...` : value.trim();
      return `${key}: ${preview || "NO ANSWER"}`;
    })
    .join("\n")}

Respond ONLY with JSON using this schema:
{
  "listeningBand": number,
  "readingBand": number,
  "writingBand": number,
  "speakingBand": number,
  "sectionFeedback": {
    "listening": "feedback sentence",
    "reading": "feedback sentence",
    "writing": "feedback sentence",
    "speaking": "feedback sentence"
  },
  "improvementPlan": ["4 actionable steps"],
  "summary": "one sentence mock summary"
}`;

  const parsed = await generateJson(prompt, "mock evaluation", () => {});
  if (Object.keys(parsed).length === 0) return null;

  const bands: BandMap = {
    listening: clampBand(asNumber(parsed.listeningBand, profile.bands.listening)),
    reading: clampBand(asNumber(parsed.readingBand, profile.bands.reading)),
    writing: clampBand(asNumber(parsed.writingBand, profile.bands.writing)),
    speaking: clampBand(asNumber(parsed.speakingBand, profile.bands.speaking)),
  };
  const overallBand = calculateOverallBand(bands);

  const rawFeedback = (parsed.sectionFeedback ?? {}) as Record<string, unknown>;
  const improvementPlan = asStringArray(parsed.improvementPlan, []).slice(0, 6);

  const result: MockExamResult = {
    id: `mock-${Date.now()}`,
    listeningBand: bands.listening,
    readingBand: bands.reading,
    writingBand: bands.writing,
    speakingBand: bands.speaking,
    overallBand,
    sectionFeedback: {
      listening: asString(rawFeedback.listening, "Listening shows general comprehension; refine detail recovery after corrections."),
      reading: asString(rawFeedback.reading, "Reading main ideas are stable; check inference and heading evidence."),
      writing: asString(rawFeedback.writing, "Writing task response is clear; work on progression and complex grammar."),
      speaking: asString(rawFeedback.speaking, "Speaking is fluent with examples; extend Part 3 answers with abstract reasoning."),
    },
    improvementPlan:
      improvementPlan.length >= 3
        ? improvementPlan
        : [
            "Spend two sessions on the lowest band skill before another full mock.",
            "Review all wrong or uncertain items by question type, not by topic only.",
            "Use a 3-minute planning routine for Writing Task 2 to improve progression.",
            "Record one Part 3 answer daily and extend each answer with cause, example, and result.",
          ],
  };

  const updatedProfile = buildMockUpdatedProfile(profile, bands, result);

  return { result, updatedProfile };
}

function getSkillFocusTypes(module: Skill, weakQuestionTypes: string[]): string[] {
  const skillMap: Record<Skill, string[]> = {
    reading: ["Matching Headings", "True / False / Not Given", "Summary Completion", "Multiple Choice", "Sentence Completion"],
    listening: ["Map Labelling", "Form Completion", "Multiple Choice", "Sentence Completion", "Matching"],
    writing: ["Task 2 Coherence", "Task Response", "Lexical Resource", "Grammatical Range"],
    speaking: ["Speaking Fluency", "Part 3 Extension", "Lexical Resource", "Pronunciation"],
  };
  const bySkill = skillMap[module];
  const matched = weakQuestionTypes.filter((weakness) => bySkill.some((type) => weakness.toLowerCase().includes(type.toLowerCase().split(" ")[0])));
  return matched.length ? matched.slice(0, 2) : bySkill.slice(0, 2);
}

function normalizeGeneratedItems(rawItems: unknown): PracticeItem[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
  return rawItems
    .slice(0, 6)
    .map((raw, index) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      const type = sessionItemTypes.includes(item.type as PracticeItemType)
        ? (item.type as PracticeItemType)
        : "short-answer";
      const options = Array.isArray(item.options)
        ? item.options.filter((option): option is string => typeof option === "string" && option.trim().length > 0).slice(0, 5)
        : undefined;

      return {
        id: `g${index + 1}`,
        type,
        title: asString(item.title, `Generated question ${index + 1}`),
        prompt: asString(item.prompt, "Answer the question."),
        context: asString(item.context, ""),
        options: options?.length ? options : undefined,
        expectedFocus: asString(item.expectedFocus, "Accuracy and band-descriptor alignment."),
        descriptorFocus: asString(item.descriptorFocus, "Band descriptor focus for the selected skill."),
      };
    })
    .filter((item) => item.prompt.trim());
}

export async function generateSessionWithAI(
  profile: StudentLearningProfile,
  module: Skill,
  mode: string,
): Promise<PracticeSession | null> {
  const recommendation = getAdaptiveRecommendation(profile);
  const topic = profile.weakTopics[0] ?? "Urban development and technology";
  const focusTypes = getSkillFocusTypes(module, profile.weakQuestionTypes);

  const prompt = `You are a certified Senior IELTS Test Writer. Generate ONE original, authentic IELTS-style practice section for a real student. NEVER copy published exam content — create a fresh, original question set.

Skill: ${formatSkill(module)}
Section mode: ${mode}
Student current ${formatSkill(module)} band: ${profile.bands[module].toFixed(1)}
Target band: ${profile.targetBand.toFixed(1)}
Target difficulty band: ${recommendation.difficultyBand.toFixed(1)}
Topic family: ${topic}
Weaknesses to attack: ${focusTypes.join(", ")}

Requirements:
- Generate EXACTLY 3 questions.
- The question type mix MUST follow this skill template:
  - Writing: one "essay" prompt plus two "short-answer" planning questions. NO multiple-choice, matching, or speaking-cue types.
  - Speaking: one "speaking-cue" long turn plus two "short-answer" Part 1 / Part 3 follow-ups. NO multiple-choice, matching, or essay types.
  - Reading: "matching" or "multiple-choice" plus "short-answer"; put an original short passage inside the first item's "context".
  - Listening: "multiple-choice" plus "short-answer"; put "Audio script: ..." inside the first item's "context".
- Vocabulary and grammar must sit at the requested difficulty band. Be concise.

Respond ONLY with JSON:
{
  "title": "section title",
  "subtitle": "one-line description",
  "examinerIntent": "what the section tests",
  "questionTypes": ["question type labels"],
  "durationMinutes": number,
  "items": [
    {
      "type": "multiple-choice" | "short-answer" | "matching" | "essay" | "speaking-cue",
      "title": "short title",
      "prompt": "the full question",
      "context": "passage / audio script / background (optional)",
      "options": ["option A", "option B"] (only for multiple-choice or matching),
      "expectedFocus": "what a strong answer does",
      "descriptorFocus": "band descriptor area it tests"
    }
  ]
}`;

  const parsed = await generateJson(prompt, "question generation", () => {});
  if (Object.keys(parsed).length === 0) return null;

  const items = normalizeGeneratedItems(parsed.items);
  if (items.length === 0) return null;

  const expectedTypes = module === "writing"
    ? ["essay", "short-answer"]
    : module === "speaking"
      ? ["speaking-cue", "short-answer"]
      : ["multiple-choice", "short-answer", "matching"];
  const filteredItems = items.filter((item) => expectedTypes.includes(item.type));
  if (filteredItems.length === 0) return null;

  return {
    id: `gen-${Date.now()}`,
    module,
    mode,
    title: asString(parsed.title, `${formatSkill(module)} practice`),
    subtitle: asString(parsed.subtitle, "Original AI-generated practice for your current weaknesses."),
    durationMinutes: Math.max(2, Math.round(asNumber(parsed.durationMinutes, 20))),
    questionCount: filteredItems.length,
    questionTypes: asStringArray(parsed.questionTypes, focusTypes).slice(0, 5),
    difficultyBand: recommendation.difficultyBand,
    examinerIntent: asString(parsed.examinerIntent, "Targets the student's current weakness within the requested section."),
    items: filteredItems,
  };
}

export async function aiDiagnostic(
  name: string,
  answers: Record<string, string>,
): Promise<{
  bands: BandMap;
  grammarLevel: string;
  vocabularyLevel: string;
  weakQuestionTypes: string[];
  weakTopics: string[];
  strongSignals: string[];
} | null> {
  const prompt = `You are a Principal IELTS Examiner running a quick diagnostic for a brand-new student.

Student name: ${name}
Diagnostic answers:
${Object.entries(answers)
    .map(([key, value]) => {
      const preview = value.trim().length > 400 ? `${value.trim().slice(0, 400)}...` : value.trim();
      return `${key}: ${preview || "NO ANSWER"}`;
    })
    .join("\n")}

Estimate this student's current performance using official public IELTS band descriptors (4.0-9.0 in 0.5 steps). This is an estimate only — be honest and slightly conservative.

Respond ONLY with JSON:
{
  "bands": {
    "listening": number,
    "reading": number,
    "writing": number,
    "speaking": number
  },
  "grammarLevel": "CEFR description e.g. B2 - ...",
  "vocabularyLevel": "CEFR description",
  "weakQuestionTypes": ["up to 5 specific IELTS question types"],
  "weakTopics": ["up to 4 topics to practise"],
  "strongSignals": ["up to 4 observable strengths"]
}`;

  const parsed = await generateJson(prompt, "diagnostic", () => {});
  if (Object.keys(parsed).length === 0) return null;

  const rawBands = (parsed.bands ?? {}) as Record<string, unknown>;
  const bands: BandMap = {
    listening: clampBand(asNumber(rawBands.listening, 5.5)),
    reading: clampBand(asNumber(rawBands.reading, 5.5)),
    writing: clampBand(asNumber(rawBands.writing, 5.5)),
    speaking: clampBand(asNumber(rawBands.speaking, 5.5)),
  };

  return {
    bands,
    grammarLevel: asString(parsed.grammarLevel, "B1+ - basic structures with frequent errors in complex sentences"),
    vocabularyLevel: asString(parsed.vocabularyLevel, "B1+ - everyday range, limited academic precision"),
    weakQuestionTypes: asStringArray(parsed.weakQuestionTypes, ["Sentence Completion", "Multiple Choice", "Task 2 Coherence", "Speaking Fluency"]).slice(0, 5),
    weakTopics: asStringArray(parsed.weakTopics, ["Education policy", "Urban development"]).slice(0, 4),
    strongSignals: asStringArray(parsed.strongSignals, ["Willing to write full answers"]).slice(0, 4),
  };
}
