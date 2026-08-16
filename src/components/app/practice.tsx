"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlarmClock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Gauge,
  Layers,
  Lightbulb,
  LineChart,
  ListChecks,
  MessagesSquare,
  Mic,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  WifiOff,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { advanceQuestionWindow, rotateFreshItems } from "@/lib/fresh-items";
import { completionPercent, modeToBackend, moduleConfig, wordCount } from "@/lib/app-config";
import { API_BASE, clearAuth, getToken, isBackendUp } from "@/lib/backend";
import { ChartCard } from "@/components/chart-card";
import { CountdownTimer } from "@/components/countdown-timer";
import { AudioPlayer } from "@/components/audio-player";
import { VoiceRecorder } from "@/components/voice-recorder";
import { toast } from "@/hooks/use-toast";
import { brainApi } from "@/lib/api";
import type {
  BlueprintMeta,
  EvaluationResult,
  ItemFeedback,
  PracticeItem,
  PracticeSession,
  ReadingBlueprint,
  Skill,
  StudentLearningProfile,
  TextAnalysis,
} from "@/lib/ielts-brain";
import { listeningQuestionTypes, readingQuestionTypes, speakingQuestionTypes, writingQuestionTypes } from "@/lib/ielts-brain";
import {
  getBlueprintMeta,
  getListeningBlueprint,
  getReadingBlueprint,
  getSpeakingBlueprint,
  getWritingBlueprint,
} from "@/lib/ielts-brain";
import { computeTimingMetrics, formatClock, type PerformanceMetric, type TimingDetail } from "@/lib/timing";

export function PracticeModule({
  module,
  profile,
  session,
  answers,
  evaluation,
  loading,
  fullscreen = false,
  onExit,
  onAnswer,
  onLaunch,
  onSubmit,
  onUseSample,
}: {
  module: Skill;
  profile: StudentLearningProfile;
  session: PracticeSession | null;
  answers: Record<string, string>;
  evaluation: EvaluationResult | null;
  loading: boolean;
  fullscreen?: boolean;
  onExit?: () => void;
  onAnswer: (id: string, value: string) => void;
  onLaunch: (module?: Skill, mode?: string) => void;
  onSubmit: (elapsedSeconds?: number) => void;
  onUseSample: () => void;
}) {
  const config = moduleConfig[module];
  const Icon = config.icon;
  const [blueprints, setBlueprints] = useState<BlueprintMeta[] | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [readingBlueprint, setReadingBlueprint] = useState<ReadingBlueprint | null>(null);
  const [bank, setBank] = useState<{ session: PracticeSession; total: number } | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<{ reason: string; backendUp: boolean; authExpired: boolean } | null>(null);
  const activeTypeRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    setBlueprintLoading(true);
    fetch(`/api/brain/blueprints?module=${module}`)
      .then((response) => response.json())
      .then((data: BlueprintMeta[]) => {
        if (cancelled) return;
        setBlueprints(data && data.length > 0 ? data : getBlueprintMeta(module));
      })
      .catch(() => {
        if (!cancelled) setBlueprints(getBlueprintMeta(module));
      })
      .finally(() => {
        if (!cancelled) setBlueprintLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [module]);

  useEffect(() => {
    if (module !== "reading" && module !== "listening") return;
    let cancelled = false;
    brainApi
      .blueprint(module)
      .then((data) => {
        if (!cancelled) setReadingBlueprint(data);
      })
      .catch(() => {
        if (!cancelled) setReadingBlueprint(null);
      });
    return () => {
      cancelled = true;
    };
  }, [module]);

  const active = session !== null && session.module === module;
  const progress = active ? completionPercent(session as PracticeSession, answers) : 0;
  const fallbackBlueprint: ReadingBlueprint =
    module === "listening"
      ? getListeningBlueprint()
      : module === "writing"
        ? getWritingBlueprint()
        : module === "speaking"
          ? getSpeakingBlueprint()
          : getReadingBlueprint();
  const matchedEvaluation = active && session !== null && evaluation?.sessionId === session.id ? evaluation : null;

  const openBank = async (type: string) => {
    const activeAbort = new AbortController();
    activeTypeRef.current = type;
    setBankLoading(true);
    setBankError(null);
    let lastError = "";
    let lastStatus: number | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (activeAbort.signal.aborted) return;
      try {
        const response = await brainApi.bank(profile, module, type, 800);
        if (response.session && response.session.items.length > 0) {
          response.session.items = rotateFreshItems(response.session.items, module, response.session.mode);
          setBank(response);
          setBankLoading(false);
          return;
        }
        lastError = "The bank came back empty (0 questions).";
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        lastStatus = (error as Error & { status?: number }).status ?? null;
        console.error("[bank] attempt", attempt + 1, "failed:", lastError);
        if (lastStatus !== null && lastStatus >= 400 && lastStatus < 500) break;
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 600));
    }
    const backendUp = await isBackendUp().catch(() => false);
    setBankError({ reason: lastError, backendUp, authExpired: lastStatus === 401 });
    setBank(null);
    setBankLoading(false);
  };

  const handleModeClick = (label: string) => {
    if (label === "Blueprint") {
      document.getElementById(`blueprint-${module}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (label === "Practice by Question Type") {
      document.getElementById(`types-${module}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onLaunch(module, modeToBackend(module, label));
  };

  if (bankLoading) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-8 text-center shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl">
        <div>
          <div className="mx-auto grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-serif text-2xl font-semibold text-[#17342f]">Loading your question bank…</h3>
          <p className="mt-1 text-sm text-[#66746e]">Fetching up to 500 ready {config.label.toLowerCase()} questions.</p>
        </div>
      </div>
    );
  }

  if (bank && bank.session && bank.session.items.length > 0) {
    return (
      <BankWorkbench
        module={module}
        session={bank.session}
        onExit={() => setBank(null)}
      />
    );
  }

  if (bankError) {
    return (
      <section className="rounded-[2.4rem] border border-red-200 bg-[#fff5f3]/95 p-6 shadow-[0_22px_80px_rgba(33,72,67,0.12)]">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-2xl font-semibold text-[#5c1a17]">
              {bankError.authExpired ? "Your session has expired" : "Question bank unavailable"}
            </h3>
            <p className="mt-1 text-sm text-[#7c3f3c]">
              {bankError.authExpired
                ? "The backend rejected your last request (401 Unauthorized). Your login has expired — log in again and the bank will load normally."
                : "Could not load the question bank for this type after 3 attempts."}
            </p>
            <dl className="mt-4 space-y-2 rounded-2xl bg-white/80 p-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <dt className="font-bold text-[#17342f]">Reason:</dt>
                <dd className="break-all text-[#66746e]">{bankError.reason || "unknown"}</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-bold text-[#17342f]">Requested:</dt>
                <dd className="break-all text-[#66746e]">{API_BASE}/brain/bank</dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <dt className="font-bold text-[#17342f]">Backend reachable:</dt>
                <dd className={bankError.backendUp ? "font-bold text-[#2f7151]" : "font-bold text-red-600"}>
                  {bankError.backendUp ? "Yes — health check passed" : "No — health check failed"}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              {bankError.authExpired ? (
                <button
                  onClick={() => {
                    clearAuth();
                    window.location.reload();
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1e4440]"
                >
                  <Sparkles className="h-4 w-4" />
                  Log in again
                </button>
              ) : (
                <button
                  onClick={() => openBank(activeTypeRef.current || "")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1e4440]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry loading bank
                </button>
              )}
              <button
                onClick={() => setBankError(null)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-2.5 text-sm font-bold text-[#17342f] transition hover:bg-white"
              >
                Back to question types
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (fullscreen && active && session !== null) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col gap-4 px-4 py-4 lg:px-6">
        <div className="flex items-center justify-between gap-3 rounded-[1.6rem] border border-white/70 bg-[#fffaf0]/85 p-4 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", config.accent)}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Full-screen practice</p>
              <h2 className="font-serif text-2xl font-semibold text-[#17342f]">{config.label} — {session.mode}</h2>
            </div>
            <div className="flex items-center gap-2">
              {session.source === "offline" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d8c8a8] bg-[#f5eddc] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#8b5732]">
                  <WifiOff className="h-3.5 w-3.5" />
                  Offline mode
                </span>
              ) : session.source === "ai" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#17342f]/15 bg-[#e4f0ea] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#2f7151]">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI live
                </span>
              ) : null}
            </div>
          </div>
          {onExit ? (
            <button
              onClick={onExit}
              className="rounded-2xl border border-[#d8c8a8] bg-white/80 px-4 py-2 text-sm font-bold text-[#17342f] transition hover:bg-white"
            >
              ← Back
            </button>
          ) : null}
        </div>
        <PracticeWorkbench
          session={session}
          answers={answers}
          progress={progress}
          evaluation={matchedEvaluation}
          onAnswer={onAnswer}
          onSubmit={onSubmit}
          onUseSample={onUseSample}
        />
      </div>
    );
  }

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
              The AI Brain generates the questions. This interface only displays them and sends your answers back for evaluation.
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
              onClick={() => handleModeClick(mode)}
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left text-sm font-bold text-[#17342f] transition hover:-translate-y-0.5 hover:bg-white"
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {module === "reading" || module === "listening" || module === "writing" || module === "speaking" ? (
        <div id={`blueprint-${module}`}>
          {!active && <BlueprintPanel module={module} blueprint={readingBlueprint ?? fallbackBlueprint} onLaunchType={(type) => openBank(type)} />}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
        <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
          {active && session !== null ? (
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
              {blueprintLoading ? (
                <p className="rounded-2xl bg-white/60 p-4 text-sm text-[#66746e]">Loading blueprint metadata…</p>
              ) : blueprints && blueprints.length > 0 ? (
                blueprints.map((blueprint) => (
                  <button
                    key={blueprint.id}
                    onClick={() => onLaunch(module, blueprint.mode)}
                    className="w-full rounded-2xl border border-[#e3dac6] bg-white/65 p-3 text-left transition hover:bg-white"
                  >
                    <p className="font-bold text-[#17342f]">{blueprint.mode}</p>
                    <p className="mt-1 text-xs leading-5 text-[#66746e]">{blueprint.questionTypes.join(" / ")}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#8b6f39]">
                      {blueprint.durationMinutes} min · {blueprint.questionCount} questions · B{blueprint.difficultyBand.toFixed(1)}
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-white/60 p-4 text-sm text-[#66746e]">Could not load blueprints.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_18px_60px_rgba(33,72,67,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Examiner rule</p>
            <p className="mt-3 text-sm leading-6 text-[#dbe7e2]">
              No per-question marking. The AI Brain reviews the completed section and updates the learning memory in one pass.
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
  onSubmit: (elapsedSeconds?: number) => void;
  onUseSample: () => void;
}) {
  const config = moduleConfig[session.module];
  const Icon = config.icon;
  const [elapsed, setElapsed] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setElapsed(0);
    setStep(0);
  }, [session.id]);

  const liveTiming = computeTimingMetrics(session.module, session.items.length, answers, session.durationMinutes, elapsed);
  const answeredCount = session.items.filter((item) => Boolean((answers[item.id] ?? "").trim())).length;
  const groups = groupSessionItems(session.items);
  const total = session.items.length;
  const stepIndex = Math.min(step, Math.max(0, total - 1));
  const currentItem = session.items[stepIndex];
  const currentGroup = currentItem ? (groups.find((group) => group.items.some((entry) => entry.item.id === currentItem.id)) ?? groups[0] ?? null) : null;

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]", config.soft)}>
            <Icon className="h-4 w-4" />
            {session.mode}
          </div>
          <h3 className="mt-3 font-serif text-3xl font-semibold text-[#17342f]">{session.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66746e]">{session.subtitle}</p>
        </div>
        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#17342f]/5 p-2 text-center">
            <MiniStat label="Minutes" value={`${session.durationMinutes}`} />
            <MiniStat label="Questions" value={`${session.questionCount}`} />
            <MiniStat label="Level" value={`B${session.difficultyBand.toFixed(1)}`} />
          </div>
          <CountdownTimer
            minutes={session.durationMinutes}
            resetKey={session.id}
            onChange={setElapsed}
            onTimeUp={() => toast({ title: "Time is up", description: "Submit when you are ready — the AI will still evaluate your section." })}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-[#17342f]/5 p-3 sm:grid-cols-5">
        <MiniStat label="Time used" value={liveTiming.timing.timeTaken} />
        <MiniStat label="Recommended" value={formatClock(liveTiming.timing.recommendedSeconds)} />
        <MiniStat label="Remaining" value={liveTiming.timing.remaining} />
        <MiniStat label="Pace" value={liveTiming.speed.label} />
        <MiniStat label="Time mgmt" value={liveTiming.timeManagement.label} />
      </div>

      <div className="mt-5 rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">AI examiner intent</p>
            <p className="mt-1 text-sm leading-6 text-[#4f625b]">{session.examinerIntent}</p>
          </div>
          <div className="min-w-40">
            <div className="flex justify-between text-xs font-bold text-[#315149]">
              <span>{answeredCount}/{session.items.length} answered</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[#d8c8a8]/70">
              <div className="h-full rounded-full bg-[#17342f] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {session.module === "listening" ? <ListeningPanel session={session} /> : null}

      <div className="mt-5 space-y-4">
        {currentItem && currentGroup ? (
          <div className="overflow-hidden rounded-[2rem] border border-[#e3dac6] bg-[#fffdf7]">
            <div className="flex items-center justify-between gap-3 bg-[#17342f]/5 px-4 py-3">
              <p className="font-black text-[#17342f]">
                Question {stepIndex + 1} of {total}
              </p>
              {currentGroup.items.length > 1 ? (
                <span className="rounded-full bg-[#f6ecd4] px-3 py-1 font-mono text-xs font-bold text-[#8a6a1f]">
                  {currentGroup.title} · Q{currentGroup.items[0].index + 1}–{currentGroup.items[currentGroup.items.length - 1].index + 1}
                </span>
              ) : (
                <span className="rounded-full bg-[#f6ecd4] px-3 py-1 font-mono text-xs font-bold text-[#8a6a1f]">
                  {currentGroup.title}
                </span>
              )}
            </div>
            {currentGroup.text && session.module !== "listening" ? (
              <div className="border-b border-[#e3dac6] bg-white/80 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">
                  {session.module === "reading" ? "Reading passage" : "Recording script"}
                </p>
                <p className="mt-1.5 max-h-56 overflow-y-auto text-sm leading-7 text-[#4f625b]">{currentGroup.text}</p>
              </div>
            ) : null}
            <div className="p-4">
              <PracticeQuestion
                key={currentItem.id}
                item={currentItem}
                index={stepIndex}
                module={session.module}
                value={answers[currentItem.id] ?? ""}
                onAnswer={onAnswer}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-8 text-center text-sm font-semibold text-[#66746e]">
            No questions in this session yet.
          </div>
        )}

        {total > 1 ? (
          <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Jump to question</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {session.items.map((item, index) => {
                const answered = Boolean((answers[item.id] ?? "").trim());
                return (
                  <button
                    key={item.id}
                    onClick={() => setStep(index)}
                    title={`Question ${index + 1}`}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg text-xs font-black transition",
                      index === stepIndex && "ring-2 ring-[#17342f] ring-offset-2 ring-offset-[#fffdf7]",
                      answered ? "bg-[#f5eddc] text-[#8b5732]" : "bg-[#17342f]/8 text-[#315149]",
                    )}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-[#cdddcf] bg-[#eff7ef] px-4 py-3 text-sm font-semibold text-[#2f7151]">
        One step per question — {answeredCount}/{total} answered. Step through every question, then submit the section for the full AI examiner report.
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {stepIndex > 0 ? (
          <button
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>
        ) : null}
        {total > 0 && stepIndex < total - 1 ? (
          <button
            onClick={() => setStep((current) => Math.min(current + 1, total - 1))}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Next question ({stepIndex + 2}/{total})
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : total > 0 ? (
          <button
            onClick={() => onSubmit(elapsed)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Submit selected section
            <CheckCircle2 className="h-4 w-4" />
          </button>
        ) : null}
        <button
          onClick={onUseSample}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
        >
          <ClipboardList className="h-4 w-4" />
          Fill demo answers
        </button>
      </div>

      {evaluation ? <EvaluationPanel evaluation={evaluation} /> : null}
      {evaluation && (session.module === "reading" || session.module === "listening" || session.module === "writing" || session.module === "speaking") ? (
        <AnswerKeyPanel session={session} answers={answers} evaluation={evaluation} />
      ) : null}
    </div>
  );
}

function groupSessionItems(items: PracticeSession["items"]) {
  const groups: { key: string; title: string; text: string; items: { item: PracticeSession["items"][number]; index: number }[] }[] = [];
  let counter = 0;
  for (const [itemIndex, item] of items.entries()) {
    const context = (item.context ?? "").trim();
    let key = context || `__no_context__`;
    if (context && !groups.some((group) => group.key === key)) {
      counter += 1;
      const titleMatch = (item.title ?? "").match(/^(Passage \d|Part \d)/i);
      groups.push({ key, title: titleMatch ? titleMatch[1] : `Passage ${counter}`, text: context, items: [] });
    } else if (!context) {
      key = `__no_context__`;
    }
    if (!groups.some((group) => group.key === key)) {
      counter += 1;
      const titleMatch = (item.title ?? "").match(/^(Passage \d|Part \d)/i);
      groups.push({ key, title: titleMatch ? titleMatch[1] : `Passage ${counter}`, text: "", items: [] });
    }
    groups.find((group) => group.key === key)!.items.push({ item, index: itemIndex });
  }
  return groups;
}

function QuestionFeedbackCard({ feedback, module }: { feedback: ItemFeedback; module: Skill }) {
  const detail = feedback.feedback;
  const correct = feedback.isCorrect;
  return (
    <div className={cn("rounded-[2rem] border p-5", correct ? "border-[#cdddcf] bg-[#eff7ef]" : "border-[#eed9cf] bg-[#fdf3ec]")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {correct ? (
            <CheckCircle2 className="h-8 w-8 text-[#2f7151]" />
          ) : (
            <XCircle className="h-8 w-8 text-[#a2532e]" />
          )}
          <div>
            <p className={cn("text-xs font-black uppercase tracking-[0.18em]", correct ? "text-[#2f7151]" : "text-[#a2532e]")}>
              {detail.verdict}
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#17342f]">
              {module === "writing" || module === "speaking"
                ? detail.estimatedBand
                  ? `Estimated Band ${detail.estimatedBand.toFixed(1)}`
                  : detail.verdict
                : correct
                  ? "Correct answer"
                  : "Not quite — here is the answer"}
            </p>
          </div>
        </div>
      </div>

      {module !== "writing" && module !== "speaking" && detail.idealAnswer ? (
        <div className="mt-4 rounded-2xl bg-[#e4f0ea] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">Correct answer</p>
          <p className="mt-1.5 text-sm font-bold leading-6 text-[#2f7151]">{detail.idealAnswer}</p>
        </div>
      ) : null}

      {module === "speaking" ? (
        <SpeakingPassageCard teach={detail.speakingTeach} fallback={detail.spotCorrection || detail.sampleHighBandAnswer} />
      ) : null}

      {module === "speaking" && detail.speakingTeach ? (
        <div className="mt-4 space-y-3">
          {detail.speakingTeach.lines?.length ? (
            <div className="rounded-2xl bg-[#fffdf7] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Line by line — what to fix and where</p>
              <div className="mt-2 space-y-2">
                {detail.speakingTeach.lines.map((entry) => (
                  <div key={`${entry.n}-${entry.quote}`} className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-xs text-[#4f625b]">Line {entry.n}: <span className="italic text-[#8a6d3b]">"{entry.quote}"</span> <span className="text-[#a2532e]">— {entry.problem}</span></p>
                    <p className="mt-1 text-xs font-bold text-[#315149]">Say: {entry.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {detail.speakingTeach.grammar?.length ? (
            <div className="rounded-2xl bg-[#fffdf7] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Grammar fixes</p>
              <div className="mt-2 space-y-2">
                {detail.speakingTeach.grammar.map((g, i) => (
                  <div key={i} className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-xs text-[#4f625b]">"{g.sentence}" — <span className="text-[#a2532e]">{g.issue}</span></p>
                    <p className="mt-1 text-xs font-bold text-[#315149]">Say: {g.say}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {detail.speakingTeach.vocabulary?.length ? (
            <div className="rounded-2xl bg-[#fffdf7] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Vocabulary upgrades</p>
              <div className="mt-2 space-y-2">
                {detail.speakingTeach.vocabulary.map((v, i) => (
                  <div key={i} className="rounded-xl bg-white/80 p-2.5">
                    <p className="text-xs text-[#4f625b]"><span className="font-bold text-[#a2532e]">{v.word}</span> → <span className="font-bold text-[#2f7151]">{v.better}</span> <span className="text-[#66746e]">({v.why})</span></p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {detail.speakingTeach.fillers?.length ? (
            <div className="rounded-2xl bg-[#fffaf0] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Fillers spotted</p>
              <div className="mt-2 space-y-1.5">
                {detail.speakingTeach.fillers.map((f, i) => (
                  <p key={i} className="text-xs text-[#4f625b]">"{f.word}" at line {f.line} — replace with a natural pause or "actually / well".</p>
                ))}
              </div>
            </div>
          ) : null}
          {detail.speakingTeach.changes?.length ? (
            <div className="rounded-2xl bg-[#e9f2f6] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0e7490]">Quick changes for this answer</p>
              <div className="mt-2 space-y-1.5">
                {detail.speakingTeach.changes.map((c, i) => (
                  <p key={i} className="text-xs leading-5 text-[#3f554d]">{i + 1}. {c}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        <AnswerRow icon={<Sparkles className="h-4 w-4 text-[#8b6f39]" />} label="Explanation" text={detail.explanation} />
        <AnswerRow icon={<ListChecks className="h-4 w-4 text-[#8b6f39]" />} label="Logic" text={detail.logic} />
        {!(module === "speaking" && detail.speakingTeach) ? (
          <>
            <AnswerRow icon={<Lightbulb className="h-4 w-4 text-[#8b6f39]" />} label="Tip" text={detail.tip} />
            <AnswerRow icon={<Target className="h-4 w-4 text-[#8b6f39]" />} label="Suggestions" text={detail.suggestions} />
          </>
        ) : null}
        <AnswerRow icon={<TrendingUp className="h-4 w-4 text-[#8b6f39]" />} label="Band advice" text={detail.bandAdvice} />
        {detail.criteria?.length ? (
          <div className="rounded-2xl bg-[#fffdf7] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">IELTS criteria</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {detail.criteria.map((criterion) => (
                <div key={criterion.criterion} className="rounded-xl bg-white/80 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-[#315149]">{criterion.criterion}</p>
                    <span className="font-mono text-sm font-black text-[#17342f]">{criterion.band.toFixed(1)}</span>
                  </div>
                  {criterion.comment ? <p className="mt-1 text-xs leading-5 text-[#66746e]">{criterion.comment}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ListeningPanel({ session }: { session: PracticeSession }) {
  const scripts = session.items
    .map((item) => item.context)
    .filter((context): context is string => Boolean(context));
  const script = scripts.join(" ");
  return (
    <div className="mt-5">
      <AudioPlayer
        script={
          script ||
          "You will hear a conversation about a community garden project. The project runs every Saturday morning, and volunteers should arrive by nine o'clock. The organisers ask everyone to bring gardening gloves, because the equipment shed keeps only a few spare pairs. New volunteers are welcome, and the first session is free."
        }
        examLocked={session.mode === "Full Listening Section"}
      />
    </div>
  );
}

function extractListeningScript(session: PracticeSession, item: PracticeItem): string {
  if (item.context) return item.context;
  if (item.prompt) return item.prompt;
  const others = session.items
    .map((candidate) => candidate.context ?? "")
    .filter(Boolean);
  return others[0] ?? item.title ?? "Play the recording, then answer the questions.";
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/70 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-[#17342f]">{value}</p>
    </div>
  );
}

export function PracticeQuestion({
  item,
  index,
  module,
  value,
  onAnswer,
  locked = false,
}: {
  item: PracticeItem;
  index: number;
  module: Skill;
  value: string;
  onAnswer: (id: string, value: string) => void;
  locked?: boolean;
}) {
  const isEssay = item.type === "essay";
  const isTaskOne =
    item.examSection === "Task 1" ||
    item.title.includes("Task 1") ||
    (item.typeLabel ?? "").startsWith("Task 1");
  const targetWords = module === "writing" ? (isTaskOne ? 150 : 250) : 0;
  const liveWords = wordCount(value);

  return (
    <div className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-4 shadow-sm">
      {item.adaptiveReason ? (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-[#e8d9b0] bg-[#fbf4df] px-4 py-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8b6f39]" />
          <p className="text-xs leading-5 text-[#6d5d3a]">
            <span className="font-black uppercase tracking-[0.14em] text-[#8b6f39]">Why this question </span>
            {item.adaptiveReason}
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Question {index + 1}</p>
          <h4 className="mt-1 text-lg font-black text-[#17342f]">{item.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {item.difficultyBand ? (
            <span className="rounded-full bg-[#17342f]/5 px-3 py-1 font-mono text-xs font-bold text-[#315149]">
              Band {item.difficultyBand.toFixed(1)}
            </span>
          ) : null}
          <span className="rounded-full bg-[#17342f]/8 px-3 py-1 text-xs font-bold text-[#315149]">{item.descriptorFocus}</span>
        </div>
      </div>

      {item.context && module !== "listening" ? (
        <div className="mt-4 rounded-2xl bg-[#17342f]/5 p-4 text-sm leading-7 text-[#4f625b]">{item.context}</div>
      ) : null}

      <p className="mt-4 text-base font-semibold leading-7 text-[#17342f]">{item.prompt}</p>

      {module === "writing" && item.chart && (item.chart.type || (item.chart as { mixedWith?: unknown }).mixedWith) ? (
        <ChartCard chart={item.chart as unknown as Parameters<typeof ChartCard>[0]["chart"]} />
      ) : null}

      {item.options?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {item.options.map((option) => (
            <button
              key={option}
              onClick={() => !locked && onAnswer(item.id, option)}
              disabled={locked}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                value === option
                  ? "border-[#17342f] bg-[#17342f] text-white"
                  : "border-[#d8c8a8] bg-white/75 text-[#315149] hover:bg-white",
                locked && "cursor-not-allowed opacity-60",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : module === "speaking" ? null : (
        <div>
          <textarea
            value={value}
            onChange={(event) => !locked && onAnswer(item.id, event.target.value)}
            readOnly={locked}
            rows={item.type === "essay" ? 8 : 4}
            placeholder={
              "Type your full answer here. The AI evaluates after you submit the selected section."
            }
            className="mt-4 w-full resize-y rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
          />
          {module === "writing" && targetWords > 0 ? (
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-[#e4f0ea] px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2f7151]" />
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#2f7151]">Word counter</span>
              </div>
              <span className={cn("font-mono text-sm font-bold", liveWords >= targetWords ? "text-[#2f7151]" : "text-[#8b5732]")}>
                {liveWords} / {targetWords} words {liveWords >= targetWords ? "✓" : ""}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {module === "speaking" ? (
        <div className="mt-4">
          {locked ? (
            <p className="rounded-2xl bg-[#e4f0ea] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2f7151]">
              Response recorded — checking complete above.
            </p>
          ) : (
            <VoiceRecorder onTranscript={(text) => text && onAnswer(item.id, text)} />
          )}
        </div>
      ) : null}

      <p className="mt-3 text-xs font-semibold text-[#6d756f]">Focus: {item.expectedFocus}</p>
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
          <div className="flex gap-2">
            <div className="rounded-2xl bg-white/75 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Accuracy</p>
              <p className="mt-1 font-mono text-4xl font-bold text-[#17342f]">{evaluation.accuracy}%</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Score confidence</p>
              <p className="mt-1 font-mono text-4xl font-bold text-[#17342f]">
                {evaluation.confidence != null ? `${evaluation.confidence}%` : "—"}
              </p>
            </div>
          </div>
        </div>

        {evaluation.judges && evaluation.judges.length > 0 ? (
          <div className="mt-4 rounded-2xl bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Verification panel</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {evaluation.judges.map((judge) => (
                <span
                  key={judge.judge}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#17342f]/5 px-3 py-1 font-mono text-xs font-bold text-[#315149]"
                >
                  {judge.judge}: Band {judge.band.toFixed(1)}
                </span>
              ))}
              {evaluation.judgeAgreement != null ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-black",
                    evaluation.judgeAgreement >= 75
                      ? "bg-[#e4f0ea] text-[#2f7151]"
                      : evaluation.judgeAgreement >= 50
                        ? "bg-[#f5eddc] text-[#8b5732]"
                        : "bg-[#f8e8e2] text-[#a2532e]",
                  )}
                >
                  {evaluation.judgeAgreement}% agreement
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#5b6b63]">
              The band is the consensus of {evaluation.judges.length} independent AI examiners. When judges disagree, the
              report favours the shared score and lowers confidence.
            </p>
          </div>
        ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <FeedbackList title="Strengths" items={evaluation.strengths} />
        <FeedbackList title="Weaknesses" items={evaluation.weaknesses} />
        <FeedbackList title="Next plan" items={evaluation.nextPlan} />
      </div>

      {evaluation.speed || evaluation.timeManagement ? (
        <TimingCards
          speed={evaluation.speed}
          timeManagement={evaluation.timeManagement}
          detail={evaluation.timing}
        />
      ) : null}

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

      {evaluation.textAnalysis ? <TextAnalysisPanel analysis={evaluation.textAnalysis} /> : null}
    </div>
  );
}

function TextAnalysisPanel({ analysis }: { analysis: TextAnalysis }) {
  const metrics = [
    { label: "Words", value: `${analysis.wordCount}` },
    { label: "Sentences", value: `${analysis.sentenceCount}` },
    { label: "Avg sentence", value: `${analysis.averageSentenceWords.toFixed(1)}w` },
    { label: "Lexical range", value: `${analysis.uniqueWordRatio}%` },
    { label: "Paragraphs", value: `${analysis.paragraphCount}` },
    { label: "Long sentences", value: `${analysis.longSentenceCount}` },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-[#d8e4df] bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <LineChart className="h-5 w-5 text-[#2f7151]" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Language analysis</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-[#17342f]/5 px-3 py-3 text-center">
            <p className="font-mono text-xl font-bold text-[#17342f]">{metric.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#8b6f39]">{metric.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {analysis.insights.map((insight) => (
          <p key={insight} className="rounded-xl bg-[#eef7ef] px-3 py-2 text-xs leading-5 text-[#315149]">
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}

function TimingCards({
  speed,
  timeManagement,
  detail,
}: {
  speed?: PerformanceMetric;
  timeManagement?: PerformanceMetric;
  detail?: TimingDetail;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[#d8e4df] bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <Gauge className="h-5 w-5 text-[#2f7151]" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Pacing report</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {speed ? (
          <div className="rounded-2xl bg-[#17342f]/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Answer speed</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-mono text-3xl font-bold text-[#17342f]">{speed.score}</p>
              <span className="rounded-full bg-[#e4f0ea] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7151]">{speed.label}</span>
            </div>
            {speed.metric ? <p className="mt-1 text-xs font-bold text-[#315149]">{speed.metric}</p> : null}
            <p className="mt-2 text-xs leading-5 text-[#5b6b63]">{speed.comment}</p>
          </div>
        ) : null}
        {timeManagement ? (
          <div className="rounded-2xl bg-[#17342f]/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Time management</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-mono text-3xl font-bold text-[#17342f]">{timeManagement.score}</p>
              <span className="rounded-full bg-[#e4f0ea] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7151]">{timeManagement.label}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#5b6b63]">{timeManagement.comment}</p>
          </div>
        ) : null}
        {detail ? (
          <div className="rounded-2xl bg-[#17342f]/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Section time</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-mono text-3xl font-bold text-[#17342f]">{detail.timeTaken}</p>
              <span className="rounded-full bg-[#e4f0ea] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7151]">
                of {detail.recommendedSeconds >= 3600 ? `${Math.round(detail.recommendedSeconds / 60)}m` : formatClock(detail.recommendedSeconds)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#5b6b63]">
              {detail.onBudget ? `Finished ${detail.remaining} ahead of the recommended limit.` : `Went ${formatClock(detail.overBudgetSeconds)} over the recommended limit.`}
            </p>
          </div>
        ) : null}
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

function AnswerKeyPanel({
  session,
  answers,
  evaluation,
}: {
  session: PracticeSession;
  answers: Record<string, string>;
  evaluation: EvaluationResult;
}) {
  const feedbackById = new Map((evaluation.perItemFeedback ?? []).map((item) => [item.id, item]));
  if (feedbackById.size === 0) return null;
  const [reviewIndex, setReviewIndex] = useState(0);
  const reviewTotal = session.items.length;

  return (
    <div className="mt-6 rounded-[2rem] border border-[#e3dac6] bg-[#fffaf0] p-5">
      <div className="flex items-center gap-3">
        <BookOpenCheck className="h-5 w-5 text-[#8b6f39]" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Answer key</p>
          <p className="text-sm font-bold text-[#17342f]">Question-by-question breakdown with logic and band advice</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {session.items.map((item, index) => {
          const feedbackItem = feedbackById.get(item.id);
          const answered = Boolean((answers[item.id] ?? "").trim());
          const state = feedbackItem
            ? feedbackItem.isCorrect
              ? "correct"
              : "wrong"
            : answered
              ? "answered"
              : "idle";
          return (
            <button
              key={item.id}
              onClick={() => setReviewIndex(index)}
              title={`Question ${index + 1}`}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg text-xs font-black transition",
                index === reviewIndex && "ring-2 ring-[#17342f] ring-offset-2 ring-offset-[#fffaf0]",
                state === "correct" && "bg-[#e4f0ea] text-[#2f7151]",
                state === "wrong" && "bg-[#f8e8e2] text-[#a2532e]",
                state === "answered" && "bg-[#f5eddc] text-[#8b5732]",
                state === "idle" && "bg-[#17342f]/8 text-[#315149]",
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {reviewTotal > 0
          ? (() => {
              const index = Math.min(reviewIndex, reviewTotal - 1);
              const item = session.items[index];
              const feedbackItem = feedbackById.get(item.id);
              const feedback = feedbackItem?.feedback;
              const userAnswer = (answers[item.id] ?? "").trim() || "Not answered";
              return (
            <div key={item.id} className="rounded-[1.5rem] border border-[#e3dac6] bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Question {index + 1}</p>
                  <h4 className="mt-1 font-serif text-xl font-semibold text-[#17342f]">{item.title}</h4>
                </div>
                {feedback ? (
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em]",
                      feedback.verdict === "Correct" || feedback.verdict === "Good response"
                        ? "bg-[#e4f0ea] text-[#2f7151]"
                        : "bg-[#f8e8e2] text-[#a2532e]",
                    )}
                  >
                    {session.module === "writing" || session.module === "speaking" ? (
                      feedback.estimatedBand ? `Estimated Band ${feedback.estimatedBand.toFixed(1)}` : feedback.verdict
                    ) : (
                      feedback.verdict
                    )}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-6 text-[#17342f]">{item.prompt}</p>

              <div className={cn("grid gap-2", session.module === "writing" || session.module === "speaking" ? "grid-cols-1" : "sm:grid-cols-2")}>
                <div className="rounded-2xl bg-[#17342f]/5 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Your answer</p>
                  <p className="mt-1 whitespace-pre-line text-sm font-bold text-[#315149]">{userAnswer}</p>
                </div>
                {session.module !== "writing" && session.module !== "speaking" ? (
                  <div className="rounded-2xl bg-[#e4f0ea] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">Correct answer</p>
                    <p className="mt-1 text-sm font-bold text-[#2f7151]">{feedback?.idealAnswer ?? item.correctAnswer ?? "—"}</p>
                  </div>
                ) : null}
              </div>

              {feedback ? (
                <div className="mt-3 space-y-3">
                  {session.module === "writing" || session.module === "speaking" ? (
                    <div className="rounded-2xl bg-[#fffdf7] p-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#8b6f39]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">
                          {session.module === "writing" ? "IELTS criteria" : "IELTS speaking criteria"}
                        </p>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {feedback.criteria?.length
                          ? feedback.criteria.map((criterion) => (
                              <div key={criterion.criterion} className="rounded-xl bg-white/80 p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-bold text-[#315149]">{criterion.criterion}</p>
                                  <span className="font-mono text-sm font-black text-[#17342f]">{criterion.band.toFixed(1)}</span>
                                </div>
                                {criterion.comment ? <p className="mt-1 text-xs leading-5 text-[#66746e]">{criterion.comment}</p> : null}
                              </div>
                            ))
                          : null}
                      </div>
                    </div>
                  ) : null}
                  {session.module === "speaking" && feedback.fillerAdvice ? (
                    <div className="rounded-2xl bg-[#fffaf0] p-3">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-[#8b6f39]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Fillers</p>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-[#4f625b]">{feedback.fillerAdvice}</p>
                    </div>
                  ) : null}
                  {session.module === "speaking" ? (
                    <SpeakingPassageCard teach={feedback.speakingTeach} fallback={feedback.spotCorrection || feedback.sampleHighBandAnswer} />
                  ) : session.module === "writing" && (feedback.spotCorrection || feedback.sampleHighBandAnswer) ? (
                    <div className="rounded-2xl bg-[#e4f0ea] p-3">
                      <div className="flex items-center gap-2">
                        <BookOpenCheck className="h-4 w-4 text-[#2f7151]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">{feedback.spotCorrection ? "Your corrected answer — say it like this" : "Sample high band answer"}</p>
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#315149]">{feedback.spotCorrection || feedback.sampleHighBandAnswer}</p>
                    </div>
                  ) : null}
                  {session.module === "speaking" && feedback.speakingTeach ? (
                    <div className="mt-3 space-y-2.5">
                      {feedback.speakingTeach.lines?.length ? (
                        <div className="rounded-2xl bg-[#fffdf7] p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Line by line — what to fix and where</p>
                          <div className="mt-2 space-y-2">
                            {feedback.speakingTeach.lines.map((entry) => (
                              <div key={`r-${entry.n}-${entry.quote}`} className="rounded-xl bg-white/80 p-2.5">
                                <p className="text-xs text-[#4f625b]">Line {entry.n}: <span className="italic text-[#8a6d3b]">"{entry.quote}"</span> <span className="text-[#a2532e]">— {entry.problem}</span></p>
                                <p className="mt-1 text-xs font-bold text-[#315149]">Say: {entry.fix}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {feedback.speakingTeach.fillers?.length ? (
                        <div className="rounded-2xl bg-[#fffaf0] p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Fillers spotted</p>
                          <div className="mt-1.5 space-y-1">
                            {feedback.speakingTeach.fillers.map((f, i) => (
                              <p key={`rf-${i}`} className="text-xs text-[#4f625b]">"{f.word}" at line {f.line} — replace with a natural pause or "actually / well".</p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {feedback.speakingTeach.changes?.length ? (
                        <div className="rounded-2xl bg-[#e9f2f6] p-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#0e7490]">Quick changes for this answer</p>
                          <div className="mt-1.5 space-y-1">
                            {feedback.speakingTeach.changes.map((c, i) => (
                              <p key={`rc-${i}`} className="text-xs leading-5 text-[#3f554d]">{i + 1}. {c}</p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <AnswerRow icon={<Sparkles className="h-4 w-4 text-[#8b6f39]" />} label="Explanation" text={feedback.explanation} />
                  <AnswerRow icon={<ListChecks className="h-4 w-4 text-[#8b6f39]" />} label="Logic" text={feedback.logic} />
                  {!(session.module === "speaking" && feedback.speakingTeach) ? (
                    <>
                      <AnswerRow icon={<Lightbulb className="h-4 w-4 text-[#8b6f39]" />} label="Tip" text={feedback.tip} />
                      <AnswerRow icon={<Target className="h-4 w-4 text-[#8b6f39]" />} label="Suggestions" text={feedback.suggestions} />
                    </>
                  ) : null}
                  <AnswerRow icon={<TrendingUp className="h-4 w-4 text-[#8b6f39]" />} label="Band advice" text={feedback.bandAdvice} />
                </div>
              ) : null}
            </div>
          );
              })()
          : null}

        {reviewTotal > 1 ? (
          <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-[#17342f]">
                Question {Math.min(reviewIndex + 1, reviewTotal)} of {reviewTotal}
              </p>
              <span className="rounded-full bg-[#17342f]/5 px-3 py-1 text-xs font-bold text-[#315149]">
                {session.items.filter((item) => feedbackById.get(item.id)?.isCorrect).length} correct
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              {reviewIndex > 0 ? (
                <button
                  onClick={() => setReviewIndex((current) => Math.max(0, current - 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-2.5 text-sm font-bold text-[#17342f] transition hover:bg-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
              ) : null}
              {reviewIndex < reviewTotal - 1 ? (
                <button
                  onClick={() => setReviewIndex((current) => Math.min(reviewTotal - 1, current + 1))}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
                >
                  Next question ({Math.min(reviewIndex + 2, reviewTotal)}/{reviewTotal})
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AnswerRow({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-2xl bg-[#fffdf7] p-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{label}</p>
      </div>
      <p className="mt-1.5 text-sm leading-6 text-[#4f625b]">{text}</p>
    </div>
  );
}

function PassageView({
  title,
  segments,
  accent,
  rule,
}: {
  title: string;
  segments: { text: string; tag: "good" | "improve"; tip?: string }[];
  accent: "green" | "yellow";
  rule?: string;
}) {
  const improvable = segments.filter((segment) => segment.tag === "improve");
  return (
    <div className={cn("rounded-2xl p-4", accent === "green" ? "bg-[#e4f0ea]" : "bg-[#fffdf7]")}>
      <div className="flex items-center gap-2">
        <BookOpenCheck className={cn("h-4 w-4", accent === "green" ? "text-[#2f7151]" : "text-[#2f7151]")} />
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">{title}</p>
      </div>
      {rule ? (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-xl bg-[#17342f] px-3 py-1.5 text-[11px] font-black leading-4 text-white">
          <Timer className="h-3.5 w-3.5 shrink-0 translate-y-px" />
          Sentence plan — {rule}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3f0e7] px-2.5 py-1 text-[10px] font-bold text-[#2f7151]">
          <span className="h-2 w-2 rounded-full bg-[#2f7151]" />
          Already correct
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf0c2] px-2.5 py-1 text-[10px] font-bold text-[#8a6d3b]">
          <span className="h-2 w-2 rounded-full bg-[#b98a2a]" />
          Improve — logic tip below
        </span>
      </div>
      <p className={cn("mt-3 text-sm leading-7 text-[#17342f]", accent === "green" && "font-bold")}>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={cn(
              "rounded-md px-1 py-0.5",
              segment.tag === "good" ? "bg-[#d9f0e0] text-[#1f6b47]" : "bg-[#fdf0c2] text-[#7a5a12]",
            )}
          >
            {segment.text}
          </span>
        ))}
      </p>
      {improvable.length ? (
        <div className="mt-3 space-y-1.5">
          {improvable.map((segment, index) => (
            <p key={index} className="rounded-xl bg-[#fffaf0] px-3 py-2 text-xs leading-5 text-[#4f625b]">
              <span className="font-black text-[#a2532e]">"{segment.text}"</span>
              {segment.tip ? <span> — {segment.tip}</span> : null}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SpeakingPassageCard({
  teach,
  fallback,
}: {
  teach: NonNullable<ItemFeedback["feedback"]>["speakingTeach"];
  fallback?: string;
}) {
  const originalPassage = (teach?.originalPassage ?? []).filter((segment) => segment.text.trim());
  const passage = (teach?.passage ?? []).filter((segment) => segment.text.trim());
  if (!passage.length && !originalPassage.length) {
    if (!fallback) return null;
    return (
      <div className="mt-4 rounded-2xl bg-[#e4f0ea] p-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-[#2f7151]" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">Your corrected answer — say it like this</p>
        </div>
        <p className="mt-1.5 whitespace-pre-line text-sm font-bold leading-6 text-[#2f7151]">{fallback}</p>
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      {originalPassage.length ? (
        <PassageView title="Your passage — what you said" segments={originalPassage} accent="yellow" />
      ) : null}
      {passage.length ? (
        <PassageView title="Corrected passage — say it like this" segments={passage} accent="green" rule={teach?.lengthRule} />
      ) : null}
    </div>
  );
}

function BlueprintPanel({
  module,
  blueprint,
  onLaunchType,
}: {
  module: Skill;
  blueprint: ReadingBlueprint | null;
  onLaunchType: (type: string) => void;
}) {
  const types =
    module === "listening"
      ? listeningQuestionTypes
      : module === "writing"
        ? writingQuestionTypes
        : module === "speaking"
          ? speakingQuestionTypes
          : readingQuestionTypes;
  const label =
    module === "listening" ? "Listening" : module === "writing" ? "Writing" : module === "speaking" ? "Speaking" : "Reading";
  const typeBlurb =
    module === "listening"
      ? "Each type opens a focused 8-question, 10-minute set with the exact strategy applied — then the AI Brain evaluates the set."
      : module === "writing"
        ? "Each type opens a focused prompt (20 minutes for Task 1, 40 for Task 2) with the exact approach applied — then the AI Brain marks your response."
        : module === "speaking"
          ? "Each part opens a focused 3-prompt set (4-5 minutes) with the exact approach applied — then the AI Brain evaluates fluency, pronunciation, grammar, vocabulary and coherence."
          : "Each type opens a 10-question, 12-minute set with the exact strategy applied — then the AI Brain evaluates the whole set.";
  const typeMeta =
    module === "listening"
      ? "8 questions · 10 minutes · AI feedback"
      : module === "writing"
        ? "1 prompt · 20/40 minutes · AI feedback"
        : module === "speaking"
          ? "3 prompts · 4/5 minutes · AI feedback"
          : "10 questions · 12 minutes · AI feedback";

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">{label} blueprint</p>
            <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">The complete guide to {label}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66746e]">
              {blueprint?.tagline ?? `How the ${label} test is built, how it is scored, and how to lift your band.`}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <BlueprintSection icon={<Layers className="h-4 w-4" />} title={`${label} structure`}>
            {blueprint?.structure?.length ? (
              <ol className="space-y-2">
                {blueprint.structure.map((part) => (
                  <li key={part.name} className="rounded-2xl bg-white/65 p-3 text-sm leading-6 text-[#4f625b]">
                    <span className="font-black text-[#17342f]">{part.name}.</span> {part.detail}
                    <span className="font-semibold text-[#8b6f39]"> ({part.topic})</span>
                  </li>
                ))}
              </ol>
            ) : (
              null
            )}
          </BlueprintSection>

          <BlueprintSection icon={<ListChecks className="h-4 w-4" />} title="Question types">
            {blueprint?.questionTypes?.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {blueprint.questionTypes.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => onLaunchType(type.name)}
                    className="rounded-2xl border border-[#e3dac6] bg-white/70 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white"
                  >
                    <p className="text-sm font-black text-[#17342f]">{type.name}</p>
                    <p className="mt-1 text-xs leading-5 text-[#66746e]">
                      Strategy: {type.strategy} · {type.time} each
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-[#8b6f39]">Common mistake: {type.mistakes}</p>
                  </button>
                ))}
              </div>
            ) : (
              null
            )}
          </BlueprintSection>

          <BlueprintSection icon={<Gauge className="h-4 w-4" />} title="Scoring">
            {blueprint?.scoring?.length ? (
              <div className="overflow-x-auto rounded-2xl bg-white/65">
                <table className="w-full min-w-[26rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e3dac6]">
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Correct answers</th>
                      <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blueprint.scoring.map((row) => (
                      <tr key={row.band} className="border-b border-[#e3dac6]/60 last:border-0">
                        <td className="px-4 py-2.5 font-bold text-[#17342f]">{row.correct}</td>
                        <td className="px-4 py-2.5 text-[#4f625b]">{row.band}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              null
            )}
          </BlueprintSection>

          <BlueprintSection icon={<MessagesSquare className="h-4 w-4" />} title="How to answer each type naturally">
            {blueprint?.typeGuides?.length ? (
              <div className="space-y-5">
                {module === "speaking" ? (
                  <div className="rounded-2xl border border-[#e3dac6] bg-white/60 p-3 text-[11px] leading-5 text-[#4f625b]">
                    <span className="font-black text-[#8b6f39]">Examiner length rules (IDP official):</span> if a Part 1
                    answer is too short, the examiner is instructed to <em>prompt you with "why?"</em> — so give enough that no
                    prompt is needed (2–4 sentences); in Part 2 the official instruction is to keep talking for the
                    <em> full 2 minutes</em>; in Part 3 the examiner expects you to answer <em>"in more depth"</em> — longer
                    turns, usually 45–60 s, and they can pause whenever you were long enough (speak until told to move on).
                  </div>
                ) : null}
                {Array.from(new Set((blueprint?.typeGuides ?? []).map((guide) => guide.group).filter(Boolean))).map((group) => {
                  const guides = [...((blueprint?.typeGuides ?? []).filter((g) => g.group === group))].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
                  if (!guides.length) return null;
                  return (
                    <div key={group}>
                      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{group} — {guides.length} answer flows</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {guides.map((guide) => (
                          <div key={guide.name} className="rounded-2xl border border-[#e3dac6] bg-white/70 p-3.5">
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
                            {"band8" in guide && guide.band8 ? (
                              <p className="mt-2 rounded-xl bg-[#e4f0ea]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#315149]"><span className="font-black text-[#2f7151]">Band-8 move:</span> {guide.band8}</p>
                            ) : null}
                            <details className="group mt-2">
                              <summary className="cursor-pointer select-none text-[11px] font-black uppercase tracking-[0.14em] text-[#8b6f39]">More: official pattern · minute-plan · avoid</summary>
                              <div className="mt-2 space-y-1.5">
                                {guide.official ? (
                                  <p className="rounded-xl bg-[#f4efe2]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#7a6233]"><span className="font-black text-[#a3823c]">Official pattern:</span> {guide.official}</p>
                                ) : null}
                                {guide.tip ? (
                                  <p className="rounded-xl bg-[#eef2f1]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#3f554d]"><span className="font-black text-[#0e7490]">Minute-plan:</span> {guide.tip}</p>
                                ) : null}
                                <p className="rounded-xl bg-[#f8e8e2]/80 px-2.5 py-1.5 text-[11px] leading-5 text-[#7c4a2c]"><span className="font-black">Avoid:</span> {guide.avoid}</p>
                              </div>
                            </details>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              null
            )}
          </BlueprintSection>

          <BlueprintSection icon={<AlarmClock className="h-4 w-4" />} title="Time management">
            {blueprint?.timeManagement?.length ? (
              <ol className="space-y-2">
                {blueprint.timeManagement.map((item) => (
                  <li key={item} className="rounded-2xl bg-white/65 p-3 text-sm leading-6 text-[#4f625b]">
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              null
            )}
          </BlueprintSection>

          <BlueprintSection icon={<AlertTriangle className="h-4 w-4" />} title="Common mistakes">
            {blueprint?.commonMistakes?.length ? (
              <ul className="grid gap-2 md:grid-cols-2">
                {blueprint.commonMistakes.map((mistake) => (
                  <li key={mistake} className="rounded-2xl bg-[#f8e8e2]/80 p-3 text-sm leading-6 text-[#7c4a2c]">
                    {mistake}
                  </li>
                ))}
              </ul>
            ) : (
              null
            )}
          </BlueprintSection>

          <BlueprintSection icon={<TrendingUp className="h-4 w-4" />} title="Band advice by score">
            {blueprint?.bandTips ? (
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(blueprint.bandTips).map(([band, tip]) => (
                  <div key={band} className="rounded-2xl bg-[#e4f0ea] p-3 text-sm leading-6 text-[#315149]">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">Band {band}</p>
                    <p className="mt-1">{tip}</p>
                  </div>
                ))}
              </div>
            ) : (
              null
            )}
          </BlueprintSection>
        </div>
      </section>

      <section id={`types-${module}`} className="rounded-[2.4rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_22px_80px_rgba(33,72,67,0.18)] md:p-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Practice by question type</p>
        <h3 className="mt-2 font-serif text-3xl font-semibold">Target one skill at a time</h3>
        <p className="mt-2 text-sm leading-6 text-[#dbe7e2]">{typeBlurb}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => onLaunchType(type)}
              className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              <p className="text-sm font-black">{type}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#e3b65f]">{typeMeta}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function BlueprintSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{title}</p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BankWorkbench({
  module,
  session,
  onExit,
}: {
  module: Skill;
  session: PracticeSession;
  onExit: () => void;
}) {
  const config = moduleConfig[module];
  const Icon = config.icon;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedFeedback, setCheckedFeedback] = useState<Record<string, ItemFeedback>>({});
  const [checking, setChecking] = useState(false);

  const total = session.items.length;
  const currentItem = session.items[Math.min(currentIndex, total - 1)];
  const currentId = currentItem?.id ?? "";
  const currentValue = answers[currentId] ?? "";
  const currentFeedback = checkedFeedback[currentId];
  const checkedCount = session.items.filter((item) => Boolean(checkedFeedback[item.id])).length;
  const answeredCount = session.items.filter((item) => Boolean((answers[item.id] ?? "").trim())).length;

  const handleAnswer = (id: string, value: string) => {
    if (checkedFeedback[id]) {
      setCheckedFeedback((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheck = async () => {
    if (!currentValue.trim() || checking || currentFeedback) return;
    setChecking(true);
    try {
      const feedbackList = await brainApi.check(
        { id: session.id, module: session.module, mode: session.mode },
        { [currentId]: currentValue },
      );
      const feedback = feedbackList.find((entry) => entry.id === currentId) ?? feedbackList[0];
      if (feedback) {
        setCheckedFeedback((prev) => ({ ...prev, [currentId]: feedback }));
      } else {
        toast({ title: "No feedback returned", description: "Try the next question." });
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const message = !getToken() && /not authenticated|401/i.test(raw)
        ? "Sign in to use the AI Brain for instant question feedback."
        : raw || "The AI Brain is unreachable right now — move to the next question.";
      toast({ title: "Could not check this question", description: message });
    } finally {
      setChecking(false);
    }
  };

  const next = () => setCurrentIndex((index) => Math.min(index + 1, total - 1));
  const prev = () => setCurrentIndex((index) => Math.max(index - 1, 0));
  const skipTo = (index: number) => setCurrentIndex(Math.max(0, Math.min(index, total - 1)));
  const exit = () => {
    advanceQuestionWindow(module, session.mode, answeredCount);
    onExit();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", config.accent)}>
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Question bank</p>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-[#17342f]">{session.mode}</h2>
              <p className="mt-1 text-sm text-[#66746e]">
                {total} ready questions · {answeredCount} answered · {checkedCount} checked
              </p>
            </div>
          </div>
          <button
            onClick={exit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-4 py-2 text-sm font-bold text-[#17342f] transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blueprint
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#17342f]/5 p-3 sm:grid-cols-4">
          <MiniStat label="Questions" value={`${total}`} />
          <MiniStat label="Answered" value={`${answeredCount}`} />
          <MiniStat label="Checked" value={`${checkedCount}`} />
          <MiniStat label="Progress" value={`${Math.round((answeredCount / Math.max(1, total)) * 100)}%`} />
        </div>

        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Jump to question</p>
          <div className="mt-2 flex max-h-44 flex-wrap gap-1.5 overflow-y-auto rounded-2xl bg-white/60 p-3">
            {session.items.map((item, index) => {
              const feedbackItem = checkedFeedback[item.id];
              const answered = Boolean((answers[item.id] ?? "").trim());
              const state = feedbackItem
                ? feedbackItem.isCorrect
                  ? "correct"
                  : "wrong"
                : answered
                  ? "answered"
                  : "idle";
              return (
                <button
                  key={item.id}
                  onClick={() => skipTo(index)}
                  title={`Question ${index + 1}`}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg text-xs font-black transition",
                    index === currentIndex && "ring-2 ring-[#17342f] ring-offset-2 ring-offset-[#fffaf0]",
                    state === "correct" && "bg-[#e4f0ea] text-[#2f7151]",
                    state === "wrong" && "bg-[#f8e8e2] text-[#a2532e]",
                    state === "answered" && "bg-[#f5eddc] text-[#8b5732]",
                    state === "idle" && "bg-[#17342f]/8 text-[#315149]",
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
            Question {currentIndex + 1} of {total}
          </p>
          <span className="rounded-full bg-[#17342f]/5 px-3 py-1 text-xs font-bold text-[#315149]">{session.mode}</span>
        </div>

        <div className="mt-4">
          <PracticeQuestion
            key={currentItem.id}
            item={currentItem}
            index={currentIndex}
            module={module}
            value={currentValue}
            onAnswer={handleAnswer}
            locked={Boolean(currentFeedback)}
          />
        </div>

        {module === "listening" ? (
          <div className="mt-4">
            <AudioPlayer script={extractListeningScript(session, currentItem)} examLocked={session.mode === "Full Listening Section"} />
          </div>
        ) : null}

        {currentFeedback ? <QuestionFeedbackCard feedback={currentFeedback} module={module} /> : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {currentIndex > 0 ? (
            <button
              onClick={prev}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>
          ) : null}
          {!currentFeedback ? (
            <button
              onClick={handleCheck}
              disabled={!currentValue.trim() || checking}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checking ? "Checking…" : "Check answer"}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={next}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
            >
              {currentIndex >= total - 1 ? "Restart from question 1" : `Next question (${currentIndex + 2}/${total})`}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {checkedCount > 0 ? (
          <div className="mt-5 rounded-2xl border border-[#cdddcf] bg-[#eff7ef] p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2f7151]">Bank progress</p>
            <p className="mt-1 text-sm leading-6 text-[#4f625b]">
              {checkedCount} of {answeredCount} answered questions have been checked. Correct so far:{" "}
              {session.items.filter((item) => checkedFeedback[item.id]?.isCorrect).length}.
            </p>
            {currentIndex >= total - 1 ? (
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setCheckedFeedback({});
                }}
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-4 py-2 text-sm font-bold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Clear checks and go again
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
