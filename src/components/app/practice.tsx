"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlarmClock,
  AlertTriangle,
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
  Mic,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  WifiOff,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { completionPercent, moduleConfig, wordCount } from "@/lib/app-config";
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
              onClick={() => onLaunch(module, mode)}
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left text-sm font-bold text-[#17342f] transition hover:-translate-y-0.5 hover:bg-white"
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {module === "reading" || module === "listening" || module === "writing" || module === "speaking" ? (
        !active && <BlueprintPanel module={module} blueprint={readingBlueprint ?? fallbackBlueprint} onLaunchType={(type) => onLaunch(module, type)} />
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

  useEffect(() => {
    setElapsed(0);
  }, [session.id]);

  const liveTiming = computeTimingMetrics(session.module, session.items.length, answers, session.durationMinutes, elapsed);

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
              <span>Section completion</span>
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
        {session.items.map((item, index) => (
          <PracticeQuestion
            key={item.id}
            item={item}
            index={index}
            module={session.module}
            value={answers[item.id] ?? ""}
            onAnswer={onAnswer}
          />
        ))}
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
          onClick={() => onSubmit(elapsed)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
        >
          Submit selected section
          <CheckCircle2 className="h-4 w-4" />
        </button>
      </div>

      {evaluation ? <EvaluationPanel evaluation={evaluation} /> : null}
      {evaluation && (session.module === "reading" || session.module === "listening" || session.module === "writing" || session.module === "speaking") ? (
        <AnswerKeyPanel session={session} answers={answers} evaluation={evaluation} />
      ) : null}
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
}: {
  item: PracticeItem;
  index: number;
  module: Skill;
  value: string;
  onAnswer: (id: string, value: string) => void;
}) {
  const isEssay = item.type === "essay";
  const targetWords = module === "writing" ? (item.title.includes("Task 1") ? 150 : 250) : 0;
  const liveWords = wordCount(value);

  return (
    <div className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Question {index + 1}</p>
          <h4 className="mt-1 text-lg font-black text-[#17342f]">{item.title}</h4>
        </div>
        <span className="rounded-full bg-[#17342f]/8 px-3 py-1 text-xs font-bold text-[#315149]">{item.descriptorFocus}</span>
      </div>

      {item.context ? (
        <div className="mt-4 rounded-2xl bg-[#17342f]/5 p-4 text-sm leading-7 text-[#4f625b]">{item.context}</div>
      ) : null}

      <p className="mt-4 text-base font-semibold leading-7 text-[#17342f]">{item.prompt}</p>

      {module === "writing" && item.chart && Array.isArray(item.chart.categories) && item.chart.categories.length > 0 ? (
        <ChartCard chart={item.chart} />
      ) : null}

      {item.options?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {item.options.map((option) => (
            <button
              key={option}
              onClick={() => onAnswer(item.id, option)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                value === option
                  ? "border-[#17342f] bg-[#17342f] text-white"
                  : "border-[#d8c8a8] bg-white/75 text-[#315149] hover:bg-white",
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
            onChange={(event) => onAnswer(item.id, event.target.value)}
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
          <VoiceRecorder onTranscript={(text) => text && onAnswer(item.id, text)} />
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

  return (
    <div className="mt-6 rounded-[2rem] border border-[#e3dac6] bg-[#fffaf0] p-5">
      <div className="flex items-center gap-3">
        <BookOpenCheck className="h-5 w-5 text-[#8b6f39]" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Answer key</p>
          <p className="text-sm font-bold text-[#17342f]">Question-by-question breakdown with logic and band advice</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {session.items.map((item, index) => {
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
                  {session.module === "writing" || session.module === "speaking" ? (
                    feedback.sampleHighBandAnswer ? (
                      <div className="rounded-2xl bg-[#e4f0ea] p-3">
                        <div className="flex items-center gap-2">
                          <BookOpenCheck className="h-4 w-4 text-[#2f7151]" />
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f7151]">Sample high band answer</p>
                        </div>
                        <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-[#315149]">{feedback.sampleHighBandAnswer}</p>
                      </div>
                    ) : null
                  ) : null}
                  <AnswerRow icon={<Sparkles className="h-4 w-4 text-[#8b6f39]" />} label="Explanation" text={feedback.explanation} />
                  <AnswerRow icon={<ListChecks className="h-4 w-4 text-[#8b6f39]" />} label="Logic" text={feedback.logic} />
                  <AnswerRow icon={<Lightbulb className="h-4 w-4 text-[#8b6f39]" />} label="Tip" text={feedback.tip} />
                  <AnswerRow icon={<Target className="h-4 w-4 text-[#8b6f39]" />} label="Suggestions" text={feedback.suggestions} />
                  <AnswerRow icon={<TrendingUp className="h-4 w-4 text-[#8b6f39]" />} label="Band advice" text={feedback.bandAdvice} />
                </div>
              ) : null}
            </div>
          );
        })}
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

      <section className="rounded-[2.4rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_22px_80px_rgba(33,72,67,0.18)] md:p-6">
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
