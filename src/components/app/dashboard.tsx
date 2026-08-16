"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  ChevronRight,
  Clock,
  Gauge,
  Layers,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { moduleConfig, skillOrder, type ViewId } from "@/lib/app-config";
import { Reveal } from "@/components/reveal";
import type {
  AdaptiveRecommendation,
  PracticeSession,
  Skill,
  StudentLearningProfile,
} from "@/lib/ielts-brain";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return (
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " +
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

export function Dashboard({
  profile,
  recommendation,
  bandGap,
  lastSession,
  onLaunchPractice,
  onContinue,
  onQuick,
  onStartMock,
  onGoTo,
}: {
  profile: StudentLearningProfile;
  recommendation: AdaptiveRecommendation;
  bandGap: number;
  lastSession: PracticeSession | null;
  onLaunchPractice: (module?: Skill, mode?: string) => void;
  onContinue: () => void;
  onQuick: (module?: Skill) => void;
  onStartMock: () => void;
  onGoTo: (view: ViewId) => void;
}) {
  const recentActivity = [
    ...profile.practiceHistory.slice(0, 3).map((entry) => ({
      id: entry.id,
      date: formatDate(entry.date),
      title: entry.title,
      detail: `${moduleConfig[entry.module].label} · ${entry.mode} · Band ${entry.band.toFixed(1)}`,
      icon: moduleConfig[entry.module].icon,
      type: "Practice" as const,
    })),
    ...profile.mockHistory.slice(0, 2).map((entry) => ({
      id: entry.id,
      date: formatDate(entry.date),
      title: "Full mock exam",
      detail: `Overall Band ${entry.overallBand.toFixed(1)} · L ${entry.listeningBand} R ${entry.readingBand} W ${entry.writingBand} S ${entry.speakingBand}`,
      icon: Trophy,
      type: "Mock" as const,
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-5">
      <Reveal>
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/70 bg-[#17342f] p-6 text-white shadow-[0_24px_90px_rgba(23,52,47,0.24)] md:p-8">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full border border-[#e3b65f]/30" />
          <div className="absolute -right-16 bottom-[-5rem] h-64 w-64 rounded-full bg-[#e3b65f]/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#e9d29b]">
                <Brain className="h-4 w-4" />
                AI Brain Command Center
              </div>
              <h3 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
                Adaptive IELTS training that learns before it teaches.
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#d8e4df]">
                The platform remembers skill bands, weak question types, topics, mock history, and practice
                outcomes. Every session is selected to move the student toward Band {profile.targetBand.toFixed(1)}.
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
      </Reveal>

      <Reveal delay={60}>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Target} label="Current band" value={profile.currentBand.toFixed(1)} detail={`Target ${profile.targetBand.toFixed(1)}`} />
        <MetricCard icon={Activity} label="Study streak" value={`${profile.studyStreak}`} detail="days of profile memory" />
        <MetricCard icon={Timer} label="Weekly goal" value={`${profile.completedHours}/${profile.weeklyGoalHours}h`} detail="practice hours" />
        <MetricCard icon={ShieldCheck} label="AI confidence" value={`${profile.confidenceLevel}%`} detail="learning profile signal" />
        </section>
      </Reveal>

      <Reveal delay={120}>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ContinueCard lastSession={lastSession} onContinue={onContinue} />
        <QuickCard onQuick={onQuick} />
        <MockShortcut onStartMock={onStartMock} />
        </section>
      </Reveal>

      <Reveal delay={180}>
        <section className="grid grid-cols-1 min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <ModuleGrid profile={profile} onLaunchPractice={onLaunchPractice} />
        <div className="min-w-0 space-y-5">
          <WeaknessMap profile={profile} />
          <ProgressCard profile={profile} onGoTo={onGoTo} />
          <RecentActivity items={recentActivity} onGoTo={onGoTo} />
          </div>
        </section>
      </Reveal>
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
    { label: "Generate", value: `${recommendation.module.charAt(0).toUpperCase() + recommendation.module.slice(1)} ${recommendation.mode}` },
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
    <div className="group hover-lift rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl hover:shadow-[0_26px_70px_rgba(33,72,67,0.18)]">
      <div className="flex items-center justify-between">
        <span className="rounded-2xl bg-[#17342f] p-3 text-white transition duration-300 group-hover:scale-110 group-hover:bg-[#245f5a]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</span>
      </div>
      <p className="mt-5 font-mono text-3xl font-bold text-[#17342f]">{value}</p>
      <p className="mt-1 text-sm text-[#66746e]">{detail}</p>
    </div>
  );
}

function ContinueCard({
  lastSession,
  onContinue,
}: {
  lastSession: PracticeSession | null;
  onContinue: () => void;
}) {
  const icon = lastSession ? moduleConfig[lastSession.module].icon : Play;
  return (
    <button
      onClick={onContinue}
      className="group flex items-center gap-4 rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.11)] transition hover:-translate-y-1 hover:bg-white"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17342f] text-white">
        <Clock className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Continue practice</p>
        <p className="mt-1 truncate font-serif text-xl font-semibold text-[#17342f]">
          {lastSession ? lastSession.title : "Start a new session"}
        </p>
        <p className="mt-1 text-sm text-[#66746e]">
          {lastSession
            ? `${moduleConfig[lastSession.module].label} · ${lastSession.mode} · ${lastSession.durationMinutes} min`
            : "The AI Brain will pick your next best action."}
        </p>
      </div>
      <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-[#8b6f39] transition group-hover:translate-x-1" />
    </button>
  );
}

function QuickCard({ onQuick }: { onQuick: (module?: Skill) => void }) {
  const icon = Sparkles;
  return (
    <button
      onClick={() => onQuick()}
      className="group flex items-center gap-4 rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.11)] transition hover:-translate-y-1 hover:bg-white"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Quick practice</p>
        <p className="mt-1 font-serif text-xl font-semibold text-[#17342f]">Five-minute warm-up</p>
        <p className="mt-1 text-sm text-[#66746e]">A short boost for the skill the AI suggests.</p>
      </div>
      <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-[#8b6f39] transition group-hover:translate-x-1" />
    </button>
  );
}

function MockShortcut({ onStartMock }: { onStartMock: () => void }) {
  return (
    <button
      onClick={onStartMock}
      className="group flex items-center gap-4 rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.11)] transition hover:-translate-y-1 hover:bg-white"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17342f] text-white">
        <Trophy className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Full mock test</p>
        <p className="mt-1 font-serif text-xl font-semibold text-[#17342f]">Computer-delivered exam</p>
        <p className="mt-1 text-sm text-[#66746e]">Listening → Reading → Writing → Speaking, official timings.</p>
      </div>
      <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-[#8b6f39] transition group-hover:translate-x-1" />
    </button>
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
    <div className="grid min-w-0 gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
      {skillOrder.map((skill) => {
        const config = moduleConfig[skill];
        const Icon = config.icon;
        return (
          <button
            key={skill}
            onClick={() => onLaunchPractice(skill)}
            className={cn(
              "group min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br p-5 text-left shadow-[0_18px_60px_rgba(33,72,67,0.11)] transition hover:-translate-y-1",
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

function ProgressCard({ profile, onGoTo }: { profile: StudentLearningProfile; onGoTo: (view: ViewId) => void }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-white">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Progress</p>
          <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Band trend</h3>
        </div>
      </div>
      {profile.progress.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white/60 p-4 text-sm leading-6 text-[#66746e]">
          No sessions yet — your band trend appears here after your first practice.
        </p>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-3 overflow-x-auto border-b border-[#d8c8a8] pb-3">
          {profile.progress.map((point) => (
            <div key={`${point.label}-${point.overall}`} className="flex min-w-16 flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end justify-center rounded-t-2xl bg-[#17342f]/5 px-2">
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
      )}
      <button
        onClick={() => onGoTo("reports")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-4 py-3 text-sm font-black text-white transition hover:bg-[#1e453d]"
      >
        <BarChart3 className="h-4 w-4" />
        Open full reports
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function RecentActivity({
  items,
  onGoTo,
}: {
  items: { id: string; date: string; title: string; detail: string; icon: LucideIcon; type: "Practice" | "Mock" }[];
  onGoTo: (view: ViewId) => void;
}) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-white">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Recent activity</p>
            <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Latest sessions</h3>
          </div>
        </div>
        <button onClick={() => onGoTo("reports")} className="text-xs font-black text-[#2f7151] hover:underline">
          Reports →
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white/60 p-4 text-sm text-[#66746e]">No sessions yet — start your first practice above.</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#e3dac6] bg-white/65 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#17342f]/8 text-[#17342f]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#17342f]">{item.title}</p>
                  <p className="truncate text-xs text-[#66746e]">{item.detail}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-[#17342f]/5 px-3 py-1 text-xs font-bold text-[#315149]">{item.date}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
