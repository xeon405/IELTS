"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Eye, Gauge, Loader2, Play, Sparkles, Target } from "lucide-react";

import { cn } from "@/lib/utils";
import { isSkill, moduleConfig, skillOrder, type MockSection } from "@/lib/app-config";
import { CountdownTimer } from "@/components/countdown-timer";
import { AudioPlayer } from "@/components/audio-player";
import { PracticeQuestion } from "@/components/app/practice";
import { toast } from "@/hooks/use-toast";
import { officialMockSections, type MockExamResult, type PracticeSession, type Skill } from "@/lib/ielts-brain";
import { computeTimingMetrics, formatClock } from "@/lib/timing";
import { useEffect, useState } from "react";

const fallbackAudioScript =
  "Listening audio: The reference is M as in mother, 4, 2, and then double 8. Do not turn left at the tool shed as older maps suggest. Continue past it and the compost area is the second fenced space on your right. Weekend workshops used to cost 12 pounds, but the council subsidy means visitors now pay 7 pounds. Please bring gloves, a water bottle, and proof of registration.";

export function MockExam({
  section,
  answers,
  result,
  loading,
  sections,
  onStart,
  onAnswer,
  onFillDemo,
  onNext,
}: {
  section: MockSection;
  answers: Record<string, string>;
  result: MockExamResult | null;
  loading: boolean;
  sections: Partial<Record<Skill, PracticeSession | null>>;
  onStart: () => void;
  onAnswer: (id: string, value: string) => void;
  onFillDemo: () => void;
  onNext: (elapsedSeconds?: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
  }, [section]);

  if (section === "intro") {
    return (
      <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Real exam simulation</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">Full IELTS computer-delivered mock</h2>
          <p className="mt-4 text-sm leading-7 text-[#5c6b64]">
            This mode is separate from adaptive practice. It follows the official order, section timings, and question
            counts, and every section is generated fresh by the AI Brain exactly like the real exam: listening with
            audio, reading with three passages, writing with chart data, and speaking in three parts.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {officialMockSections.map((item) => {
            const skillConfig = isSkill(item.id) ? moduleConfig[item.id] : null;
            return (
              <div key={item.id} className="rounded-[2rem] border border-[#e3dac6] bg-white/70 p-5">
                <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]", skillConfig?.soft)}>
                  {item.label}
                </span>
                <p className="mt-3 font-serif text-2xl font-semibold text-[#17342f]">{item.minutes}m</p>
                <p className="mt-1 text-sm text-[#66746e]">{item.questions} questions</p>
                <p className="mt-4 text-xs leading-5 text-[#6d756f]">{item.note}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={onStart}
          disabled={loading}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? "Generating your exam paper…" : "Start mock exam"}
        </button>
        {loading ? (
          <p className="mt-3 text-sm font-semibold text-[#8b6f39]">
            The AI Brain is writing Listening, Reading, Writing and Speaking for your current band — this takes a few seconds.
          </p>
        ) : null}
      </div>
    );
  }

  if (section === "result") {
    return <MockResult result={result} answers={answers} onRestart={onStart} />;
  }

  const current = officialMockSections.find((item) => item.id === section)!;
  const index = skillOrder.indexOf(section);
  const skillConfig = isSkill(section) ? moduleConfig[section] : null;
  const session = sections[section] ?? null;
  const items = session?.items ?? [];
  const questionCount = items.length > 0 ? items.length : current.questions;
  const liveTiming = computeTimingMetrics(section, questionCount, answers, current.minutes, elapsed);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.28fr_1fr]">
      <aside className="rounded-[2.2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Exam order</p>
        <div className="mt-5 space-y-3">
          {officialMockSections.map((item, itemIndex) => {
            const skillConfig = isSkill(item.id) ? moduleConfig[item.id] : null;
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border p-4",
                  item.id === section
                    ? cn("border-[#17342f] text-white shadow-lg", skillConfig ? skillConfig.accent : "bg-[#17342f]")
                    : itemIndex < index
                      ? cn("border-transparent", skillConfig?.soft ?? "border-[#bdd3c7] bg-[#edf7ef] text-[#2f7151]")
                      : "border-[#e3dac6] bg-white/60 text-[#315149]",
                )}
              >
                <p className="font-bold">{item.label}</p>
                <p className="mt-1 text-xs opacity-75">{item.minutes} min / {item.questions} questions</p>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            {skillConfig ? (
              <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl", skillConfig.accent)}>
                <skillConfig.icon className="h-6 w-6" />
              </span>
            ) : null}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Computer-delivered mock</p>
              <h2 className="mt-1 font-serif text-4xl font-semibold text-[#17342f]">{current.label}</h2>
              <p className="mt-2 text-sm text-[#66746e]">{session ? session.subtitle : current.note}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CountdownTimer
              minutes={current.minutes}
              resetKey={`mock-${section}`}
              variant="exam"
              onChange={setElapsed}
              onTimeUp={() => toast({ title: `${current.label} section time is up`, description: "You can keep working, then submit when ready." })}
            />
            <MiniStatDark label="Questions" value={`${questionCount}`} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-[#17342f]/10 p-3 sm:grid-cols-5">
          <MiniStatDark label="Used" value={liveTiming.timing.timeTaken} />
          <MiniStatDark label="Recommended" value={`${current.minutes}m`} />
          <MiniStatDark label="Remaining" value={liveTiming.timing.remaining} />
          <MiniStatDark label="Pace" value={liveTiming.speed.label} />
          <MiniStatDark label="Time mgmt" value={liveTiming.timeManagement.label} />
        </div>

        {section === "listening" ? (
          <div className="mt-5">
            <AudioPlayer
              script={items.map((item) => item.context).filter(Boolean).join(" ") || fallbackAudioScript}
              examLocked
            />
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
          {loading && !session ? (
            <div className="grid min-h-[260px] place-items-center text-center">
              <div>
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#8b6f39]" />
                <p className="mt-3 text-sm font-bold text-[#17342f]">The AI Brain is writing this section…</p>
              </div>
            </div>
          ) : !session || items.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-[#66746e]">
              This section could not be generated. Go back to the start and retry the mock exam.
            </p>
          ) : section === "reading" ? (
            <ReadingSection items={items} answers={answers} onAnswer={onAnswer} />
          ) : (
            <div className="space-y-4">
              {items.map((item, itemIndex) => (
                <PracticeQuestion
                  key={item.id}
                  item={item}
                  index={itemIndex}
                  module={section}
                  value={answers[item.id] ?? ""}
                  onAnswer={onAnswer}
                />
              ))}
            </div>
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
            onClick={() => onNext(elapsed)}
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

function ReadingSection({
  items,
  answers,
  onAnswer,
}: {
  items: PracticeSession["items"];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
}) {
  const passages = new Map<string, { title: string; text: string; items: { item: PracticeSession["items"][number]; index: number }[] }>();
  let passageCounter = 0;
  for (const [itemIndex, item] of items.entries()) {
    const context = (item.context ?? "").trim();
    let key = context || `__no_context__`;
    if (context && !passages.has(key)) {
      passageCounter += 1;
      passages.set(key, { title: `Passage ${passageCounter} — ${item.title}`, text: context, items: [] });
    } else if (!context) {
      key = `__no_context__`;
    }
    if (!passages.has(key)) {
      passageCounter += 1;
      passages.set(key, { title: `Passage ${passageCounter} — ${item.title}`, text: "", items: [] });
    }
    passages.get(key)!.items.push({ item, index: itemIndex });
  }

  return (
    <div className="space-y-4">
      {Array.from(passages.values()).map((passage) => (
        <div key={passage.title} className="rounded-2xl border border-[#e3dac6] bg-[#fffdf7] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-black text-[#17342f]">{passage.title}</p>
            {passage.items.length > 0 ? (
              <span className="rounded-full bg-[#f6ecd4] px-3 py-1 font-mono text-xs font-bold text-[#8a6a1f]">
                Questions {passage.items[0].index + 1}–{passage.items[passage.items.length - 1].index + 1}
              </span>
            ) : null}
          </div>
          {passage.text ? <p className="mt-3 text-sm leading-7 text-[#4f625b]">{passage.text}</p> : null}
          <div className="mt-3 space-y-3">
            {passage.items.map(({ item, index }) => (
              <PracticeQuestion
                key={item.id}
                item={item}
                index={index}
                module="reading"
                value={answers[item.id] ?? ""}
                onAnswer={onAnswer}
              />
            ))}
          </div>
        </div>
      ))}
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

function MockResult({
  result,
  answers,
  onRestart,
}: {
  result: MockExamResult | null;
  answers: Record<string, string>;
  onRestart: () => void;
}) {
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

      <MockTimingResult result={result} />

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f0ea] text-[#2f7151]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Strengths</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What carried the mock</h3>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {result.strengths.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f7e3de] text-[#9c3a2e]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Weaknesses</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What cost you band score</h3>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {result.weaknesses.map((item) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[#9c3a2e]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Section feedback</p>
          <div className="mt-4 grid gap-3">
            {skillOrder.map((skill) => (
              <div key={skill} className="rounded-2xl bg-white/70 p-4">
                <p className="font-black text-[#17342f]">{skill.charAt(0).toUpperCase() + skill.slice(1)}</p>
                <p className="mt-1 text-sm leading-6 text-[#5b6b63]">{result.sectionFeedback[skill]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Recommendations</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Your next sessions</h3>
            </div>
          </div>
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

      <MockAnswerReview answers={answers} />
    </div>
  );
}

function MockTimingResult({ result }: { result: MockExamResult }) {
  const hasMetrics = result.speed || result.timeManagement;
  return (
    <section className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
          <Gauge className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Pacing across the mock</p>
          <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Accuracy, speed, and time management</h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MockMetricCard label="Overall accuracy" value={result.accuracy != null ? `${result.accuracy}%` : "—"} />
        <MockMetricCard label="Answer speed" value={result.speed ? `${result.speed.score}` : "—"} sub={result.speed?.label} comment={result.speed?.comment} />
        <MockMetricCard label="Time management" value={result.timeManagement ? `${result.timeManagement.score}` : "—"} sub={result.timeManagement?.label} comment={result.timeManagement?.comment} />
      </div>

      {hasMetrics ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {skillOrder.map((skill) => {
            const detail = result.timing?.[skill];
            if (!detail) return null;
            return (
              <div key={skill} className="rounded-xl bg-[#17342f]/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{skill}</p>
                <p className="mt-1 font-mono text-lg font-bold text-[#17342f]">{detail.timeTaken}</p>
                <p className="text-xs text-[#5b6b63]">
                  recommended {detail.recommendedSeconds >= 3600 ? `${Math.round(detail.recommendedSeconds / 60)} min` : formatClock(detail.recommendedSeconds)}
                  {detail.overBudgetSeconds > 0 ? ` · ${formatClock(detail.overBudgetSeconds)} over` : ""}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function MockMetricCard({
  label,
  value,
  sub,
  comment,
}: {
  label: string;
  value: string;
  sub?: string;
  comment?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#17342f]/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-mono text-4xl font-bold text-[#17342f]">{value}</p>
        {sub ? (
          <span className="rounded-full bg-[#e4f0ea] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7151]">{sub}</span>
        ) : null}
      </div>
      {comment ? <p className="mt-2 text-xs leading-5 text-[#5b6b63]">{comment}</p> : null}
    </div>
  );
}

function MockAnswerReview({ answers }: { answers: Record<string, string> }) {
  const numericIds = Object.keys(answers).filter((id) => id.startsWith("listening-") || id.startsWith("reading-"));
  const answeredNumeric = numericIds.filter((id) => (answers[id] ?? "").trim()).length;
  const writtenIds = Object.keys(answers).filter((id) => !id.startsWith("listening-") && !id.startsWith("reading-"));

  return (
    <section className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Submitted answers</p>
            <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Review what you wrote</h3>
          </div>
        </div>
        <span className="rounded-full bg-[#17342f]/5 px-4 py-2 font-mono text-sm font-bold text-[#315149]">
          {answeredNumeric}/{numericIds.length} listening & reading · {writtenIds.length} written
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniScore label="Listening" value={numericIds.filter((id) => id.startsWith("listening-")).filter((id) => (answers[id] ?? "").trim()).length} suffix={` / ${numericIds.filter((id) => id.startsWith("listening-")).length}`} />
        <MiniScore label="Reading" value={numericIds.filter((id) => id.startsWith("reading-")).filter((id) => (answers[id] ?? "").trim()).length} suffix={` / ${numericIds.filter((id) => id.startsWith("reading-")).length}`} />
        {writtenIds.map((id) => (
          <MiniScore key={id} label="Written" value={(answers[id] ?? "").trim() ? 1 : 0} suffix=" filled" />
        ))}
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-2">
        {writtenIds.map((id) => {
          const value = answers[id] ?? "";
          return (
            <div key={id} className="rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
              <p className="font-black text-[#17342f]">{id}</p>
              <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-[#4f625b]">
                {value.trim() || <span className="italic text-[#8b8f88]">No answer submitted.</span>}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BandCard({ label, band }: { label: string; band: number }) {
  const skillId = label.toLowerCase() as Skill;
  const skillConfig = skillOrder.includes(skillId) ? moduleConfig[skillId] : null;
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]", skillConfig?.soft ?? "bg-[#17342f]/5 text-[#8b6f39]")}>
        {label}
      </span>
      <p className="mt-3 font-mono text-5xl font-bold text-[#17342f]">{band.toFixed(1)}</p>
      <div className="mt-4 h-2 rounded-full bg-[#d8c8a8]/70">
        <div className={cn("h-full rounded-full", skillConfig?.accent ?? "bg-[#17342f]")} style={{ width: `${(band / 9) * 100}%` }} />
      </div>
    </div>
  );
}

function MiniScore({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const display = Number.isInteger(value) ? `${value}${suffix}` : `${value.toFixed(1)}${suffix}`;
  return (
    <div className="rounded-xl bg-[#17342f]/5 px-2 py-2">
      <p className="text-xs font-black text-[#8b6f39]">{label}</p>
      <p className="font-mono text-lg font-bold text-[#17342f]">{display}</p>
    </div>
  );
}
