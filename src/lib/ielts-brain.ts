import { computeTimingMetrics, formatClock, OFFICIAL_SECTION_MINUTES, type PerformanceMetric, type TimingDetail } from "@/lib/timing";

export type Skill = "reading" | "listening" | "writing" | "speaking";

export type PracticeItemType =
  | "multiple-choice"
  | "short-answer"
  | "matching"
  | "essay"
  | "speaking-cue";

export type BandMap = Record<Skill, number>;

export interface ChartSpec {
  type?: string;
  title?: string;
  unit?: string;
  categories?: string[];
  values?: number[];
}

export interface PracticeItem {
  id: string;
  type: PracticeItemType;
  title: string;
  prompt: string;
  context?: string;
  options?: string[];
  expectedFocus: string;
  descriptorFocus: string;
  correctAnswer?: string;
  explanation?: string;
  logic?: string;
  tip?: string;
  suggestions?: string;
  bandAdvice?: string;
  chart?: ChartSpec;
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
  source?: "ai" | "offline";
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
  testType: "academic" | "general";
  diagnosticCompleted: boolean;
  studyStreak: number;
  weeklyGoalHours: number;
  completedHours: number;
  grammarLevel: string;
  vocabularyLevel: string;
  confidenceLevel: number;
  fluency: number;
  coherence: number;
  bands: BandMap;
  weakQuestionTypes: string[];
  weakTopics: string[];
  strongSignals: string[];
  practiceHistory: PracticeHistoryEntry[];
  mockHistory: MockHistoryEntry[];
  progress: ProgressPoint[];
  vocabMastered: string[];
  vocabQuizzesTaken: number;
  vocabQuizBest: number;
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
  textAnalysis?: TextAnalysis;
  perItemFeedback?: ItemFeedback[];
  speed?: PerformanceMetric;
  timeManagement?: PerformanceMetric;
  timing?: TimingDetail;
}

export interface ItemFeedback {
  id: string;
  type: string;
  isCorrect: boolean;
  score: number;
  feedback: {
    verdict: string;
    idealAnswer: string;
    sampleHighBandAnswer?: string;
    criteria?: { criterion: string; band: number; comment: string }[];
    explanation: string;
    logic: string;
    tip: string;
    suggestions: string;
    bandAdvice: string;
    estimatedBand: number | null;
    textAnalysis?: TextAnalysis | null;
    fillerAdvice?: string;
  };
}

export interface ReadingBlueprint {
  title: string;
  tagline: string;
  structure: { name: string; detail: string; topic: string }[];
  scoring: { correct: string; band: string }[];
  questionTypes: { name: string; strategy: string; time: string; mistakes: string }[];
  timeManagement: string[];
  commonMistakes: string[];
  bandTips: Record<string, string>;
  tipsToImprove: string[];
  grammarVocab: string;
}

export const readingQuestionTypes = [
  "Multiple Choice",
  "Matching Headings",
  "Matching Features",
  "Matching Sentence Endings",
  "True / False / Not Given",
  "Yes / No / Not Given",
  "Summary Completion",
  "Sentence Completion",
  "Short Answer",
  "Table / Flow Chart Completion",
] as const;

export const listeningQuestionTypes = [
  "Multiple Choice",
  "Map Labelling",
  "Form / Note Completion",
  "Sentence Completion",
  "Matching",
] as const;

export type ListeningQuestionType = (typeof listeningQuestionTypes)[number];

export const writingQuestionTypes = [
  "Task 1 Report (Data)",
  "Task 1 Process / Map",
  "Task 2 Opinion",
  "Task 2 Discussion",
  "Task 2 Advantages / Disadvantages",
  "Task 2 Problem / Solution",
  "Task 2 Double Question",
] as const;

export type WritingQuestionType = (typeof writingQuestionTypes)[number];

export const speakingQuestionTypes = [
  "Part 1 Interview (personal questions)",
  "Part 2 Cue Card (long turn)",
  "Part 3 Discussion (abstract questions)",
] as const;

export type SpeakingQuestionType = (typeof speakingQuestionTypes)[number];

const QUESTION_TYPES_BY_SKILL: Partial<Record<Skill, readonly string[]>> = {
  reading: readingQuestionTypes,
  listening: listeningQuestionTypes,
  writing: writingQuestionTypes,
  speaking: speakingQuestionTypes,
};

export function isQuestionTypeMode(module: Skill, mode: string | undefined): boolean {
  return Boolean(mode && QUESTION_TYPES_BY_SKILL[module]?.some((type) => type === mode));
}

export interface TextAnalysis {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceWords: number;
  uniqueWordRatio: number;
  longSentenceCount: number;
  insights: string[];
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
  strengths: string[];
  weaknesses: string[];
  accuracy?: number;
  speed?: PerformanceMetric;
  timeManagement?: PerformanceMetric;
  timing?: Record<string, TimingDetail>;
}

const skillLabels: Record<Skill, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

const defaultProfile: StudentLearningProfile = {
  id: "student-demo-001",
  name: "Amina Rahman",
  currentBand: 6.25,
  targetBand: 7.5,
  testType: "academic",
  diagnosticCompleted: true,
  studyStreak: 9,
  weeklyGoalHours: 8,
  completedHours: 5.5,
  grammarLevel: "B2 - accurate basics with complex sentence control gaps",
  vocabularyLevel: "B2+ - strong academic range, needs collocation precision",
  confidenceLevel: 72,
  fluency: 64,
  coherence: 58,
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
  vocabMastered: [],
  vocabQuizzesTaken: 0,
  vocabQuizBest: 0,
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
          correctAnswer: "Why connected shade networks matter",
          explanation: "The paragraph argues that the strongest results come from connecting green routes, not from planting isolated trees.",
          logic: "1. Read the concluding clause: 'rather than planting isolated trees'. 2. The controlling idea is connected shade networks. 3. Reject 'A single solution' — the text says results appear when routes are CONNECTED.",
          tip: "Match the paragraph's conclusion, not its most repeated word.",
          suggestions: "On heading items, read the last sentence first — it usually carries the main idea.",
          bandAdvice: "Heading selection is the core Band 6.5-7 reading skill and feeds Multiple Choice 'purpose' items.",
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
          correctAnswer: "Not Given",
          explanation: "The trial measured foot traffic; researchers 'did not claim that retail sales improved', so shop revenue is never mentioned.",
          logic: "1. Claim keywords: shop revenue. 2. Text: foot traffic increased, revenue 'not claimed'. 3. Not measured = not stated -> Not Given (NOT False — nothing contradicts it).",
          tip: "'Did not claim' is a Not Given signal, not a contradiction.",
          suggestions: "Never answer from real-world knowledge; the text is the only evidence.",
          bandAdvice: "Not Given vs False discrimination is worth a full band at 6.5 — it is the most common trap in Reading.",
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
          correctAnswer: "planning",
          explanation: "The text contrasts 'seasonal emergency measures' with 'year-round planning responsibilities' — the gap mirrors that contrast.",
          logic: "1. Spot the contrast pair: 'rather than'. 2. The gap needs the positive side. 3. Copy the text's word: planning.",
          tip: "'Rather than' pairs two opposites; the gap usually needs the side the sentence argues for.",
          suggestions: "Underline contrast pairs while skimming; completion items often draw answers from them.",
          bandAdvice: "Contrast-driven completions are common at Band 7 — reading the pair structure answers them in seconds.",
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
          correctAnswer: "access",
          explanation: "The archive made fragile documents 'accessible to people unable to visit' — the improvement is public access.",
          logic: "1. The gap needs a noun after 'public'. 2. The text says documents became 'accessible'. 3. Convert the adjective to the noun: access.",
          tip: "Complete the sentence grammatically: after 'public' you need a noun, not the text's adjective.",
          suggestions: "Say the missing word type (noun/verb/adjective) before scanning — it halves search time.",
          bandAdvice: "Grammar-fit plus exact copying is the whole test of sentence completion.",
        },
        {
          id: "rf2",
          type: "multiple-choice",
          title: "Passage 2 Inference",
          prompt: "What is the writer's attitude toward remote work experiments?",
          options: ["Cautiously optimistic", "Openly dismissive", "Completely neutral", "Strongly nostalgic"],
          expectedFocus: "Infer attitude from contrast markers.",
          descriptorFocus: "Reading: implied meaning and writer stance.",
          correctAnswer: "Cautiously optimistic",
          explanation: "Inference items reward balanced reading: the writer weighs benefits against limits, which supports cautious optimism rather than dismissal or neutrality.",
          logic: "1. Attitude questions need evidence words: but, however, although. 2. A writer who names both promise and limits is cautiously optimistic. 3. 'Dismissive' and 'nostalgic' are unsupported extremes.",
          tip: "Attitude is rarely stated directly — collect the writer's contrast markers before choosing.",
          suggestions: "Practise naming attitudes from markers alone (however=balanced, clearly=confident, sadly=negative).",
          bandAdvice: "Stance inference is the Passage 2-3 skill that pushes reading toward Band 7.",
        },
        {
          id: "rf3",
          type: "matching",
          title: "Passage 3 Matching Features",
          prompt: "Match the researcher with the claim about memory and sleep.",
          options: ["Dr. Hall - timing matters", "Professor Singh - diet matters", "Dr. Moreno - exercise matters"],
          expectedFocus: "Track names and claims accurately.",
          descriptorFocus: "Reading: locating specific information across dense text.",
          correctAnswer: "Dr. Hall - timing matters",
          explanation: "Memory and sleep studies centre on the timing of sleep relative to learning, so the timing claim belongs to Dr. Hall; diet and exercise are distractors.",
          logic: "1. The question links memory with sleep. 2. Timing is the sleep-memory variable; diet and exercise are other topics. 3. Match by the strongest semantic link.",
          tip: "In matching features, reject options whose topic is not in the question's key words.",
          suggestions: "When a passage lists researchers, note one claim per name before answering.",
          bandAdvice: "Feature matching at Band 7.5+ tests your ability to track several referents across dense prose.",
        },
      ],
    },
    {
      id: "reading-passage-1",
      module: "reading",
      mode: "Passage 1",
      title: "The History of the Postage Stamp",
      subtitle: "Accessible passage focused on factual scanning and True / False / Not Given control.",
      durationMinutes: 20,
      questionCount: 13,
      questionTypes: ["True / False / Not Given", "Sentence Completion", "Short Answer"],
      difficultyBand: 6,
      examinerIntent: "Build scanning routines on an approachable topic before attempting harder passages.",
      items: [
        {
          id: "rp1",
          type: "multiple-choice",
          title: "True / False / Not Given",
          context: "The first adhesive stamp, the Penny Black, appeared in Britain in 1840. Its name came from its one-penny price and black ink, not from the portrait printed on it.",
          prompt: "The Penny Black was named after its colour and its price.",
          options: ["True", "False", "Not Given"],
          expectedFocus: "Check the reason given in the text before answering.",
          descriptorFocus: "Reading: verifying stated reasons.",
          correctAnswer: "True",
          explanation: "The name came from its 'one-penny price and black ink' — exactly colour and price.",
          logic: "1. Claim: name from colour + price. 2. Text: 'one-penny price and black ink'. 3. Same meaning, different words -> True.",
          tip: "Check the REASON the text gives before answering — the portrait detail is a distractor.",
          suggestions: "For 'why named' claims, verify both parts of the reason against the text.",
          bandAdvice: "Reason-verification is the Band 6 requirement for True answers; skip it and the distractor wins.",
        },
        {
          id: "rp2",
          type: "short-answer",
          title: "Sentence Completion",
          context: "Early collectors often soaked stamps off letters, which damaged the paper underneath, so postal services began printing stamps with perforated edges.",
          prompt: "Complete the sentence: Postal services printed perforated edges because collectors were ______.",
          expectedFocus: "Paraphrase the cause using an accurate word form.",
          descriptorFocus: "Reading: causal detail and grammar fit.",
          correctAnswer: "damaging the paper",
          explanation: "Collectors' soaking 'damaged the paper underneath', and 'so' marks the consequence: perforation.",
          logic: "1. The gap is the CAUSE. 2. 'So' links cause to consequence. 3. Copy the cause in the text's words: damaging the paper.",
          tip: "After 'because' the answer is always in the cause clause, usually before 'so'.",
          suggestions: "Circle cause markers (so, because, therefore) while skimming; they anchor the answer sentence.",
          bandAdvice: "Causal reading is the grammar skill behind completion tasks and sentence endings at Band 7.",
        },
      ],
    },
    {
      id: "reading-passage-3",
      module: "reading",
      mode: "Passage 3",
      title: "The Archaeology of Noise",
      subtitle: "Dense academic text testing matching features, summary completion, and writer stance.",
      durationMinutes: 20,
      questionCount: 14,
      questionTypes: ["Matching Features", "Summary Completion", "Yes / No / Not Given"],
      difficultyBand: 7.5,
      examinerIntent: "Push stamina and inference on an abstract academic register.",
      items: [
        {
          id: "rp3",
          type: "matching",
          title: "Matching Features",
          context:
            "Dr. Vasquez argues that soundscapes shape memory. Professor Ito links ancient acoustic design to religious practice. Dr. Alder treats noise as a marker of social status.",
          prompt: "Which researcher connects sound design to worship?",
          options: ["Dr. Vasquez", "Professor Ito", "Dr. Alder"],
          expectedFocus: "Track names and claims precisely across dense prose.",
          descriptorFocus: "Reading: locating specific information.",
          correctAnswer: "Professor Ito",
          explanation: "Professor Ito 'links ancient acoustic design to religious practice' — worship is religious practice.",
          logic: "1. Key word: worship. 2. Paraphrase: religious practice. 3. Only Ito's sentence contains it.",
          tip: "Features are paraphrased (worship = religious practice) — scan for meaning, not the exact word.",
          suggestions: "Note two words per researcher as you read (Vasquez-memory, Ito-ritual, Alder-class).",
          bandAdvice: "Referent tracking across dense prose is the Passage 3 skill separating Band 6.5 from 7.5.",
        },
        {
          id: "rp4",
          type: "short-answer",
          title: "Summary Completion",
          context:
            "Excavations show that many ceremonial buildings were positioned to amplify the human voice. The authors suggest this was not coincidence but deliberate architectural choice.",
          prompt: "Complete the summary: The alignment of ceremonial buildings suggests deliberate ______.",
          expectedFocus: "Use a noun that fits the summary grammar.",
          descriptorFocus: "Reading: paraphrase and lexical fit.",
          correctAnswer: "architectural choice",
          explanation: "The authors conclude the alignment was 'deliberate architectural choice' — a direct two-word copy.",
          logic: "1. The summary restates the conclusion. 2. Find 'deliberate' in the text. 3. Copy the noun phrase: architectural choice.",
          tip: "When the summary compresses a conclusion, the answer is usually its key noun phrase.",
          suggestions: "Practise compressing a sentence to its core noun phrase in two words — exactly what this task asks.",
          bandAdvice: "Compression is the mechanism behind many Passage 3 completions; verbatim copies become rarer at high bands.",
        },
      ],
    },
    {
      id: "reading-question-type",
      module: "reading",
      mode: "Individual Question Types",
      title: "Matching Headings Focus",
      subtitle: "Short targeted sets on one question type at a time.",
      durationMinutes: 12,
      questionCount: 6,
      questionTypes: ["Matching Headings", "Matching Features"],
      difficultyBand: 6.5,
      examinerIntent: "Train one skill in isolation so the weakness map becomes more precise.",
      items: [
        {
          id: "rq1",
          type: "matching",
          title: "Matching Headings",
          context:
            "Paragraph A: Cities are planting more trees, but the greatest cooling gains come from connected corridors rather than isolated planting. Paragraph B: Maintenance budgets often decide whether green corridors survive their first decade.",
          prompt: "Choose a heading for Paragraph B.",
          options: [
            "Why green projects fail",
            "The cost of maintaining shade",
            "How trees lower temperature",
          ],
          expectedFocus: "Identify the controlling idea, not a repeated keyword.",
          descriptorFocus: "Reading: heading selection from controlling idea.",
          correctAnswer: "The cost of maintaining shade",
          explanation: "Paragraph B is about maintenance budgets deciding survival — the cost of maintaining shade.",
          logic: "1. Read Paragraph B's first sentence. 2. Its subject is maintenance budgets. 3. The heading naming maintenance/cost matches; 'Why projects fail' is a detail-led distractor.",
          tip: "The heading must fit the whole paragraph — match on the subject noun, not one example.",
          suggestions: "Write the subject noun of each paragraph in the margin before scanning headings.",
          bandAdvice: "Subject-noun matching is the fastest reliable technique for headings at every band.",
        },
      ],
    },
    {
      id: "reading-quick",
      module: "reading",
      mode: "Quick Practice",
      title: "Five-Minute Reading Boost",
      subtitle: "A short scanning warm-up before the main session.",
      durationMinutes: 5,
      questionCount: 3,
      questionTypes: ["Short Answer", "True / False / Not Given"],
      difficultyBand: 6,
      examinerIntent: "Keep scanning sharp on days with little time.",
      items: [
        {
          id: "rq2",
          type: "short-answer",
          title: "Quick Scan",
          context: "The new metro line cut average journey times by twelve minutes and reduced car traffic in the centre by eight percent.",
          prompt: "By how many minutes were journey times reduced?",
          expectedFocus: "Extract the number without paraphrasing.",
          descriptorFocus: "Reading: quick number scanning.",
          correctAnswer: "twelve",
          explanation: "The metro line 'cut average journey times by twelve minutes'.",
          logic: "1. Question word: how many minutes. 2. Scan for 'minutes' and the verb 'cut'. 3. Copy the number: twelve.",
          tip: "Copy the number exactly as written — do not paraphrase.",
          suggestions: "In short answer tasks, search the number word first (minutes, percent, pounds).",
          bandAdvice: "Short answer is the fastest task when scanned correctly — 40 seconds per question keeps you on pace.",
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
    {
      id: "listening-part-1",
      module: "listening",
      mode: "Part 1",
      title: "Hotel Reservation Form",
      subtitle: "Form completion with names, dates, and numbers.",
      durationMinutes: 10,
      questionCount: 10,
      questionTypes: ["Form Completion", "Short Answer"],
      difficultyBand: 6,
      examinerIntent: "Drill names, spellings, and figure capture in a social context.",
      items: [
        {
          id: "lp1",
          type: "short-answer",
          title: "Form Completion",
          context: "Audio script: 'Could you spell your surname? It is H-A-R-B-I-N-G-E-R, Harbinger.'",
          prompt: "Write the guest's surname.",
          expectedFocus: "Capture the spelling exactly.",
          descriptorFocus: "Listening: name spelling.",
        },
        {
          id: "lp2",
          type: "short-answer",
          title: "Form Completion",
          context: "Audio script: 'The special rate is 98 dollars per night, but for three nights it is only 89 dollars each.'",
          prompt: "What is the three-night rate per night?",
          expectedFocus: "Apply the discount, not the standard rate.",
          descriptorFocus: "Listening: figure correction and discount.",
        },
      ],
    },
    {
      id: "listening-part-3",
      module: "listening",
      mode: "Part 3",
      title: "Student Project Discussion",
      subtitle: "Multi-speaker discussion with attitude and matching questions.",
      durationMinutes: 10,
      questionCount: 10,
      questionTypes: ["Multiple Choice", "Matching", "Short Answer"],
      difficultyBand: 7,
      examinerIntent: "Separate speakers' opinions from agreement phrases.",
      items: [
        {
          id: "lp3",
          type: "multiple-choice",
          title: "Attitude Choice",
          context:
            "Audio script: 'Sam: The survey gives us real data. Maya: I agree it is useful, but the sample is too small to be conclusive.'",
          prompt: "What is Maya's attitude to the survey?",
          options: ["Fully supportive", "Sceptical about size", "Completely dismissive"],
          expectedFocus: "Hear the concession after the agreement phrase.",
          descriptorFocus: "Listening: distinguishing agreement from doubt.",
        },
        {
          id: "lp4",
          type: "matching",
          title: "Speaker Matching",
          context:
            "Audio script: 'Elena will handle the interviews. Tom will analyse the data. Sam is presenting next week.'",
          prompt: "Who will analyse the data?",
          options: ["Elena", "Tom", "Sam"],
          expectedFocus: "Attribute tasks to speakers accurately.",
          descriptorFocus: "Listening: role and task matching.",
        },
      ],
    },
    {
      id: "listening-part-4",
      module: "listening",
      mode: "Part 4",
      title: "Ocean Currents Lecture",
      subtitle: "Academic lecture completion with dense note-taking.",
      durationMinutes: 10,
      questionCount: 10,
      questionTypes: ["Sentence Completion", "Short Answer"],
      difficultyBand: 7.5,
      examinerIntent: "Build note-taking stamina on academic monologue.",
      items: [
        {
          id: "lp5",
          type: "short-answer",
          title: "Lecture Completion",
          context: "Audio script: 'Surface currents transfer warm water toward the poles, while deep currents move cold water back toward the equator.'",
          prompt: "Complete the note: Deep currents return ______ water toward the equator.",
          expectedFocus: "Capture the adjective in sequence.",
          descriptorFocus: "Listening: academic note completion.",
        },
      ],
    },
    {
      id: "listening-question-type",
      module: "listening",
      mode: "Individual Question Types",
      title: "Map Labelling Focus",
      subtitle: "Targeted map labelling and spatial language sets.",
      durationMinutes: 12,
      questionCount: 6,
      questionTypes: ["Map Labelling", "Multiple Choice"],
      difficultyBand: 6.5,
      examinerIntent: "Isolate spatial language and correction phrases.",
      items: [
        {
          id: "lq1",
          type: "short-answer",
          title: "Map Label",
          context: "Audio script: 'The entrance faces the fountain. The ticket booth is directly opposite the entrance, on the far side of the square.'",
          prompt: "Where is the ticket booth?",
          expectedFocus: "Use spatial language (opposite, far side).",
          descriptorFocus: "Listening: spatial relationships.",
        },
      ],
    },
    {
      id: "listening-quick",
      module: "listening",
      mode: "Quick Practice",
      title: "Three-Minute Listening Warm-up",
      subtitle: "A quick detail-capture exercise for short windows.",
      durationMinutes: 5,
      questionCount: 3,
      questionTypes: ["Short Answer", "Form Completion"],
      difficultyBand: 6,
      examinerIntent: "Maintain daily listening contact with minimal time.",
      items: [
        {
          id: "lq2",
          type: "short-answer",
          title: "Quick Form",
          context: "Audio script: 'Delivery is free on orders over 25 pounds. Otherwise the charge is 4 pounds.'",
          prompt: "What is the minimum order for free delivery?",
          expectedFocus: "Capture the threshold number.",
          descriptorFocus: "Listening: number and condition capture.",
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
    {
      id: "writing-task-1",
      module: "writing",
      mode: "Task 1",
      title: "Bar Chart Report",
      subtitle: "Data description with overview and comparison.",
      durationMinutes: 20,
      questionCount: 1,
      questionTypes: ["Task 1 Bar Chart", "Overview", "Comparison"],
      difficultyBand: 6.5,
      examinerIntent: "Train overview-first data reporting with selected comparisons.",
      items: [
        {
          id: "wt1",
          type: "essay",
          title: "Task 1 Report",
          prompt:
            "The bar chart shows the percentage of electricity generated from renewable sources in four countries between 2005 and 2025. Summarise the main features and make comparisons where relevant.",
          expectedFocus: "Give an overview, report key trends, and compare countries.",
          descriptorFocus: "Writing Task 1: achievement, overview, selection of data.",
        },
      ],
    },
    {
      id: "writing-essay-types",
      module: "writing",
      mode: "Essay Types",
      title: "Opinion vs Discussion Essays",
      subtitle: "Short practice separating opinion and discussion structures.",
      durationMinutes: 25,
      questionCount: 1,
      questionTypes: ["Opinion Essay", "Discussion Essay", "Problem / Solution"],
      difficultyBand: 7,
      examinerIntent: "Test whether the student can match essay structure to the task prompt.",
      items: [
        {
          id: "we1",
          type: "essay",
          title: "Discussion Essay",
          prompt:
            "Some people argue that universities should focus on vocational skills. Others believe academic knowledge is more valuable. Discuss both views and give your own opinion.",
          expectedFocus: "Cover both views equally before stating your opinion.",
          descriptorFocus: "Writing Task 2: balanced discussion structure.",
        },
      ],
    },
    {
      id: "writing-quick",
      module: "writing",
      mode: "Quick Practice",
      title: "One-Paragraph Writing Sprint",
      subtitle: "A focused paragraph to keep writing skills warm.",
      durationMinutes: 10,
      questionCount: 1,
      questionTypes: ["Task 2 Paragraph", "Coherence"],
      difficultyBand: 6.5,
      examinerIntent: "Maintain paragraphing and cohesion habits in a short window.",
      items: [
        {
          id: "wq1",
          type: "essay",
          title: "Quick Paragraph",
          prompt:
            "Write one well-developed paragraph arguing that public libraries remain relevant in the digital age. Include a topic sentence, a supporting example, and a concluding link.",
          expectedFocus: "One idea, one example, clear cohesion.",
          descriptorFocus: "Writing: paragraph development and cohesion.",
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
    {
      id: "speaking-part-1",
      module: "speaking",
      mode: "Part 1",
      title: "Work and Study",
      subtitle: "Everyday interview questions with natural extension.",
      durationMinutes: 5,
      questionCount: 4,
      questionTypes: ["Part 1", "Fluency", "Sentence Control"],
      difficultyBand: 6,
      examinerIntent: "Build direct answers extended with one reason or example.",
      items: [
        {
          id: "sp1",
          type: "short-answer",
          title: "Part 1 Question",
          prompt: "Do you prefer to study alone or with other people? Why?",
          expectedFocus: "Answer directly, then give one clear reason.",
          descriptorFocus: "Speaking Part 1: direct response with reason.",
        },
      ],
    },
    {
      id: "speaking-part-3",
      module: "speaking",
      mode: "Part 3",
      title: "Cities and Public Space",
      subtitle: "Abstract discussion with balanced reasoning.",
      durationMinutes: 6,
      questionCount: 3,
      questionTypes: ["Part 3", "Abstract Discussion"],
      difficultyBand: 7,
      examinerIntent: "Train cause, example, and consequence in abstract answers.",
      items: [
        {
          id: "sp3",
          type: "short-answer",
          title: "Part 3 Question",
          prompt: "Do you think public parks are more important than sports facilities in cities? Why or why not?",
          expectedFocus: "Weigh both sides and justify your preference.",
          descriptorFocus: "Speaking Part 3: comparison and justification.",
        },
      ],
    },
    {
      id: "speaking-topic",
      module: "speaking",
      mode: "Topic Practice",
      title: "Environment and Daily Habits",
      subtitle: "Cross-part fluency on one familiar topic.",
      durationMinutes: 8,
      questionCount: 3,
      questionTypes: ["Part 1", "Part 2 Cue Card", "Part 3"],
      difficultyBand: 6.5,
      examinerIntent: "Practise all three parts within one topic area.",
      items: [
        {
          id: "st1",
          type: "speaking-cue",
          title: "Part 2 Cue Card",
          prompt:
            "Describe something you do to help the environment. You should say what you do, how often you do it, why you started, and how it makes you feel.",
          expectedFocus: "Tell a connected story with sequence markers.",
          descriptorFocus: "Speaking Part 2: long-turn structure.",
        },
        {
          id: "st2",
          type: "short-answer",
          title: "Part 3 Question",
          prompt: "Should governments or individuals take more responsibility for protecting the environment?",
          expectedFocus: "Discuss responsibility with balanced reasoning.",
          descriptorFocus: "Speaking Part 3: abstract justification.",
        },
      ],
    },
    {
      id: "speaking-quick",
      module: "speaking",
      mode: "Quick Practice",
      title: "One-Minute Speaking Warm-up",
      subtitle: "A single question to keep speaking muscles active.",
      durationMinutes: 5,
      questionCount: 1,
      questionTypes: ["Part 1", "Fluency"],
      difficultyBand: 6,
      examinerIntent: "Keep daily speaking practice possible in tight schedules.",
      items: [
        {
          id: "sq1",
          type: "short-answer",
          title: "Quick Question",
          prompt: "What is the best piece of advice you have ever received?",
          expectedFocus: "Answer with one example and a short reflection.",
          descriptorFocus: "Speaking: fluency and example use.",
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
  return clone(defaultProfile);
}

export function createNewStudentProfile(name: string, testType: "academic" | "general", targetBand: number): StudentLearningProfile {
  return {
    ...clone(defaultProfile),
    id: `student-${Date.now()}`,
    name: name.trim() || "IELTS Student",
    testType,
    targetBand,
    currentBand: 0,
    bands: { reading: 0, listening: 0, writing: 0, speaking: 0 },
    diagnosticCompleted: false,
    studyStreak: 0,
    weeklyGoalHours: 10,
    completedHours: 0,
    confidenceLevel: 50,
    fluency: 50,
    coherence: 50,
    weakQuestionTypes: [],
    weakTopics: [],
    strongSignals: [],
    practiceHistory: [],
    mockHistory: [],
    progress: [],
    vocabMastered: [],
    vocabQuizzesTaken: 0,
    vocabQuizBest: 0,
  };
}

export function migrateProfile(profile: StudentLearningProfile | null | undefined): StudentLearningProfile {
  const defaults = createDefaultLearningProfile();
  const source = profile ?? ({} as StudentLearningProfile);
  return {
    ...defaults,
    ...source,
    testType: source.testType === "general" ? "general" : "academic",
    diagnosticCompleted: source.diagnosticCompleted ?? true,
    bands: { ...defaults.bands, ...(source.bands ?? {}) },
    weakQuestionTypes: source.weakQuestionTypes ?? [],
    weakTopics: source.weakTopics ?? [],
    strongSignals: source.strongSignals ?? [],
    practiceHistory: source.practiceHistory ?? [],
    mockHistory: source.mockHistory ?? [],
    progress: source.progress ?? [],
    vocabMastered: source.vocabMastered ?? [],
    vocabQuizzesTaken: source.vocabQuizzesTaken ?? 0,
    vocabQuizBest: source.vocabQuizBest ?? 0,
    fluency: source.fluency ?? defaults.fluency,
    coherence: source.coherence ?? defaults.coherence,
  };
}

export function getPracticeBlueprints(module: Skill): PracticeSession[] {
  return structuredClone(practiceBlueprints[module]);
}

export interface BlueprintMeta {
  id: string;
  mode: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  questionTypes: string[];
  difficultyBand: number;
}

export function getBlueprintMeta(module: Skill): BlueprintMeta[] {
  return practiceBlueprints[module].map((session) => ({
    id: session.id,
    mode: session.mode,
    title: session.title,
    durationMinutes: session.durationMinutes,
    questionCount: session.questionCount,
    questionTypes: session.questionTypes,
    difficultyBand: session.difficultyBand,
  }));
}

const localReadingBlueprint: ReadingBlueprint = {
  title: "Reading Blueprint",
  tagline: "How to read strategically and earn more marks.",
  structure: [
    { name: "Passage 1", detail: "Usually the easiest. Factual texts, 13 questions. Spend ~15-18 minutes.", topic: "Descriptive / factual" },
    { name: "Passage 2", detail: "Medium difficulty. Argument and description, 13 questions. Spend ~20 minutes.", topic: "Argumentative / discursive" },
    { name: "Passage 3", detail: "Hardest. Dense academic prose, 14 questions. Spend ~22-25 minutes.", topic: "Abstract / academic" },
  ],
  scoring: [
    { correct: "39-40", band: "Band 9" },
    { correct: "37-38", band: "Band 8.5" },
    { correct: "35-36", band: "Band 8" },
    { correct: "33-34", band: "Band 7.5" },
    { correct: "30-32", band: "Band 7" },
    { correct: "27-29", band: "Band 6.5" },
    { correct: "23-26", band: "Band 6" },
    { correct: "19-22", band: "Band 5.5" },
    { correct: "15-18", band: "Band 5" },
  ],
  questionTypes: [
    { name: "True / False / Not Given", strategy: "Find the exact sentence. True = same meaning; False = contradicts; Not Given = not mentioned.", time: "~90 seconds each", mistakes: "Confusing False with Not Given; using outside knowledge." },
    { name: "Matching Headings", strategy: "Read the first and last sentence of each paragraph first, then the heading list.", time: "~60 seconds each", mistakes: "Matching a heading that only fits one detail, not the whole paragraph." },
    { name: "Multiple Choice", strategy: "Skim the passage for keywords from each option before deciding.", time: "~60 seconds each", mistakes: "Choosing an option that is true in the text but does not answer the question." },
    { name: "Summary / Sentence Completion", strategy: "Predict the part of speech and word limit (e.g. ONE WORD ONLY) before reading.", time: "~75 seconds each", mistakes: "Using more than the word limit or copying extra words." },
    { name: "Short Answer", strategy: "Scan for the question words and copy exact words from the text.", time: "~60 seconds each", mistakes: "Answering in your own words instead of the words in the text." },
    { name: "Yes / No / Not Given", strategy: "Decide based on the writer's view, not facts you know from outside.", time: "~90 seconds each", mistakes: "Answering True/False instead of Yes/No; judging by your own opinion." },
    { name: "Matching Features", strategy: "Track names, dates and claims in a quick table as you read.", time: "~90 seconds each", mistakes: "Confusing which researcher/group said what." },
    { name: "Matching Sentence Endings", strategy: "Read the half-sentence, predict the end, then match meaning not exact words.", time: "~75 seconds each", mistakes: "Choosing an ending from a similar sentence that does not complete the logic." },
    { name: "Table / Flow Chart Completion", strategy: "Read the row/column headers first and predict the missing cell.", time: "~60 seconds each", mistakes: "Answering the wrong row or copying beyond the word limit." },
  ],
  timeManagement: [
    "Passage 1 is usually easiest: spend 15 minutes.",
    "Passage 2: 20 minutes. Passage 3: 25 minutes (often hardest).",
    "Never spend more than 2 minutes on one question.",
    "Transfer answers as you go — there is no extra transfer time in the computer test.",
    "Do not stop to read every word: skim for structure, scan for answers.",
  ],
  commonMistakes: [
    "Reading the whole passage before looking at the questions — questions should guide your reading.",
    "Choosing False instead of Not Given when the text is simply silent on the claim.",
    "Exceeding the word limit on completion tasks (ONE WORD means ONE word).",
    "Answering completion tasks in your own words instead of copying the text's words.",
    "Confusing True/False (facts) with Yes/No (writer's opinion) answer sets.",
    "Spending too long on one hard question and running out of time on easy marks later.",
  ],
  bandTips: {
    "5": "Build vocabulary by topic and practise scanning for keywords.",
    "6": "Master True/False/Not Given logic — the most common question type.",
    "7": "Practise matching headings and summary completion under 20-minute limits.",
    "8": "Read academic articles to build speed and infer writer opinion (Yes/No).",
  },
  tipsToImprove: [
    "Complete one full 60-minute reading test every week and review every wrong answer by question type.",
    "Learn question type strategy before speed — accuracy comes first, then pace.",
    "Practise skimming: read only the first and last sentence of each paragraph in 2 minutes per passage.",
    "Keep a notebook of paraphrase pairs (e.g. 'not suitable for every role' ~ 'does not benefit all roles').",
    "Do 5-question type-focused sets daily instead of only full tests.",
  ],
  grammarVocab: "Learn collocations for technology, environment, and health topics. Paraphrase in your head as you read — this builds the synonyms IELTS uses.",
};

export function getReadingBlueprint(): ReadingBlueprint {
  return structuredClone(localReadingBlueprint);
}

const localListeningBlueprint: ReadingBlueprint = {
  title: "Listening Blueprint",
  tagline: "How to hear the answer, not just the words.",
  structure: [
    { name: "Part 1", detail: "Easiest. A conversation in an everyday context (booking, enquiry), 10 questions. ~8 minutes.", topic: "Everyday conversation" },
    { name: "Part 2", detail: "A monologue on a topic like a tour, guide or announcement, 10 questions. ~8 minutes.", topic: "Monologue / announcement" },
    { name: "Part 3", detail: "A conversation between up to four people, often academic (discussion, tutorial), 10 questions. ~8 minutes.", topic: "Academic conversation" },
    { name: "Part 4", detail: "Hardest. An academic lecture or talk, 10 questions. ~8 minutes.", topic: "Academic lecture" },
  ],
  scoring: [
    { correct: "39-40", band: "Band 9" },
    { correct: "37-38", band: "Band 8.5" },
    { correct: "35-36", band: "Band 8" },
    { correct: "33-34", band: "Band 7.5" },
    { correct: "30-32", band: "Band 7" },
    { correct: "27-29", band: "Band 6.5" },
    { correct: "23-26", band: "Band 6" },
    { correct: "19-22", band: "Band 5.5" },
    { correct: "15-18", band: "Band 5" },
  ],
  questionTypes: [
    { name: "Form / Note Completion", strategy: "Predict word type (name, number, time) by reading the gaps before the audio starts.", time: "~10 seconds each", mistakes: "Missing a plural 's' — it still counts." },
    { name: "Map Labelling", strategy: "Trace the route with your finger. Listen for 'turn left', 'opposite', 'past the X'.", time: "~10 seconds each", mistakes: "Choosing a label heard earlier, not the one at the destination." },
    { name: "Multiple Choice", strategy: "Underline the difference between options before each section plays.", time: "~15 seconds each", mistakes: "Picking an option with a word you heard even if it was said negatively." },
    { name: "Matching", strategy: "Predict which names or features will be matched, then write letters as you hear them.", time: "~15 seconds each", mistakes: "Answering from memory instead of the recording." },
    { name: "Sentence Completion", strategy: "Predict how many words are allowed (e.g. ONE WORD ONLY) and keep the grammar correct.", time: "~10 seconds each", mistakes: "Adding a preposition the sentence does not need." },
  ],
  timeManagement: [
    "Use the 30 seconds before each section to read ALL the questions.",
    "Use the gap between questions to predict the next answer type.",
    "Keep pace: you get exactly one chance to hear each answer.",
    "Write answers immediately; never stop to think while the recording plays.",
  ],
  commonMistakes: [
    "Reading the options and stopping to think — the audio keeps moving and the answer is missed.",
    "Writing an answer you heard in the first mention when the speaker corrects it later.",
    "Missing plural 's' or wrong letter case on completion and note answers.",
    "Answering completion tasks from memory instead of the exact words.",
    "Confusing distractors: options that contain heard words but answer a different question.",
  ],
  bandTips: {
    "5": "Practise number and date dictation daily.",
    "6": "Learn to identify distractors: answers are usually said twice with a change.",
    "7": "Train map labelling by tracing routes on real maps.",
    "8": "Listen to academic lectures (TED, BBC Ideas) and take notes in English.",
  },
  tipsToImprove: [
    "Complete one full 30-minute listening test weekly and review every wrong answer by question type.",
    "Practise predicting answer types: is the gap a name, number, date, direction or adjective?",
    "Dictate phone numbers, dates, prices and postcodes until capture is automatic.",
    "Do 5-question type-focused sets daily instead of only full tests.",
  ],
  grammarVocab: "Learn spelling of common words (accommodation, environment, separate). Grammar must fit the gap: noun, verb form, or plural.",
};

export function getListeningBlueprint(): ReadingBlueprint {
  return structuredClone(localListeningBlueprint);
}

const localWritingBlueprint: ReadingBlueprint = {
  title: "Writing Blueprint",
  tagline: "Structure the essay, then language follows.",
  structure: [
    { name: "Task 1", detail: "Academic report or process: summarise data, trends, comparisons or stages. 20 minutes, at least 150 words.", topic: "Academic writing" },
    { name: "Task 2", detail: "Essay on a topic: give your opinion, discuss both views, or solve a problem. 40 minutes, at least 250 words.", topic: "Essay" },
  ],
  scoring: [
    { correct: "Task 1", band: "One third of the Writing band" },
    { correct: "Task 2", band: "Two thirds of the Writing band" },
    { correct: "Task Achievement", band: "25%" },
    { correct: "Coherence and Cohesion", band: "25%" },
    { correct: "Lexical Resource (Vocabulary)", band: "25%" },
    { correct: "Grammatical Range and Accuracy", band: "25%" },
  ],
  questionTypes: [
    { name: "Task 1 Report (Data)", strategy: "Open with an overview sentence, then group data (highest/lowest, trends) into 2-3 body paragraphs. Never list every number.", time: "20 minutes", mistakes: "Copying numbers without an overview or comparisons." },
    { name: "Task 1 Process / Map", strategy: "Describe the stages or changes in time order with linking words (first, then, subsequently). Include all stages; no opinion.", time: "20 minutes", mistakes: "Adding opinions or omitting a stage of the process." },
    { name: "Task 2 Opinion", strategy: "State your position in the introduction and support it in every body paragraph; conclusion restates the position.", time: "40 minutes", mistakes: "Giving both sides without ever taking a clear position." },
    { name: "Task 2 Discussion", strategy: "Present both views fairly, then your own opinion in the conclusion or a dedicated paragraph.", time: "40 minutes", mistakes: "Burying the discussion in examples without explanation." },
    { name: "Task 2 Advantages / Disadvantages", strategy: "Balance one paragraph per side and conclude with a clear judgement of which outweighs.", time: "40 minutes", mistakes: "Discussing advantages only, ignoring disadvantages." },
    { name: "Task 2 Problem / Solution", strategy: "Name the problem with causes, then practical solutions linked to those causes.", time: "40 minutes", mistakes: "Listing solutions with no cause-and-effect link." },
    { name: "Task 2 Double Question", strategy: "Answer BOTH questions in separate body paragraphs, keeping equal weight between them.", time: "40 minutes", mistakes: "Answering only the first question fully." },
  ],
  timeManagement: [
    "Task 1: 5 minutes plan, 12 minutes write, 3 minutes check (overview present, no missing data).",
    "Task 2: 10 minutes plan, 25 minutes write, 5 minutes check (position clear, 250+ words, linking).",
    "Write the overview for Task 1 before the detail paragraphs.",
    "Spend the last 2 minutes on grammar: subject-verb agreement, articles, verb tense.",
  ],
  commonMistakes: [
    "Under-length answers: Task 1 under 150 words, Task 2 under 250 words.",
    "Memorised introductions that do not answer the actual question.",
    "Describing data for Task 1 without a single overview sentence.",
    "Arguments without examples or explanation (assertion, no support).",
    "Informal register: contractions, phrasal verbs, 'a lot of' in academic essays.",
  ],
  bandTips: {
    "5": "Write to length every time and learn one linking word per function.",
    "6": "Plan before writing: position, two ideas, one example each.",
    "7": "Use less common vocabulary precisely and vary sentence structures.",
    "8": "Develop ideas fully: claim, explanation, example, link to question.",
  },
  tipsToImprove: [
    "Write one full Task 2 essay weekly and revise it twice: once for ideas, once for grammar.",
    "Practise planning in 3 minutes: decide position, two arguments, two examples.",
    "Keep a vocabulary notebook organised by topic (education, environment, technology).",
    "Read high-band sample essays and mark the structure: thesis, topic sentences, linking.",
  ],
  grammarVocab: "Use present perfect for recent trends, past simple for finished periods, and comparatives for data. Replace 'big'/'good' with precise academic vocabulary.",
};

export function getWritingBlueprint(): ReadingBlueprint {
  return structuredClone(localWritingBlueprint);
}

const localSpeakingBlueprint: ReadingBlueprint = {
  title: "Speaking Blueprint",
  tagline: "How to sound fluent, confident, and organised.",
  structure: [
    { name: "Part 1", detail: "Interview. Personal questions on familiar topics (work, home, hobbies). 4-5 minutes, about 12 questions.", topic: "Familiar / personal" },
    { name: "Part 2", detail: "Long turn. A cue card with four bullet points; 1 minute to prepare, then speak for 1-2 minutes.", topic: "Story / experience" },
    { name: "Part 3", detail: "Discussion. Abstract questions linked to the Part 2 topic. Deeper opinions with reasons and examples. 4-5 minutes.", topic: "Abstract / critical" },
  ],
  scoring: [
    { correct: "Fluency", band: "20%" },
    { correct: "Pronunciation", band: "20%" },
    { correct: "Grammar (Range and Accuracy)", band: "20%" },
    { correct: "Vocabulary (Lexical Resource)", band: "20%" },
    { correct: "Coherence", band: "20%" },
  ],
  questionTypes: [
    { name: "Part 1 Interview (personal questions)", strategy: "Answer directly, add a reason or example, then stop. Never one word.", time: "~20 sec each", mistakes: "Memorised answers that do not fit the question." },
    { name: "Part 2 Cue Card (long turn)", strategy: "Use the 1 minute to write 4 keywords and tell the story with structure (what/when/where/why).", time: "1-2 minutes", mistakes: "Speaking for 30 seconds and stopping. Keep talking with details." },
    { name: "Part 3 Discussion (abstract questions)", strategy: "Give an opinion, explain it, and give an example or compare.", time: "~60 sec each", mistakes: "Giving one-sentence answers to abstract questions." },
  ],
  timeManagement: [
    "Part 1: do not over-answer; 2-3 sentences is enough.",
    "Part 2: use the preparation minute to write 4 keywords, then speak each one as a paragraph.",
    "Part 3: treat it like a mini essay — claim, reason, example.",
    "Never chase a perfect answer; fluency beats perfection.",
  ],
  commonMistakes: [
    "One-word answers in Part 1 — always add a reason or example.",
    "Memorised answers that ignore the actual question.",
    "Stopping early in Part 2; keep talking with small details.",
    "Repeating the question and adding nothing new.",
    "Punishing yourself for fillers like 'umm' — natural pauses are fine; the AI ignores them.",
  ],
  bandTips: {
    "5": "Practise speaking for 1 minute non-stop on any topic.",
    "6": "Use linking phrases: 'Actually...', 'The main reason is...'.",
    "7": "Vary vocabulary and use conditionals and complex sentences naturally.",
    "8": "Use idiomatic language, precise vocabulary, and natural rhythm.",
  },
  tipsToImprove: [
    "Record one Part 2 answer daily and listen back for rhythm, not just content.",
    "Create 5 reusable stories (place, person, habit, meal, skill) that fit many cue cards.",
    "Learn topic collocations weekly (work, environment, education, technology).",
    "Practise reframing: answer with a twist ('attention has not disappeared; it has become selective').",
  ],
  grammarVocab: "Use present/past/future correctly, conditionals, and question tags. Pronunciation: stress content words and keep a steady rhythm — fillers like 'umm' do not lower your score.",
};

export function getSpeakingBlueprint(): ReadingBlueprint {
  return structuredClone(localSpeakingBlueprint);
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

const ANSWER_FIELDS = ["correctAnswer", "explanation", "logic", "tip", "suggestions", "bandAdvice"] as const;

function stripItemAnswers(item: PracticeItem): PracticeItem {
  const copy = { ...item } as Record<string, unknown>;
  for (const field of ANSWER_FIELDS) {
    delete copy[field];
  }
  return copy as unknown as PracticeItem;
}

function localReadingItemsByType(type: string): PracticeItem[] {
  return practiceBlueprints.reading
    .flatMap((session) => session.items)
    .filter((item) => {
      if (item.type === "matching") {
        return ["Matching Headings", "Matching Features", "Matching Sentence Endings"].includes(type);
      }
      if (item.type === "multiple-choice") return type === "Multiple Choice";
      if (item.type === "short-answer") return type === "Short Answer";
      return false;
    });
}

function localListeningItemsByType(type: string): PracticeItem[] {
  return practiceBlueprints.listening
    .flatMap((session) => session.items)
    .filter((item) => {
      if (item.type === "matching") return type === "Matching";
      if (item.type === "multiple-choice") return type === "Multiple Choice";
      if (item.type === "short-answer") {
        return ["Form / Note Completion", "Sentence Completion", "Map Labelling"].includes(type);
      }
      return false;
    });
}

function localWritingItemsByType(type: string): PracticeItem[] {
  const all = practiceBlueprints.writing.flatMap((session) => session.items);
  const taskMatch = type.startsWith("Task 1")
    ? (session: PracticeSession) => session.mode.includes("Task 1")
    : (session: PracticeSession) => session.mode.includes("Task 2");
  const matched = practiceBlueprints.writing.filter(taskMatch).flatMap((session) => session.items);
  const pool = matched.length > 0 ? matched : all;
  return pool.filter((item) => item.type === "essay");
}

function localSpeakingItemsByType(type: string): PracticeItem[] {
  const part = type.startsWith("Part 1")
    ? "Part 1"
    : type.startsWith("Part 2")
      ? "Part 2"
      : type.startsWith("Part 3")
        ? "Part 3"
        : "";
  const matched = part ? practiceBlueprints.speaking.filter((session) => session.mode === part).flatMap((session) => session.items) : [];
  const pool = matched.length > 0 ? matched : practiceBlueprints.speaking.flatMap((session) => session.items);
  return pool.filter((item) => item.type === "speaking-cue" || item.type === "short-answer");
}

export function createPracticeSession(
  profile: StudentLearningProfile,
  module?: Skill,
  mode?: string,
  questionType?: string,
): PracticeSession {
  const recommendation = getAdaptiveRecommendation(profile);
  const selectedModule = module ?? recommendation.module;
  const blueprints = practiceBlueprints[selectedModule];
  const skillTypes = QUESTION_TYPES_BY_SKILL[selectedModule] ?? [];
  const activeType = skillTypes.find((type) => type === (questionType ?? mode));
  const fallbackMode = activeType ? "Individual Question Types" : mode;
  const selected =
    blueprints.find((session) => session.mode === fallbackMode) ??
    blueprints.find((session) => session.mode === recommendation.mode) ??
    blueprints[0];

  const items = activeType
    ? selectedModule === "listening"
      ? localListeningItemsByType(activeType)
      : selectedModule === "writing"
        ? localWritingItemsByType(activeType)
        : selectedModule === "speaking"
          ? localSpeakingItemsByType(activeType)
          : localReadingItemsByType(activeType)
    : selected.items;
  const label = activeType ?? (questionType ?? mode);

  return structuredClone({
    ...selected,
    id: activeType ? `${selectedModule}-${activeType.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}` : selected.id,
    title: activeType ? `Practice: ${activeType}` : selected.title,
    subtitle: activeType
      ? `A focused set on ${activeType}. Answer every question, then the AI Brain evaluates the set.`
      : selected.subtitle,
    mode: label ?? selected.mode,
    questionCount: items.length,
    items: items.map(stripItemAnswers),
    difficultyBand: Math.max(selected.difficultyBand, recommendation.difficultyBand),
  });
}

function answerWordCount(answers: Record<string, string>): number {
  return Object.values(answers)
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function analyzeText(text: string): TextAnalysis {
  const cleaned = text.trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const sentences = cleaned
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const averageSentenceWords =
    sentences.length === 0 ? 0 : Math.round((words.length / sentences.length) * 10) / 10;
  const uniqueWords = new Set(words.map((word) => word.toLowerCase()));
  const uniqueWordRatio = words.length === 0 ? 0 : Math.round((uniqueWords.size / words.length) * 100);
  const longSentenceCount = sentences.filter((sentence) => sentence.split(/\s+/).filter(Boolean).length > 20).length;
  const insights: string[] = [];

  if (words.length === 0) {
    insights.push("No text submitted — write at least a few sentences for a diagnosis.");
  } else if (words.length < 150) {
    insights.push("Below 150 words: aim for 250+ on Writing Task 2.");
  } else if (words.length < 250) {
    insights.push("Good length; push to 250+ words to remove a length penalty.");
  } else {
    insights.push("Strong response length for a Task 2 answer.");
  }

  if (sentences.length > 0) {
    if (averageSentenceWords > 22) {
      insights.push("Sentences average very long — vary short and long for rhythm and clarity.");
    } else if (averageSentenceWords < 12) {
      insights.push("Sentences are short — link ideas with connectors for cohesion.");
    } else {
      insights.push("Sentence variety is in a healthy range.");
    }
  }

  if (uniqueWordRatio < 45) {
    insights.push("Lexical range is narrow — reuse of the same words limits Band 7 vocabulary.");
  } else if (uniqueWordRatio > 62) {
    insights.push("Strong lexical variety for a high band vocabulary score.");
  }

  if (longSentenceCount > 3) {
    insights.push(`${longSentenceCount} very long sentences risk losing the examiner in unclear grammar.`);
  }

  if (paragraphs.length === 0) {
    insights.push("Break the response into clear paragraphs — one idea per paragraph.");
  }

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageSentenceWords,
    uniqueWordRatio,
    longSentenceCount,
    insights,
  };
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

function normalizeAnswer(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(/[.,;:'"!?()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findLocalItemById(id: string): PracticeItem | undefined {
  for (const module of Object.values(practiceBlueprints)) {
    for (const session of module) {
      const found = session.items.find((item) => item.id === id);
      if (found) return found;
    }
  }
  return undefined;
}

function buildLocalItemFeedback(session: PracticeSession, answers: Record<string, string>): ItemFeedback[] {
  return session.items.map((item) => {
    const source = findLocalItemById(item.id) ?? item;
    const userAnswer = (answers[item.id] ?? "").trim();
    const ideal = (source.correctAnswer ?? "").trim();
    const userNorm = normalizeAnswer(userAnswer);
    const idealNorm = normalizeAnswer(ideal);
    const optionMatch = item.options?.some((option) => normalizeAnswer(option) === userNorm);
    const isCorrect = Boolean(userNorm && (userNorm === idealNorm || (optionMatch && userNorm === idealNorm) || (idealNorm && (userNorm.includes(idealNorm) || idealNorm.includes(userNorm)))));
    return {
      id: item.id,
      type: item.type,
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback: {
        verdict: isCorrect ? "Correct" : userNorm ? "Incorrect" : "Not answered",
        idealAnswer: ideal || item.prompt,
        explanation: source.explanation ?? "Review the section blueprint for the strategy behind this answer.",
        logic: source.logic ?? "Locate the key sentence, match meaning to the answer, then reject what the text contradicts.",
        tip: source.tip ?? "Practise this question type in the blueprint, then retry.",
        suggestions: source.suggestions ?? "Re-read the question, find the exact sentence, and verify against the word limit or scope words.",
        bandAdvice: source.bandAdvice ?? "Controlled scanning and paraphrase awareness lift Reading accuracy at every band.",
        estimatedBand: null,
        textAnalysis: null,
      },
    };
  });
}

export function evaluatePracticeSession(
  profile: StudentLearningProfile,
  session: PracticeSession,
  answers: Record<string, string>,
  timingSeconds?: number | null,
): { evaluation: EvaluationResult; updatedProfile: StudentLearningProfile } {
  const timingResult = computeTimingMetrics(session.module, session.items.length, answers, session.durationMinutes, timingSeconds);
  const predictedBand = calculateSessionBand(profile, session, answers);
  const accuracy = Math.round(Math.max(35, Math.min(96, answerCompletion(session, answers) * 70 + predictedBand * 4)));
  const weaknesses = detectWeaknesses(session, answers);
  const strengths = detectStrengths(session, answers);
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

  const updatedProfile: StudentLearningProfile = {
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

  const evaluation: EvaluationResult = {
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
    perItemFeedback: buildLocalItemFeedback(session, answers),
    speed: timingResult.speed,
    timeManagement: timingResult.timeManagement,
    timing: timingResult.timing,
  };

  if (session.module === "writing" || session.module === "speaking") {
    evaluation.textAnalysis = analyzeText(
      session.items
        .map((item) => answers[item.id] ?? "")
        .filter(Boolean)
        .join("\n\n"),
    );
  }

  return { evaluation, updatedProfile };
}

export function evaluateMockExam(
  profile: StudentLearningProfile,
  answers: Record<string, string>,
  timing?: Partial<Record<Skill, number>>,
): { result: MockExamResult; updatedProfile: StudentLearningProfile } {
  const sectionTiming: Record<string, TimingDetail> = {};
  const speedScores: number[] = [];
  const tmScores: number[] = [];
  (["listening", "reading", "writing", "speaking"] as Skill[]).forEach((skill) => {
    const installed = skill === "speaking" ? 12 : skill === "writing" ? 2 : 40;
    const metrics = computeTimingMetrics(skill, installed, answers, OFFICIAL_SECTION_MINUTES[skill], timing?.[skill]);
    sectionTiming[skill] = metrics.timing;
    speedScores.push(metrics.speed.score);
    tmScores.push(metrics.timeManagement.score);
  });
  const overallSpeed = Math.round(speedScores.reduce((sum, score) => sum + score, 0) / speedScores.length);
  const overallTm = Math.round(tmScores.reduce((sum, score) => sum + score, 0) / tmScores.length);
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
  const overallBand = calculateOverallBand(bands);

  const sortedBands = (Object.entries(bands) as [Skill, number][]).sort((a, b) => b[1] - a[1]);
  const [bestSkill, bestBand] = sortedBands[0];
  const [worstSkill, worstBand] = sortedBands[sortedBands.length - 1];
  const mockSkills: Skill[] = ["listening", "reading", "writing", "speaking"];

  const strengths = new Set<string>();
  strengths.add(`${skillLabels[bestSkill]} at ${bestBand.toFixed(1)} was your highest section band this mock.`);
  (Object.entries(bands) as [Skill, number][]).forEach(([skill, band]) => {
    if (band >= profile.bands[skill]) {
      strengths.add(`${skillLabels[skill]} held at or above your starting ${profile.bands[skill].toFixed(1)} profile band.`);
    }
  });
  if (overallTm >= 65) strengths.add("You completed the full exam inside the official section timings.");
  if (overallSpeed >= 45) strengths.add(`Pacing was ${overallSpeed >= 75 ? "fast" : "consistent"} across all four sections.`);
  if (answeredItems > 70) strengths.add("You answered the vast majority of items — strong stamina across the full exam.");

  const weaknesses = new Set<string>();
  weaknesses.add(`${skillLabels[worstSkill]} at ${worstBand.toFixed(1)} is pulling your overall band down to ${overallBand.toFixed(1)}.`);
  (Object.entries(bands) as [Skill, number][]).forEach(([skill, band]) => {
    if (band < profile.bands[skill]) {
      weaknesses.add(`${skillLabels[skill]} dipped below your starting ${profile.bands[skill].toFixed(1)} profile band.`);
    }
  });
  mockSkills.forEach((skill) => {
    const detail = sectionTiming[skill];
    if (detail.overBudgetSeconds > 0) {
      weaknesses.add(`${skillLabels[skill]} ran ${formatClock(detail.overBudgetSeconds)} over its official ${formatClock(detail.recommendedSeconds)} limit.`);
    }
  });
  if (overallTm < 65) weaknesses.add("Time management needs work — a section ran over budget or ended with items still unanswered.");
  if (!sortedBands.some(([, band]) => band >= profile.targetBand)) {
    weaknesses.add(`No section reached your ${profile.targetBand.toFixed(1)} target this mock.`);
  }

  const result: MockExamResult = {
    id: `mock-${Date.now()}`,
    listeningBand,
    readingBand,
    writingBand,
    speakingBand,
    overallBand,
    accuracy: Math.round((overallBand / 9) * 100),
    speed: {
      score: overallSpeed,
      label: overallSpeed >= 75 ? "Fast" : overallSpeed >= 45 ? "Balanced" : "Slow",
      comment: "Overall pace across the four official timings — aim to answer every question and keep 2 spare minutes per section.",
    },
    timeManagement: {
      score: overallTm,
      label: overallTm >= 85 ? "Excellent" : overallTm >= 65 ? "On pace" : "Needs work",
      comment: "Compare each section's time taken against its official limit (L 30 / R 60 / W 60 / S 14 minutes).",
    },
    timing: sectionTiming,
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
    strengths: Array.from(strengths).slice(0, 4),
    weaknesses: Array.from(weaknesses).slice(0, 4),
  };
  const dateLabel = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date());
  const updatedProfile: StudentLearningProfile = {
    ...profile,
    bands,
    currentBand: overallBand,
    mockHistory: [
      {
        id: result.id,
        date: dateLabel,
        overallBand,
        listeningBand,
        readingBand,
        writingBand,
        speakingBand,
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
        reading: readingBand,
        listening: listeningBand,
        writing: writingBand,
        speaking: speakingBand,
      },
    ],
  };

  return { result, updatedProfile };
}

export function getBandGap(profile: StudentLearningProfile): number {
  return Math.max(0, profile.targetBand - profile.currentBand);
}

// ---------------------------------------------------------------------------
// New-student diagnostic (offline brain fallback)
// ---------------------------------------------------------------------------

export interface DiagnosticQuestion {
  id: string;
  skill: Skill;
  type: string;
  title: string;
  prompt: string;
  context?: string;
  options?: string[];
}

export interface DiagnosticResult {
  bands: BandMap;
  overallBand: number;
  summary: string;
  weakQuestionTypes: string[];
  profile: StudentLearningProfile;
}

const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: "diagnostic-reading-1",
    skill: "reading",
    type: "multiple-choice",
    title: "Reading · Main idea",
    prompt:
      "A study of commuter behaviour found that when cities added protected cycling lanes, cycling rose sharply while car journeys fell only slightly, because most new cyclists had previously used public transport.",
    context: "According to the text, the cycling lanes mainly replaced journeys made by which group?",
    options: ["Car drivers", "Public transport users", "People who walked", "Delivery workers"],
  },
  {
    id: "diagnostic-listening-1",
    skill: "listening",
    type: "multiple-choice",
    title: "Listening · Detail",
    prompt:
      "Receptionist: The workshop starts at 10, but arrive 15 minutes early to collect your name badge. If you have not registered online, you will need to do that at the desk first.",
    context: "What must unregistered visitors do first?",
    options: ["Collect a name badge", "Register at the desk", "Find their seat", "Pay the fee"],
  },
  {
    id: "diagnostic-writing-1",
    skill: "writing",
    type: "essay",
    title: "Writing · Task 2",
    prompt:
      "Some people think that children should start learning a foreign language at primary school, while others believe this should wait until secondary school. Discuss both views and give your own opinion.",
  },
  {
    id: "diagnostic-speaking-1",
    skill: "speaking",
    type: "speaking-cue",
    title: "Speaking · Part 2",
    prompt:
      "Describe a hobby you enjoy. You should say: what it is, how often you do it, why you started it, and why it is important to you.",
  },
];

export function getDiagnosticQuestions(): DiagnosticQuestion[] {
  return structuredClone(diagnosticQuestions);
}

function diagnosticObjectiveBand(answers: Record<string, string>): number {
  const reading = (answers["diagnostic-reading-1"] ?? "").trim().toLowerCase();
  const listening = (answers["diagnostic-listening-1"] ?? "").trim().toLowerCase();
  const readingCorrect = reading === "public transport users";
  const listeningCorrect = listening === "register at the desk";
  const correct = [readingCorrect, listeningCorrect].filter(Boolean).length;
  if (correct === 2) return 6.5;
  if (correct === 1) return 5.5;
  return 5.0;
}

function diagnosticSubjectiveBands(answers: Record<string, string>): { writing: number; speaking: number } {
  const words = (text: string): number => (text ?? "").trim().split(/\s+/).filter(Boolean).length;
  const writing = words(answers["diagnostic-writing-1"] ?? "");
  const speaking = words(answers["diagnostic-speaking-1"] ?? "");
  const writingBand = writing >= 150 ? 6.5 : writing >= 80 ? 6.0 : writing >= 30 ? 5.5 : 5.0;
  const speakingBand = speaking >= 60 ? 6.5 : speaking >= 30 ? 6.0 : 5.5;
  return { writing: writingBand, speaking: speakingBand };
}

export function submitLocalDiagnostic(
  profile: StudentLearningProfile,
  answers: Record<string, string>,
): DiagnosticResult {
  const objectiveBand = diagnosticObjectiveBand(answers);
  const subjective = diagnosticSubjectiveBands(answers);
  const bands: BandMap = {
    reading: objectiveBand,
    listening: objectiveBand,
    writing: subjective.writing,
    speaking: subjective.speaking,
  };
  const overallBand = clampBand((bands.reading + bands.listening + bands.writing + bands.speaking) / 4);
  const weakQuestionTypes = Array.from(
    new Set([
      bands.writing < 6 ? "Task 2 Coherence" : null,
      bands.speaking < 6 ? "Speaking Fluency" : null,
      bands.reading < 6 || bands.listening < 6 ? "Matching Headings" : null,
    ].filter(Boolean) as string[]),
  );
  const dateLabel = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date());
  const updatedProfile: StudentLearningProfile = {
    ...profile,
    bands,
    currentBand: overallBand,
    diagnosticCompleted: true,
    completedHours: 0.25,
    weakQuestionTypes,
    strongSignals: [
      bands.writing >= 6 ? "Clear position with supporting reasons" : null,
      bands.speaking >= 6 ? "Answers extend beyond single sentences" : null,
      bands.reading >= 6 && bands.listening >= 6 ? "Stable comprehension on short texts" : null,
    ].filter(Boolean) as string[],
    progress: [
      {
        label: "Diagnostic",
        overall: overallBand,
        reading: bands.reading,
        listening: bands.listening,
        writing: bands.writing,
        speaking: bands.speaking,
      },
    ],
    practiceHistory: [
      {
        id: `diagnostic-${Date.now()}`,
        date: dateLabel,
        module: "reading",
        mode: "Diagnostic",
        title: "Diagnostic Assessment",
        band: overallBand,
        accuracy: Math.round((overallBand / 9) * 100),
        weaknesses: weakQuestionTypes,
      },
    ],
  };
  const summary = `The AI examiner estimates your current overall band at ${overallBand.toFixed(1)} (${formatSkill(getWeakestSkill(updatedProfile))} is your lowest section at ${bands[getWeakestSkill(updatedProfile)].toFixed(1)}).`;
  return { bands, overallBand, summary, weakQuestionTypes, profile: updatedProfile };
}

export interface TutorMessage {
  role: "student" | "tutor";
  text: string;
}

export interface TutorReply {
  reply: string;
  tips: string[];
}

const tutorKnowledge: { keywords: string[]; reply: string; tips: string[] }[] = [
  {
    keywords: ["true", "false", "not given", "yes", "no"],
    reply:
      "For True/False/Not Given, decide if the statement matches the text exactly (True/Yes), contradicts the text (False/No), or is not mentioned at all (Not Given). Never rely on the whole text — only the meaning of the sentence.",
    tips: [
      "Underline the words that carry the claim before scanning.",
      "If the text has the idea but different words, it is usually True.",
      "If the text is silent on one part of the claim, choose Not Given.",
    ],
  },
  {
    keywords: ["matching heading", "headings"],
    reply:
      "Read the paragraph's first and last sentences, then look for the controlling idea — the message the whole paragraph supports — rather than a repeated keyword.",
    tips: [
      "Read all headings once before the passage.",
      "Match the controlling idea, not the most frequent word.",
      "Leave hard paragraphs for the end and use elimination.",
    ],
  },
  {
    keywords: ["task 1", "writing task 1", "graph", "chart", "data"],
    reply:
      "Task 1 needs an overview paragraph that summarises the main trend before you report specific numbers. Structure: paraphrase the task, give the overview, then group the data into two clear paragraphs.",
    tips: [
      "Write the overview immediately after the introduction.",
      "Compare categories, do not describe the data one by one.",
      "Keep to around 170 words and use comparison language.",
    ],
  },
  {
    keywords: ["task 2", "writing task 2", "essay"],
    reply:
      "Task 2 rewards a clear position with developed paragraphs. Plan for 3 minutes: decide your position, think of two supporting ideas, and pick a specific example for each before writing.",
    tips: [
      "Answer the question exactly — check the instruction type first.",
      "One idea per paragraph, opened by a clear topic sentence.",
      "Use a range of linking words, but let ideas link, not just words.",
    ],
  },
  {
    keywords: ["speaking", "fluency", "cue card", "part 2"],
    reply:
      "For Speaking Part 2, structure your answer in stages: introduce the situation, describe the details, give the reason, and end with how it made you feel. Keep talking without long pauses.",
    tips: [
      "Use your 1-minute preparation to write four short prompts.",
      "If you lose the thread, continue with 'and that is why...'.",
      "Record yourself and count hesitation sounds.",
    ],
  },
  {
    keywords: ["vocabulary", "words", "lexical"],
    reply:
      "Aim to learn collocations (words that go together) rather than single words. For example, learn 'a sharp increase' and 'pose a threat' as one unit.",
    tips: [
      "Learn 5 collocations a day, then use them in a sentence.",
      "Review yesterday's words before adding new ones.",
      "Use the vocabulary trainer on the dashboard to stay consistent.",
    ],
  },
  {
    keywords: ["grammar", "grammatical"],
    reply:
      "Band 7 grammar means control: complex sentences used without frequent errors. Master conditionals, relative clauses, and passive forms for data reports.",
    tips: [
      "Rewrite your best answer with only complex sentences.",
      "Check subject-verb agreement in every paragraph.",
      "Keep a personal error log of your three most common mistakes.",
    ],
  },
  {
    keywords: ["listening", "audio", "map", "part 1", "part 2", "part 3", "part 4"],
    reply:
      "Listening rewards prediction: read the questions before the audio starts, predict the type of word you need (number, name, noun), and stay alert for correction phrases like 'actually' or 'rather than'.",
    tips: [
      "Predict the word form from the gap around it.",
      "Write the first letter when you miss a word, then return.",
      "Do not stop for a missed answer — keep moving with the audio.",
    ],
  },
  {
    keywords: ["time", "timing", "pace", "slow", "finish"],
    reply:
      "Pacing is built in practice. For Reading, never spend more than 20 minutes on one passage; leave unknown questions and come back. For Writing, budget 20 minutes for Task 1 and 40 for Task 2.",
    tips: [
      "Use the in-app timers so pacing becomes automatic.",
      "Finish sections with 5 minutes to check obvious errors.",
      "Practise under exam timing at least twice a week.",
    ],
  },
  {
    keywords: ["band", "score", "improve", "target"],
    reply:
      "To move from your current band toward your target, focus on one weakness at a time. Your profile currently prioritises your weakest skill — train it with short, focused sessions before attempting full mocks.",
    tips: [
      "One focused skill session beats a random full section.",
      "Review every evaluation's weaknesses before the next session.",
      "Do a full mock every 2 weeks, not every day.",
    ],
  },
];

const fallbackTutorReply =
  "Great question. The most reliable IELTS strategy is to practise one skill in short focused sessions, review the AI evaluation afterwards, and retrain exactly the weakness it names. Would you like a study tip for reading, writing, speaking, or listening?";

export function tutorReply(profile: StudentLearningProfile, question: string): TutorReply {
  const lower = question.toLowerCase();
  const match =
    tutorKnowledge.find((entry) => entry.keywords.some((keyword) => lower.includes(keyword))) ?? null;

  if (!match) {
    return {
      reply: fallbackTutorReply,
      tips: [
        "Practise the weakest skill in 20-minute sessions.",
        "Always review the weakness map after evaluation.",
        "Record your speaking answers and listen back.",
        "Use the vocabulary trainer for daily collocations.",
      ],
    };
  }

  const personalized = match.reply.replace("your weakest skill", formatSkill(getWeakestSkill(profile)));
  return { reply: personalized, tips: match.tips };
}

export function getWeakestSkill(profile: StudentLearningProfile): Skill {
  return (Object.entries(profile.bands) as [Skill, number][]).sort((a, b) => a[1] - b[1])[0][0];
}

export interface DescriptorScore {
  score: number;
  level: string;
  comment: string;
}

export interface StudyStatistics {
  studyStreak: number;
  weeklyGoalHours: number;
  completedHours: number;
  practiceSessions: number;
  mockExams: number;
  confidenceLevel: number;
  accuracy: number;
}

export interface ReportData {
  overallBand: number;
  sectionScores: BandMap;
  strengths: string[];
  weaknesses: string[];
  progress: ProgressPoint[];
  recommendation: AdaptiveRecommendation;
  practiceSummary: string;
  grammar: DescriptorScore;
  vocabulary: DescriptorScore;
  fluency: DescriptorScore;
  coherence: DescriptorScore;
  statistics: StudyStatistics;
  recommendations: string[];
}

function descriptorFromLevel(level: string, fallback: number, commentFor: (score: number) => string): DescriptorScore {
  const clean = (level ?? "").toLowerCase();
  const score = clean.startsWith("c1")
    ? 88
    : clean.startsWith("b2+")
      ? 75
      : clean.startsWith("b2")
        ? 62
        : clean.startsWith("b1")
          ? 45
          : fallback;
  const levelLabel = score >= 85 ? "Advanced (C1)" : score >= 70 ? "B2+ Strong" : score >= 55 ? "B2 Developing" : score >= 40 ? "B1 Building" : "Foundation";
  return { score, level: levelLabel, comment: commentFor(score) };
}

function descriptorFromScore(score: number, skill: string): DescriptorScore {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const levelLabel = clamped >= 85 ? "Advanced (C1)" : clamped >= 70 ? "B2+ Strong" : clamped >= 55 ? "B2 Developing" : clamped >= 40 ? "B1 Building" : "Foundation";
  const comment =
    clamped >= 85
      ? `${skill} is at exam-day level — keep practising to hold it steady.`
      : clamped >= 70
        ? `Solid ${skill.toLowerCase()}; push accuracy to reach Band 7+ consistency.`
        : clamped >= 55
          ? `${skill} is developing; targeted sessions will move it fastest.`
          : `${skill} needs foundational work before band targets can rise.`;
  return { score: clamped, level: levelLabel, comment };
}

export function buildReport(profile: StudentLearningProfile): ReportData {
  const averageAccuracy = profile.practiceHistory.length
    ? Math.round(profile.practiceHistory.reduce((sum, entry) => sum + (entry.accuracy ?? 0), 0) / profile.practiceHistory.length)
    : Math.round((profile.currentBand / 9) * 100);
  const recommendation = getAdaptiveRecommendation(profile);
  const recommendations = [
    `Start with ${recommendation.module} — ${recommendation.reason}`,
    `Target weakness: ${recommendation.targetWeakness}. Expected lift: ${recommendation.expectedBandLift}.`,
    `Next session: ${recommendation.mode} at difficulty band ${recommendation.difficultyBand.toFixed(1)} (${recommendation.priority}).`,
    ...profile.weakQuestionTypes.slice(0, 2).map((type) => `Focused question-type work: ${type}.`),
    ...profile.mockHistory.slice(0, 1).map((entry) => `Your last full mock: overall ${entry.overallBand.toFixed(1)} — retest in 7 days.`),
  ].slice(0, 4);
  return {
    overallBand: profile.currentBand,
    sectionScores: profile.bands,
    strengths: profile.strongSignals,
    weaknesses: profile.weakQuestionTypes,
    progress: profile.progress,
    recommendation,
    practiceSummary: `${profile.practiceHistory.length} practice sessions and ${profile.mockHistory.length} full mocks reviewed by the AI examiner.`,
    grammar: descriptorFromLevel(
      profile.grammarLevel,
      (profile.bands.writing ?? 5.5) * 10,
      (score) => (score >= 70 ? "Sentence control is strong; maintain range in Task 2." : "Grammar range holds you below Band 7 — drill complex sentences."),
    ),
    vocabulary: descriptorFromLevel(
      profile.vocabularyLevel,
      (profile.bands.reading ?? 5.5) * 10,
      (score) => (score >= 70 ? "Academic range is working for you across sections." : "Collocation precision is the main vocabulary gap."),
    ),
    fluency: descriptorFromScore(profile.fluency, "Fluency"),
    coherence: descriptorFromScore(profile.coherence, "Coherence"),
    statistics: {
      studyStreak: profile.studyStreak,
      weeklyGoalHours: profile.weeklyGoalHours,
      completedHours: profile.completedHours,
      practiceSessions: profile.practiceHistory.length,
      mockExams: profile.mockHistory.length,
      confidenceLevel: profile.confidenceLevel,
      accuracy: averageAccuracy,
    },
    recommendations,
  };
}
