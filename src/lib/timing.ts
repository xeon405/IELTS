export const OFFICIAL_SECTION_MINUTES: Record<string, number> = {
  listening: 30,
  reading: 60,
  writing: 60,
  speaking: 14,
};

export interface TimingDetail {
  recommendedSeconds: number;
  totalSeconds: number | null;
  timeTaken: string;
  remaining: string;
  overBudgetSeconds: number;
  onBudget: boolean;
}

export interface PerformanceMetric {
  score: number;
  label: string;
  metric?: string;
  comment: string;
}

export interface TimingResult {
  timing: TimingDetail;
  speed: PerformanceMetric;
  timeManagement: PerformanceMetric;
}

export function formatClock(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(total / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function formatMinutesClock(minutes: number): string {
  const total = Math.max(0, Math.round(minutes * 60));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function clampScore(value: number): number {
  return Math.max(5, Math.min(100, Math.round(value)));
}

export function computeTimingMetrics(
  module: string,
  itemCount: number,
  answers: Record<string, string>,
  recommendedMinutes: number,
  totalSeconds?: number | null,
): TimingResult {
  const recommended = Math.max(1, Math.round(recommendedMinutes || 1) * 60);
  const answered = Object.values(answers).filter((value) => (value ?? "").trim()).length;
  const totalItems = Math.max(1, itemCount);
  const completion = answered / totalItems;
  const used = totalSeconds != null && totalSeconds > 0 ? Math.max(0, Math.round(totalSeconds)) : null;
  const effective = used ?? recommended;
  const over = Math.max(0, effective - recommended);
  const minutes = Math.max(0.1, effective / 60);
  const words = Object.values(answers).reduce((sum, value) => sum + (value ?? "").trim().split(/\s+/).filter(Boolean).length, 0);

  let speedScore: number;
  let speedLabel: string;
  let speedMetric: string;
  let speedComment: string;

  if (module === "writing") {
    const wpm = words / minutes;
    speedScore = clampScore(wpm * 10);
    speedLabel = wpm >= 8 ? "Fast" : wpm >= 4.5 ? "Balanced" : "Slow";
    speedMetric = `${wpm.toFixed(0)} words/min`;
    speedComment =
      speedLabel === "Fast"
        ? "Writing pace is above target — keep the structure and you can add depth."
        : speedLabel === "Balanced"
          ? "Solid writing pace; plan for 5 minutes, then write without stopping."
          : "Pace is slow — plan in 5 minutes and write continuously, checking length at the end.";
  } else if (module === "speaking") {
    const wpm = words / minutes;
    speedScore = clampScore(wpm * 1.4);
    speedLabel = wpm >= 65 ? "Fast" : wpm >= 35 ? "Balanced" : "Slow";
    speedMetric = `${wpm.toFixed(0)} words/min`;
    speedComment =
      speedLabel === "Fast"
        ? "Strong answer flow — use the extra time to develop Part 3 ideas."
        : speedLabel === "Balanced"
          ? "Good flow; keep extending each answer with a reason and example."
          : "Answers are short — extend every point with a reason and an example.";
  } else {
    const expectedPace = totalItems / (recommended / 60);
    const qpm = answered / minutes;
    const ratio = expectedPace > 0 ? qpm / expectedPace : 0;
    speedScore = clampScore(ratio * 75);
    speedLabel = ratio >= 1.25 ? "Fast" : ratio >= 0.75 ? "Balanced" : "Slow";
    speedMetric = `${answered} questions in ${minutes.toFixed(0)} min`;
    speedComment =
      speedLabel === "Fast"
        ? "Ahead of the recommended pace — keep the accuracy that comes with it."
        : speedLabel === "Balanced"
          ? "Pace matches the official recommendation; keep scanning, not reading word by word."
          : "Falling behind the official pace — move on after 90 seconds per question.";
  }

  let tmScore: number;
  let tmLabel: string;
  let tmComment: string;
  if (used == null) {
    tmScore = clampScore(50 + completion * 45);
    tmLabel = "No timing data";
    tmComment = "Use the section countdown next time so the examiner can measure your pacing.";
  } else {
    const ratio = effective / recommended;
    let score = 100;
    if (ratio > 1.1) score -= Math.min(55, (ratio - 1.1) * 110);
    if (ratio < 0.7 && completion < 1.0) score -= Math.min(55, (1 - ratio) * 90);
    score -= (1 - completion) * 25;
    tmScore = clampScore(score);
    const overBudget = ratio > 1.1;
    if (ratio < 0.7 && completion < 1.0) {
      tmLabel = "Rushed";
      tmComment = `Finished in ${formatClock(effective)} of ${formatClock(recommended)} but left questions unanswered — distribute time across all items.`;
    } else if (overBudget) {
      tmLabel = tmScore >= 45 ? "Slightly over" : "Over time";
      tmComment = `Used ${formatClock(effective)} of the recommended ${formatClock(recommended)} — practise moving on after 90 seconds per question.`;
    } else if (completion >= 1.0) {
      tmLabel = tmScore >= 85 ? "Excellent" : "On pace";
      tmComment = `Completed everything within the recommended ${formatClock(recommended)} — exactly the pacing the examiner looks for.`;
    } else {
      tmLabel = "On pace";
      tmComment = `Pacing is good; use remaining time to answer the ${totalItems - answered} unanswered item(s).`;
    }
  }

  return {
    timing: {
      recommendedSeconds: recommended,
      totalSeconds: used,
      timeTaken: formatClock(used ?? 0),
      remaining: formatClock(Math.max(0, recommended - (used ?? 0))),
      overBudgetSeconds: over,
      onBudget: effective <= recommended,
    },
    speed: { score: speedScore, label: speedLabel, metric: speedMetric, comment: speedComment },
    timeManagement: { score: tmScore, label: tmLabel, comment: tmComment },
  };
}
