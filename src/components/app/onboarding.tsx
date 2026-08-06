"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  GraduationCap,
  Headphones,
  Mic,
  PenLine,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { onboardingApi } from "@/lib/api";
import { moduleConfig } from "@/lib/app-config";
import { ChartCard } from "@/components/chart-card";
import { AudioPlayer } from "@/components/audio-player";
import { VoiceRecorder } from "@/components/voice-recorder";
import type {
  DiagnosticQuestion,
  DiagnosticResult,
  Skill,
  StudentLearningProfile,
} from "@/lib/ielts-brain";

type Step = "choose" | "diagnostic" | "result";

type DiagnosticChart = {
  type?: string;
  title?: string;
  unit?: string;
  categories?: string[];
  values?: number[];
};

const skillMeta: Record<Skill, { label: string; icon: typeof BookOpen; hint: string }> = {
  reading: { label: "Reading", icon: BookOpen, hint: "One short passage question" },
  listening: { label: "Listening", icon: Headphones, hint: "One short listening-style question" },
  writing: { label: "Writing", icon: PenLine, hint: "One Task 2 essay prompt" },
  speaking: { label: "Speaking", icon: Mic, hint: "One Part 2 cue card" },
};

const targetBands = [6, 6.5, 7, 7.5, 8];

export function Onboarding({
  profile,
  onComplete,
}: {
  profile: StudentLearningProfile;
  onComplete: (profile: StudentLearningProfile) => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState(profile.name === "IELTS Student" ? "" : profile.name);
  const [testType, setTestType] = useState<"academic" | "general">(profile.testType);
  const [targetBand, setTargetBand] = useState(profile.targetBand);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const answered = questions.filter((question) => (answers[question.id] ?? "").trim()).length;

  const startDiagnostic = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await onboardingApi.startDiagnostic();
      setQuestions(items);
      setStep("diagnostic");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the diagnostic assessment.");
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseTestType = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await onboardingApi.setTestType(profile, testType, targetBand);
      await startDiagnostic();
      setName((current) => current || updated.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your exam choice.");
      setLoading(false);
    }
  }, [profile, testType, targetBand, startDiagnostic]);

  const submitDiagnostic = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = { ...profile, name: name.trim() || profile.name, testType, targetBand };
      const outcome = await onboardingApi.submitDiagnostic(next, answers);
      setResult(outcome);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The AI examiner could not score the diagnostic.");
    } finally {
      setLoading(false);
    }
  }, [profile, name, testType, targetBand, answers]);

  const finish = useCallback(() => {
    if (!result) return;
    onComplete(result.profile);
  }, [result, onComplete]);

  return (
    <main className="exam-grid min-h-screen overflow-hidden bg-[#f5eddc] text-[#17342f]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-slow-drift absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
        <div className="animate-slow-drift absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-[#e8c872]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f] shadow-lg shadow-[#17342f]/20">
            <Brain className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-[#8b6f39]">
            {step === "choose" ? "Step 1 of 3 · Your exam" : step === "diagnostic" ? "Step 2 of 3 · Diagnostic" : "Step 3 of 3 · Your starting bands"}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            {step === "choose" ? "Welcome. Which IELTS are you taking?" : step === "diagnostic" ? "A quick diagnostic, four sections" : "The AI Brain knows where you start"}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5b6b63]">
            {step === "choose"
              ? "Choose the exam you are preparing for. The AI Brain will use it to generate the right questions, topics and difficulty."
              : step === "diagnostic"
                ? "Answer one question per section. The AI examiner estimates your current band and builds your learning profile from it."
                : "Your starting bands are saved in your learning profile. Every session from now on adapts to this memory."}
          </p>
        </div>

        <div className="w-full animate-soft-rise rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_24px_90px_rgba(33,72,67,0.16)] backdrop-blur-xl md:p-8">
          {step === "choose" ? (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="mt-2 w-full rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
                />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Exam type</span>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      {
                        value: "academic",
                        title: "Academic",
                        text: "For university, higher education and professional registration.",
                        icon: GraduationCap,
                      },
                      {
                        value: "general",
                        title: "General Training",
                        text: "For migration, work abroad and secondary education.",
                        icon: Briefcase,
                      },
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const active = testType === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTestType(option.value)}
                        className={cn(
                          "relative rounded-[1.8rem] border-2 p-5 text-left transition hover:-translate-y-0.5",
                          active
                            ? "border-[#17342f] bg-[#17342f] text-white shadow-lg shadow-[#17342f]/20"
                            : "border-[#d8c8a8] bg-[#fffdf7] hover:border-[#17342f]/40",
                        )}
                      >
                        {active ? (
                          <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-[#e3b65f] text-[#17342f]">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                        <Icon className={cn("h-7 w-7", active ? "text-[#e3b65f]" : "text-[#2f7151]")} />
                        <p className="mt-4 font-serif text-2xl font-semibold">{option.title}</p>
                        <p className={cn("mt-1 text-xs leading-5", active ? "text-[#d8e4df]" : "text-[#5b6b63]")}>
                          {option.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">
                  Target band · {targetBand.toFixed(1)}
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {targetBands.map((band) => (
                    <button
                      key={band}
                      onClick={() => setTargetBand(band)}
                      className={cn(
                        "rounded-xl px-4 py-2 font-mono text-sm font-bold transition",
                        targetBand === band ? "bg-[#17342f] text-white" : "bg-[#f5eddc] text-[#315149] hover:bg-[#e8ddc6]",
                      )}
                    >
                      {band.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>

              {error ? <p className="rounded-2xl border border-[#d8c8a8] bg-[#f5eddc] px-4 py-3 text-center text-sm text-[#8b3a2a]">{error}</p> : null}

              <button
                onClick={chooseTestType}
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Preparing your diagnostic…" : "Start the diagnostic assessment"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          ) : null}

          {step === "diagnostic" ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl bg-[#17342f] px-5 py-3 text-white">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e3b65f]">
                  {answered} / {questions.length} answered
                </p>
                <div className="flex gap-1.5">
                  {questions.map((question) => (
                    <span
                      key={question.id}
                      className={cn(
                        "h-2 w-2 rounded-full",
                        (answers[question.id] ?? "").trim() ? "bg-[#e3b65f]" : "bg-white/25",
                      )}
                    />
                  ))}
                </div>
              </div>

              {questions.map((question, index) => {
                const skill = question.skill && skillMeta[question.skill] ? question.skill : "reading";
                const meta = skillMeta[skill];
                const Icon = meta.icon;
                const config = moduleConfig[skill];
                const value = answers[question.id] ?? "";
                const isSpeaking = skill === "speaking";
                const isListening = skill === "listening";
                const isReading = skill === "reading";
                const chart = skill === "writing" ? (question as DiagnosticQuestion & { chart?: DiagnosticChart }).chart : undefined;
                return (
                  <div key={question.id} className="rounded-[1.8rem] border border-white/70 bg-[#fffdf7] p-5">
                    <div className="flex items-center gap-3">
                      <span className={cn("grid h-10 w-10 place-items-center rounded-xl text-white", config.accent.split(" ")[0])}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black">
                          <span className={cn("mr-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]", config.soft)}>
                            {meta.label}
                          </span>
                          {question.title.replace(/^Reading |^Listening |^Writing |^Speaking /, "")}
                        </p>
                        <p className="text-xs text-[#8b8f88]">{meta.hint}</p>
                      </div>
                    </div>

                    {isReading && question.context ? (
                      <div className="mt-4 rounded-2xl border border-[#2f5d8c]/20 bg-[#e2ecf5] p-4">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2f5d8c]">Reading passage</p>
                        <p className="mt-2 text-sm leading-7 text-[#315149]">{question.context}</p>
                      </div>
                    ) : null}

                    {isListening && question.context ? (
                      <div className="mt-4">
                        <AudioPlayer script={question.context} />
                      </div>
                    ) : null}

                    {chart ? <ChartCard chart={chart} /> : null}

                    <p className="mt-4 text-sm leading-6 text-[#4f625b]">{question.prompt}</p>

                    {question.options?.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {question.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                            className={cn(
                              "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                              value === option
                                ? "border-[#17342f] bg-[#17342f] text-white"
                                : "border-[#d8c8a8] bg-[#fffdf7] text-[#315149] hover:border-[#17342f]/40",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : isSpeaking ? (
                      <div className="mt-3">
                        <VoiceRecorder
                          onTranscript={(text) => {
                            if (text && text.trim()) setAnswers((current) => ({ ...current, [question.id]: text.trim() }));
                          }}
                        />
                      </div>
                    ) : (
                      <textarea
                        value={value}
                        onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                        placeholder="Type your answer here…"
                        rows={skill === "writing" ? 6 : 3}
                        className="mt-3 w-full resize-y rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
                      />
                    )}
                    {index < questions.length - 1 ? (
                      <div className="mt-5 h-px bg-[#e8ddc6]" />
                    ) : null}
                  </div>
                );
              })}

              {error ? <p className="rounded-2xl border border-[#d8c8a8] bg-[#f5eddc] px-4 py-3 text-center text-sm text-[#8b3a2a]">{error}</p> : null}

              <button
                onClick={submitDiagnostic}
                disabled={loading || answered < questions.length}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "The AI examiner is scoring…" : "Estimate my current band"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </button>
            </div>
          ) : null}

          {step === "result" && result ? <ResultView result={result} onFinish={finish} /> : null}
        </div>
      </div>
    </main>
  );
}

function ResultView({ result, onFinish }: { result: DiagnosticResult; onFinish: () => void }) {
  const bands: { skill: Skill; band: number }[] = [
    { skill: "reading", band: result.bands.reading },
    { skill: "listening", band: result.bands.listening },
    { skill: "writing", band: result.bands.writing },
    { skill: "speaking", band: result.bands.speaking },
  ];
  const weakest = bands.reduce((lowest, entry) => (entry.band < lowest.band ? entry : lowest), bands[0]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] bg-[#17342f] p-6 text-white shadow-inner shadow-white/10">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Estimated overall band</p>
          <Sparkles className="h-5 w-5 text-[#e3b65f]" />
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-mono text-6xl font-bold">{result.overallBand.toFixed(1)}</span>
          <span className="pb-2 text-sm text-[#d8e4df]">/ 9.0</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#d8e4df]">{result.summary}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {bands.map(({ skill, band }) => {
          const meta = skillMeta[skill];
          const Icon = meta.icon;
          const config = moduleConfig[skill];
          return (
            <div
              key={skill}
              className={cn(
                "flex items-center gap-4 rounded-2xl border p-4",
                skill === weakest.skill ? "border-[#d69b5b] bg-[#f5e7cf]" : "border-white/70 bg-[#fffdf7]",
              )}
            >
              <span className={cn("grid h-11 w-11 place-items-center rounded-xl text-white", config.accent.split(" ")[0])}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-black">{meta.label}</p>
                <p className="text-xs text-[#8b8f88]">{skill === weakest.skill ? "Focus area" : "Starting band"}</p>
              </div>
              <span className="font-mono text-2xl font-bold">{band.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#d8c8a8] bg-[#f5eddc] px-5 py-4 text-sm leading-6 text-[#5b6b63]">
        <span className="font-black text-[#17342f]">Learning profile saved.</span> Your bands, weaknesses and history
        are now in your AI memory. The dashboard below is built from this diagnostic — returning students skip this
        step and continue straight to personalized practice.
      </div>

      <button
        onClick={onFinish}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
      >
        Open my personalized dashboard
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </button>
    </div>
  );
}
