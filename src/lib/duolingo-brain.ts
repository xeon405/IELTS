export type DetSkill = "literacy" | "comprehension" | "conversation" | "production";

export type DetModule =
  | "read-select"
  | "read-complete"
  | "listen-type"
  | "read-aloud"
  | "speak-photo"
  | "write-photo"
  | "interactive-reading"
  | "interactive-listening"
  | "writing-sample"
  | "speaking-sample";

export interface DetPracticeItem {
  id: string;
  type: DetModule;
  title: string;
  prompt: string;
  context?: string;
  options?: string[];
  focus: string;
}

export interface DetPracticeSession {
  id: string;
  module: DetModule;
  skill: DetSkill;
  title: string;
  subtitle: string;
  durationMinutes: number;
  targetScore: number;
  questionCount: number;
  aiIntent: string;
  items: DetPracticeItem[];
}

export interface DetHistoryEntry {
  id: string;
  date: string;
  module: DetModule;
  title: string;
  score: number;
  weaknesses: string[];
}

export interface DetProgressPoint {
  label: string;
  overall: number;
  literacy: number;
  comprehension: number;
  conversation: number;
  production: number;
}

export interface DetProfile {
  id: string;
  name: string;
  currentScore: number;
  targetScore: number;
  streak: number;
  weeklyGoalHours: number;
  completedHours: number;
  vocabularyLevel: string;
  grammarLevel: string;
  speakingConfidence: number;
  subscores: Record<DetSkill, number>;
  weakQuestionTypes: string[];
  weakTopics: string[];
  strongSignals: string[];
  history: DetHistoryEntry[];
  progress: DetProgressPoint[];
}

export interface DetRecommendation {
  module: DetModule;
  skill: DetSkill;
  reason: string;
  targetWeakness: string;
  expectedLift: string;
  priority: string;
}

export interface DetEvaluation {
  score: number;
  accuracy: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  nextPlan: string[];
}

export interface DetMockResult {
  overallScore: number;
  literacy: number;
  comprehension: number;
  conversation: number;
  production: number;
  feedback: Record<DetSkill, string>;
  plan: string[];
}

export const detSkillLabels: Record<DetSkill, string> = {
  literacy: "Literacy",
  comprehension: "Comprehension",
  conversation: "Conversation",
  production: "Production",
};

export const detModuleLabels: Record<DetModule, string> = {
  "read-select": "Read and Select",
  "read-complete": "Read and Complete",
  "listen-type": "Listen and Type",
  "read-aloud": "Read Aloud",
  "speak-photo": "Speak About Photo",
  "write-photo": "Write About Photo",
  "interactive-reading": "Interactive Reading",
  "interactive-listening": "Interactive Listening",
  "writing-sample": "Writing Sample",
  "speaking-sample": "Speaking Sample",
};

const defaultDetProfile: DetProfile = {
  id: "det-demo-001",
  name: "Amina Rahman",
  currentScore: 115,
  targetScore: 135,
  streak: 11,
  weeklyGoalHours: 7,
  completedHours: 4.5,
  vocabularyLevel: "Upper-intermediate with academic collocation gaps",
  grammarLevel: "Complex sentences are emerging but tense control slips under speed",
  speakingConfidence: 68,
  subscores: {
    literacy: 110,
    comprehension: 120,
    conversation: 115,
    production: 110,
  },
  weakQuestionTypes: [
    "Read and Complete",
    "Listen and Type",
    "Speaking Sample Extension",
    "Write About Photo Details",
    "Read Aloud Stress",
  ],
  weakTopics: ["Campus life", "Technology habits", "Urban spaces", "Workplace decisions"],
  strongSignals: [
    "Understands short academic texts quickly",
    "Can explain personal opinions clearly",
    "Recognizes common DET distractors",
  ],
  history: [
    {
      id: "dh-1",
      date: "Aug 01",
      module: "read-complete",
      title: "Sustainable Campus Cafes",
      score: 110,
      weaknesses: ["Word form", "Collocation"],
    },
    {
      id: "dh-2",
      date: "Jul 31",
      module: "speak-photo",
      title: "People Working in a Library",
      score: 115,
      weaknesses: ["Detail expansion", "Pronunciation rhythm"],
    },
    {
      id: "dh-3",
      date: "Jul 30",
      module: "listen-type",
      title: "Museum Membership Notice",
      score: 105,
      weaknesses: ["Function words", "Spelling under speed"],
    },
  ],
  progress: [
    { label: "W1", overall: 100, literacy: 100, comprehension: 105, conversation: 100, production: 95 },
    { label: "W2", overall: 105, literacy: 105, comprehension: 110, conversation: 105, production: 100 },
    { label: "W3", overall: 110, literacy: 110, comprehension: 115, conversation: 110, production: 105 },
    { label: "W4", overall: 115, literacy: 110, comprehension: 120, conversation: 115, production: 110 },
  ],
};

export const detMockFlow = [
  { id: "quick" as const, label: "Adaptive Questions", minutes: 35, note: "Fast question types adjust to ability" },
  { id: "interactive" as const, label: "Interactive Tasks", minutes: 20, note: "Reading and Listening passage tasks" },
  { id: "sample" as const, label: "Samples", minutes: 10, note: "Writing Sample and Speaking Sample" },
  { id: "report" as const, label: "AI Report", minutes: 2, note: "Score, subscores, and next plan" },
];

const sessions: DetPracticeSession[] = [
  {
    id: "det-read-complete-core",
    module: "read-complete",
    skill: "literacy",
    title: "Campus Cafes and Food Waste",
    subtitle: "Adaptive cloze practice for word form, collocation, and sentence logic.",
    durationMinutes: 7,
    targetScore: 125,
    questionCount: 6,
    aiIntent: "Find whether the student can restore missing words from grammar and meaning, not guessing by topic.",
    items: [
      {
        id: "rc-1",
        type: "read-complete",
        title: "Read and Complete",
        context:
          "Many university cafes now measure daily leftovers because small changes in ordering can reduce waste without limiting student choice.",
        prompt: "Complete the missing word: Small changes in ordering can r____ waste without limiting student choice.",
        focus: "Use context and word form to complete a high-frequency academic verb.",
      },
      {
        id: "rc-2",
        type: "read-complete",
        title: "Collocation Gap",
        prompt: "Complete the phrase: make a measurable ______ in waste levels.",
        options: ["difference", "different", "differ", "differently"],
        focus: "Choose the noun that fits the collocation.",
      },
    ],
  },
  {
    id: "det-listen-type-focus",
    module: "listen-type",
    skill: "comprehension",
    title: "Museum Membership Notice",
    subtitle: "Listen and Type simulation with function words and spelling traps.",
    durationMinutes: 6,
    targetScore: 125,
    questionCount: 4,
    aiIntent: "Train exact transcription, especially articles, plural endings, and short unstressed words.",
    items: [
      {
        id: "lt-1",
        type: "listen-type",
        title: "Listen and Type",
        context: "Audio script: The gallery will be closed on Monday, but members can book private tours online.",
        prompt: "Type the sentence you hear.",
        focus: "Capture every word, not only meaning.",
      },
      {
        id: "lt-2",
        type: "listen-type",
        title: "Number and Date Detail",
        context: "Audio script: Discounted tickets are available until the twenty-first of September.",
        prompt: "Type the sentence you hear.",
        focus: "Handle dates and function words accurately.",
      },
    ],
  },
  {
    id: "det-speak-photo-expand",
    module: "speak-photo",
    skill: "conversation",
    title: "People Working in a Library",
    subtitle: "Photo speaking with observation, inference, and fluent extension.",
    durationMinutes: 5,
    targetScore: 130,
    questionCount: 1,
    aiIntent: "Move the student from listing objects to describing relationships, actions, and possible reasons.",
    items: [
      {
        id: "sp-1",
        type: "speak-photo",
        title: "Speak About Photo",
        prompt:
          "Describe a photo of three students working around a laptop in a bright library. Include what they are doing, where they are, and what might happen next.",
        focus: "Use present continuous, location language, and a natural inference.",
      },
    ],
  },
  {
    id: "det-writing-sample-plan",
    module: "writing-sample",
    skill: "production",
    title: "Technology and Learning Habits",
    subtitle: "Longer writing sample with structure, examples, and clear position.",
    durationMinutes: 5,
    targetScore: 135,
    questionCount: 1,
    aiIntent: "Check whether ideas are developed with enough detail for a high DET production score.",
    items: [
      {
        id: "ws-1",
        type: "writing-sample",
        title: "Writing Sample",
        prompt:
          "Some students prefer learning with short videos, while others prefer books and long articles. Which method is more effective for serious learning? Give reasons and examples.",
        focus: "State a position, compare both methods, and support with examples.",
      },
    ],
  },
];

export function createDetProfile(): DetProfile {
  return structuredClone(defaultDetProfile);
}

export function getDetSessions(): DetPracticeSession[] {
  return structuredClone(sessions);
}

export function roundDetScore(score: number): number {
  return Math.max(10, Math.min(160, Math.round(score / 5) * 5));
}

export function calculateDetOverall(subscores: Record<DetSkill, number>): number {
  return roundDetScore(
    (subscores.literacy + subscores.comprehension + subscores.conversation + subscores.production) / 4,
  );
}

export function getDetRecommendation(profile: DetProfile): DetRecommendation {
  const [skill, score] = (Object.entries(profile.subscores) as [DetSkill, number][]).sort((a, b) => a[1] - b[1])[0];
  const weakness = profile.weakQuestionTypes[0] ?? "Score consistency";
  const session = sessions.find((item) => item.skill === skill) ?? sessions[0];

  return {
    module: session.module,
    skill,
    targetWeakness: weakness,
    priority: profile.targetScore - score >= 20 ? "Critical score path" : "High value",
    expectedLift: profile.targetScore - score >= 20 ? "+10 points after 4 sessions" : "+5 points after 2 sessions",
    reason: `${detSkillLabels[skill]} is the lowest subscore at ${score}, and recent answers show ${weakness.toLowerCase()} weakness.`,
  };
}

export function createDetSession(profile: DetProfile, module?: DetModule): DetPracticeSession {
  const recommended = getDetRecommendation(profile);
  const selected = sessions.find((session) => session.module === (module ?? recommended.module)) ?? sessions[0];
  return structuredClone(selected);
}

function wordCount(answers: Record<string, string>): number {
  return Object.values(answers).join(" ").trim().split(/\s+/).filter(Boolean).length;
}

function completion(session: DetPracticeSession, answers: Record<string, string>): number {
  if (session.items.length === 0) return 0;
  return session.items.filter((item) => answers[item.id]?.trim()).length / session.items.length;
}

export function evaluateDetSession(
  profile: DetProfile,
  session: DetPracticeSession,
  answers: Record<string, string>,
): { evaluation: DetEvaluation; profile: DetProfile } {
  const words = wordCount(answers);
  const done = completion(session, answers);
  const base = profile.subscores[session.skill];
  const score = roundDetScore(base + (done - 0.7) * 25 + Math.min(10, words / 12));
  const accuracy = Math.max(35, Math.min(96, Math.round(done * 72 + score / 6)));
  const weaknesses = session.module === "listen-type"
    ? ["Function words", "Spelling under speed"]
    : session.module === "speak-photo"
      ? ["Detail expansion", "Natural stress"]
      : session.module === "writing-sample"
        ? ["Idea development", "Sentence variety"]
        : ["Word form", "Collocation accuracy"];
  const strengths = [
    "Completed the selected DET task before AI review",
    words > 35 ? "Enough language for reliable score diagnosis" : "Clear starting signal for adaptive practice",
    `${detSkillLabels[session.skill]} profile memory updated`,
  ];
  const nextSubscores = { ...profile.subscores, [session.skill]: roundDetScore(base * 0.7 + score * 0.3) };
  const overall = calculateDetOverall(nextSubscores);
  const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date());
  const nextProfile: DetProfile = {
    ...profile,
    currentScore: overall,
    subscores: nextSubscores,
    streak: profile.streak + 1,
    completedHours: Math.min(profile.weeklyGoalHours, profile.completedHours + session.durationMinutes / 60),
    weakQuestionTypes: Array.from(new Set([...weaknesses, ...profile.weakQuestionTypes])).slice(0, 7),
    strongSignals: Array.from(new Set([...strengths, ...profile.strongSignals])).slice(0, 6),
    history: [
      { id: `det-${Date.now()}`, date, module: session.module, title: session.title, score, weaknesses },
      ...profile.history,
    ].slice(0, 8),
    progress: [
      ...profile.progress.slice(-5),
      {
        label: "Now",
        overall,
        literacy: nextSubscores.literacy,
        comprehension: nextSubscores.comprehension,
        conversation: nextSubscores.conversation,
        production: nextSubscores.production,
      },
    ],
  };

  return {
    evaluation: {
      score,
      accuracy,
      summary: `This response is predicted around DET ${score}. The AI Brain reviewed the completed task and updated the next-practice path.`,
      strengths,
      weaknesses,
      nextPlan: [
        `Repeat ${detModuleLabels[session.module]} with focus on ${weaknesses[0]}.`,
        "Do one speed round, then one accuracy round for the same question type.",
        `Move to ${detModuleLabels[getDetRecommendation(nextProfile).module]} when accuracy is above 80%.`,
      ],
    },
    profile: nextProfile,
  };
}

export function evaluateDetMock(profile: DetProfile, answers: Record<string, string>): { result: DetMockResult; profile: DetProfile } {
  const words = wordCount(answers);
  const answered = Object.values(answers).filter((value) => value.trim()).length;
  const stamina = answered > 24 ? 5 : answered > 12 ? 0 : -10;
  const language = words > 260 ? 10 : words > 120 ? 5 : -5;
  const subscores = {
    literacy: roundDetScore(profile.subscores.literacy + stamina),
    comprehension: roundDetScore(profile.subscores.comprehension + stamina),
    conversation: roundDetScore(profile.subscores.conversation + language),
    production: roundDetScore(profile.subscores.production + language),
  };
  const overallScore = calculateDetOverall(subscores);
  const nextProfile: DetProfile = {
    ...profile,
    currentScore: overallScore,
    subscores,
    progress: [
      ...profile.progress.slice(-5),
      { label: "Mock", overall: overallScore, ...subscores },
    ],
  };

  return {
    result: {
      overallScore,
      ...subscores,
      feedback: {
        literacy: "Reading vocabulary is stable; cloze tasks need stronger word-form control.",
        comprehension: "Listening meaning is clear, but exact transcription loses small words.",
        conversation: "Photo and speaking sample answers are understandable; extension needs more detail.",
        production: "Writing has a clear position; sentence variety and examples can lift the score.",
      },
      plan: [
        "Train the lowest subscore for two sessions before another mock.",
        "Alternate speed practice with accuracy review for Read and Complete.",
        "Record one speaking sample daily and extend each answer with observation, inference, and example.",
        "Use a 4-sentence structure for writing samples: position, reason, example, result.",
      ],
    },
    profile: nextProfile,
  };
}
