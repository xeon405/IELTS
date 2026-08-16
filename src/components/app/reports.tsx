"use client";

import { CheckCircle2, LineChart, Sparkles, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { skillOrder } from "@/lib/app-config";
import { brainApi } from "@/lib/api";
import { buildReport, type BandMap, type ReportData, type StudentLearningProfile } from "@/lib/ielts-brain";

export function Reports({ profile }: { profile: StudentLearningProfile }) {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    let cancelled = false;
    brainApi
      .report(profile)
      .then((report) => {
        if (!cancelled) setData(report);
      })
      .catch((error) => {
        // Show the local fallback, but don't hide that live data failed.
        console.warn("[reports] backend report unavailable:", error);
        const notice = document.createElement("div");
        notice.textContent = "Live report unavailable — showing locally computed estimates.";
        notice.style.cssText =
          "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#17342f;color:#fff;padding:0.6rem 1rem;border-radius:0.75rem;font-size:0.875rem;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,0.25)";
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 4000);
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const report = data ?? buildReport(profile);
  const sectionScores = skillOrder.map((skill) => ({ skill, band: report.sectionScores[skill] }));
  const highest = Math.max(...sectionScores.map((item) => item.band));
  const lowest = Math.min(...sectionScores.map((item) => item.band));
  const strongest = sectionScores.find((item) => item.band === highest)?.skill ?? "reading";
  const weakest = sectionScores.find((item) => item.band === lowest)?.skill ?? "writing";

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Reports</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">Progress over time</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">
          The AI Brain turns practice and mock outcomes into a living band forecast and weakness map.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ReportMetric label="Overall band" value={report.overallBand.toFixed(1)} detail="Across all four skills" />
          <ReportMetric label="Strongest skill" value={strongest.charAt(0).toUpperCase() + strongest.slice(1)} detail={`Band ${highest.toFixed(1)}`} />
          <ReportMetric label="Priority skill" value={weakest.charAt(0).toUpperCase() + weakest.slice(1)} detail={`Band ${lowest.toFixed(1)} · focus here`} />
        </div>

        <ProgressChart progress={report.progress} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SectionScores scores={report.sectionScores} />
        <RecommendationCard report={report} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DescriptorCard label="Grammar" score={report.grammar} />
        <DescriptorCard label="Vocabulary" score={report.vocabulary} />
        <DescriptorCard label="Fluency" score={report.fluency} />
        <DescriptorCard label="Coherence" score={report.coherence} />
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Study statistics</p>
            <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Your training load</h3>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          <StatTile label="Study streak" value={`${report.statistics.studyStreak} days`} />
          <StatTile label="Hours completed" value={`${report.statistics.completedHours.toFixed(1)}h`} />
          <StatTile label="Weekly goal" value={`${report.statistics.weeklyGoalHours.toFixed(1)}h`} />
          <StatTile label="Practice sessions" value={`${report.statistics.practiceSessions}`} />
          <StatTile label="Full mocks" value={`${report.statistics.mockExams}`} />
          <StatTile label="Confidence" value={`${Math.round(report.statistics.confidenceLevel)}%`} />
          <StatTile label="Avg accuracy" value={`${report.statistics.accuracy}%`} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SignalPanel title="Strengths" icon={<CheckCircle2 className="h-4 w-4 text-[#2f7151]" />} items={report.strengths} />
        <SignalPanel title="Weaknesses" icon={<TrendingUp className="h-4 w-4 text-[#9c3a2e]" />} items={report.weaknesses} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <HistoryPanel history={profile.practiceHistory} />
        <MockHistoryPanel history={profile.mockHistory} />
      </section>
    </div>
  );
}

function ReportMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</p>
      <p className="mt-3 font-mono text-4xl font-bold text-[#17342f]">{value}</p>
      <p className="mt-1 text-sm text-[#66746e]">{detail}</p>
    </div>
  );
}

function SectionScores({ scores }: { scores: BandMap }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Section scores</p>
      <div className="mt-4 space-y-4">
        {skillOrder.map((skill) => (
          <div key={skill}>
            <div className="flex items-center justify-between text-sm font-bold text-[#17342f]">
              <span>{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
              <span>{scores[skill].toFixed(1)}</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-[#d8c8a8]/70">
              <div className="h-full rounded-full bg-[#17342f]" style={{ width: `${(scores[skill] / 9) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ report }: { report: ReportData }) {
  const rec = report.recommendation;
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_18px_60px_rgba(33,72,67,0.18)]">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">AI recommendation</p>
          <h3 className="font-serif text-2xl font-semibold">Next study focus</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#d8e4df]">{rec.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#e3b65f]">
          {rec.module} · {rec.priority}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#e3b65f]">
          {rec.expectedBandLift}
        </span>
      </div>
      <div className="mt-4 rounded-2xl bg-white/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#e3b65f]">Suggested plan</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#dbe7e2]">
          {report.recommendations.map((item) => (
            <li key={item} className="flex gap-2">
              <Target className="mt-1 h-4 w-4 shrink-0 text-[#e3b65f]" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#9fb3ab]">{report.practiceSummary}</p>
    </div>
  );
}

function DescriptorCard({ label, score }: { label: string; score: ReportData["grammar"] }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">{label}</p>
        <span className="rounded-full bg-[#e4f0ea] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2f7151]">
          {score.level}
        </span>
      </div>
      <p className="mt-3 font-mono text-4xl font-bold text-[#17342f]">{score.score}</p>
      <div className="mt-3 h-2 rounded-full bg-[#d8c8a8]/70">
        <div className="h-full rounded-full bg-[#17342f]" style={{ width: `${score.score}%` }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-[#5b6b63]">{score.comment}</p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#17342f]/5 px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8b6f39]">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-[#17342f]">{value}</p>
    </div>
  );
}

function ProgressChart({ progress }: { progress: ReportData["progress"] }) {
  return (
    <div className="mt-7 rounded-[2rem] border border-[#e3dac6] bg-white/65 p-5">
      <div className="flex items-center gap-3">
        <LineChart className="h-5 w-5 text-[#2f7151]" />
        <p className="font-black text-[#17342f]">Band trend</p>
      </div>
      <div className="mt-6 flex h-64 items-end gap-3 overflow-x-auto border-b border-[#d8c8a8] pb-4">
        {progress.map((point) => (
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

function SignalPanel({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">{title}</p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#4f625b]">
            {icon}
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ history }: { history: StudentLearningProfile["practiceHistory"] }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Practice history</p>
      <div className="mt-4 space-y-3">
        {history.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#17342f]">{entry.title}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6f39]">
                  {entry.module.charAt(0).toUpperCase() + entry.module.slice(1)} / {entry.mode} / {entry.date}
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

function MockHistoryPanel({ history }: { history: StudentLearningProfile["mockHistory"] }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Mock history</p>
      <div className="mt-4 space-y-3">
        {history.map((entry) => (
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
  const display = Number.isInteger(value) ? `${value}` : `${value.toFixed(1)}`;
  return (
    <div className={cn("rounded-xl px-2 py-2", label === "W" ? "bg-[#f3e3d4]" : "bg-[#17342f]/5")}>
      <p className="text-xs font-black text-[#8b6f39]">{label}</p>
      <p className="font-mono text-lg font-bold text-[#17342f]">{display}</p>
    </div>
  );
}
