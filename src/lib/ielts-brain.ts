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
  typeLabel?: string;
  sectionLabel?: string;
  examSection?: string;
  topicLabel?: string;
  cardCategory?: string;
  bullets?: string[];
  suggestedMinutes?: number;
  difficultyBand?: number;
  adaptiveReason?: string;
}

export interface PracticalMockPaper {
  id: string;
  number: number;
  title: string;
  totalMinutes: number;
  sections: Partial<Record<Skill, PracticeSession>>;
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
  judges?: { judge: string; band: number }[];
  judgeAgreement?: number | null;
  confidence?: number | null;
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
    spotCorrection?: string;
speakingTeach?: {
      corrected?: string;
      lengthRule?: string;
      passage?: { text: string; tag: "good" | "improve"; tip?: string }[];
      originalPassage?: { text: string; tag: "good" | "improve"; tip?: string }[];
      lines?: { n: number; quote: string; problem: string; fix: string }[];
      grammar?: { sentence: string; issue: string; say: string }[];
      vocabulary?: { word: string; better: string; why: string }[];
      fillers?: { word: string; line: number }[];
      changes?: string[];
    } | null;
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

export interface TypedGuideStep {
  label: string;
  text: string;
}

export interface TypedGuide {
  group: string;
  name: string;
  official?: string;
  steps: TypedGuideStep[];
  band8: string;
  avoid: string;
  tip?: string;
  length?: string;
  relevance?: string;
  priority?: number;
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
  typeGuides?: TypedGuide[];
}

export const readingQuestionTypes = [
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
] as const;

export const listeningQuestionTypes = [
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
] as const;

export type ListeningQuestionType = (typeof listeningQuestionTypes)[number];

export const writingQuestionTypes = [
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
] as const;

export type WritingQuestionType = (typeof writingQuestionTypes)[number];

export const speakingQuestionTypes = [
  "Part 1 — Introduction & Interview (personal questions)",
  "Part 2 — Cue Card / Individual Long Turn",
  "Part 3 — Discussion (abstract questions)",
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
    "Map / Plan / Diagram Labelling",
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
      questionCount: 14,
      questionTypes: ["Matching Headings", "True / False / Not Given", "Yes / No / Not Given", "Sentence Completion"],
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
          id: "r2b",
          type: "multiple-choice",
          title: "Yes / No / Not Given",
          context:
            "Interviewed after the Lisbon trial, the team argued that pleasant public spaces, rather than shade alone, drive how long people choose to stay outside. They stopped short of linking the findings to any change in shopping habits.",
          prompt: "The researchers believe that factors other than shade influence how long people spend outside.",
          options: ["Yes", "No", "Not Given"],
          expectedFocus: "Judge the writer's opinion, not the facts themselves.",
          descriptorFocus: "Reading: distinguishing the writer's views (Yes/No) from factual claims (True/False).",
          correctAnswer: "Yes",
          explanation: "'The team argued that pleasant public spaces, rather than shade alone, drive how long people stay' — an opinion match, so Yes.",
          logic: "1. Question asks about the WRITER'S VIEW (belief). 2. The team 'argued' that pleasant public spaces, not shade alone, drive staying. 3. The text presents that as their belief -> Yes.",
          tip: "Yes/No items ask about opinions ('the writer believes'); True/False items ask about facts. Check WHICH one you are answering.",
          suggestions: "Underline 'argued', 'believes', 'claims' — opinion verbs mean Yes/No, fact verbs mean True/False.",
          bandAdvice: "Mixing Yes/No with True/False answer keys is one of the most common Band 6.5 reading errors.",
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
      questionTypes: ["Map / Plan / Diagram Labelling", "Multiple Choice", "Short Answer"],
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
      questionTypes: ["Form Completion", "Map / Plan / Diagram Labelling", "Matching", "Sentence Completion"],
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
      title: "Map / Plan / Diagram Labelling Focus",
      subtitle: "Targeted labelling and spatial language sets.",
      durationMinutes: 12,
      questionCount: 6,
      questionTypes: ["Map / Plan / Diagram Labelling", "Multiple Choice"],
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
          examSection: "Task 1",
          suggestedMinutes: 20,
          prompt:
            "The line graph shows changes in public transport use in three cities from 2000 to 2025. Summarise the main features and make comparisons where relevant. Write at least 150 words.",
          expectedFocus: "Include an overview, key trends, and selected data comparisons.",
          descriptorFocus: "Writing Task 1: achievement, coherence, lexical range, grammar accuracy.",
        },
        {
          id: "wf2",
          type: "essay",
          title: "Task 2 Essay",
          examSection: "Task 2",
          suggestedMinutes: 40,
          prompt:
            "Governments should spend more money on preventing environmental problems than on repairing damage after it occurs. To what extent do you agree or disagree? Write at least 250 words.",
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
      questionTypes: ["Part 2 — Cue Card / Individual Long Turn", "Fluency", "Pronunciation Awareness"],
      difficultyBand: 6.5,
      examinerIntent: "Encourage a two-minute answer with connected details rather than memorized phrases.",
      items: [
        {
          id: "s1",
          type: "speaking-cue",
          title: "Part 2 — Cue Card / Individual Long Turn",
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
      questionTypes: ["Part 1 — Introduction & Interview", "Part 2 — Cue Card / Individual Long Turn", "Part 3 — Discussion"],
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
      questionTypes: ["Part 1 — Introduction & Interview", "Part 2 — Cue Card / Individual Long Turn", "Part 3 — Discussion"],
      difficultyBand: 6.5,
      examinerIntent: "Practise all three parts within one topic area.",
      items: [
        {
          id: "st1",
          type: "speaking-cue",
          title: "Part 2 — Cue Card / Individual Long Turn",
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
  { id: "listening" as const, label: "Listening", minutes: 30, questions: 40, note: "4 sections · audio played once · +2 min to check answers" },
  { id: "reading" as const, label: "Reading", minutes: 60, questions: 40, note: "3 passages, no transfer time" },
  { id: "writing" as const, label: "Writing", minutes: 60, questions: 2, note: "Task 1 (20 min) + Task 2 (40 min)" },
  { id: "speaking" as const, label: "Speaking", minutes: 14, questions: 20, note: "12 + cue card + follow-up + 6" },
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
    { name: "Passage 1", detail: "Usually the easiest. Factual texts, typically around 13 questions. Spend ~15-18 minutes.", topic: "Descriptive / factual" },
    { name: "Passage 2", detail: "Medium difficulty. Argument and description, typically around 13 questions. Spend ~20 minutes.", topic: "Argumentative / discursive" },
    { name: "Passage 3", detail: "Hardest. Dense academic prose, typically around 14 questions. Spend ~22-25 minutes.", topic: "Abstract / academic" },
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
    { name: "Yes / No / Not Given", strategy: "Decide based on the writer's view, not facts you know from outside.", time: "~90 seconds each", mistakes: "Answering True/False instead of Yes/No; judging by your own opinion." },
    { name: "Matching Information", strategy: "Identify which paragraph: skim for the key noun phrase, then scan each paragraph.", time: "~75 seconds each", mistakes: "Choosing a paragraph that mentions the word but not the information." },
    { name: "Matching Headings", strategy: "Read the first and last sentence of each paragraph first, then the heading list.", time: "~60 seconds each", mistakes: "Matching a heading that only fits one detail, not the whole paragraph." },
    { name: "Matching Features", strategy: "Track names, dates and claims in a quick table as you read.", time: "~90 seconds each", mistakes: "Confusing which researcher/group said what." },
    { name: "Matching Sentence Endings", strategy: "Read the half-sentence, predict the end, then match meaning not exact words.", time: "~75 seconds each", mistakes: "Choosing an ending from a similar sentence that does not complete the logic." },
    { name: "Multiple Choice", strategy: "Skim the passage for keywords from each option before deciding.", time: "~60 seconds each", mistakes: "Choosing an option that is true in the text but does not answer the question." },
    { name: "Sentence Completion", strategy: "Predict the part of speech and word limit (e.g. ONE WORD ONLY) before reading.", time: "~75 seconds each", mistakes: "Using more than the word limit or copying extra words." },
    { name: "Summary Completion", strategy: "Read the finished summary first to predict each gap, then scan for paraphrases.", time: "~75 seconds each", mistakes: "Exceeding the word limit or copying a phrase that fits grammatically but not semantically." },
    { name: "Note Completion", strategy: "Notes are telegraphic: predict the missing fact type (name, number, time).", time: "~60 seconds each", mistakes: "Adding words the note slot cannot take." },
    { name: "Table Completion", strategy: "Read the row and column headers to predict each missing cell.", time: "~60 seconds each", mistakes: "Answering the wrong row or copying beyond the word limit." },
    { name: "Flow-chart Completion", strategy: "Read the arrows: each gap continues the previous stage.", time: "~60 seconds each", mistakes: "Jumping stages or exceeding the word limit." },
    { name: "Diagram Label Completion", strategy: "Use the diagram labels and arrows to predict what each label names.", time: "~60 seconds each", mistakes: "Labeling from general knowledge instead of the text." },
    { name: "Short Answer", strategy: "Scan for the question words and copy exact words from the text.", time: "~60 seconds each", mistakes: "Answering in your own words instead of the words in the text." },
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
    { name: "Form Completion", strategy: "Predict word type (name, number, time) by reading the gaps before the audio starts.", time: "~10 seconds each", mistakes: "Missing a plural 's' — it still counts." },
    { name: "Note Completion", strategy: "Read the note headings to predict each missing fact, then copy exactly as heard.", time: "~10 seconds each", mistakes: "Writing a synonym instead of the exact recorded word." },
    { name: "Map / Plan / Diagram Labelling", strategy: "Trace the route with your finger. Listen for 'turn left', 'opposite', 'past the X'.", time: "~15 seconds each", mistakes: "Choosing a label heard earlier, not the one at the destination." },
    { name: "Multiple Choice", strategy: "Underline the difference between options before each section plays.", time: "~15 seconds each", mistakes: "Picking an option with a word you heard even if it was said negatively." },
    { name: "Matching", strategy: "Predict which names or features will be matched, then write letters as you hear them.", time: "~15 seconds each", mistakes: "Answering from memory instead of the recording." },
    { name: "Table Completion", strategy: "Read row and column headers to predict the missing cell before the audio.", time: "~10 seconds each", mistakes: "Filling the right answer into the wrong row." },
    { name: "Flow-chart Completion", strategy: "Follow the arrows; each gap continues the previous stage as heard.", time: "~10 seconds each", mistakes: "Swapping the order of stages." },
    { name: "Summary Completion", strategy: "Read the summary as a whole; predict each gap before the audio plays.", time: "~15 seconds each", mistakes: "Exceeding the word limit or adding the article the summary does not allow." },
    { name: "Sentence Completion", strategy: "Predict how many words are allowed (e.g. ONE WORD ONLY) and keep the grammar correct.", time: "~10 seconds each", mistakes: "Adding a preposition the sentence does not need." },
    { name: "Short Answer", strategy: "Read the question and predict the fact type (place, price, time).", time: "~10 seconds each", mistakes: "Adding detail the question does not ask for." },
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
    { correct: "Task 1: Task Achievement", band: "25%" },
    { correct: "Task 2: Task Response", band: "25%" },
    { correct: "Coherence and Cohesion", band: "25%" },
    { correct: "Lexical Resource (Vocabulary)", band: "25%" },
    { correct: "Grammatical Range and Accuracy", band: "25%" },
  ],
  questionTypes: [
    { name: "Task 1 Charts & Graphs", strategy: "Open with an overview sentence, then group data (highest/lowest, trends) into 2-3 body paragraphs. Never list every number.", time: "20 minutes", mistakes: "Copying numbers without an overview or comparisons." },
    { name: "Task 1 Tables", strategy: "Group rows or columns (totals, highest/lowest) into 2-3 body paragraphs; compare across the table.", time: "20 minutes", mistakes: "Listing cells instead of comparing across rows." },
    { name: "Task 1 Mixed Charts", strategy: "Describe each visual separately, then add one overview that compares across both.", time: "20 minutes", mistakes: "Writing two separate answers instead of one balanced report." },
    { name: "Task 1 Process", strategy: "Describe the stages in time order with sequence markers (first, then, subsequently). Include the first and last stage; no opinion.", time: "20 minutes", mistakes: "Adding opinions or omitting a stage of the process." },
    { name: "Task 1 Maps / Plans", strategy: "Describe how the place changed between the two periods with location language (north of, opposite, adjacent).", time: "20 minutes", mistakes: "Describing only one period or adding invented changes." },
    { name: "Task 1 Diagrams", strategy: "Explain how the object works: name the parts, then describe the flow or mechanism in order.", time: "20 minutes", mistakes: "Describing the object instead of explaining how it works." },
    { name: "Task 2 Opinion", strategy: "State your position in the introduction and support it in every body paragraph; conclusion restates the position.", time: "40 minutes", mistakes: "Giving both sides without ever taking a clear position." },
    { name: "Task 2 Discussion", strategy: "Present both views fairly, then your own opinion in the conclusion or a dedicated paragraph.", time: "40 minutes", mistakes: "Burying the discussion in examples without explanation." },
    { name: "Task 2 Advantages / Disadvantages", strategy: "Balance one paragraph per side and conclude with a clear judgement of which outweighs.", time: "40 minutes", mistakes: "Discussing advantages only, ignoring disadvantages." },
    { name: "Task 2 Problem / Solution", strategy: "Name the problem with causes, then practical solutions linked to those causes.", time: "40 minutes", mistakes: "Listing solutions with no cause-and-effect link." },
    { name: "Task 2 Double Question", strategy: "Answer BOTH questions in separate body paragraphs, keeping equal weight between them.", time: "40 minutes", mistakes: "Answering only the first question fully." },
    { name: "Task 2 Mixed / Combined Question", strategy: "Map every clause of the prompt to a paragraph: views, your opinion and solutions all need coverage.", time: "40 minutes", mistakes: "Skipping the part of the question that feels harder to answer." },
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
  typeGuides: [
    {
      name: "Task 1 Charts & Graphs",
      group: "Writing tasks",
      relevance: "The most common Task 1 type — a line or bar chart appears in most test series. Learn this one first.",
      official: "Official task: \"The chart below shows… Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\" No opinion allowed.",
      length: "At least 150 words in 20 minutes · under 150 words risks Task Achievement",
      steps: [
        { label: "Overview", text: "One sentence naming the overall trend — \"Overall, sales rose steadily, with a sharp dip in 2020.\"" },
        { label: "Group", text: "Two body paragraphs by idea or time — \"Electric cars tripled, while petrol models fell by half.\"" },
        { label: "Compare", text: "Put figures against each other — \"By 2025, digital sales were double in-store sales.\"" },
      ],
      band8: "Every key feature covered once, with one clear overview sentence and no invented figures.",
      tip: "Minute-plan: 20 minutes — 2 planning (write the overview sentence first), 15 writing, 3 checking (word count and units).",
      avoid: "Listing every number, wandering commentary, and personal opinion.",
    },
    {
      name: "Task 1 Tables",
      group: "Writing tasks",
      relevance: "Common — nearly every test series includes a table at some point. Prepare the row-and-column grouping.",
      official: "Official task: \"The table below shows… Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"",
      length: "At least 150 words in 20 minutes · group rows, never list every cell",
      steps: [
        { label: "Overview", text: "Name the biggest and smallest values first — \"Overall, the lowest figures were in 2015, across every region.\"" },
        { label: "Group", text: "Two body paragraphs by rows — \"Urban areas grew fastest, while rural figures stayed flat.\"" },
        { label: "Cross-compare", text: "Compare across rows and columns — \"The north doubled the south's total.\"" },
      ],
      band8: "Two or three body paragraphs that group the data instead of itemising it.",
      tip: "Minute-plan: 20 minutes — 2 planning, 15 writing, 3 checking (every row mentioned once).",
      avoid: "A cell-by-cell list and comments about whether the data is good or bad.",
    },
    {
      name: "Task 1 Maps / Plans",
      group: "Writing tasks",
      relevance: "A fixture of recent test series — appears in roughly one test in three. Must-prepare.",
      official: "Official task: \"The maps below show a town centre in 2000 and today. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"",
      length: "At least 150 words in 20 minutes · both time periods must appear",
      steps: [
        { label: "Orient", text: "Name the place and both periods — \"The maps show the town centre in 2000 and today.\"" },
        { label: "Change", text: "One paragraph per map, biggest changes first — \"The car park became a pedestrian square.\"" },
        { label: "Locate", text: "Place the changes precisely — \"a new hotel went up to the north of the station.\"" },
      ],
      band8: "Position words (north of, opposite, adjacent to) used naturally, every change named once.",
      tip: "Minute-plan: 20 minutes — 2 planning (list 4-5 changes per map), 15 writing, 3 checking (both maps covered).",
      avoid: "Describing the maps' appearance instead of what changed between the periods.",
    },
    {
      name: "Task 1 Process",
      group: "Writing tasks",
      relevance: "Less frequent than charts, but appears regularly in some test series. Learn the passive flow.",
      official: "Official task: \"The diagram below shows the process for… Summarise the information by selecting and reporting the main features.\"",
      length: "At least 150 words in 20 minutes · one to two sentences per stage",
      steps: [
        { label: "Name", text: "Say what the process produces — \"The diagram shows how glass is recycled.\"" },
        { label: "Passive", text: "Describe stages in order with the passive — \"The glass is crushed and then melted at 1,400°C.\"" },
        { label: "Link", text: "Connect stages naturally — \"After sorting, the bottles are washed before crushing.\"" },
      ],
      band8: "A clear stage count and sequencing words (first, next, once, finally) with no steps missed.",
      tip: "Minute-plan: 20 minutes — 2 planning (number the stages), 15 writing, 3 checking (stage order exact).",
      avoid: "Commentary, opinions, and skipping any stage of the cycle.",
    },
    {
      name: "Task 1 Mixed Charts",
      group: "Writing tasks",
      relevance: "Occasional — two visuals in one question. Appears in some series; balance both visuals evenly.",
      official: "Official task: \"The charts below show… Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\"",
      length: "At least 150 words in 20 minutes · both visuals in equal depth",
      steps: [
        { label: "Each visual", text: "One body paragraph per visual — \"The bar chart shows… Meanwhile, the table records…\"" },
        { label: "One overview", text: "A single sentence covering both — \"Both visuals point to a steady shift towards streaming.\"" },
        { label: "Span", text: "Connect the two sets of data — \"The rise in the chart matches the table's higher totals.\"" },
      ],
      band8: "Equal paragraph weight across both visuals and one overview that touches both.",
      tip: "Minute-plan: 20 minutes — 2 planning, 15 writing (half the time per visual), 3 checking.",
      avoid: "Describing one visual in detail and dismissing the other in one line.",
    },
    {
      name: "Task 1 Diagrams",
      group: "Writing tasks",
      relevance: "The least common Task 1 — appears rarely. Cover it last, and only if the other types are solid.",
      official: "Official task: \"The diagram below shows how… Summarise the information by selecting and reporting the main features.\"",
      length: "At least 150 words in 20 minutes · parts ordered by location, not time",
      steps: [
        { label: "Parts", text: "Name the components in the diagram's order — \"The filter is fixed at the top of the tank.\"" },
        { label: "Location", text: "Describe position to position — \"pipes run from the inlet along the left wall.\"" },
        { label: "Function", text: "One sentence on how it works — \"water enters here and passes through the filter.\"" },
      ],
      band8: "Every labelled part identified once, with the working explained cleanly in order.",
      tip: "Minute-plan: 20 minutes — 2 planning, 15 writing, 3 checking (every label covered).",
      avoid: "Narrating a time sequence the diagram does not show.",
    },
    {
      name: "Task 2 Opinion",
      group: "Writing tasks",
      relevance: "The single most common Task 2 — around a quarter of all essays in most series. Learn this one first.",
      official: "Official task: \"To what extent do you agree or disagree? / Do you agree or disagree? Give reasons for your answer and include any relevant examples from your own knowledge or experience.\"",
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
    {
      name: "Task 2 Discussion",
      group: "Writing tasks",
      relevance: "Very common — appears alongside Opinion in most series. Discuss both views fairly.",
      official: "Official task: \"Discuss both views and give your own opinion. Give reasons for your answer and include any relevant examples.\"",
      length: "At least 250 words in 40 minutes · roughly 80 words per view + your opinion",
      steps: [
        { label: "Both sides", text: "One paragraph per view, fairly — \"Supporters argue that… Critics counter that…\"" },
        { label: "Your view", text: "Give your own position with a reason — \"On balance, I side with… because…\"" },
        { label: "Conclusion", text: "Settle it in one sentence — \"A blend of both approaches would serve most countries best.\"" },
      ],
      band8: "Both views developed with examples, and a personal opinion that is clearly expressed.",
      tip: "Minute-plan: 40 minutes — 3 planning (echoes both views), 32 writing, 5 checking (both sides present).",
      avoid: "Straw-manning one view or disappearing behind 'some people say'.",
    },
    {
      name: "Task 2 Advantages / Disadvantages",
      group: "Writing tasks",
      relevance: "Common — one of the most repeated themes across test series.",
      official: "Official task: \"What are the advantages and disadvantages of…? Give reasons for your answer and include any relevant examples.\"",
      length: "At least 250 words in 40 minutes · cover both sides, then a verdict",
      steps: [
        { label: "One side", text: "Advantages with an example — \"On the one hand, remote work cuts commuting time." },
        { label: "Other side", text: "Disadvantages with an example — \"On the other hand, it weakens team culture.\"" },
        { label: "Verdict", text: "A reasoned conclusion — \"The benefits outweigh the drawbacks when companies invest in team building.\"" },
      ],
      band8: "Balanced development of both sides and a clear reasoned judgement in the conclusion.",
      tip: "Minute-plan: 40 minutes — 3 planning (2 advantages + 2 disadvantages), 32 writing, 5 checking.",
      avoid: "One long side and a token flipped paragraph; keep parity.",
    },
    {
      name: "Task 2 Problem / Solution",
      group: "Writing tasks",
      relevance: "Regular — appears in nearly every test series in some form.",
      official: "Official task: \"What problems does… cause, and what solutions can you suggest? Give reasons for your answer and include any relevant examples.\"",
      length: "At least 250 words in 40 minutes · at least one problem and one solution, fully linked",
      steps: [
        { label: "Problem", text: "One paragraph naming the problem and its cause — \"Urban traffic congestion worsens as cities grow.\"" },
        { label: "Solution", text: "One paragraph with a realistic fix — \"Congestion charging, as seen in several capitals, cuts car use.\"" },
        { label: "Result", text: "Show what the solution achieves — \"Within a decade, commuting times could fall by a third.\"" },
      ],
      band8: "Every problem matched by a workable solution, each supported with a concrete example.",
      tip: "Minute-plan: 40 minutes — 3 planning (1-2 problems, 1-2 solutions), 32 writing, 5 checking.",
      avoid: "Listing problems without ever solving them, or vague fixes like 'the government should act'.",
    },
    {
      name: "Task 2 Double Question",
      group: "Writing tasks",
      relevance: "Occasional — two linked questions in one prompt. Some series feature it; answer BOTH fully.",
      official: "Official task: \"Why is… becoming more common? Do you think it is a positive or negative development? Give reasons for your answer.\"",
      length: "At least 250 words in 40 minutes · one paragraph per question",
      steps: [
        { label: "First question", text: "Answer it directly — \"It is becoming common because travel and remote tools got cheaper.\"" },
        { label: "Second question", text: "Answer it directly — \"Overall I see it as positive, since it widens access to jobs.\"" },
        { label: "Link", text: "Tie both answers in the conclusion — \"As the causes persist, its advantages are likely to grow.\"" },
      ],
      band8: "Both halves of the prompt answered fully — missing one question caps the band.",
      tip: "Minute-plan: 40 minutes — 3 planning (one idea per question), 32 writing, 5 checking (both answered).",
      avoid: "Answering only the first half or answering the second one vaguely.",
    },
    {
      name: "Task 2 Mixed / Combined Question",
      group: "Writing tasks",
      relevance: "The least common Task 2 — a combined prompt. Appears in a few series; map each clause to a paragraph.",
      official: "Official task: \"Some people think… while others think… Discuss both views, give your opinion, and say what the implications would be.\"",
      length: "At least 250 words in 40 minutes · every clause of the prompt gets a paragraph",
      steps: [
        { label: "Split", text: "Map each clause of the prompt — \"this question asks for both views, my opinion, and the consequences.\"" },
        { label: "Cover", text: "One requirement per paragraph — \"First the two views, then my position, then the outcomes.\"" },
        { label: "Close", text: "Tie everything together — \"Either way, the effect on planning is what we must weigh.\"" },
      ],
      band8: "Every requirement of the combined prompt handled — skipping one caps the band.",
      tip: "Minute-plan: 40 minutes — 3 planning (requirements inventory first), 32 writing, 5 checking against the prompt.",
      avoid: "Treating it as a single question and missing half the task.",
    },
  ],
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
    { correct: "Fluency & Coherence", band: "25%" },
    { correct: "Lexical Resource", band: "25%" },
    { correct: "Grammatical Range & Accuracy", band: "25%" },
    { correct: "Pronunciation", band: "25%" },
  ],
  questionTypes: [
    { name: "Part 1 — Introduction & Interview (personal questions)", strategy: "Answer directly, add a reason or example, then stop. Never one word.", time: "~20 sec each", mistakes: "Memorised answers that do not fit the question." },
    { name: "Part 2 — Cue Card / Individual Long Turn", strategy: "Use the 1 minute to write 4 keywords and tell the story with structure (what/when/where/why).", time: "1-2 minutes", mistakes: "Speaking for 30 seconds and stopping. Keep talking with details." },
    { name: "Part 3 — Discussion (abstract questions)", strategy: "Give an opinion, explain it, and give an example or compare.", time: "~60 sec each", mistakes: "Giving one-sentence answers to abstract questions." },
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
typeGuides: [
    {
      group: "Part 1",
      name: "Personal Information",
      official: "Official drill: the examiner names a topic — \"Let's talk about your home\" — then asks one question at a time, e.g. \"What kind of place is it?\" and \"Would you say it's a good place to live? (Why?)\". Give one short, clear answer per question (2-3 sentences), then stop.",
      length: "25-30 s · 2-3 sentences: the fact, one detail, stop",
      steps: [
        { label: "Answer", text: "State the fact in one clean line, like small talk: \"I'm from a small town in the south.\"" },
        { label: "One light detail", text: "Add a single colour, not a biography: \"It has a river running through it.\"" },
        { label: "Stop", text: "Close softly or just let it rest: \"So, yeah, quiet place, but home.\"" },
      ],
      band8: "Zoom out naturally: \"It shaped me more than I notice day to day.\"",
      avoid: "A memorised CV: birth year, family members, address — that sounds rehearsed.",
    },
    {
      group: "Part 1",
      name: "Preferences",
      official: "Official drill: \"Would you prefer...?\" or \"What sort of... would you most like?\" (real sample: \"What sort of accommodation would you most like to live in?\"). Pick one side, give the real reason, one honest contrast, stop.",
      length: "30 s · 3-4 sentences: choose + why + one contrast",
      steps: [
        { label: "Choose", text: "Pick one side straight away: \"If I had to choose, I'd go the apartment.\"" },
        { label: "Why", text: "Give the real reason, not a slogan: \"A flat is easier to keep, and I'm barely home anyway.\"" },
        { label: "Concede", text: "One honest contrast, then stop: \"Though I see the appeal of extras.\"" },
      ],
      band8: "Elevate it into a value: \"It seems I choose ease over size — in homes and in life.\"",
      avoid: "Fence-sitting: \"I like both equally\" on every question sounds trained to ignore the question.",
    },
    {
      group: "Part 1",
      name: "Likes / Dislikes",
      official: "Official drill: direct feeling questions like \"What do you like about living there?\". Name the thing, say what it does for you, one small story line, finish.",
      length: "30 s · 3 sentences: name + feeling + one small line",
      steps: [
        { label: "Name it", text: "\"I'm actually quite into cooking, in a lazy kind of way.\"" },
        { label: "Feel it", text: "\"It calms me after work — chopping vegetables is close to meditation.\"" },
        { label: "Small story", text: "\"Weekends, I make the same rice my grandfather taught me.\"" },
        { label: "Stop", text: "End with the point, not a list: \"It's less the dish, more the routine.\"" },
      ],
      band8: "Add the tension: \"I like it more as an escape than as a skill — there is a difference.\"",
      avoid: "Grocery lists: \"I like coffee, tea, pizza, books and films\" — no thread, no score.",
    },
    {
      group: "Part 1",
      name: "Habits / Routines",
      official: "Official drill: \"How often do you...?\" or \"When you do X, what do you do?\" Give the habit, the rhythm and the reason behind it - no timeline recital.",
      length: "30 s · 3-4 sentences: habit + rhythm + why",
      steps: [
        { label: "Habit + rhythm", text: "\"I've got into the habit of reading before I sleep.\"" },
        { label: "Why", text: "\"It helps me switch off — my phone just wakes the day back up.\"" },
        { label: "Change", text: "\"It started during lockdowns and just never left.\"" },
      ],
      band8: "Admit imperfection: \"I still break it on deadline weeks, and that's human.\"",
      avoid: "Clock answers: \"I wake at 6, I eat at 7\" with zero feeling — examiners hear robot routines.",
    },
    {
      group: "Part 1",
      name: "Past Experiences",
      official: "Official drill: \"When did you first...?\" or \"How long have you...?\" One short memory, one precise detail, one consequence - stay in the memory frame.",
      length: "30-40 s · 3-4 sentences: memory + detail + consequence",
      steps: [
        { label: "Recall", text: "\"When I was fourteen, I sold lemonade for a whole summer.\"" },
        { label: "Detail", text: "\"I did it to buy trainers my parents refused to pay for.\"" },
        { label: "Outcome", text: "\"I made enough by August — and I've been careful with money ever since.\"" },
      ],
      band8: "Reflect, don't report: \"The money mattered less than learning to organise myself.\"",
      avoid: "Binary 'interesting' and switching to present tense — stay in the memory frame.",
    },
    {
      group: "Part 1",
      name: "Reasons / Explanations",
      official: "Official drill: questions are marked \"(Why?)\" - e.g. \"Would you say it's a good place to live? (Why?)\". An honest reason, then the proof of it.",
      length: "30 s · 3 sentences: honest reason + the proof",
      steps: [
        { label: "Cause #1", text: "\"If you ask why I study English, the honest answer is work.\"" },
        { label: "Cause #2", text: "\"On top of that, I prefer watching films in the original.\"" },
        { label: "Small proof", text: "\"Last week a client asked me to review her English proposal — that's the everyday proof.\"" },
      ],
      band8: "Add the hidden layer: \"Beneath that, I suspect I'm proving something to myself.\"",
      avoid: "\"Because it's interesting\" with nothing behind it — dead language.",
    },
    {
      group: "Part 1",
      name: "Opinions about Familiar Topics",
      official: "Official drill: \"Would you say...?\" or \"What do you think of...?\" on an everyday topic - position, one reason, one concession.",
      length: "30 s · 3-4 sentences: position + why + concession",
      steps: [
        { label: "Position", text: "\"Honestly, I think breakfast is overrated.\"" },
        { label: "Why", text: "\"One meal shouldn't decide the whole morning for you.\"" },
        { label: "Flip / context", text: "\"But I know people who fall apart without it — routines are picky.\"" },
      ],
      band8: "Tie it to a principle: \"To me, food should serve life, not run it.\"",
      avoid: "Starting every sentence with 'I think I think' — trim the crutch.",
    },
    {
      group: "Part 2",
      name: "Person",
      official: "Official cue card: \"Describe a person...\" - You should say: who the person is / how you know them / what kind of person they are / and explain why you like them (the explain-point is what scores).",
      length: "full 2 min · 12-15 sentences (3-4 per point); give the 'why' point 4-5",
      steps: [
        { label: "Who", text: "Open with the person + why they came to mind: \"My grandmother — she runs the whole family.\"" },
        { label: "Qualities", text: "\"The first thing about her is that she never says no.\"" },
        { label: "Moment", text: "Your one real story tied to the card: once her neighbour's pipe burst at 2am and she was there with a mop." },
        { label: "Why", text: "\"She taught me that care is a skill, not a mood.\"" },
      ],
      band8: "Balance the portrait: \"She never says she's strong — she just keeps ironing.\"",
      tip: "In the real test: 60 seconds of notes, 1–2 minutes of talking, then one or two short rounding-off questions on the same person.",
      avoid: "A polished 'my mother' speech that ignores the actual card.",
    },
    {
      group: "Part 2",
      name: "Place",
      official: "Official cue card: \"Describe a place...\" - You should say: where it is / when and why you go / what you see and do there / and explain why you like it.",
      length: "full 2 min · 12-15 sentences (3-4 per point); senses carry the last point",
      steps: [
        { label: "What / where", text: "\"A hillside cafe that looks over the whole city.\"" },
        { label: "Senses", text: "\"There's a strong, soft wind — you hear it more than you feel it.\"" },
        { label: "First visit", text: "\"A friend dragged me there after my exams; I've been going ever since.\"" },
        { label: "What you do", text: "\"Sit with a notebook, watch the lights come on, drift.\"" },
      ],
      band8: "Turn it into a habit of mind: \"Height makes problems small — that's what it does.\"",
      tip: "Exam format: 1 minute to jot the card's points, speak 1–2 minutes, then a rounding-off question — \"Would you actually live there?\"",
      avoid: "'It's big and modern' and then 30 seconds of silence.",
    },
    {
      group: "Part 2",
      name: "Object / Thing",
      official: "Official cue card (British Council's own sample): \"Describe something you own which is very important to you\" - You should say: where you got it from / how long you have had it / what you use it for / and explain why it is important to you.",
      length: "full 2 min · 12-15 sentences; 3-4 per point, more on origin + why",
      steps: [
        { label: "What", text: "\"A small leather wallet, worn thin at the corners.\"" },
        { label: "Origin", text: "\"My brother gave it to me before he moved abroad.\"" },
        { label: "Use", text: "\"It's still practical — cards in, receipts out, photo of my parents inside.\"" },
        { label: "Why", text: "\"It's a pocket-sized time capsule.\"" },
      ],
      band8: "One physical oddity: \"It smells faintly of the old house — strange for a wallet.\"",
      tip: "Use the 1-minute note time to map the card's points, then talk 1–2 minutes and answer the rounding-off question. Don't just list features — tell where it came from and why it stays.",
      avoid: "Only features, no story: 'It's brown and it has a zip.'",
    },
    {
      group: "Part 2",
      name: "Experience / Event",
      official: "Official cue card: \"Describe an event...\" - You should say: when it happened / what happened / who was with you / and explain why it was memorable. A rounding-off question follows your talk.",
      length: "full 2 min · 12-15 sentences; the feeling must come back in the 'why'",
      steps: [
        { label: "Scene", text: "\"A night train, the first time I travelled alone.\"" },
        { label: "Happen", text: "\"Fields and small stations kept sliding past from 2am to dawn.\"" },
        { label: "Moment", text: "\"At 3am, watching the moon, I decided to stop worrying about life.\"" },
        { label: "Takeaway", text: "\"It proved I could rely on myself.\"" },
      ],
      band8: "Make it yours: \"I didn't understand the world better that night — I understood myself.\"",
      tip: "The examiner rounds off after your talk — \"Were you scared then?\" — answer in two sentences, not another story.",
      avoid: "Retelling it like a news report — feeling belongs in the middle.",
    },
    {
      group: "Part 2",
      name: "Activity",
      official: "Official cue card: \"Describe an activity...\" - You should say: what it is / when and where you do it / who you do it with / and explain why you keep doing it.",
      length: "full 2 min · 12-15 sentences: what, when, where, with whom, why",
      steps: [
        { label: "What", text: "\"Swimming — and only on cold mornings.\"" },
        { label: "When / with", text: "\"Forty minutes alone in the lane before work.\"" },
        { label: "Detail", text: "\"The water is cold for five minutes, then the protest stops.\"" },
        { label: "Why", text: "\"It forces me to breathe slowly — a thing I forget at a desk.\"" },
      ],
      band8: "Round it off: \"After it, even heavy days feel a notch lighter.\"",
      tip: "Use the 1-minute note time to jot the card's points, then keep the 1–2-minute talk going with small routines — precise place, time and feeling.",
      avoid: "One sentence and silence: 'I like running' — the card asks for a story.",
    },
    {
      group: "Part 2",
      name: "Future Plan",
      official: "Official cue card: \"Describe a plan...\" - You should say: what the plan is / when you made it / the first steps you have taken / and explain why it matters to you.",
      length: "full 2 min · 12-15 sentences: plan + steps + why it matters",
      steps: [
        { label: "What", text: "\"I want to open a small cooking workshop.\"" },
        { label: "Why now", text: "\"I've been teaching friends for two years and the kitchen is where I feel real.\"" },
        { label: "First steps", text: "\"I've already researched rent and picked the street.\"" },
        { label: "Feeling", text: "\"If it lands, Thursday nights next to a hot stove is where you'll find me.\"" },
      ],
      band8: "Keep the honesty: \"If the timing cracks, I'll start as a weekend class — same heart.\"",
      tip: "Expect a rounding-off question — \"What if the plan fails?\" — answer it in two sentences, with the same honesty.",
      avoid: "Dreamy 'one day I will' with no steps — plans need carriers.",
    },
    {
      group: "Part 3",
      name: "Opinion",
      official: "Official drill (from the published transcript): \"What do you think of this way of thinking?\" → \"And do you think this will change?\" → \"Can you tell me a little bit more about that?\" Each turn: position + one new example.",
      length: "45-60 s · 4-6 sentences: position + 2 supports + example",
      steps: [
        { label: "Claim", text: "\"In my opinion, a degree isn't the only key anymore.\"" },
        { label: "Defend", text: "\"The job market now rewards what you can do, not where you studied.\"" },
        { label: "Example", text: "\"A friend from a coding camp earns more than his degree-holding colleagues.\"" },
        { label: "Nuance", text: "\"Though for medicine, the certificate still gates entry.\"" },
      ],
      band8: "Wrap it: \"The degree lost its monopoly, not its value.\"",
      tip: "It's a two-way discussion — the examiner may say \"Can you tell me a little bit more about that?\" Have a second example ready.",
      avoid: "\"It depends\" — take a spine, then add nuance.",
    },
    {
      group: "Part 3",
      name: "Comparison",
      official: "Official drill (from the published questions): \"What kind of things give status to people?\" → \"Have things changed since your parents' time?\" Compare past vs now - both poles, then your own judgement.",
      length: "45-75 s · 5-7 sentences: past + now + reason + verdict",
      steps: [
        { label: "Poles", text: "\"Compare free time now to my parents' era.\"" },
        { label: "Contrast", text: "Then, leisure meant gathering; now it means a phone and a door." },
        { label: "Why", text: "\"Everything is streaming and homes have lost common living rooms.\"" },
        { label: "Judge", text: "\"I'd pick solo calm, but I'd fight for my Saturdays.\"" },
      ],
      band8: "\"In 1985 leisure was a group photo; now it's a single story.\"",
      tip: "Three crisp contrasts beat one long one — use before/after, here/there, young/old.",
      avoid: "Describing one side and forgetting the other — comparisons need both poles.",
    },
    {
      group: "Part 3",
      name: "Reasons / Causes",
      official: "Official drill: plain \"Why...?\" / \"Why do you think that is?\" - deliver the visible reason, the deeper reason, then one ripple.",
      length: "45-60 s · 4-6 sentences: visible + deeper + evidence + ripple",
      steps: [
        { label: "Visible cause", text: "\"The obvious reason is money — everything rides on it.\"" },
        { label: "Deeper cause", text: "\"Beneath it, status: nobody wants to look irresponsible.\"" },
        { label: "Evidence", text: "\"My cousin married later than he wanted — no flat, no wedding.\"" },
        { label: "Ripple", text: "\"And that pressure lands hardest on women.\"" },
      ],
      band8: "\"The real fuel isn't money — it's what money buys: respect.\"",
      tip: "One visible + one hidden cause, then a ripple. Examiner-approved layers.",
      avoid: "Answering with a single 'because' — one cause reads as shallow.",
    },
    {
      group: "Part 3",
      name: "Advantages / Disadvantages",
      official: "Official drill: \"What are the advantages and disadvantages of...?\" - one developed advantage, one developed disadvantage, then your verdict.",
      length: "45-60 s · 5-6 sentences: pro + con + verdict",
      steps: [
        { label: "Upside", text: "\"Working from home gives me back two hours a day.\"" },
        { label: "Downside", text: "\"It can isolate — after a week alone I start talking to plants.\"" },
        { label: "Weigh", text: "\"For the social it's a cost; for the tired it's medicine.\"" },
        { label: "Verdict", text: "\"I'd still choose it, and I'd treat isolation like a tax to pay.\"" },
      ],
      band8: "\"It costs your network but buys your attention — attention wins.\"",
      tip: "One developed pro and one con beat ten bullets of each.",
      avoid: "Perfectly balanced 'both have points' — land one clear side.",
    },
    {
      group: "Part 3",
      name: "Hypothetical",
      official: "Official drill: \"What would you do if...?\" / \"If you had the chance...\" - answer in conditionals and stay inside the imagined world until asked back to reality.",
      length: "45-60 s · 4-6 sentences: conditional + picture + personal",
      steps: [
        { label: "If...", text: "\"If I had the power to remove exams, I'd use it.\"" },
        { label: "Thing", text: "\"Because they test memory under stress, not understanding.\"" },
        { label: "Picture", text: "\"Two students — one slept badly, one truly knows. Only one passes. Which did we want to keep?\"" },
        { label: "Personal", text: "\"I'd start in my own old school, where failures still sit on the walls.\"" },
      ],
      band8: "Make it personal — conditionals in motion: \"I'd probably begin with the subject I loved, and see what it could be.\"",
      tip: "The examiner may extend the imaginary world — follow the \"what if\" deeper instead of retreating to reality.",
      avoid: "Answering as if the imagined world already exists — float in the conditional.",
    },
    {
      group: "Part 3",
      name: "Prediction / Future",
      official: "Official drill (from the published transcript): \"And do you think this will change? In the future...\" - direction, why, a sign you can see now, then what follows.",
      length: "45-60 s · 4-6 sentences: forecast + why + sign + consequence",
      steps: [
        { label: "Direction", text: "\"I think AI won't replace us — it will change the work division.\"" },
        { label: "Why", text: "\"Machines cover the ifs; judgment calls stay human.\"" },
        { label: "Sign", text: "\"In hospitals it's already split — the scan reads, the human speaks.\"" },
        { label: "Consequence", text: "\"In ten years the split will look wildly different per profession.\"" },
      ],
      band8: "Soft certainty pays: \"It won't be a slow crawl either — some jobs will crack overnight.\"",
      tip: "Predict + proof (a sign you can see) + chain.",
      avoid: "Fortune-teller certainty: 'It 100% will not change' — soften the claim.",
    },
    {
      group: "Part 3",
      name: "Effects / Consequences",
      official: "Official drill: \"How does it affect people?\" / \"What are the consequences?\" - immediate effect, long-term effect, the chain, then who feels it.",
      length: "45-60 s · 4-6 sentences: immediate + slow + chain + who",
      steps: [
        { label: "Immediate", text: "\"Right now, notifications fracture attention every few minutes.\"" },
        { label: "Slow", text: "\"The long-term bill is background tiredness.\"" },
        { label: "Chain", text: "Tired focus, shallow reading, slower learning — at every age." },
        { label: "Who", text: "\"Students feel it first; families feel it last.\"" },
      ],
      band8: "\"It's not a noise problem, it's an attention inheritance problem\" — the chain is the band-8.",
      tip: "Short-term to long-term to who feels it. Let the chain breathe.",
      avoid: "Only saying 'bad' without saying why, for whom, or how deep.",
    },
    {
      group: "Part 3",
      name: "Problem / Solution",
      official: "Official drill: \"What can be done about this?\" / \"How should we deal with...?\" - the root, why it stays, one small fix, and who acts.",
      length: "45-60 s · 4-6 sentences: root + why + small fix + who",
      steps: [
        { label: "Root", text: "\"The real problem isn't plastic — it's convenience.\"" },
        { label: "Why it persists", text: "\"Nobody chooses to pollute; they pick the lazy wrap.\"" },
        { label: "Fix", text: "\"Bag fees did more than a year of ads. That's the shape of a fix.\"" },
        { label: "Who acts", text: "\"The real change comes from shops, not speeches.\"" },
      ],
      band8: "Principle-first: \"Make the good choice the lazy one — that's the policy.\"",
      tip: "Root, why it stays, one small working fix. That out-says vague essay answers.",
      avoid: "'The government should fix it' with zero detail — say who, and how.",
    },
  ],
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
  return Math.max(2.5, Math.min(9, roundToHalf(value)));
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
        return ["Matching Information", "Matching Headings", "Matching Features", "Matching Sentence Endings"].includes(type);
      }
      if (item.type === "multiple-choice") return type === "Multiple Choice";
      if (item.type === "short-answer") {
        return ["Short Answer", "Sentence Completion", "Summary Completion", "Note Completion", "Table Completion", "Flow-chart Completion", "Diagram Label Completion"].includes(type);
      }
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
        return ["Form Completion", "Note Completion", "Sentence Completion", "Table Completion", "Flow-chart Completion", "Summary Completion", "Short Answer", "Map / Plan / Diagram Labelling"].includes(type);
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
    weaknesses.add(session.questionTypes.includes("Map / Plan / Diagram Labelling") ? "Map / Plan / Diagram Labelling" : "Distractor control");
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
  const module = session.module;
  if (module === "reading" || module === "listening") {
    // The band must come from what the student actually got right, using the
    // official IELTS curve — never from mere completion or word volume.
    const feedback = buildLocalItemFeedback(session, answers);
    const total = feedback.length;
    const correct = feedback.filter((item) => item.isCorrect).length;
    if (total === 0) return profile.bands[module];
    const difficultyAdjustment = session.difficultyBand >= profile.bands[module] + 0.75 ? -0.1 : 0.1;
    return clampBand(bandFromCount(module, correct, total) + difficultyAdjustment);
  }

  const text = Object.values(answers)
    .filter((answer) => answer && answer.trim())
    .join("\n\n");
  const stats = analyzeText(text);
  const words = stats.wordCount;
  if (module === "writing") {
    let band = 5.0;
    if (words >= 250) band += 1.0;
    else if (words >= 150) band += 0.5;
    else if (words < 60) band = 3.5;
    if (stats.averageSentenceWords >= 14) band += 0.5;
    if (stats.paragraphCount >= 3) band += 0.5;
    if (stats.uniqueWordRatio >= 55) band += 0.5;
    else if (stats.uniqueWordRatio < 45) band -= 0.5;
    return clampBand(band);
  }

  let band = 5.0;
  if (words >= 60) band += 1.0;
  else if (words >= 30) band += 0.5;
  else band -= 0.5;
  const linkers = (["because", "however", "therefore", "for example", "although", "despite", "whereas"].filter((word) =>
    text.toLowerCase().includes(word),
  )).length;
  const conditionals = (["if", "would", "could", "should", "might", "may"].filter((word) =>
    text.toLowerCase().includes(word),
  )).length;
  if (linkers >= 2) band += 0.5;
  if (conditionals >= 1) band += 0.5;
  return clampBand(band);
}

function normalizeAnswer(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(/[.,;:'"!?()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchTolerant(user: string, correct: string): boolean {
  if (!user || !correct) return false;
  if (user === correct) return true;
  let u = user;
  let c = correct;
  for (const prefix of ["the ", "a ", "an "]) {
    if (u.startsWith(prefix) && !c.startsWith(prefix)) u = u.slice(prefix.length);
    else if (c.startsWith(prefix) && !u.startsWith(prefix)) c = c.slice(prefix.length);
  }
  if (u === c) return true;
  if (u.length > 3 && u.endsWith("s") && !c.endsWith("s") && u.slice(0, -1) === c) return true;
  if (c.length > 3 && c.endsWith("s") && !u.endsWith("s") && c.slice(0, -1) === u) return true;
  return false;
}

// Official IELTS raw-score -> band curves (Academic Reading and Listening,
// out of 40). Partial sessions are scaled to the 40-mark equivalent so the
// offline brain agrees with the backend and the tables the UI advertises.
const OFFICIAL_COUNT_BANDS: Record<"reading" | "listening", [number, number][]> = {
  reading: [
    [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0], [27, 6.5],
    [23, 6.0], [19, 5.5], [15, 5.0], [13, 4.5], [10, 4.0], [8, 3.5],
    [6, 3.0], [0, 2.5],
  ],
  listening: [
    [39, 9.0], [37, 8.5], [35, 8.0], [33, 7.5], [30, 7.0], [26, 6.5],
    [23, 6.0], [18, 5.5], [16, 5.0], [13, 4.5], [11, 4.0], [10, 3.5],
    [9, 3.0], [0, 2.5],
  ],
};

function bandFromCount(skill: Skill, correct: number, total: number): number {
  const table = OFFICIAL_COUNT_BANDS[skill === "listening" ? "listening" : "reading"];
  const scaled = total > 0 ? Math.round((correct / total) * 40) : 0;
  for (const [threshold, band] of table) {
    if (scaled >= threshold) return band;
  }
  return table[table.length - 1][1];
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
    const optionMatched = Boolean(item.options?.some((option) => normalizeAnswer(option) === userNorm));
    const isCorrect = Boolean(userNorm && (matchTolerant(userNorm, idealNorm) || (optionMatched && matchTolerant(userNorm, idealNorm))));
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
  const feedback = buildLocalItemFeedback(session, answers);
  const totalItems = feedback.length;
  const correctItems = feedback.filter((item) => item.isCorrect).length;
  const accuracy =
    session.module === "writing" || session.module === "speaking"
      ? Math.round((predictedBand / 9) * 100)
      : Math.round((correctItems / Math.max(1, totalItems)) * 100);
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
  sections?: Partial<Record<Skill, PracticeSession>>,
): { result: MockExamResult; updatedProfile: StudentLearningProfile } {
  const mockSkills: Skill[] = ["listening", "reading", "writing", "speaking"];
  const sectionTiming: Record<string, TimingDetail> = {};
  const speedScores: number[] = [];
  const tmScores: number[] = [];
  mockSkills.forEach((skill) => {
    const installed = skill === "speaking" ? 20 : skill === "writing" ? 2 : 40;
    const metrics = computeTimingMetrics(skill, installed, answers, OFFICIAL_SECTION_MINUTES[skill], timing?.[skill]);
    sectionTiming[skill] = metrics.timing;
    speedScores.push(metrics.speed.score);
    tmScores.push(metrics.timeManagement.score);
  });
  const overallSpeed = Math.round(speedScores.reduce((sum, score) => sum + score, 0) / speedScores.length);
  const overallTm = Math.round(tmScores.reduce((sum, score) => sum + score, 0) / tmScores.length);
  const answerVolume = answerWordCount(answers);
  const answeredItems = Object.values(answers).filter((answer) => answer.trim()).length;

  const sectionBands: BandMap = { ...profile.bands };
  const sectionAccuracy: Partial<Record<Skill, number>> = {};
  const sectionCorrect: Partial<Record<Skill, number>> = {};
  const hasSections = sections && Object.keys(sections).length > 0;

  if (hasSections) {
    // Offline grading with the real paper: per-section accuracy comes from
    // the answer keys, and bands use the official IELTS curve per section.
    mockSkills.forEach((skill) => {
      const session = sections![skill];
      if (!session || !session.items?.length) return;
      const feedback = buildLocalItemFeedback(session, answers);
      const total = feedback.length;
      const correct = feedback.filter((item) => item.isCorrect).length;
      sectionCorrect[skill] = correct;
      sectionAccuracy[skill] = Math.round((correct / total) * 100);
      if (skill === "reading" || skill === "listening") {
        sectionBands[skill] = clampBand(bandFromCount(skill, correct, total));
      } else {
        const text = session.items
          .map((item) => answers[item.id])
          .filter((answer): answer is string => Boolean(answer && answer.trim()))
          .join("\n\n");
        const words = analyzeText(text).wordCount;
        if (skill === "writing") {
          let band = 5.0;
          if (words >= 250) band += 1.0;
          else if (words >= 150) band += 0.5;
          else if (words < 60) band = 3.5;
          const stats = analyzeText(text);
          if (stats.averageSentenceWords >= 14) band += 0.5;
          if (stats.paragraphCount >= 3) band += 0.5;
          if (stats.uniqueWordRatio >= 55) band += 0.5;
          else if (stats.uniqueWordRatio < 45) band -= 0.5;
          sectionBands[skill] = clampBand(band);
        } else {
          let band = 5.0;
          if (words >= 60) band += 1.0;
          else if (words >= 30) band += 0.5;
          else band -= 0.5;
          const linkers = (["because", "however", "therefore", "for example", "although", "despite", "whereas"].filter((word) =>
            text.toLowerCase().includes(word),
          )).length;
          const conditionals = (["if", "would", "could", "should", "might", "may"].filter((word) =>
            text.toLowerCase().includes(word),
          )).length;
          if (linkers >= 2) band += 0.5;
          if (conditionals >= 1) band += 0.5;
          sectionBands[skill] = clampBand(band);
        }
      }
    });
  } else {
    // No paper available offline: bands must NOT be fabricated from
    // participation. Keep profile bands and say so explicitly.
    const noData: Partial<Record<Skill, number>> = {};
    mockSkills.forEach((skill) => {
      noData[skill] = undefined;
    });
    Object.assign(sectionAccuracy, noData);
  }

  const bands: BandMap = sectionBands;
  const overallBand = calculateOverallBand(bands);

  const sortedBands = (Object.entries(bands) as [Skill, number][]).sort((a, b) => b[1] - a[1]);
  const [bestSkill, bestBand] = sortedBands[0];
  const [worstSkill, worstBand] = sortedBands[sortedBands.length - 1];

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
  if (!hasSections) {
    weaknesses.add("Offline mode: section answer keys were unavailable, so bands reflect your profile rather than this attempt. Connect the backend for band-accurate results.");
  }

  const sectionFeedback: Record<Skill, string> = {
    listening: sectionAccuracy.listening !== undefined
      ? `Listening: ${sectionAccuracy.listening}% correct, estimated band ${bands.listening.toFixed(1)}.`
      : "Listening answers could not be graded offline against the paper.",
    reading: sectionAccuracy.reading !== undefined
      ? `Reading: ${sectionAccuracy.reading}% correct, estimated band ${bands.reading.toFixed(1)}.`
      : "Reading answers could not be graded offline against the paper.",
    writing: sectionAccuracy.writing !== undefined
      ? `Writing: text-length and criteria heuristics put your answer at band ${bands.writing.toFixed(1)}.`
      : "Writing answers could not be graded offline against the paper.",
    speaking: sectionAccuracy.speaking !== undefined
      ? `Speaking: response length and language signals put your answers at band ${bands.speaking.toFixed(1)}.`
      : "Speaking answers could not be graded offline against the paper.",
  };
  const accuracySections = mockSkills
    .map((skill) => sectionAccuracy[skill])
    .filter((value): value is number => value !== undefined);
  const overallAccuracy = accuracySections.length
    ? Math.round(accuracySections.reduce((sum, value) => sum + value, 0) / accuracySections.length)
    : Math.round((overallBand / 9) * 100);

  const result: MockExamResult = {
    id: `mock-${Date.now()}`,
    listeningBand: bands.listening,
    readingBand: bands.reading,
    writingBand: bands.writing,
    speakingBand: bands.speaking,
    overallBand,
    accuracy: overallAccuracy,
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
    sectionFeedback,
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
        listeningBand: bands.listening,
        readingBand: bands.reading,
        writingBand: bands.writing,
        speakingBand: bands.speaking,
        summary: hasSections ? "Computer-delivered mock completed with answer-key grading." : "Mock completed offline; bands reflect the profile because the paper could not be graded.",
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
  source?: string;
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
