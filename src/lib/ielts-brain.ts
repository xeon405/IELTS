export type Skill = "reading" | "listening" | "writing" | "speaking";

export type PracticeItemType =
  | "multiple-choice"
  | "short-answer"
  | "matching"
  | "essay"
  | "speaking-cue";

export type BandMap = Record<Skill, number>;

export interface PracticeItem {
  id: string;
  type: PracticeItemType;
  title: string;
  prompt: string;
  context?: string;
  options?: string[];
  expectedFocus: string;
  descriptorFocus: string;
}

export interface PracticeSession {
  id: string;
  module: Skill;
  mode: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  questionCount: number;
  questionTypes: string[];
  difficultyBand: number;
  examinerIntent: string;
  items: PracticeItem[];
}

export interface PracticeHistoryEntry {
  id: string;
  date: string;
  module: Skill;
  mode: string;
  title: string;
  band: number;
  accuracy: number;
  weaknesses: string[];
}

export interface MockHistoryEntry {
  id: string;
  date: string;
  overallBand: number;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  summary: string;
}

export interface ProgressPoint {
  label: string;
  overall: number;
  reading: number;
  listening: number;
  writing: number;
  speaking: number;
}

export interface StudentLearningProfile {
  id: string;
  name: string;
  currentBand: number;
  targetBand: number;
  studyStreak: number;
  weeklyGoalHours: number;
  completedHours: number;
  grammarLevel: string;
  vocabularyLevel: string;
  confidenceLevel: number;
  bands: BandMap;
  weakQuestionTypes: string[];
  weakTopics: string[];
  strongSignals: string[];
  practiceHistory: PracticeHistoryEntry[];
  mockHistory: MockHistoryEntry[];
  progress: ProgressPoint[];
}

export interface AdaptiveRecommendation {
  module: Skill;
  mode: string;
  priority: string;
  reason: string;
  targetWeakness: string;
  expectedBandLift: string;
  difficultyBand: number;
}

export interface EvaluationResult {
  sessionId: string;
  module: Skill;
  predictedBand: number;
  accuracy: number;
  examinerSummary: string;
  strengths: string[];
  weaknesses: string[];
  nextPlan: string[];
  bandDescriptorNotes: string[];
}

export interface MockExamResult {
  id: string;
  listeningBand: number;
  readingBand: number;
  writingBand: number;
  speakingBand: number;
  overallBand: number;
  sectionFeedback: Record<Skill, string>;
  improvementPlan: string[];
}

const skillLabels: Record<Skill, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

const defaultProfile: StudentLearningProfile = {
  id: "student-demo-001",
  name: "Amina Rahman",
  currentBand: 6.25,
  targetBand: 7.5,
  studyStreak: 9,
  weeklyGoalHours: 8,
  completedHours: 5.5,
  grammarLevel: "B2 - accurate basics with complex sentence control gaps",
  vocabularyLevel: "B2+ - strong academic range, needs collocation precision",
  confidenceLevel: 72,
  bands: {
    reading: 6,
    listening: 6.5,
    writing: 6,
    speaking: 6.5,
  },
  weakQuestionTypes: [
    "Matching Headings",
    "True / False / Not Given",
    "Task 2 Coherence",
    "Speaking Fluency",
    "Map Labelling",
  ],
  weakTopics: [
    "Urban development",
    "Workplace communication",
    "Environment and energy",
    "Education policy",
  ],
  strongSignals: [
    "Understands main ideas quickly",
    "Uses topic-specific vocabulary",
    "Good task response when planning is visible",
  ],
  practiceHistory: [
    {
      id: "ph-1",
      date: "Jul 30",
      module: "reading",
      mode: "Passage 2",
      title: "Coastal Cities and Flood Risk",
      band: 6,
      accuracy: 63,
      weaknesses: ["Matching Headings", "Reference words"],
    },
    {
      id: "ph-2",
      date: "Jul 29",
      module: "speaking",
      mode: "Part 2",
      title: "Describe a Useful Skill",
      band: 6.5,
      accuracy: 71,
      weaknesses: ["Fluency", "Self-correction"],
    },
    {
      id: "ph-3",
      date: "Jul 28",
      module: "writing",
      mode: "Task 2",
      title: "Public Transport Investment",
      band: 6,
      accuracy: 60,
      weaknesses: ["Coherence", "Examples"],
    },
  ],
  mockHistory: [
    {
      id: "mh-1",
      date: "Jul 24",
      overallBand: 6,
      listeningBand: 6.5,
      readingBand: 6,
      writingBand: 6,
      speakingBand: 6.5,
      summary: "Strong comprehension, but writing progression limited the overall band.",
    },
  ],
  progress: [
    { label: "W1", overall: 5.5, reading: 5.5, listening: 6, writing: 5.5, speaking: 6 },
    { label: "W2", overall: 5.8, reading: 5.5, listening: 6, writing: 5.5, speaking: 6.5 },
    { label: "W3", overall: 6, reading: 6, listening: 6, writing: 6, speaking: 6.5 },
    { label: "W4", overall: 6.25, reading: 6, listening: 6.5, writing: 6, speaking: 6.5 },
  ],
};

const practiceBlueprints: Record<Skill, PracticeSession[]> = {
  reading: [
    {
      id: "reading-adaptive-headings",
      module: "reading",
      mode: "Passage 2",
      title: "Urban Canopies and the Cooling City",
      subtitle: "Adaptive passage built for Matching Headings and inference control.",
      durationMinutes: 20,
      questionCount: 13,
      questionTypes: ["Matching Headings", "True / False / Not Given", "Sentence Completion"],
      difficultyBand: 6.5,
      examinerIntent:
        "Test whether the student can separate topic sentences from supporting examples under Band 7 reading pressure.",
      items: [
        {
          id: "r1",
          type: "matching",
          title: "Match the Heading",
          context:
            "Cities are turning to tree-lined corridors, reflective materials, and shaded transport stops to reduce dangerous heat. The strongest results appear when design teams connect green routes rather than planting isolated trees.",
          prompt: "Choose the best heading for the paragraph.",
          options: [
            "A single solution for urban heat",
            "Why connected shade networks matter",
            "The cost of planting street trees",
            "How residents oppose city greening",
          ],
          expectedFocus: "Identify the controlling idea, not the most repeated word.",
          descriptorFocus: "Reading: locating main ideas and implied purpose.",
        },
        {
          id: "r2",
          type: "multiple-choice",
          title: "True / False / Not Given",
          context:
            "A three-year trial in Lisbon found that shaded walking routes increased afternoon foot traffic, but researchers did not claim that retail sales improved as a direct result.",
          prompt: "The Lisbon trial proved that shaded streets increased shop revenue.",
          options: ["True", "False", "Not Given"],
          expectedFocus: "Notice the difference between foot traffic and revenue.",
          descriptorFocus: "Reading: distinguishing stated information from unsupported claims.",
        },
        {
          id: "r3",
          type: "short-answer",
          title: "Sentence Completion",
          context:
            "Researchers warned that heat policies fail when they are treated as seasonal emergency measures rather than year-round planning responsibilities.",
          prompt: "Complete the sentence: Heat policies should be treated as year-round ______ responsibilities.",
          expectedFocus: "Use exact wording and grammar fit.",
          descriptorFocus: "Reading: detail accuracy and lexical fit.",
        },
      ],
    },
    {
      id: "reading-full-section",
      module: "reading",
      mode: "Full Reading Section",
      title: "Three-Passage Reading Simulator",
      subtitle: "Full-section pacing with Passage 1, Passage 2, and Passage 3 navigation.",
      durationMinutes: 60,
      questionCount: 40,
      questionTypes: ["Multiple Choice", "Matching Features", "Summary Completion", "Yes / No / Not Given"],
      difficultyBand: 7,
      examinerIntent: "Replicate the decision load of a computer-delivered reading section.",
      items: [
        {
          id: "rf1",
          type: "short-answer",
          title: "Passage 1 Detail",
          prompt: "Write the word that completes the note: The museum opened a digital archive to improve public ______.",
          context: "The archive was designed to make fragile documents accessible to people unable to visit the museum.",
          expectedFocus: "Choose a grammatically precise noun.",
          descriptorFocus: "Reading: scanning for concrete detail.",
        },
        {
          id: "rf2",
          type: "multiple-choice",
          title: "Passage 2 Inference",
          prompt: "What is the writer's attitude toward remote work experiments?",
          options: ["Cautiously optimistic", "Openly dismissive", "Completely neutral", "Strongly nostalgic"],
          expectedFocus: "Infer attitude from contrast markers.",
          descriptorFocus: "Reading: implied meaning and writer stance.",
        },
        {
          id: "rf3",
          type: "matching",
          title: "Passage 3 Matching Features",
          prompt: "Match the researcher with the claim about memory and sleep.",
          options: ["Dr. Hall - timing matters", "Professor Singh - diet matters", "Dr. Moreno - exercise matters"],
          expectedFocus: "Track names and claims accurately.",
          descriptorFocus: "Reading: locating specific information across dense text.",
        },
      ],
    },
  ],
  listening: [
    {
      id: "listening-map-labelling",
      module: "listening",
      mode: "Part 2",
      title: "Community Garden Orientation",
      subtitle: "Map labelling and distractor handling for everyday public information.",
      durationMinutes: 10,
      questionCount: 10,
      questionTypes: ["Map Labelling", "Multiple Choice", "Short Answer"],
      difficultyBand: 6.5,
      examinerIntent: "Train attention to correction phrases and spatial language.",
      items: [
        {
          id: "l1",
          type: "short-answer",
          title: "Map Label",
          context:
            "Audio script: 'Do not turn left at the tool shed as older maps suggest. Continue past it and the compost area is the second fenced space on your right.'",
          prompt: "Where is the compost area located?",
          expectedFocus: "Ignore the corrected route and capture the final location.",
          descriptorFocus: "Listening: following directions and corrections.",
        },
        {
          id: "l2",
          type: "multiple-choice",
          title: "Distractor Choice",
          context:
            "Audio script: 'Weekend workshops used to cost 12 pounds, but the council subsidy means visitors now pay 7 pounds.'",
          prompt: "How much do visitors now pay for weekend workshops?",
          options: ["7 pounds", "12 pounds", "19 pounds", "No fee"],
          expectedFocus: "Choose the updated information after the contrast signal.",
          descriptorFocus: "Listening: recognizing change of information.",
        },
        {
          id: "l3",
          type: "short-answer",
          title: "Form Completion",
          context:
            "Audio script: 'Please bring gloves, a water bottle, and proof of registration. Tools are provided on site.'",
          prompt: "Name one item visitors must bring.",
          expectedFocus: "Use a concrete noun phrase from the list.",
          descriptorFocus: "Listening: identifying required details.",
        },
      ],
    },
    {
      id: "listening-full-section",
      module: "listening",
      mode: "Full Listening Section",
      title: "Four-Part Listening Simulator",
      subtitle: "Part 1 form completion through Part 4 academic lecture practice.",
      durationMinutes: 30,
      questionCount: 40,
      questionTypes: ["Form Completion", "Map Labelling", "Matching", "Sentence Completion"],
      difficultyBand: 7,
      examinerIntent: "Build stamina across social and academic listening contexts.",
      items: [
        {
          id: "lf1",
          type: "short-answer",
          title: "Part 1 Form",
          prompt: "Write the missing membership number from the audio note.",
          context: "Audio script: 'The reference is M as in mother, 4, 2, and then double 8.'",
          expectedFocus: "Capture letters and numbers accurately.",
          descriptorFocus: "Listening: form completion accuracy.",
        },
        {
          id: "lf2",
          type: "matching",
          title: "Part 3 Speaker Matching",
          prompt: "Which student believes the research method was too narrow?",
          options: ["Maya", "Jon", "Elena"],
          expectedFocus: "Separate opinions from agreement phrases.",
          descriptorFocus: "Listening: speaker attitude and function.",
        },
        {
          id: "lf3",
          type: "short-answer",
          title: "Part 4 Lecture Completion",
          prompt: "Complete the note: Early battery designs were limited by material ______.",
          context: "Audio script: 'The key barrier was not demand but the scarcity of reliable materials.'",
          expectedFocus: "Convert phrasing into the expected noun.",
          descriptorFocus: "Listening: academic note completion.",
        },
      ],
    },
  ],
  writing: [
    {
      id: "writing-task-2-coherence",
      module: "writing",
      mode: "Task 2",
      title: "Technology and Independent Learning",
      subtitle: "Essay planning and paragraph progression for Band 7 coherence.",
      durationMinutes: 40,
      questionCount: 1,
      questionTypes: ["Opinion Essay", "Coherence and Cohesion", "Lexical Resource"],
      difficultyBand: 7,
      examinerIntent: "Check whether the student can sustain a position with developed examples and clear progression.",
      items: [
        {
          id: "w1",
          type: "essay",
          title: "Task 2 Essay",
          prompt:
            "Some people believe technology makes students too dependent on devices. Others think it helps learners become more independent. Discuss both views and give your own opinion.",
          expectedFocus: "Give both views, a clear opinion, and developed examples.",
          descriptorFocus: "Writing Task 2: task response, coherence, lexical resource, grammar range.",
        },
        {
          id: "w2",
          type: "short-answer",
          title: "Plan Before Writing",
          prompt: "Write a 3-point essay plan with one example you would use.",
          expectedFocus: "Plan progression before the full essay.",
          descriptorFocus: "Writing: paragraph organization and idea sequencing.",
        },
      ],
    },
    {
      id: "writing-full-section",
      module: "writing",
      mode: "Full Writing Section",
      title: "Academic Writing Simulator",
      subtitle: "Task 1 data report followed by Task 2 argument writing.",
      durationMinutes: 60,
      questionCount: 2,
      questionTypes: ["Task 1 Line Graph", "Task 2 Discussion Essay"],
      difficultyBand: 7,
      examinerIntent: "Measure Task 1 overview control and Task 2 position development in sequence.",
      items: [
        {
          id: "wf1",
          type: "essay",
          title: "Task 1 Report",
          prompt:
            "The line graph shows changes in public transport use in three cities from 2000 to 2025. Summarise the main features and make comparisons where relevant.",
          expectedFocus: "Include an overview, key trends, and selected data comparisons.",
          descriptorFocus: "Writing Task 1: achievement, coherence, lexical range, grammar accuracy.",
        },
        {
          id: "wf2",
          type: "essay",
          title: "Task 2 Essay",
          prompt:
            "Governments should spend more money on preventing environmental problems than on repairing damage after it occurs. To what extent do you agree or disagree?",
          expectedFocus: "State a position and develop it with relevant examples.",
          descriptorFocus: "Writing Task 2: response depth and argument control.",
        },
      ],
    },
  ],
  speaking: [
    {
      id: "speaking-fluency-part-2",
      module: "speaking",
      mode: "Part 2",
      title: "Describe a Place That Helps You Focus",
      subtitle: "Cue-card practice for fluency, lexical flexibility, and natural extension.",
      durationMinutes: 4,
      questionCount: 1,
      questionTypes: ["Part 2 Cue Card", "Fluency", "Pronunciation Awareness"],
      difficultyBand: 6.5,
      examinerIntent: "Encourage a two-minute answer with connected details rather than memorized phrases.",
      items: [
        {
          id: "s1",
          type: "speaking-cue",
          title: "Part 2 Cue Card",
          prompt:
            "Describe a place where you can concentrate well. You should say where it is, what you do there, why it helps you focus, and how you feel after spending time there.",
          expectedFocus: "Speak in connected story stages with reasons and examples.",
          descriptorFocus: "Speaking: fluency, lexical resource, grammar range, pronunciation clarity.",
        },
        {
          id: "s2",
          type: "short-answer",
          title: "Part 3 Follow-up",
          prompt: "Do you think workplaces should be designed differently for people who need quiet? Why?",
          expectedFocus: "Extend an abstract opinion with cause and consequence.",
          descriptorFocus: "Speaking Part 3: abstract discussion and justification.",
        },
      ],
    },
    {
      id: "speaking-full-section",
      module: "speaking",
      mode: "Full Speaking Section",
      title: "Complete Speaking Interview",
      subtitle: "Part 1 interview, Part 2 long turn, and Part 3 discussion.",
      durationMinutes: 14,
      questionCount: 12,
      questionTypes: ["Part 1", "Part 2 Cue Card", "Part 3 Discussion"],
      difficultyBand: 7,
      examinerIntent: "Check fluency consistency from familiar topics to abstract reasoning.",
      items: [
        {
          id: "sf1",
          type: "short-answer",
          title: "Part 1",
          prompt: "What kind of apps do you use most often, and why?",
          expectedFocus: "Answer directly and extend with one reason.",
          descriptorFocus: "Speaking Part 1: natural response and sentence control.",
        },
        {
          id: "sf2",
          type: "speaking-cue",
          title: "Part 2",
          prompt: "Describe a time when you learned something difficult.",
          expectedFocus: "Build a clear story with sequence markers.",
          descriptorFocus: "Speaking Part 2: long-turn fluency.",
        },
        {
          id: "sf3",
          type: "short-answer",
          title: "Part 3",
          prompt: "How should schools prepare students for skills that may change in the future?",
          expectedFocus: "Discuss an abstract issue with balanced reasoning.",
          descriptorFocus: "Speaking Part 3: depth, precision, and development.",
        },
      ],
    },
  ],
};

export const officialMockSections = [
  { id: "listening" as const, label: "Listening", minutes: 30, questions: 40, note: "4 parts, audio played once" },
  { id: "reading" as const, label: "Reading", minutes: 60, questions: 40, note: "3 passages, no transfer time" },
  { id: "writing" as const, label: "Writing", minutes: 60, questions: 2, note: "Task 1 and Task 2" },
  { id: "speaking" as const, label: "Speaking", minutes: 14, questions: 12, note: "Part 1, Part 2, Part 3" },
];

export function createDefaultLearningProfile(): StudentLearningProfile {
  return structuredClone(defaultProfile);
}

export function getPracticeBlueprints(module: Skill): PracticeSession[] {
  return structuredClone(practiceBlueprints[module]);
}

export function formatSkill(skill: Skill): string {
  return skillLabels[skill];
}

export function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function clampBand(value: number): number {
  return Math.max(4, Math.min(9, roundToHalf(value)));
}

export function calculateOverallBand(bands: BandMap): number {
  const average = (bands.reading + bands.listening + bands.writing + bands.speaking) / 4;
  return roundToHalf(average);
}

export function getAdaptiveRecommendation(profile: StudentLearningProfile): AdaptiveRecommendation {
  const [lowestSkill, lowestBand] = (Object.entries(profile.bands) as [Skill, number][]).sort(
    (a, b) => a[1] - b[1],
  )[0];
  const targetGap = Math.max(0, profile.targetBand - lowestBand);
  const firstWeakness = profile.weakQuestionTypes[0] ?? "Band descriptor consistency";
  const blueprint = practiceBlueprints[lowestSkill].find((session) =>
    session.questionTypes.some((type) => firstWeakness.toLowerCase().includes(type.toLowerCase().split(" ")[0])),
  ) ?? practiceBlueprints[lowestSkill][0];

  return {
    module: lowestSkill,
    mode: blueprint.mode,
    priority: targetGap >= 1 ? "Critical path" : "High value",
    reason: `${skillLabels[lowestSkill]} is ${targetGap.toFixed(1)} band from the target, and recent history shows ${firstWeakness.toLowerCase()} errors.`,
    targetWeakness: firstWeakness,
    expectedBandLift: targetGap >= 1 ? "+0.5 after 3 focused sessions" : "+0.25 after 2 focused sessions",
    difficultyBand: Math.min(8, Math.max(6, lowestBand + 0.5)),
  };
}

export function createPracticeSession(
  profile: StudentLearningProfile,
  module?: Skill,
  mode?: string,
  recommendation?: AdaptiveRecommendation,
): PracticeSession {
  const baseRecommendation = recommendation ?? getAdaptiveRecommendation(profile);
  const selectedModule = module ?? baseRecommendation.module;
  const blueprints = practiceBlueprints[selectedModule];
  const selected =
    blueprints.find((session) => session.mode === mode) ??
    blueprints.find((session) => session.mode === baseRecommendation.mode) ??
    blueprints[0];

  return structuredClone({
    ...selected,
    difficultyBand: Math.max(selected.difficultyBand, baseRecommendation.difficultyBand),
  });
}

function answerWordCount(answers: Record<string, string>): number {
  return Object.values(answers)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function answerCompletion(session: PracticeSession, answers: Record<string, string>): number {
  const answered = session.items.filter((item) => answers[item.id]?.trim()).length;
  return session.items.length === 0 ? 0 : answered / session.items.length;
}

function detectWeaknesses(session: PracticeSession, answers: Record<string, string>): string[] {
  const words = answerWordCount(answers);
  const completion = answerCompletion(session, answers);
  const weaknesses = new Set<string>();

  if (completion < 0.9) {
    weaknesses.add("Section completion under time pressure");
  }

  if (session.module === "reading") {
    weaknesses.add(session.questionTypes.includes("Matching Headings") ? "Matching Headings" : "Scanning accuracy");
    if (words < 18) weaknesses.add("Evidence selection");
  }

  if (session.module === "listening") {
    weaknesses.add(session.questionTypes.includes("Map Labelling") ? "Map Labelling" : "Distractor control");
    if (words < 12) weaknesses.add("Detail capture");
  }

  if (session.module === "writing") {
    weaknesses.add(words < 180 ? "Idea development" : "Coherence and cohesion");
    weaknesses.add("Band 7 grammar range");
  }

  if (session.module === "speaking") {
    weaknesses.add(words < 80 ? "Speaking Fluency" : "Pronunciation clarity");
    weaknesses.add("Part 3 extension");
  }

  return Array.from(weaknesses).slice(0, 4);
}

function detectStrengths(session: PracticeSession, answers: Record<string, string>): string[] {
  const words = answerWordCount(answers);
  const completion = answerCompletion(session, answers);
  const strengths = new Set<string>();

  if (completion >= 0.9) strengths.add("Completed the selected section before examiner review");
  if (words > 80) strengths.add("Responses show enough language for band-level diagnosis");
  if (session.module === "reading") strengths.add("Main-idea strategy is visible");
  if (session.module === "listening") strengths.add("Attention to corrected information is developing");
  if (session.module === "writing") strengths.add("Position and planning can be evaluated clearly");
  if (session.module === "speaking") strengths.add("Answers contain personal examples that support fluency");

  return Array.from(strengths).slice(0, 4);
}

function calculateSessionBand(
  profile: StudentLearningProfile,
  session: PracticeSession,
  answers: Record<string, string>,
): number {
  const baseBand = profile.bands[session.module];
  const words = answerWordCount(answers);
  const completion = answerCompletion(session, answers);
  const detailBonus = Math.min(0.5, words / (session.module === "writing" ? 380 : 160));
  const completionAdjustment = (completion - 0.75) * 1.2;
  const difficultyAdjustment = session.difficultyBand >= baseBand + 0.75 ? -0.15 : 0.1;

  return clampBand(baseBand + completionAdjustment + detailBonus + difficultyAdjustment);
}

export function buildPracticeUpdatedProfile(
  profile: StudentLearningProfile,
  session: PracticeSession,
  predictedBand: number,
  accuracy: number,
  weaknesses: string[],
  strengths: string[],
): StudentLearningProfile {
  const oldBand = profile.bands[session.module];
  const newSkillBand = clampBand(oldBand * 0.7 + predictedBand * 0.3);
  const nextBands = { ...profile.bands, [session.module]: newSkillBand } as BandMap;
  const nextOverall = calculateOverallBand(nextBands);
  const dateLabel = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date());
  const historyEntry: PracticeHistoryEntry = {
    id: `practice-${Date.now()}`,
    date: dateLabel,
    module: session.module,
    mode: session.mode,
    title: session.title,
    band: predictedBand,
    accuracy,
    weaknesses,
  };

  return {
    ...profile,
    bands: nextBands,
    currentBand: nextOverall,
    studyStreak: profile.studyStreak + 1,
    completedHours: Math.min(profile.weeklyGoalHours, profile.completedHours + session.durationMinutes / 60),
    weakQuestionTypes: Array.from(new Set([...weaknesses, ...profile.weakQuestionTypes])).slice(0, 7),
    strongSignals: Array.from(new Set([...strengths, ...profile.strongSignals])).slice(0, 6),
    practiceHistory: [historyEntry, ...profile.practiceHistory].slice(0, 8),
    progress: [
      ...profile.progress.slice(-5),
      {
        label: "Now",
        overall: nextOverall,
        reading: nextBands.reading,
        listening: nextBands.listening,
        writing: nextBands.writing,
        speaking: nextBands.speaking,
      },
    ],
  };
}

export function buildPracticeEvaluation(
  profile: StudentLearningProfile,
  session: PracticeSession,
  predictedBand: number,
  accuracy: number,
  weaknesses: string[],
  strengths: string[],
): EvaluationResult {
  const updatedProfile = buildPracticeUpdatedProfile(profile, session, predictedBand, accuracy, weaknesses, strengths);
  return {
    sessionId: session.id,
    module: session.module,
    predictedBand,
    accuracy,
    examinerSummary: `${skillLabels[session.module]} performance is currently around Band ${predictedBand}. The AI Brain updated the profile after reviewing the full selected section, not single questions.`,
    strengths,
    weaknesses,
    nextPlan: [
      `Repeat ${session.mode} with a narrower focus on ${weaknesses[0] ?? "accuracy"}.`,
      `Review one Band 7 descriptor and rewrite or resay the weakest response once.`,
      `Move to ${getAdaptiveRecommendation(updatedProfile).mode} when accuracy stays above 75%.`,
    ],
    bandDescriptorNotes: [
      `${skillLabels[session.module]} score was predicted from completion, answer depth, and current learning memory.`,
      `Target gap is ${(profile.targetBand - predictedBand).toFixed(1)} band points for this module.`,
      `Next recommendation is recalculated from the updated weakness map.`,
    ],
  };
}

export function evaluatePracticeSession(
  profile: StudentLearningProfile,
  session: PracticeSession,
  answers: Record<string, string>,
): { evaluation: EvaluationResult; updatedProfile: StudentLearningProfile } {
  const predictedBand = calculateSessionBand(profile, session, answers);
  const accuracy = Math.round(Math.max(35, Math.min(96, answerCompletion(session, answers) * 70 + predictedBand * 4)));
  const weaknesses = detectWeaknesses(session, answers);
  const strengths = detectStrengths(session, answers);
  const updatedProfile = buildPracticeUpdatedProfile(profile, session, predictedBand, accuracy, weaknesses, strengths);
  const evaluation = buildPracticeEvaluation(profile, session, predictedBand, accuracy, weaknesses, strengths);

  return { evaluation, updatedProfile };
}

export function buildMockResult(bands: BandMap): MockExamResult {
  const overallBand = calculateOverallBand(bands);
  return {
    id: `mock-${Date.now()}`,
    listeningBand: bands.listening,
    readingBand: bands.reading,
    writingBand: bands.writing,
    speakingBand: bands.speaking,
    overallBand,
    sectionFeedback: {
      listening: "Good general comprehension; still needs faster recovery when options are corrected mid-audio.",
      reading: "Main ideas are stable, but heading and inference items need stronger evidence checking.",
      writing: "Task response is clear; progression and complex grammar limit Band 7 consistency.",
      speaking: "Personal examples support fluency; Part 3 answers need more abstract development.",
    },
    improvementPlan: [
      "Spend two sessions on the lowest band skill before another full mock.",
      "Review all wrong or uncertain items by question type, not by topic only.",
      "Use a 3-minute planning routine for Writing Task 2 to improve progression.",
      "Record one Part 3 answer daily and extend each answer with cause, example, and result.",
    ],
  };
}

export function buildMockUpdatedProfile(
  profile: StudentLearningProfile,
  bands: BandMap,
  result: MockExamResult,
): StudentLearningProfile {
  const overallBand = calculateOverallBand(bands);
  const dateLabel = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date());
  return {
    ...profile,
    bands,
    currentBand: overallBand,
    mockHistory: [
      {
        id: result.id,
        date: dateLabel,
        overallBand,
        listeningBand: bands.listening,
        readingBand: bands.reading,
        writingBand: bands.writing,
        speakingBand: bands.speaking,
        summary: "Computer-delivered mock completed with AI examiner report.",
      },
      ...profile.mockHistory,
    ].slice(0, 5),
    weakQuestionTypes: Array.from(
      new Set(["Matching Headings", "Task 2 Coherence", "Part 3 Extension", ...profile.weakQuestionTypes]),
    ).slice(0, 7),
    progress: [
      ...profile.progress.slice(-5),
      {
        label: "Mock",
        overall: overallBand,
        reading: bands.reading,
        listening: bands.listening,
        writing: bands.writing,
        speaking: bands.speaking,
      },
    ],
  };
}

export function evaluateMockExam(
  profile: StudentLearningProfile,
  answers: Record<string, string>,
): { result: MockExamResult; updatedProfile: StudentLearningProfile } {
  const answerVolume = answerWordCount(answers);
  const answeredItems = Object.values(answers).filter((answer) => answer.trim()).length;
  const staminaAdjustment = answeredItems > 25 ? 0.25 : answeredItems > 10 ? 0 : -0.5;
  const writingAdjustment = answerVolume > 420 ? 0.25 : answerVolume > 180 ? 0 : -0.5;
  const speakingAdjustment = Object.keys(answers).some((key) => key.startsWith("speaking")) ? 0.25 : -0.25;

  const listeningBand = clampBand(profile.bands.listening + staminaAdjustment);
  const readingBand = clampBand(profile.bands.reading + staminaAdjustment);
  const writingBand = clampBand(profile.bands.writing + writingAdjustment);
  const speakingBand = clampBand(profile.bands.speaking + speakingAdjustment);
  const bands: BandMap = {
    listening: listeningBand,
    reading: readingBand,
    writing: writingBand,
    speaking: speakingBand,
  };
  const result = buildMockResult(bands);
  const updatedProfile = buildMockUpdatedProfile(profile, bands, result);

  return { result, updatedProfile };
}

export function getBandGap(profile: StudentLearningProfile): number {
  return Math.max(0, profile.targetBand - profile.currentBand);
}

export const diagnosticQuestions: PracticeItem[] = [
  {
    id: "dg1",
    type: "multiple-choice",
    title: "Grammar Check 1",
    prompt: "Choose the correct sentence.",
    options: [
      "She has been working here since three years.",
      "She has been working here for three years.",
      "She is working here since three years.",
      "She worked here for since three years.",
    ],
    expectedFocus: "Correct preposition of time with present perfect continuous.",
    descriptorFocus: "Grammatical Range and Accuracy.",
  },
  {
    id: "dg2",
    type: "multiple-choice",
    title: "Grammar Check 2",
    prompt: "Choose the correct sentence.",
    options: [
      "If I will have time, I will visit the museum.",
      "If I had time, I would have visited the museum yesterday.",
      "If I would have time, I visit the museum.",
      "If I have time, I would visiting the museum.",
    ],
    expectedFocus: "Correct third conditional structure.",
    descriptorFocus: "Grammatical Range and Accuracy.",
  },
  {
    id: "dg3",
    type: "multiple-choice",
    title: "Vocabulary Range",
    prompt: "Choose the word closest in meaning to 'substantial'.",
    options: ["Minor", "Considerable", "Temporary", "Immediate"],
    expectedFocus: "Recognize academic synonyms.",
    descriptorFocus: "Lexical Resource.",
  },
  {
    id: "dg4",
    type: "short-answer",
    title: "Reading Passage",
    context:
      "Solar power has grown rapidly, yet its expansion depends on cheap storage. Researchers argue that without better batteries, renewable targets remain unrealistic despite falling panel prices.",
    prompt: "What do researchers say renewable targets depend on? (write your own answer in 1-2 sentences)",
    expectedFocus: "Identify the controlling condition, not the repeated word.",
    descriptorFocus: "Reading: main ideas and implied conditions.",
  },
  {
    id: "dg5",
    type: "short-answer",
    title: "Listening Form",
    context:
      "Audio script: 'Good morning, booking desk. The train to Leeds leaves at 6:15, not 6:30 as the old timetable says. Please be at platform four ten minutes early.'",
    prompt: "What time does the train to Leeds leave?",
    expectedFocus: "Capture the corrected detail after the contrast signal.",
    descriptorFocus: "Listening: detail recognition and corrections.",
  },
  {
    id: "dg6",
    type: "essay",
    title: "Writing Task 2",
    prompt:
      "Some people think that children should begin formal education as early as possible, while others believe they should spend more time playing. Discuss both views and give your own opinion. Write as much as you can.",
    expectedFocus: "Show a clear position, developed ideas, and coherent paragraphs.",
    descriptorFocus: "Writing: task response, coherence, lexical resource, grammar.",
  },
  {
    id: "dg7",
    type: "speaking-cue",
    title: "Speaking Part 2",
    prompt:
      "Describe a skill you learned recently. You should say what it was, how you learned it, why you wanted to learn it, and how you feel about it now.",
    expectedFocus: "Give a connected two-minute answer with reasons and an example.",
    descriptorFocus: "Speaking: fluency, lexical resource, grammar, pronunciation.",
  },
  {
    id: "dg8",
    type: "short-answer",
    title: "Speaking Part 3",
    prompt: "Should schools teach practical skills or academic knowledge? Give reasons for your answer.",
    expectedFocus: "Extend an abstract opinion with cause and consequence.",
    descriptorFocus: "Speaking Part 3: abstract discussion and justification.",
  },
];

export interface DiagnosticEstimate {
  bands: BandMap;
  grammarLevel: string;
  vocabularyLevel: string;
  weakQuestionTypes: string[];
  weakTopics: string[];
  strongSignals: string[];
}

export function createDiagnosticProfile(name: string, diagnostic: DiagnosticEstimate): StudentLearningProfile {
  const overall = calculateOverallBand(diagnostic.bands);
  return {
    id: `student-${Date.now()}`,
    name: name.trim() || "IELTS Student",
    currentBand: overall,
    targetBand: 7.5,
    studyStreak: 1,
    weeklyGoalHours: 8,
    completedHours: 0,
    grammarLevel: diagnostic.grammarLevel,
    vocabularyLevel: diagnostic.vocabularyLevel,
    confidenceLevel: 50,
    bands: diagnostic.bands,
    weakQuestionTypes: diagnostic.weakQuestionTypes.slice(0, 7),
    weakTopics: diagnostic.weakTopics.slice(0, 4),
    strongSignals: diagnostic.strongSignals.slice(0, 6),
    practiceHistory: [],
    mockHistory: [],
    progress: [
      {
        label: "Start",
        overall,
        reading: diagnostic.bands.reading,
        listening: diagnostic.bands.listening,
        writing: diagnostic.bands.writing,
        speaking: diagnostic.bands.speaking,
      },
    ],
  };
}

export function estimateDiagnosticFromAnswers(answers: Record<string, string>): DiagnosticEstimate {
  const wordCount = (value?: string) => (value ?? "").trim().split(/\s+/).filter(Boolean).length;
  const has = (id: string) => Boolean(answers[id]?.trim());
  const reading = clampBand(5.5 + (has("dg4") ? 0.5 : 0) + (wordCount(answers["dg4"]) >= 15 ? 0.5 : 0));
  const listening = clampBand(5.5 + (has("dg5") ? 0.5 : 0) + (wordCount(answers["dg5"]) >= 5 ? 0.5 : 0));
  const writing = clampBand(5.5 + (wordCount(answers["dg6"]) >= 80 ? 0.5 : 0) + (wordCount(answers["dg6"]) >= 40 ? 0 : -0.5));
  const speaking = clampBand(5.5 + (wordCount(answers["dg7"]) >= 40 ? 0.5 : 0) + (wordCount(answers["dg8"]) >= 20 ? 0.5 : 0));

  return {
    bands: { listening, reading, writing, speaking },
    grammarLevel: "B1+ - basic structures with frequent errors in complex sentences",
    vocabularyLevel: "B1+ - everyday range, limited academic precision",
    weakQuestionTypes: ["Sentence Completion", "Multiple Choice", "Task 2 Coherence", "Speaking Fluency"],
    weakTopics: ["Education policy", "Urban development", "Environment and energy", "Workplace communication"],
    strongSignals: ["Completed the full diagnostic", "Willing to write full answers"],
  };
}
