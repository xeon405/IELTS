"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  Gauge,
  GraduationCap,
  Headphones,
  Layers,
  LineChart,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserRound,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AnswerSheetInput,
  ExamClock,
  QuestionNavigator,
  SectionTransition,
  WordCounter,
  useCountdown,
} from "@/components/exam-ui";
import {
  getAdaptiveBrainRecommendation,
  submitDiagnostic,
  submitMockEvaluation,
  submitPracticeEvaluation,
} from "@/lib/brain-client";
import {
  calculateOverallBand,
  createDefaultLearningProfile,
  createDiagnosticProfile,
  createPracticeSession,
  diagnosticQuestions,
  estimateDiagnosticFromAnswers,
  evaluateMockExam,
  evaluatePracticeSession,
  formatSkill,
  getAdaptiveRecommendation,
  getBandGap,
  getPracticeBlueprints,
  officialMockSections,
  type AdaptiveRecommendation,
  type EvaluationResult,
  type MockExamResult,
  type PracticeItem,
  type PracticeSession,
  type Skill,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

type ViewId = "dashboard" | Skill | "mock" | "reports" | "profile" | "settings";
type MockSection = "intro" | Skill | "transition" | "result";

const storageKey = "ai-ielts-examiner-profile";
const skillOrder: Skill[] = ["listening", "reading", "writing", "speaking"];

const navItems: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "listening", label: "Listening", icon: Headphones },
  { id: "writing", label: "Writing", icon: PenLine },
  { id: "speaking", label: "Speaking", icon: Mic },
  { id: "mock", label: "Full Mock", icon: Trophy },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

const moduleConfig: Record<
  Skill,
  {
    label: string;
    icon: LucideIcon;
    accent: string;
    soft: string;
    ring: string;
    gradient: string;
    description: string;
    modes: string[];
  }
> = {
  reading: {
    label: "Reading",
    icon: BookOpen,
    accent: "bg-[#245f5a] text-white",
    soft: "bg-[#e4f0ea] text-[#245f5a]",
    ring: "ring-[#245f5a]/25",
    gradient: "from-[#d7eadf] via-[#f8f0d9] to-[#f5ddae]",
    description: "Adaptive passages for headings, inference, detail, and timing.",
    modes: ["Full Reading Section", "Passage 1", "Passage 2", "Passage 3", "Individual Question Types"],
  },
  listening: {
    label: "Listening",
    icon: Headphones,
    accent: "bg-[#295d88] text-white",
    soft: "bg-[#deebf2] text-[#295d88]",
    ring: "ring-[#295d88]/25",
    gradient: "from-[#dceaf2] via-[#eff5e9] to-[#f8e9c6]",
    description: "Four-part listening practice with distractors and map language.",
    modes: ["Full Listening Section", "Part 1", "Part 2", "Part 3", "Part 4", "Individual Question Types"],
  },
  writing: {
    label: "Writing",
    icon: PenLine,
    accent: "bg-[#8b5732] text-white",
    soft: "bg-[#f3e3d4] text-[#8b5732]",
    ring: "ring-[#8b5732]/25",
    gradient: "from-[#f4ddc8] via-[#f7edd7] to-[#dbe8dc]",
    description: "Task 1 and Task 2 workflows evaluated by band descriptors.",
    modes: ["Full Writing Section", "Task 1", "Task 2", "Essay Types"],
  },
  speaking: {
    label: "Speaking",
    icon: Mic,
    accent: "bg-[#2f7151] text-white",
    soft: "bg-[#e0efe4] text-[#2f7151]",
    ring: "ring-[#2f7151]/25",
    gradient: "from-[#d9ecd9] via-[#eef0d2] to-[#f6dfbf]",
    description: "Interview, cue-card, and Part 3 extension with examiner feedback.",
    modes: ["Full Speaking Section", "Part 1", "Part 2", "Part 3", "Topic Practice"],
  },
};

const sampleResponses: Record<Skill, string> = {
  reading:
    "The paragraph is mainly about connected shade networks, not isolated trees. The claim about shop revenue is false because the text only proves foot traffic increased. The missing word is planning.",
  listening:
    "The compost area is the second fenced space on the right after the tool shed. Visitors now pay 7 pounds. They must bring gloves or a water bottle.",
  writing:
    "Plan: one paragraph on overdependence, one on independence, and my opinion that technology helps when schools teach self-management. Example: students using online feedback can revise essays independently. Full essay: Technology can create passive habits if students copy answers without thinking, but it can also make learners more independent when it gives access to explanations, practice, and feedback. In my view, the result depends on how teachers design tasks. If students must compare sources, write reflections, and correct their own errors, devices become tools for autonomy rather than shortcuts.",
  speaking:
    "I usually concentrate best in a small public library near my apartment. It is quiet but not completely silent, so I feel calm without feeling isolated. I normally read articles there, plan essays, and review vocabulary. The place helps me focus because everyone around me is also working, and that atmosphere keeps me disciplined. After spending time there, I feel organized and more confident about my study plan.",
};

function isSkill(view: ViewId): view is Skill {
  return view === "reading" || view === "listening" || view === "writing" || view === "speaking";
}

function getSampleAnswers(session: PracticeSession): Record<string, string> {
  return Object.fromEntries(
    session.items.map((item, index) => {
      if (item.options?.length) {
        return [item.id, item.options[Math.min(1, item.options.length - 1)]];
      }

      return [item.id, `${sampleResponses[session.module]} ${index === 0 ? "" : "This answer extends the same reasoning with a clearer example."}`];
    }),
  );
}

function completionPercent(session: PracticeSession, answers: Record<string, string>): number {
  if (session.items.length === 0) return 0;
  const answered = session.items.filter((item) => answers[item.id]?.trim()).length;
  return Math.round((answered / session.items.length) * 100);
}

export default function Home() {
  const [profile, setProfile] = useState<StudentLearningProfile>(() => createDefaultLearningProfile());
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [session, setSession] = useState<PracticeSession>(() =>
    createPracticeSession(createDefaultLearningProfile()),
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [mockSection, setMockSection] = useState<MockSection>("intro");
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);
  const [mockAnswers, setMockAnswers] = useState<Record<string, string>>({});
  const [mockResult, setMockResult] = useState<MockExamResult | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [needsDiagnostic, setNeedsDiagnostic] = useState(false);
  const [diagnosticName, setDiagnosticName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("ielts_user");
      return raw ? (JSON.parse(raw).name ?? "") : "";
    } catch {
      return "";
    }
  });
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation>(() =>
    getAdaptiveRecommendation(createDefaultLearningProfile()),
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StudentLearningProfile;
        setProfile(parsed);
        setSession(createPracticeSession(parsed));
      } else {
        setNeedsDiagnostic(true);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
      setNeedsDiagnostic(true);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [hasLoaded, profile]);

  const bandGap = useMemo(() => getBandGap(profile), [profile]);

  useEffect(() => {
    let cancelled = false;

    async function syncRecommendation() {
      try {
        const response = await getAdaptiveBrainRecommendation(profile);
        if (!cancelled) {
          setRecommendation(response.recommendation);
        }
      } catch {
        if (!cancelled) {
          setRecommendation(getAdaptiveRecommendation(profile));
        }
      }
    }

    void syncRecommendation();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  async function launchPractice(module?: Skill, mode?: string) {
    try {
      const response = await getAdaptiveBrainRecommendation(profile, {
        module,
        mode,
        generateSession: true,
      });
      setSession(response.session);
      setAnswers({});
      setEvaluation(null);
      setRecommendation(response.recommendation);
      setActiveView(response.session.module);
    } catch {
      const nextSession = createPracticeSession(profile, module, mode);
      setSession(nextSession);
      setAnswers({});
      setEvaluation(null);
      setRecommendation(getAdaptiveRecommendation(profile));
      setActiveView(nextSession.module);
    }
  }

  async function submitPractice() {
    try {
      const result = await submitPracticeEvaluation(profile, session, answers);
      setEvaluation(result.evaluation);
      setProfile(result.updatedProfile);
      setRecommendation(getAdaptiveRecommendation(result.updatedProfile));
    } catch {
      const result = evaluatePracticeSession(profile, session, answers);
      setEvaluation(result.evaluation);
      setProfile(result.updatedProfile);
      setRecommendation(getAdaptiveRecommendation(result.updatedProfile));
    }
  }

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function resetDemo() {
    const fresh = createDefaultLearningProfile();
    setProfile(fresh);
    setSession(createPracticeSession(fresh));
    setAnswers({});
    setEvaluation(null);
    setMockSection("intro");
    setPendingSkill(null);
    setMockAnswers({});
    setMockResult(null);
  }

  function startMockExam() {
    setMockSection("listening");
    setMockAnswers({});
    setMockResult(null);
    setActiveView("mock");
  }

  function fillMockDemo() {
    const filled: Record<string, string> = {};
    for (let index = 1; index <= 40; index += 1) {
      filled[`listening-${index}`] = index % 4 === 0 ? "B" : "A";
      filled[`reading-${index}`] = index % 5 === 0 ? "Not Given" : "True";
    }
    filled["writing-task-1"] =
      "The chart shows a steady increase in public transport use in two cities, while the third city remains comparatively stable. Overall, the strongest growth appears after 2015, especially in the city that invested in faster rail links.";
    filled["writing-task-2"] =
      "Preventing environmental damage is usually more effective than paying to repair it later. Although emergency repair is sometimes necessary, prevention protects public health, saves money, and encourages industries to plan responsibly. For example, flood defenses and clean energy incentives can reduce the scale of future damage.";
    filled["speaking-part-1"] = "I use study and transport apps most often because they help me organize my day.";
    filled["speaking-part-2"] = sampleResponses.speaking;
    filled["speaking-part-3"] =
      "Schools should teach flexible learning habits because many future skills will change. Students need to know how to research, test ideas, and improve from feedback instead of memorizing one fixed method.";
    setMockAnswers((current) => ({ ...filled, ...current }));
  }

  async function finishMockExam() {
    try {
      const result = await submitMockEvaluation(profile, mockAnswers);
      setMockResult(result.result as MockExamResult);
      setProfile(result.updatedProfile);
      setRecommendation(getAdaptiveRecommendation(result.updatedProfile));
      setMockSection("result");
    } catch {
      const result = evaluateMockExam(profile, mockAnswers);
      setMockResult(result.result);
      setProfile(result.updatedProfile);
      setRecommendation(getAdaptiveRecommendation(result.updatedProfile));
      setMockSection("result");
    }
  }

  function moveMockForward() {
    if (mockSection === "intro" || mockSection === "result") {
      startMockExam();
      return;
    }

    const index = skillOrder.indexOf(mockSection);
    if (index < skillOrder.length - 1) {
      setPendingSkill(skillOrder[index + 1]);
      setMockSection("transition");
      return;
    }

    finishMockExam();
  }

  function startNextSection() {
    if (pendingSkill) {
      setMockSection(pendingSkill);
      setPendingSkill(null);
    }
  }

  async function completeDiagnostic() {
    setDiagnosticLoading(true);
    try {
      const { profile: created } = await submitDiagnostic(diagnosticName, diagnosticAnswers);
      setProfile(created);
      setSession(createPracticeSession(created));
      setRecommendation(getAdaptiveRecommendation(created));
      setNeedsDiagnostic(false);
      setActiveView("dashboard");
    } catch {
      const created = createDiagnosticProfile(diagnosticName, estimateDiagnosticFromAnswers(diagnosticAnswers));
      setProfile(created);
      setSession(createPracticeSession(created));
      setRecommendation(getAdaptiveRecommendation(created));
      setNeedsDiagnostic(false);
      setActiveView("dashboard");
    } finally {
      setDiagnosticLoading(false);
    }
  }

  function skipDiagnostic() {
    const fresh = createDefaultLearningProfile();
    setProfile(fresh);
    setSession(createPracticeSession(fresh));
    setRecommendation(getAdaptiveRecommendation(fresh));
    setNeedsDiagnostic(false);
    setActiveView("dashboard");
  }

  const content = (() => {
    if (activeView === "dashboard") {
      return (
        <Dashboard
          profile={profile}
          recommendation={recommendation}
          bandGap={bandGap}
          onLaunchPractice={launchPractice}
          onStartMock={startMockExam}
        />
      );
    }

    if (isSkill(activeView)) {
      return (
        <PracticeModule
          module={activeView}
          profile={profile}
          session={session}
          answers={answers}
          evaluation={evaluation}
          onAnswer={updateAnswer}
          onLaunch={launchPractice}
          onSubmit={submitPractice}
          onUseSample={() => setAnswers(getSampleAnswers(session))}
        />
      );
    }

    if (activeView === "mock") {
      return (
        <MockExam
          section={mockSection}
          answers={mockAnswers}
          result={mockResult}
          onStart={startMockExam}
          onAnswer={(id, value) => setMockAnswers((current) => ({ ...current, [id]: value }))}
          onFillDemo={fillMockDemo}
          onNext={moveMockForward}
        />
      );
    }

    if (activeView === "reports") {
      return <Reports profile={profile} recommendation={recommendation} />;
    }

    if (activeView === "profile") {
      return <LearningProfile profile={profile} recommendation={recommendation} />;
    }

    return <SettingsPanel profile={profile} setProfile={setProfile} onReset={resetDemo} />;
  })();

  if (!hasLoaded) {
    return null;
  }

  if (needsDiagnostic) {
    return (
      <main className="exam-grid min-h-screen overflow-hidden bg-[#f5eddc] text-[#17342f]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-slow-drift absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
          <div className="animate-slow-drift absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl [animation-delay:2s]" />
        </div>
        <DiagnosticView
          name={diagnosticName}
          answers={diagnosticAnswers}
          loading={diagnosticLoading}
          onNameChange={setDiagnosticName}
          onAnswer={(id, value) => setDiagnosticAnswers((current) => ({ ...current, [id]: value }))}
          onSubmit={completeDiagnostic}
          onSkip={skipDiagnostic}
        />
      </main>
    );
  }

  return (
    <main className="exam-grid min-h-screen overflow-hidden bg-[#f5eddc] text-[#17342f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-slow-drift absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
        <div className="animate-slow-drift absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-[#e8c872]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-4 lg:flex-row lg:px-6">
        <Sidebar activeView={activeView} setActiveView={setActiveView} profile={profile} onReset={resetDemo} />
        <MobileNav activeView={activeView} setActiveView={setActiveView} />

        <section className="min-w-0 flex-1 space-y-5">
          <TopBar
            profile={profile}
            recommendation={recommendation}
            onAdaptive={() => launchPractice()}
            onMock={startMockExam}
          />
          <div className="animate-soft-rise">{content}</div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({
  activeView,
  setActiveView,
  profile,
  onReset,
}: {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  profile: StudentLearningProfile;
  onReset: () => void;
}) {
  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-[#fffaf0]/75 p-4 shadow-[0_24px_80px_rgba(33,72,67,0.16)] backdrop-blur-xl lg:flex">
      <div className="rounded-[1.5rem] bg-[#17342f] p-5 text-white shadow-inner shadow-white/10">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#e6c983]">AI-first</p>
            <h1 className="font-serif text-2xl font-semibold leading-none">IELTS Examiner</h1>
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-xs text-[#d8e4df]">Current memory</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="font-mono text-4xl font-bold">{profile.currentBand.toFixed(1)}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Target {profile.targetBand.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                active
                  ? "bg-[#17342f] text-white shadow-lg shadow-[#17342f]/20"
                  : "text-[#34534d] hover:bg-white/80 hover:text-[#17342f]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onReset}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[#d7cab0] bg-white/70 px-4 py-3 text-sm font-semibold text-[#6d4d2d] transition hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" />
        Reset demo memory
      </button>
    </aside>
  );
}

function MobileNav({
  activeView,
  setActiveView,
}: {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
}) {
  return (
    <div className="lg:hidden">
      <div className="mb-3 flex items-center justify-between rounded-3xl bg-[#17342f] px-4 py-3 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-[#e3b65f]" />
          <span className="font-serif text-xl font-semibold">AI IELTS Examiner</span>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold",
                active ? "bg-[#17342f] text-white" : "bg-white/60 text-[#315149]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function DiagnosticView({
  name,
  answers,
  loading,
  onNameChange,
  onAnswer,
  onSubmit,
  onSkip,
}: {
  name: string;
  answers: Record<string, string>;
  loading: boolean;
  onNameChange: (value: string) => void;
  onAnswer: (id: string, value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const answered = diagnosticQuestions.filter((item) => answers[item.id]?.trim()).length;

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8 lg:px-6">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#17342f] p-6 text-white shadow-[0_24px_80px_rgba(23,52,47,0.24)] md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#e9d29b]">
          <Sparkles className="h-4 w-4" />
          First-time student diagnostic
        </div>
        <h2 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-5xl">
          Let the AI meet you before it teaches you.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d8e4df]">
          Answer the diagnostic below. The AI Examiner estimates your current bands, grammar, and vocabulary, then
          builds your personal learning profile. Every session after this is personalized.
        </p>
        <label className="mt-6 block max-w-sm">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#e9d29b]">Your name</span>
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="e.g. Sarah"
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/40 focus:border-[#e3b65f] focus:ring-4 focus:ring-[#e3b65f]/20"
          />
        </label>
      </section>

      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Diagnostic questions</p>
            <p className="mt-1 text-sm text-[#66746e]">Covers grammar, vocabulary, and all four skills.</p>
          </div>
          <div className="rounded-2xl bg-[#17342f] px-4 py-2 text-sm font-bold text-white">
            {answered}/{diagnosticQuestions.length} answered
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {diagnosticQuestions.map((item, index) => (
            <PracticeQuestion
              key={item.id}
              item={item}
              index={index}
              value={answers[item.id] ?? ""}
              onAnswer={onAnswer}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onSubmit}
            disabled={loading || answered === 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Brain className="h-4 w-4" />
            {loading ? "Building your profile..." : "Create my learning profile"}
          </button>
          <button
            onClick={onSkip}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
          >
            Skip and explore the demo
          </button>
        </div>
      </section>
    </div>
  );
}

function TopBar({
  profile,
  recommendation,
  onAdaptive,
  onMock,
}: {
  profile: StudentLearningProfile;
  recommendation: AdaptiveRecommendation;
  onAdaptive: () => void;
  onMock: () => void;
}) {
  return (
    <header className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/80 p-4 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl lg:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8b6f39]">
            <Sparkles className="h-4 w-4" />
            The website is the interface. The AI Brain decides the path.
          </div>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#17342f] md:text-4xl">
            Good to see you, {profile.name.split(" ")[0]}.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6b63]">
            Next best action: {recommendation.mode} for {formatSkill(recommendation.module)} because {recommendation.reason}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onAdaptive}
            className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Start adaptive practice
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <button
            onClick={onMock}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
          >
            <Timer className="h-4 w-4" />
            Full mock exam
          </button>
        </div>
      </div>
    </header>
  );
}

function Dashboard({
  profile,
  recommendation,
  bandGap,
  onLaunchPractice,
  onStartMock,
}: {
  profile: StudentLearningProfile;
  recommendation: AdaptiveRecommendation;
  bandGap: number;
  onLaunchPractice: (module?: Skill, mode?: string) => void;
  onStartMock: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[#17342f] p-6 text-white shadow-[0_24px_90px_rgba(23,52,47,0.24)] md:p-8">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-[#e3b65f]/30" />
          <div className="absolute -right-16 bottom-[-5rem] h-64 w-64 rounded-full bg-[#e3b65f]/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#e9d29b]">
                <Brain className="h-4 w-4" />
                AI Brain Command Center
              </div>
              <h3 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-6xl">
                Adaptive IELTS training that learns before it teaches.
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#d8e4df]">
                The platform remembers skill bands, weak question types, topics, mock history, and practice outcomes. Every session is selected to move the student toward Band {profile.targetBand.toFixed(1)}.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-[#e9d29b]">Target gap</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-mono text-6xl font-bold">{bandGap.toFixed(1)}</span>
                <span className="pb-2 text-sm text-[#d8e4df]">bands left</span>
              </div>
              <button
                onClick={() => onLaunchPractice(recommendation.module, recommendation.mode)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-4 py-3 text-sm font-black text-[#17342f] transition hover:bg-[#f0c66f]"
              >
                Train weakest skill
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <BrainDecisionCard profile={profile} recommendation={recommendation} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Target} label="Current band" value={profile.currentBand.toFixed(1)} detail={`Target ${profile.targetBand.toFixed(1)}`} />
        <MetricCard icon={Activity} label="Study streak" value={`${profile.studyStreak}`} detail="days of profile memory" />
        <MetricCard icon={Timer} label="Weekly goal" value={`${profile.completedHours}/${profile.weeklyGoalHours}h`} detail="practice hours" />
        <MetricCard icon={ShieldCheck} label="AI confidence" value={`${profile.confidenceLevel}%`} detail="learning profile signal" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <ModuleGrid profile={profile} onLaunchPractice={onLaunchPractice} />
        <div className="space-y-5">
          <WeaknessMap profile={profile} />
          <button
            onClick={onStartMock}
            className="group flex w-full items-center justify-between rounded-[2rem] border border-[#d8c8a8] bg-[#fffaf0]/85 p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.12)] transition hover:-translate-y-1 hover:bg-white"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Separate mode</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-[#17342f]">Computer-delivered full mock exam</h3>
              <p className="mt-2 text-sm text-[#66746e]">Listening to Reading to Writing to Speaking, official order and counts.</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17342f] text-white transition group-hover:scale-105">
              <Trophy className="h-5 w-5" />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

function BrainDecisionCard({
  profile,
  recommendation,
}: {
  profile: StudentLearningProfile;
  recommendation: AdaptiveRecommendation;
}) {
  const steps = [
    { label: "Remember", value: `${profile.practiceHistory.length} practice sessions` },
    { label: "Diagnose", value: recommendation.targetWeakness },
    { label: "Generate", value: `${formatSkill(recommendation.module)} ${recommendation.mode}` },
    { label: "Adapt", value: recommendation.expectedBandLift },
  ];

  return (
    <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.14)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Decision engine</p>
          <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">Why this practice?</h3>
        </div>
        <div className="relative grid h-16 w-16 place-items-center rounded-3xl bg-[#17342f] text-white">
          <span className="animate-brain-pulse absolute inset-0 rounded-3xl bg-[#e3b65f]/30" />
          <Brain className="relative h-7 w-7" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#65746e]">{recommendation.reason}</p>

      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-3 rounded-2xl border border-[#e3dac6] bg-white/60 p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#17342f] font-mono text-sm font-bold text-white">
              {index + 1}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8b6f39]">{step.label}</p>
              <p className="text-sm font-semibold text-[#17342f]">{step.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="rounded-2xl bg-[#17342f] p-3 text-white">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</span>
      </div>
      <p className="mt-5 font-mono text-3xl font-bold text-[#17342f]">{value}</p>
      <p className="mt-1 text-sm text-[#66746e]">{detail}</p>
    </div>
  );
}

function ModuleGrid({
  profile,
  onLaunchPractice,
}: {
  profile: StudentLearningProfile;
  onLaunchPractice: (module?: Skill, mode?: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {skillOrder.map((skill) => {
        const config = moduleConfig[skill];
        const Icon = config.icon;
        return (
          <button
            key={skill}
            onClick={() => onLaunchPractice(skill)}
            className={cn(
              "group overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.11)] transition hover:-translate-y-1",
              config.gradient,
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={cn("grid h-12 w-12 place-items-center rounded-2xl shadow-lg", config.accent)}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-white/65 px-3 py-1 font-mono text-sm font-bold text-[#17342f]">
                Band {profile.bands[skill].toFixed(1)}
              </span>
            </div>
            <h3 className="mt-5 font-serif text-2xl font-semibold text-[#17342f]">{config.label}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-[#5f6c66]">{config.description}</p>
            <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#17342f]">
              Generate practice
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WeaknessMap({ profile }: { profile: StudentLearningProfile }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Weakness map</p>
          <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What the AI remembers</h3>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.weakQuestionTypes.map((weakness) => (
          <span key={weakness} className="rounded-full border border-[#e0d2b9] bg-white/70 px-3 py-2 text-xs font-bold text-[#315149]">
            {weakness}
          </span>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {profile.weakTopics.slice(0, 4).map((topic) => (
          <div key={topic} className="rounded-2xl bg-[#17342f]/5 p-3 text-sm font-semibold text-[#315149]">
            {topic}
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticeModule({
  module,
  profile,
  session,
  answers,
  evaluation,
  onAnswer,
  onLaunch,
  onSubmit,
  onUseSample,
}: {
  module: Skill;
  profile: StudentLearningProfile;
  session: PracticeSession;
  answers: Record<string, string>;
  evaluation: EvaluationResult | null;
  onAnswer: (id: string, value: string) => void;
  onLaunch: (module?: Skill, mode?: string) => void;
  onSubmit: () => void;
  onUseSample: () => void;
}) {
  const config = moduleConfig[module];
  const Icon = config.icon;
  const blueprints = useMemo(() => getPracticeBlueprints(module), [module]);
  const active = session.module === module;
  const progress = active ? completionPercent(session, answers) : 0;
  const matchedEvaluation = active && evaluation?.sessionId === session.id ? evaluation : null;

  return (
    <div className="space-y-5">
      <section className={cn("overflow-hidden rounded-[2.4rem] border border-white/70 bg-gradient-to-br p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] md:p-8", config.gradient)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em]", config.soft)}>
              <Icon className="h-4 w-4" />
              {config.label} module
            </div>
            <h2 className="mt-5 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">{config.label} practice</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5c6b64]">
              Practice is generated from the learning profile. The AI evaluates only after the selected section is complete.
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Current skill band</p>
            <p className="mt-2 font-mono text-4xl font-bold text-[#17342f]">{profile.bands[module].toFixed(1)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {config.modes.map((mode) => (
            <button
              key={mode}
              onClick={() => onLaunch(module, mode)}
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left text-sm font-bold text-[#17342f] transition hover:-translate-y-0.5 hover:bg-white"
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
        <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
          {active ? (
            <PracticeWorkbench
              session={session}
              answers={answers}
              progress={progress}
              evaluation={matchedEvaluation}
              onAnswer={onAnswer}
              onSubmit={onSubmit}
              onUseSample={onUseSample}
            />
          ) : (
            <div className="grid min-h-[380px] place-items-center rounded-[2rem] border border-dashed border-[#d8c8a8] bg-white/40 p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#17342f] text-white">
                  <Play className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-serif text-3xl font-semibold text-[#17342f]">Choose a {config.label.toLowerCase()} mode</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#66746e]">
                  The AI Brain will generate the selected section and wait until you submit the whole section for evaluation.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Available blueprints</p>
            <div className="mt-4 space-y-3">
              {blueprints.map((blueprint) => (
                <button
                  key={blueprint.id}
                  onClick={() => onLaunch(module, blueprint.mode)}
                  className="w-full rounded-2xl border border-[#e3dac6] bg-white/65 p-3 text-left transition hover:bg-white"
                >
                  <p className="font-bold text-[#17342f]">{blueprint.mode}</p>
                  <p className="mt-1 text-xs leading-5 text-[#66746e]">{blueprint.questionTypes.join(" / ")}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_18px_60px_rgba(33,72,67,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Examiner rule</p>
            <p className="mt-3 text-sm leading-6 text-[#dbe7e2]">
              No per-question marking. The evaluator reviews the completed section and updates the learning memory in one pass.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PracticeWorkbench({
  session,
  answers,
  progress,
  evaluation,
  onAnswer,
  onSubmit,
  onUseSample,
}: {
  session: PracticeSession;
  answers: Record<string, string>;
  progress: number;
  evaluation: EvaluationResult | null;
  onAnswer: (id: string, value: string) => void;
  onSubmit: () => void;
  onUseSample: () => void;
}) {
  const config = moduleConfig[session.module];
  const Icon = config.icon;
  const [focused, setFocused] = useState(0);
  const { mmss, low, expired } = useCountdown(session.durationMinutes * 60, true);

  const jumpTo = (index: number) => {
    setFocused(index);
    document.getElementById(`pq-${session.id}-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const answeredMap = Object.fromEntries(session.items.map((item, index) => [index, Boolean(answers[item.id]?.trim())]));
  const passageParts = Array.from(new Set(session.items.map((item) => item.context).filter(Boolean) as string[]));

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]", config.soft)}>
            <Icon className="h-4 w-4" />
            {session.mode}
          </div>
          <h3 className="mt-3 font-serif text-3xl font-semibold text-[#17342f]">{session.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66746e]">{session.subtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ExamClock label="Time remaining" time={mmss} low={low} expired={expired} />
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#17342f]/5 p-2 text-center">
            <MiniStat label="Minutes" value={`${session.durationMinutes}`} />
            <MiniStat label="Questions" value={`${session.questionCount}`} />
            <MiniStat label="Level" value={`B${session.difficultyBand.toFixed(1)}`} />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <QuestionNavigator
          count={session.items.length}
          current={focused}
          answered={answeredMap}
          onJump={jumpTo}
          columns={Math.min(8, session.items.length)}
        />
      </div>

      {passageParts.length > 0 ? (
        <div className="mt-5 rounded-[1.8rem] border border-[#e3dac6] bg-[#fffdf7] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">
            {session.module === "listening" ? "Listening script" : "Reading passage"}
          </p>
          <div className="mt-3 space-y-4 text-[15px] leading-7 text-[#315149]">
            {passageParts.map((part, index) => (
              <p key={index}>{part}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {session.items.map((item, index) => (
          <PracticeQuestion
            key={item.id}
            item={item}
            index={index}
            value={answers[item.id] ?? ""}
            onAnswer={onAnswer}
            id={`pq-${session.id}-${index}`}
            active={focused === index}
          />
        ))}
      </div>

      <div className="mt-6 rounded-[2rem] border border-[#e3dac6] bg-white/70 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#17342f]">Answer sheet</p>
          <p className="text-xs font-bold text-[#5c6b64]">{progress}% complete</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {session.items.map((item, index) => (
            <AnswerSheetInput
              key={item.id}
              id={item.id}
              number={index + 1}
              value={answers[item.id] ?? ""}
              onChange={onAnswer}
              onFocus={() => jumpTo(index)}
              current={focused === index}
              letter={Boolean(item.options?.length)}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onUseSample}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
        >
          <ClipboardList className="h-4 w-4" />
          Fill demo answers
        </button>
        <button
          onClick={onSubmit}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          Submit selected section
          <CheckCircle2 className="h-4 w-4" />
        </button>
      </div>

      {evaluation ? <EvaluationPanel evaluation={evaluation} /> : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-[#17342f]">{value}</p>
    </div>
  );
}

const optionLetters = ["A", "B", "C", "D", "E", "F", "G"];

function PracticeQuestion({
  item,
  index,
  value,
  onAnswer,
  id,
  active,
}: {
  item: PracticeItem;
  index: number;
  value: string;
  onAnswer: (id: string, value: string) => void;
  id: string;
  active?: boolean;
}) {
  const answered = Boolean(value.trim());

  return (
    <div
      id={id}
      className={cn(
        "rounded-[2rem] border bg-white/70 p-4 shadow-sm transition",
        active ? "border-[#17342f] ring-4 ring-[#17342f]/10" : "border-[#e3dac6]",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#17342f] font-mono text-sm font-bold text-white">
            {index + 1}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
              {item.type === "essay" ? "Writing task" : item.options?.length ? "Multiple choice" : "Short answer"}
            </p>
            <h4 className="mt-1 text-lg font-black text-[#17342f]">{item.title}</h4>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#17342f]/8 px-3 py-1 text-xs font-bold text-[#315149]">{item.descriptorFocus}</span>
      </div>

      {item.context ? (
        <div className="mt-4 rounded-2xl border-l-4 border-[#e3b65f] bg-[#17342f]/5 p-4 text-sm leading-7 text-[#4f625b]">
          {item.context}
        </div>
      ) : null}

      <p className="mt-4 text-base font-semibold leading-7 text-[#17342f]">{item.prompt}</p>

      {item.options?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {item.options.map((option, optionIndex) => (
            <button
              key={option}
              onClick={() => onAnswer(item.id, option)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                value === option
                  ? "border-[#17342f] bg-[#17342f] text-white"
                  : "border-[#d8c8a8] bg-[#fffdf7] text-[#315149] hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-black",
                  value === option ? "bg-white/20 text-white" : "bg-[#f1e9d6] text-[#8b6f39]",
                )}
              >
                {optionLetters[optionIndex] ?? optionIndex + 1}
              </span>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          {item.type === "essay" ? (
            <WordCounter text={value} target={250} />
          ) : null}
          <textarea
            value={value}
            onChange={(event) => onAnswer(item.id, event.target.value)}
            rows={item.type === "essay" ? 10 : 4}
            placeholder="Type your full answer here. The AI will evaluate after you submit the selected section."
            className="mt-2 w-full resize-y rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6d756f]">Focus: {item.expectedFocus}</p>
        <p className={cn("text-xs font-bold", answered ? "text-[#2f7151]" : "text-[#b3261e]")}>
          {answered ? "Answered" : "Not answered"}
        </p>
      </div>
    </div>
  );
}

function EvaluationPanel({ evaluation }: { evaluation: EvaluationResult }) {
  return (
    <div className="mt-6 rounded-[2rem] border border-[#cdddcf] bg-[#eff7ef] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2f7151]">AI examiner report</p>
          <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">Predicted Band {evaluation.predictedBand.toFixed(1)}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4f625b]">{evaluation.examinerSummary}</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Accuracy</p>
          <p className="mt-1 font-mono text-4xl font-bold text-[#17342f]">{evaluation.accuracy}%</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <FeedbackList title="Strengths" items={evaluation.strengths} />
        <FeedbackList title="Weaknesses" items={evaluation.weaknesses} />
        <FeedbackList title="Next plan" items={evaluation.nextPlan} />
      </div>

      <div className="mt-4 rounded-2xl bg-white/65 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Band descriptor notes</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {evaluation.bandDescriptorNotes.map((note) => (
            <p key={note} className="rounded-xl bg-[#17342f]/5 p-3 text-xs leading-5 text-[#4f625b]">
              {note}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-sm font-black text-[#17342f]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4f625b]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockExam({
  section,
  answers,
  result,
  onStart,
  onAnswer,
  onFillDemo,
  onNext,
}: {
  section: MockSection;
  answers: Record<string, string>;
  result: MockExamResult | null;
  onStart: () => void;
  onAnswer: (id: string, value: string) => void;
  onFillDemo: () => void;
  onNext: () => void;
}) {
  if (section === "intro") {
    return (
      <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Real exam simulation</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">Full IELTS computer-delivered mock</h2>
          <p className="mt-4 text-sm leading-7 text-[#5c6b64]">
            This mode is separate from adaptive practice. It follows the official order, section timings, and question counts, then creates one complete examiner report.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {officialMockSections.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-5">
              <p className="font-serif text-2xl font-semibold text-[#17342f]">{item.label}</p>
              <p className="mt-3 font-mono text-3xl font-bold text-[#17342f]">{item.minutes}m</p>
              <p className="mt-1 text-sm text-[#66746e]">{item.questions} questions</p>
              <p className="mt-4 text-xs leading-5 text-[#6d756f]">{item.note}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          <Play className="h-4 w-4" />
          Start mock exam
        </button>
      </div>
    );
  }

  if (section === "result") {
    return <MockResult result={result} onRestart={onStart} />;
  }

  const current = officialMockSections.find((item) => item.id === section)!;
  const index = skillOrder.indexOf(section);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.28fr_1fr]">
      <aside className="rounded-[2.2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Exam order</p>
        <div className="mt-5 space-y-3">
          {officialMockSections.map((item, itemIndex) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border p-4",
                item.id === section
                  ? "border-[#17342f] bg-[#17342f] text-white"
                  : itemIndex < index
                    ? "border-[#bdd3c7] bg-[#edf7ef] text-[#2f7151]"
                    : "border-[#e3dac6] bg-white/60 text-[#315149]",
              )}
            >
              <p className="font-bold">{item.label}</p>
              <p className="mt-1 text-xs opacity-75">{item.minutes} min / {item.questions} questions</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Computer-delivered mock</p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-[#17342f]">{current.label}</h2>
            <p className="mt-2 text-sm text-[#66746e]">{current.note}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#17342f] p-2 text-white">
            <MiniStatDark label="Timer" value={`${current.minutes}:00`} />
            <MiniStatDark label="Questions" value={`${current.questions}`} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
          {section === "listening" || section === "reading" ? (
            <AnswerGrid section={section} answers={answers} onAnswer={onAnswer} />
          ) : section === "writing" ? (
            <WritingMock answers={answers} onAnswer={onAnswer} />
          ) : (
            <SpeakingMock answers={answers} onAnswer={onAnswer} />
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            onClick={onFillDemo}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
          >
            <ClipboardList className="h-4 w-4" />
            Fill demo exam answers
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            {section === "speaking" ? "Submit full mock" : "Finish section"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
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

function AnswerGrid({
  section,
  answers,
  onAnswer,
}: {
  section: Skill;
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-[#17342f]">
        {section === "listening" ? "Audio player placeholder: the real app would lock playback to once only." : "Three passage workspace with computer-delivered answer sheet."}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 40 }, (_, index) => {
          const number = index + 1;
          const id = `${section}-${number}`;
          return (
            <label key={id} className="flex items-center gap-2 rounded-xl border border-[#e3dac6] bg-[#fffdf7] px-3 py-2">
              <span className="w-7 font-mono text-xs font-bold text-[#8b6f39]">{number}</span>
              <input
                value={answers[id] ?? ""}
                onChange={(event) => onAnswer(id, event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#17342f] outline-none"
                placeholder="Answer"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function WritingMock({ answers, onAnswer }: { answers: Record<string, string>; onAnswer: (id: string, value: string) => void }) {
  return (
    <div className="space-y-4">
      <MockTextArea
        id="writing-task-1"
        title="Task 1 - Academic report"
        prompt="The chart shows changes in public transport use in three cities from 2000 to 2025. Summarise the main features and make comparisons where relevant."
        value={answers["writing-task-1"] ?? ""}
        onAnswer={onAnswer}
      />
      <MockTextArea
        id="writing-task-2"
        title="Task 2 - Essay"
        prompt="Governments should spend more money on preventing environmental problems than repairing damage after it occurs. To what extent do you agree or disagree?"
        value={answers["writing-task-2"] ?? ""}
        onAnswer={onAnswer}
      />
    </div>
  );
}

function SpeakingMock({ answers, onAnswer }: { answers: Record<string, string>; onAnswer: (id: string, value: string) => void }) {
  return (
    <div className="space-y-4">
      <MockTextArea
        id="speaking-part-1"
        title="Part 1"
        prompt="What kind of apps do you use most often, and why?"
        value={answers["speaking-part-1"] ?? ""}
        onAnswer={onAnswer}
      />
      <MockTextArea
        id="speaking-part-2"
        title="Part 2 Cue Card"
        prompt="Describe a place where you can concentrate well."
        value={answers["speaking-part-2"] ?? ""}
        onAnswer={onAnswer}
      />
      <MockTextArea
        id="speaking-part-3"
        title="Part 3"
        prompt="How should schools prepare students for skills that may change in the future?"
        value={answers["speaking-part-3"] ?? ""}
        onAnswer={onAnswer}
      />
    </div>
  );
}

function MockTextArea({
  id,
  title,
  prompt,
  value,
  onAnswer,
}: {
  id: string;
  title: string;
  prompt: string;
  value: string;
  onAnswer: (id: string, value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-[#fffdf7] p-4">
      <p className="font-black text-[#17342f]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#5b6b63]">{prompt}</p>
      <textarea
        value={value}
        onChange={(event) => onAnswer(id, event.target.value)}
        rows={6}
        className="mt-3 w-full rounded-2xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
        placeholder="Type response here for demo scoring."
      />
    </div>
  );
}

function MockResult({ result, onRestart }: { result: MockExamResult | null; onRestart: () => void }) {
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

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Section feedback</p>
          <div className="mt-4 grid gap-3">
            {skillOrder.map((skill) => (
              <div key={skill} className="rounded-2xl bg-white/70 p-4">
                <p className="font-black text-[#17342f]">{formatSkill(skill)}</p>
                <p className="mt-1 text-sm leading-6 text-[#5b6b63]">{result.sectionFeedback[skill]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Improvement plan</p>
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
    </div>
  );
}

function BandCard({ label, band }: { label: string; band: number }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</p>
      <p className="mt-3 font-mono text-5xl font-bold text-[#17342f]">{band.toFixed(1)}</p>
      <div className="mt-4 h-2 rounded-full bg-[#d8c8a8]/70">
        <div className="h-full rounded-full bg-[#17342f]" style={{ width: `${(band / 9) * 100}%` }} />
      </div>
    </div>
  );
}

function Reports({ profile, recommendation }: { profile: StudentLearningProfile; recommendation: AdaptiveRecommendation }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Reports</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">Progress over time</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">
              The AI Brain turns practice and mock outcomes into a living band forecast and weakness map.
            </p>
          </div>
          <div className="rounded-2xl bg-[#17342f] p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e3b65f]">Next report focus</p>
            <p className="mt-1 text-sm font-bold">{recommendation.targetWeakness}</p>
          </div>
        </div>

        <ProgressChart profile={profile} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <HistoryPanel profile={profile} />
        <MockHistoryPanel profile={profile} />
      </section>
    </div>
  );
}

function ProgressChart({ profile }: { profile: StudentLearningProfile }) {
  return (
    <div className="mt-7 rounded-[2rem] border border-[#e3dac6] bg-white/65 p-5">
      <div className="flex items-center gap-3">
        <LineChart className="h-5 w-5 text-[#2f7151]" />
        <p className="font-black text-[#17342f]">Band trend</p>
      </div>
      <div className="mt-6 flex h-64 items-end gap-3 overflow-x-auto border-b border-[#d8c8a8] pb-4">
        {profile.progress.map((point) => (
          <div key={`${point.label}-${point.overall}`} className="flex min-w-20 flex-1 flex-col items-center gap-2">
            <div className="flex h-52 w-full items-end justify-center rounded-t-2xl bg-[#17342f]/5 px-2">
              <div
                className="w-full rounded-t-2xl bg-gradient-to-t from-[#17342f] to-[#6da894] shadow-lg shadow-[#17342f]/10"
                style={{ height: `${Math.max(12, (point.overall / 9) * 100)}%` }}
              />
            </div>
            <p className="font-mono text-sm font-bold text-[#17342f]">{point.overall.toFixed(1)}</p>
            <p className="text-xs font-bold text-[#8b6f39]">{point.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ profile }: { profile: StudentLearningProfile }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Practice history</p>
      <div className="mt-4 space-y-3">
        {profile.practiceHistory.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#17342f]">{entry.title}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6f39]">
                  {formatSkill(entry.module)} / {entry.mode} / {entry.date}
                </p>
              </div>
              <span className="rounded-full bg-[#17342f] px-3 py-1 font-mono text-sm font-bold text-white">{entry.band.toFixed(1)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.weaknesses.map((weakness) => (
                <span key={weakness} className="rounded-full bg-[#17342f]/7 px-2.5 py-1 text-xs font-semibold text-[#315149]">
                  {weakness}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockHistoryPanel({ profile }: { profile: StudentLearningProfile }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Mock history</p>
      <div className="mt-4 space-y-3">
        {profile.mockHistory.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#17342f]">Full mock exam</p>
                <p className="mt-1 text-sm leading-6 text-[#5b6b63]">{entry.summary}</p>
              </div>
              <span className="rounded-full bg-[#e3b65f] px-3 py-1 font-mono text-sm font-bold text-[#17342f]">{entry.overallBand.toFixed(1)}</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <MiniScore label="L" value={entry.listeningBand} />
              <MiniScore label="R" value={entry.readingBand} />
              <MiniScore label="W" value={entry.writingBand} />
              <MiniScore label="S" value={entry.speakingBand} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#17342f]/5 px-2 py-2">
      <p className="text-xs font-black text-[#8b6f39]">{label}</p>
      <p className="font-mono text-lg font-bold text-[#17342f]">{value.toFixed(1)}</p>
    </div>
  );
}

function LearningProfile({ profile, recommendation }: { profile: StudentLearningProfile; recommendation: AdaptiveRecommendation }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Student learning profile</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">{profile.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">
              This is the memory layer the AI uses to choose the next practice and predict IELTS bands.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-[2rem] bg-[#17342f] p-3 text-white">
            <MiniStatDark label="Current" value={profile.currentBand.toFixed(1)} />
            <MiniStatDark label="Target" value={profile.targetBand.toFixed(1)} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Skill bands</p>
          <div className="mt-4 space-y-4">
            {skillOrder.map((skill) => (
              <div key={skill}>
                <div className="flex items-center justify-between text-sm font-bold text-[#17342f]">
                  <span>{formatSkill(skill)}</span>
                  <span>{profile.bands[skill].toFixed(1)}</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-[#d8c8a8]/70">
                  <div className="h-full rounded-full bg-[#17342f]" style={{ width: `${(profile.bands[skill] / 9) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <MemoryCard icon={GraduationCap} title="Grammar level" value={profile.grammarLevel} />
          <MemoryCard icon={BookOpen} title="Vocabulary level" value={profile.vocabularyLevel} />
          <MemoryCard icon={Database} title="Weak question types" value={profile.weakQuestionTypes.join(", ")} />
          <MemoryCard icon={Target} title="Next recommendation" value={`${formatSkill(recommendation.module)} - ${recommendation.mode}`} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SignalPanel title="Strong signals" items={profile.strongSignals} />
        <SignalPanel title="Weak topics" items={profile.weakTopics} />
      </section>
    </div>
  );
}

function MemoryCard({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <Icon className="h-5 w-5 text-[#2f7151]" />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#17342f]">{value}</p>
    </div>
  );
}

function SignalPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({
  profile,
  setProfile,
  onReset,
}: {
  profile: StudentLearningProfile;
  setProfile: Dispatch<SetStateAction<StudentLearningProfile>>;
  onReset: () => void;
}) {
  function updateBand(skill: Skill, value: number) {
    setProfile((current) => {
      const bands = { ...current.bands, [skill]: value };
      return { ...current, bands, currentBand: calculateOverallBand(bands) };
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Settings</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">Tune the learning memory</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">
          Change the target band, weekly goal, and initial skill bands. The AI recommendation will recalculate instantly.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <SettingSlider
            label="Target IELTS band"
            value={profile.targetBand}
            min={5}
            max={9}
            step={0.5}
            onChange={(value) => setProfile((current) => ({ ...current, targetBand: value }))}
          />
          <SettingSlider
            label="Weekly study goal"
            value={profile.weeklyGoalHours}
            min={2}
            max={25}
            step={1}
            suffix="h"
            onChange={(value) => setProfile((current) => ({ ...current, weeklyGoalHours: value }))}
          />
          <SettingSlider
            label="AI confidence signal"
            value={profile.confidenceLevel}
            min={30}
            max={100}
            step={1}
            suffix="%"
            onChange={(value) => setProfile((current) => ({ ...current, confidenceLevel: value }))}
          />
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Skill band controls</p>
          <div className="mt-4 space-y-4">
            {skillOrder.map((skill) => (
              <SettingSlider
                key={skill}
                label={formatSkill(skill)}
                value={profile.bands[skill]}
                min={4}
                max={9}
                step={0.5}
                onChange={(value) => updateBand(skill, value)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#e0c7a4] bg-[#f8e5c8]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.1)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b5732]">Demo control</p>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-[#17342f]">Reset local learning memory</h3>
            <p className="mt-1 text-sm text-[#6a5d4d]">This clears demo progress stored in the browser and restores the default student profile.</p>
          </div>
          <button onClick={onReset} className="rounded-2xl bg-[#8b5732] px-5 py-3 text-sm font-black text-white">
            Reset demo
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-[#17342f]">{label}</span>
        <span className="font-mono text-lg font-bold text-[#17342f]">
          {value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-[#17342f]"
      />
    </label>
  );
}
