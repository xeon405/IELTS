"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Headphones,
  Layers,
  LineChart,
  Mic,
  PenLine,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserRound,
  Volume2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  createDetProfile,
  createDetSession,
  detMockFlow,
  detModuleLabels,
  detSkillLabels,
  evaluateDetMock,
  evaluateDetSession,
  getDetRecommendation,
  getDetSessions,
  type DetEvaluation,
  type DetMockResult,
  type DetModule,
  type DetPracticeItem,
  type DetPracticeSession,
  type DetProfile,
  type DetRecommendation,
  type DetSkill,
} from "@/lib/duolingo-brain";

type DetView = "dashboard" | "practice" | "mock" | "reports" | "profile" | "settings";

const navItems: { id: DetView; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "practice", label: "Practice", icon: Layers },
  { id: "mock", label: "Full DET Mock", icon: Trophy },
  { id: "reports", label: "Reports", icon: LineChart },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

const moduleConfig: Record<DetModule, { icon: LucideIcon; accent: string; soft: string; gradient: string }> = {
  "read-select": {
    icon: BookOpen,
    accent: "bg-[#285f5a] text-white",
    soft: "bg-[#e1f0ea] text-[#285f5a]",
    gradient: "from-[#dbece1] via-[#f5efd6] to-[#f5ddae]",
  },
  "read-complete": {
    icon: PenLine,
    accent: "bg-[#8b5732] text-white",
    soft: "bg-[#f4e3d4] text-[#8b5732]",
    gradient: "from-[#f4dec8] via-[#f7edd7] to-[#dce8dd]",
  },
  "listen-type": {
    icon: Headphones,
    accent: "bg-[#295d88] text-white",
    soft: "bg-[#deebf2] text-[#295d88]",
    gradient: "from-[#dceaf2] via-[#eff5e9] to-[#f8e9c6]",
  },
  "read-aloud": {
    icon: Volume2,
    accent: "bg-[#2f7151] text-white",
    soft: "bg-[#e0efe4] text-[#2f7151]",
    gradient: "from-[#d9ecd9] via-[#eef0d2] to-[#f6dfbf]",
  },
  "speak-photo": {
    icon: Mic,
    accent: "bg-[#2f7151] text-white",
    soft: "bg-[#e0efe4] text-[#2f7151]",
    gradient: "from-[#d9ecd9] via-[#eef0d2] to-[#f6dfbf]",
  },
  "write-photo": {
    icon: PenLine,
    accent: "bg-[#8b5732] text-white",
    soft: "bg-[#f4e3d4] text-[#8b5732]",
    gradient: "from-[#f4dec8] via-[#f7edd7] to-[#dce8dd]",
  },
  "interactive-reading": {
    icon: BookOpen,
    accent: "bg-[#285f5a] text-white",
    soft: "bg-[#e1f0ea] text-[#285f5a]",
    gradient: "from-[#dbece1] via-[#f5efd6] to-[#f5ddae]",
  },
  "interactive-listening": {
    icon: Headphones,
    accent: "bg-[#295d88] text-white",
    soft: "bg-[#deebf2] text-[#295d88]",
    gradient: "from-[#dceaf2] via-[#eff5e9] to-[#f8e9c6]",
  },
  "writing-sample": {
    icon: PenLine,
    accent: "bg-[#8b5732] text-white",
    soft: "bg-[#f4e3d4] text-[#8b5732]",
    gradient: "from-[#f4dec8] via-[#f7edd7] to-[#dce8dd]",
  },
  "speaking-sample": {
    icon: Mic,
    accent: "bg-[#2f7151] text-white",
    soft: "bg-[#e0efe4] text-[#2f7151]",
    gradient: "from-[#d9ecd9] via-[#eef0d2] to-[#f6dfbf]",
  },
};

const skillOrder: DetSkill[] = ["literacy", "comprehension", "conversation", "production"];

const allModules: DetModule[] = [
  "read-select",
  "read-complete",
  "listen-type",
  "read-aloud",
  "speak-photo",
  "write-photo",
  "interactive-reading",
  "interactive-listening",
  "writing-sample",
  "speaking-sample",
];

const sampleAnswers: Record<DetModule, string> = {
  "read-select": "The real words are sustainable, library, research, helpful, and community.",
  "read-complete": "reduce difference. The cafe can reduce waste because the ordering system tracks how much food students actually buy.",
  "listen-type": "The gallery will be closed on Monday, but members can book private tours online.",
  "read-aloud": "I would read the sentence clearly, with stress on the key content words and a short pause after each phrase.",
  "speak-photo":
    "The photo shows three students sitting around a laptop in a bright library. They seem to be working on a group project because one student is pointing at the screen while the others are listening. The room looks quiet and organized, so they are probably preparing for a presentation or checking their research notes.",
  "write-photo":
    "The picture shows students working together in a library. They are sitting close to a laptop, which suggests they are collaborating on a project. The bright room and bookshelves make the place look calm and academic.",
  "interactive-reading": "The best sentence completes the paragraph because it explains the result of the campus policy.",
  "interactive-listening": "The speaker changed the meeting time because the room was not available in the afternoon.",
  "writing-sample":
    "Short videos are useful for quick explanations, but books and long articles are more effective for serious learning because they develop concentration and deeper understanding. For example, a video can introduce a science topic in five minutes, but an article usually explains the evidence, exceptions, and vocabulary in more detail. I think students should use both, but serious study needs longer reading because it trains patience and critical thinking.",
  "speaking-sample":
    "I think online learning can be very effective when students have a clear plan. It gives people access to teachers, practice materials, and feedback from anywhere. However, it also requires discipline because distractions are common at home. For me, the best solution is a mix of online lessons and independent review.",
};

function fillAnswers(session: DetPracticeSession): Record<string, string> {
  return Object.fromEntries(session.items.map((item) => [item.id, sampleAnswers[item.type]]));
}

function completion(session: DetPracticeSession, answers: Record<string, string>) {
  if (session.items.length === 0) return 0;
  return Math.round((session.items.filter((item) => answers[item.id]?.trim()).length / session.items.length) * 100);
}

export default function DuolingoPage() {
  const [profile, setProfile] = useState<DetProfile>(() => createDetProfile());
  const [view, setView] = useState<DetView>("dashboard");
  const [session, setSession] = useState<DetPracticeSession>(() => createDetSession(createDetProfile()));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<DetEvaluation | null>(null);
  const [mockAnswers, setMockAnswers] = useState<Record<string, string>>({});
  const [mockResult, setMockResult] = useState<DetMockResult | null>(null);

  const recommendation = useMemo(() => getDetRecommendation(profile), [profile]);

  function launchPractice(module?: DetModule) {
    const next = createDetSession(profile, module);
    setSession(next);
    setAnswers({});
    setEvaluation(null);
    setView("practice");
  }

  function submitPractice() {
    const result = evaluateDetSession(profile, session, answers);
    setEvaluation(result.evaluation);
    setProfile(result.profile);
  }

  function resetDemo() {
    const fresh = createDetProfile();
    setProfile(fresh);
    setSession(createDetSession(fresh));
    setAnswers({});
    setEvaluation(null);
    setMockAnswers({});
    setMockResult(null);
    setView("dashboard");
  }

  function fillMock() {
    const filled: Record<string, string> = {};
    allModules.forEach((module, index) => {
      filled[`mock-${module}-${index}`] = sampleAnswers[module];
    });
    setMockAnswers(filled);
  }

  function submitMock() {
    const result = evaluateDetMock(profile, mockAnswers);
    setMockResult(result.result);
    setProfile(result.profile);
  }

  const content = (() => {
    if (view === "dashboard") {
      return <Dashboard profile={profile} recommendation={recommendation} onLaunch={launchPractice} onMock={() => setView("mock")} />;
    }

    if (view === "practice") {
      return (
        <Practice
          profile={profile}
          session={session}
          answers={answers}
          evaluation={evaluation}
          onAnswer={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
          onLaunch={launchPractice}
          onFill={() => setAnswers(fillAnswers(session))}
          onSubmit={submitPractice}
        />
      );
    }

    if (view === "mock") {
      return (
        <MockExam
          answers={mockAnswers}
          result={mockResult}
          onAnswer={(id, value) => setMockAnswers((current) => ({ ...current, [id]: value }))}
          onFill={fillMock}
          onSubmit={submitMock}
        />
      );
    }

    if (view === "reports") return <Reports profile={profile} recommendation={recommendation} />;
    if (view === "profile") return <ProfileView profile={profile} recommendation={recommendation} />;
    return <SettingsView profile={profile} setProfile={setProfile} onReset={resetDemo} />;
  })();

  return (
    <main className="exam-grid min-h-screen overflow-hidden bg-[#f5eddc] text-[#17342f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-slow-drift absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
        <div className="animate-slow-drift absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-[#e8c872]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-[#fffaf0]/75 p-4 shadow-[0_24px_80px_rgba(33,72,67,0.16)] backdrop-blur-xl lg:flex">
          <div className="rounded-[1.5rem] bg-[#17342f] p-5 text-white shadow-inner shadow-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#e6c983]">AI-first</p>
                <h1 className="font-serif text-2xl font-semibold leading-none">Duolingo Examiner</h1>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-[#d8e4df]">Current score memory</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-mono text-4xl font-bold">{profile.currentScore}</span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Target {profile.targetScore}</span>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                    active ? "bg-[#17342f] text-white shadow-lg shadow-[#17342f]/20" : "text-[#34534d] hover:bg-white/80 hover:text-[#17342f]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <button onClick={resetDemo} className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[#d7cab0] bg-white/70 px-4 py-3 text-sm font-semibold text-[#6d4d2d] transition hover:bg-white">
            <RotateCcw className="h-4 w-4" />
            Reset demo
          </button>
        </aside>

        <div className="lg:hidden">
          <div className="mb-3 flex items-center justify-between rounded-3xl bg-[#17342f] px-4 py-3 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-[#e3b65f]" />
              <span className="font-serif text-xl font-semibold">AI Duolingo Examiner</span>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cn("flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold", view === item.id ? "bg-[#17342f] text-white" : "bg-white/60 text-[#315149]")}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <section className="min-w-0 flex-1 space-y-5">
          <header className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/80 p-4 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl lg:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8b6f39]">
                  <Sparkles className="h-4 w-4" />
                  Same AI-first theme, built for the Duolingo English Test.
                </div>
                <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#17342f] md:text-4xl">
                  AI Duolingo Examiner
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6b63]">
                  Next best action: {detModuleLabels[recommendation.module]} because {recommendation.reason}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => launchPractice()} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5">
                  Start adaptive DET practice
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </button>
                <button onClick={() => setView("mock")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white">
                  <Timer className="h-4 w-4" />
                  Full DET mock
                </button>
              </div>
            </div>
          </header>

          <div className="animate-soft-rise">{content}</div>
        </section>
      </div>
    </main>
  );
}

function Dashboard({
  profile,
  recommendation,
  onLaunch,
  onMock,
}: {
  profile: DetProfile;
  recommendation: DetRecommendation;
  onLaunch: (module?: DetModule) => void;
  onMock: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[#17342f] p-6 text-white shadow-[0_24px_90px_rgba(23,52,47,0.24)] md:p-8">
          <div className="absolute -right-16 bottom-[-5rem] h-64 w-64 rounded-full bg-[#e3b65f]/20 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#e9d29b]">
              <Brain className="h-4 w-4" />
              DET AI Brain
            </div>
            <h3 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-6xl">
              Adaptive Duolingo prep that predicts the next score move.
            </h3>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#d8e4df]">
              The AI remembers DET subscores, weak question types, speaking confidence, vocabulary gaps, mock history, and recommends the next task to reach {profile.targetScore}.
            </p>
            <button onClick={() => onLaunch(recommendation.module)} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#e3b65f] px-5 py-3 text-sm font-black text-[#17342f] transition hover:bg-[#f0c66f]">
              Train weakest DET skill
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <BrainCard profile={profile} recommendation={recommendation} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Target} label="Current DET" value={`${profile.currentScore}`} detail={`Target ${profile.targetScore}`} />
        <Metric icon={Activity} label="Study streak" value={`${profile.streak}`} detail="days of memory" />
        <Metric icon={Timer} label="Weekly goal" value={`${profile.completedHours}/${profile.weeklyGoalHours}h`} detail="practice hours" />
        <Metric icon={Mic} label="Speaking confidence" value={`${profile.speakingConfidence}%`} detail="voice readiness" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <ModuleGrid onLaunch={onLaunch} />
        <div className="space-y-5">
          <WeakMap profile={profile} />
          <button onClick={onMock} className="group flex w-full items-center justify-between rounded-[2rem] border border-[#d8c8a8] bg-[#fffaf0]/85 p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.12)] transition hover:-translate-y-1 hover:bg-white">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Separate mode</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-[#17342f]">Duolingo full mock simulation</h3>
              <p className="mt-2 text-sm text-[#66746e]">Adaptive questions, interactive tasks, writing sample, speaking sample.</p>
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

function BrainCard({ profile, recommendation }: { profile: DetProfile; recommendation: DetRecommendation }) {
  const steps = [
    { label: "Remember", value: `${profile.history.length} DET attempts` },
    { label: "Diagnose", value: recommendation.targetWeakness },
    { label: "Generate", value: detModuleLabels[recommendation.module] },
    { label: "Adapt", value: recommendation.expectedLift },
  ];

  return (
    <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.14)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Decision engine</p>
          <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">Why this DET task?</h3>
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
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#17342f] font-mono text-sm font-bold text-white">{index + 1}</div>
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

function Metric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="rounded-2xl bg-[#17342f] p-3 text-white"><Icon className="h-5 w-5" /></span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</span>
      </div>
      <p className="mt-5 font-mono text-3xl font-bold text-[#17342f]">{value}</p>
      <p className="mt-1 text-sm text-[#66746e]">{detail}</p>
    </div>
  );
}

function ModuleGrid({ onLaunch }: { onLaunch: (module?: DetModule) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {allModules.map((module) => {
        const config = moduleConfig[module];
        const Icon = config.icon;
        return (
          <button key={module} onClick={() => onLaunch(module)} className={cn("group overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.11)] transition hover:-translate-y-1", config.gradient)}>
            <div className="flex items-start justify-between gap-4">
              <div className={cn("grid h-12 w-12 place-items-center rounded-2xl shadow-lg", config.accent)}><Icon className="h-6 w-6" /></div>
              <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold text-[#17342f]">DET type</span>
            </div>
            <h3 className="mt-5 font-serif text-2xl font-semibold text-[#17342f]">{detModuleLabels[module]}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-[#5f6c66]">Adaptive practice for score movement, speed, accuracy, and DET format confidence.</p>
            <div className="mt-5 flex items-center justify-between text-sm font-bold text-[#17342f]">
              Generate task
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WeakMap({ profile }: { profile: DetProfile }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]"><Layers className="h-5 w-5" /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Weakness map</p>
          <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What the AI remembers</h3>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.weakQuestionTypes.map((weakness) => <span key={weakness} className="rounded-full border border-[#e0d2b9] bg-white/70 px-3 py-2 text-xs font-bold text-[#315149]">{weakness}</span>)}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {profile.weakTopics.map((topic) => <div key={topic} className="rounded-2xl bg-[#17342f]/5 p-3 text-sm font-semibold text-[#315149]">{topic}</div>)}
      </div>
    </div>
  );
}

function Practice({
  profile,
  session,
  answers,
  evaluation,
  onAnswer,
  onLaunch,
  onFill,
  onSubmit,
}: {
  profile: DetProfile;
  session: DetPracticeSession;
  answers: Record<string, string>;
  evaluation: DetEvaluation | null;
  onAnswer: (id: string, value: string) => void;
  onLaunch: (module?: DetModule) => void;
  onFill: () => void;
  onSubmit: () => void;
}) {
  const sessions = getDetSessions();
  const config = moduleConfig[session.module];
  const Icon = config.icon;
  const progress = completion(session, answers);

  return (
    <div className="space-y-5">
      <section className={cn("overflow-hidden rounded-[2.4rem] border border-white/70 bg-gradient-to-br p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] md:p-8", config.gradient)}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em]", config.soft)}>
              <Icon className="h-4 w-4" />
              {detModuleLabels[session.module]}
            </div>
            <h2 className="mt-5 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">{session.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5c6b64]">{session.subtitle}</p>
          </div>
          <div className="rounded-[2rem] bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Current {detSkillLabels[session.skill]}</p>
            <p className="mt-2 font-mono text-4xl font-bold text-[#17342f]">{profile.subscores[session.skill]}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sessions.map((item) => (
            <button key={item.id} onClick={() => onLaunch(item.module)} className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left text-sm font-bold text-[#17342f] transition hover:-translate-y-0.5 hover:bg-white">
              {detModuleLabels[item.module]}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.34fr]">
        <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">AI examiner intent</p>
              <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">DET task workbench</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66746e]">{session.aiIntent}</p>
            </div>
            <div className="min-w-44 rounded-2xl bg-[#17342f]/5 p-3">
              <div className="flex justify-between text-xs font-bold text-[#315149]"><span>Completion</span><span>{progress}%</span></div>
              <div className="mt-2 h-2 rounded-full bg-[#d8c8a8]/70"><div className="h-full rounded-full bg-[#17342f]" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {session.items.map((item, index) => <PracticeItemView key={item.id} item={item} index={index} value={answers[item.id] ?? ""} onAnswer={onAnswer} />)}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button onClick={onFill} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white">
              <ClipboardList className="h-4 w-4" />
              Fill demo answers
            </button>
            <button onClick={onSubmit} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5">
              Submit DET task
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>

          {evaluation ? <EvaluationPanel evaluation={evaluation} /> : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">DET subscores</p>
            <div className="mt-4 space-y-4">{skillOrder.map((skill) => <ScoreBar key={skill} label={detSkillLabels[skill]} value={profile.subscores[skill]} />)}</div>
          </div>
          <div className="rounded-[2rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_18px_60px_rgba(33,72,67,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Examiner rule</p>
            <p className="mt-3 text-sm leading-6 text-[#dbe7e2]">The AI scores the finished task and updates DET memory. It does not mark the learning path from isolated clicks.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PracticeItemView({ item, index, value, onAnswer }: { item: DetPracticeItem; index: number; value: string; onAnswer: (id: string, value: string) => void }) {
  return (
    <div className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Task {index + 1}</p>
          <h4 className="mt-1 text-lg font-black text-[#17342f]">{item.title}</h4>
        </div>
        <span className="rounded-full bg-[#17342f]/8 px-3 py-1 text-xs font-bold text-[#315149]">{detModuleLabels[item.type]}</span>
      </div>
      {item.context ? <div className="mt-4 rounded-2xl bg-[#17342f]/5 p-4 text-sm leading-7 text-[#4f625b]">{item.context}</div> : null}
      <p className="mt-4 text-base font-semibold leading-7 text-[#17342f]">{item.prompt}</p>
      {item.options?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {item.options.map((option) => (
            <button key={option} onClick={() => onAnswer(item.id, option)} className={cn("rounded-2xl border px-4 py-3 text-left text-sm font-bold transition", value === option ? "border-[#17342f] bg-[#17342f] text-white" : "border-[#d8c8a8] bg-white/75 text-[#315149] hover:bg-white")}>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <textarea value={value} onChange={(event) => onAnswer(item.id, event.target.value)} rows={item.type.includes("sample") || item.type.includes("photo") ? 7 : 4} placeholder="Type your DET response here. The AI evaluates after the completed task." className="mt-4 w-full resize-y rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10" />
      )}
      <p className="mt-3 text-xs font-semibold text-[#6d756f]">Focus: {item.focus}</p>
    </div>
  );
}

function EvaluationPanel({ evaluation }: { evaluation: DetEvaluation }) {
  return (
    <div className="mt-6 rounded-[2rem] border border-[#cdddcf] bg-[#eff7ef] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2f7151]">AI DET score report</p>
          <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">Predicted Score {evaluation.score}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4f625b]">{evaluation.summary}</p>
        </div>
        <div className="rounded-2xl bg-white/75 p-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Accuracy</p>
          <p className="mt-1 font-mono text-4xl font-bold text-[#17342f]">{evaluation.accuracy}%</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Feedback title="Strengths" items={evaluation.strengths} />
        <Feedback title="Weaknesses" items={evaluation.weaknesses} />
        <Feedback title="Next plan" items={evaluation.nextPlan} />
      </div>
    </div>
  );
}

function Feedback({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-sm font-black text-[#17342f]">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[#4f625b]">{items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" /><span>{item}</span></li>)}</ul>
    </div>
  );
}

function MockExam({ answers, result, onAnswer, onFill, onSubmit }: { answers: Record<string, string>; result: DetMockResult | null; onAnswer: (id: string, value: string) => void; onFill: () => void; onSubmit: () => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Full DET simulation</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">Computer-adaptive Duolingo mock</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5c6b64]">Separate exam mode with adaptive question types, interactive tasks, Writing Sample, Speaking Sample, score report, and improvement plan.</p>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {detMockFlow.map((item) => <div key={item.id} className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-5"><p className="font-serif text-2xl font-semibold text-[#17342f]">{item.label}</p><p className="mt-3 font-mono text-3xl font-bold text-[#17342f]">{item.minutes}m</p><p className="mt-4 text-xs leading-5 text-[#6d756f]">{item.note}</p></div>)}
        </div>
      </section>

      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {allModules.map((module, index) => {
            const id = `mock-${module}-${index}`;
            return <MockInput key={id} id={id} title={detModuleLabels[module]} value={answers[id] ?? ""} onAnswer={onAnswer} />;
          })}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button onClick={onFill} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"><ClipboardList className="h-4 w-4" />Fill demo mock</button>
          <button onClick={onSubmit} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"><Play className="h-4 w-4" />Generate DET report</button>
        </div>
      </section>

      {result ? <MockResult result={result} /> : null}
    </div>
  );
}

function MockInput({ id, title, value, onAnswer }: { id: string; title: string; value: string; onAnswer: (id: string, value: string) => void }) {
  return (
    <label className="block rounded-2xl border border-[#e3dac6] bg-[#fffdf7] p-4">
      <span className="font-black text-[#17342f]">{title}</span>
      <textarea value={value} onChange={(event) => onAnswer(id, event.target.value)} rows={4} placeholder="Type demo answer or transcript here." className="mt-3 w-full rounded-2xl border border-[#d8c8a8] bg-white px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10" />
    </label>
  );
}

function MockResult({ result }: { result: DetMockResult }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[0.7fr_1fr]">
      <div className="rounded-[2.4rem] border border-white/70 bg-[#17342f] p-6 text-white shadow-[0_24px_80px_rgba(33,72,67,0.2)] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e3b65f]">DET mock result</p>
        <h2 className="mt-4 font-serif text-5xl font-semibold">Score {result.overallScore}</h2>
        <p className="mt-3 text-sm leading-6 text-[#d8e4df]">The AI generated a score estimate and subscore feedback after the complete mock.</p>
      </div>
      <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-2">{skillOrder.map((skill) => <ScoreCard key={skill} label={detSkillLabels[skill]} value={result[skill]} detail={result.feedback[skill]} />)}</div>
        <div className="mt-5 grid gap-3">{result.plan.map((item) => <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />{item}</div>)}</div>
      </div>
    </section>
  );
}

function Reports({ profile, recommendation }: { profile: DetProfile; recommendation: DetRecommendation }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">DET reports</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">Score movement and weakness memory</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">Next report focus: {recommendation.targetWeakness}</p>
        <div className="mt-7 flex h-64 items-end gap-3 overflow-x-auto border-b border-[#d8c8a8] pb-4">
          {profile.progress.map((point) => <div key={`${point.label}-${point.overall}`} className="flex min-w-20 flex-1 flex-col items-center gap-2"><div className="flex h-52 w-full items-end justify-center rounded-t-2xl bg-[#17342f]/5 px-2"><div className="w-full rounded-t-2xl bg-gradient-to-t from-[#17342f] to-[#6da894] shadow-lg shadow-[#17342f]/10" style={{ height: `${Math.max(12, (point.overall / 160) * 100)}%` }} /></div><p className="font-mono text-sm font-bold text-[#17342f]">{point.overall}</p><p className="text-xs font-bold text-[#8b6f39]">{point.label}</p></div>)}
        </div>
      </section>
      <section className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Practice history</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{profile.history.map((entry) => <div key={entry.id} className="rounded-2xl border border-[#e3dac6] bg-white/65 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#17342f]">{entry.title}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6f39]">{detModuleLabels[entry.module]} / {entry.date}</p></div><span className="rounded-full bg-[#17342f] px-3 py-1 font-mono text-sm font-bold text-white">{entry.score}</span></div><div className="mt-3 flex flex-wrap gap-2">{entry.weaknesses.map((weakness) => <span key={weakness} className="rounded-full bg-[#17342f]/7 px-2.5 py-1 text-xs font-semibold text-[#315149]">{weakness}</span>)}</div></div>)}</div>
      </section>
    </div>
  );
}

function ProfileView({ profile, recommendation }: { profile: DetProfile; recommendation: DetRecommendation }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Student DET profile</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">{profile.name}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">This memory layer drives adaptive DET practice and next score predictions.</p>
      </section>
      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Subscores</p><div className="mt-4 space-y-4">{skillOrder.map((skill) => <ScoreBar key={skill} label={detSkillLabels[skill]} value={profile.subscores[skill]} />)}</div></div>
        <div className="grid gap-5 md:grid-cols-2">
          <Memory icon={BookOpen} title="Vocabulary" value={profile.vocabularyLevel} />
          <Memory icon={PenLine} title="Grammar" value={profile.grammarLevel} />
          <Memory icon={Mic} title="Speaking confidence" value={`${profile.speakingConfidence}%`} />
          <Memory icon={Target} title="Next recommendation" value={`${detModuleLabels[recommendation.module]} for ${detSkillLabels[recommendation.skill]}`} />
        </div>
      </section>
      <section className="grid gap-5 xl:grid-cols-2"><Signal title="Strong signals" items={profile.strongSignals} /><Signal title="Weak topics" items={profile.weakTopics} /></section>
    </div>
  );
}

function SettingsView({ profile, setProfile, onReset }: { profile: DetProfile; setProfile: React.Dispatch<React.SetStateAction<DetProfile>>; onReset: () => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Settings</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">Tune DET memory</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">Adjust the demo score target and speaking confidence.</p>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <Slider label="Target DET score" value={profile.targetScore} min={80} max={160} step={5} onChange={(value) => setProfile((current) => ({ ...current, targetScore: value }))} />
          <Slider label="Speaking confidence" value={profile.speakingConfidence} min={30} max={100} step={1} suffix="%" onChange={(value) => setProfile((current) => ({ ...current, speakingConfidence: value }))} />
          <Slider label="Weekly study goal" value={profile.weeklyGoalHours} min={2} max={20} step={1} suffix="h" onChange={(value) => setProfile((current) => ({ ...current, weeklyGoalHours: value }))} />
        </div>
        <div className="rounded-[2rem] border border-[#e0c7a4] bg-[#f8e5c8]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.1)]"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b5732]">Demo control</p><h3 className="mt-2 font-serif text-2xl font-semibold text-[#17342f]">Reset Duolingo preview</h3><p className="mt-1 text-sm text-[#6a5d4d]">Restore the original DET demo profile and generated task state.</p><button onClick={onReset} className="mt-5 rounded-2xl bg-[#8b5732] px-5 py-3 text-sm font-black text-white">Reset demo</button></div>
      </section>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return <div><div className="flex items-center justify-between text-sm font-bold text-[#17342f]"><span>{label}</span><span>{value}</span></div><div className="mt-2 h-3 rounded-full bg-[#d8c8a8]/70"><div className="h-full rounded-full bg-[#17342f]" style={{ width: `${(value / 160) * 100}%` }} /></div></div>;
}

function ScoreCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-2xl bg-white/70 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</p><p className="mt-2 font-mono text-4xl font-bold text-[#17342f]">{value}</p><p className="mt-2 text-sm leading-6 text-[#5b6b63]">{detail}</p></div>;
}

function Memory({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl"><Icon className="h-5 w-5 text-[#2f7151]" /><p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{title}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#17342f]">{value}</p></div>;
}

function Signal({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">{title}</p><div className="mt-4 grid gap-3">{items.map((item) => <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />{item}</div>)}</div></div>;
}

function Slider({ label, value, min, max, step, suffix = "", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="mb-4 block rounded-2xl border border-[#e3dac6] bg-white/65 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-black text-[#17342f]">{label}</span><span className="font-mono text-lg font-bold text-[#17342f]">{value}{suffix}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-4 w-full accent-[#17342f]" /></label>;
}
