"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookMarked,
  Brain,
  CalendarCheck,
  CircleCheck,
  Crown,
  Flame,
  Headphones,
  Lock,
  Medal,
  PenLine,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudentLearningProfile } from "@/lib/ielts-brain";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  progress?: string;
}

export function getAchievements(profile: StudentLearningProfile): Achievement[] {
  const mastered = (profile.vocabMastered ?? []).length;
  const practiceCount = profile.practiceHistory.length;
  const mockCount = profile.mockHistory.length;
  const allBands = Object.values(profile.bands);

  return [
    {
      id: "first-practice",
      title: "First mark",
      description: "Complete one AI-evaluated practice session.",
      icon: CircleCheck,
      earned: practiceCount >= 1,
    },
    {
      id: "mock-finisher",
      title: "Mock finisher",
      description: "Complete a full computer-delivered mock exam.",
      icon: Trophy,
      earned: mockCount >= 1,
      progress: mockCount > 0 ? `${mockCount} mock` : undefined,
    },
    {
      id: "streak-3",
      title: "Three-day rhythm",
      description: "Build a 3-day study streak in the learning memory.",
      icon: Flame,
      earned: profile.studyStreak >= 3,
      progress: `${profile.studyStreak}/3 days`,
    },
    {
      id: "streak-7",
      title: "Week warrior",
      description: "Keep a 7-day study streak alive.",
      icon: CalendarCheck,
      earned: profile.studyStreak >= 7,
      progress: `${profile.studyStreak}/7 days`,
    },
    {
      id: "balanced",
      title: "Balanced candidate",
      description: "Reach 6.5 or higher in all four skills.",
      icon: Brain,
      earned: allBands.every((band) => band >= 6.5),
    },
    {
      id: "band-7",
      title: "Band 7 club",
      description: "Reach an overall predicted band of 7.0.",
      icon: Crown,
      earned: profile.currentBand >= 7,
      progress: `${profile.currentBand.toFixed(1)}/7.0`,
    },
    {
      id: "reader",
      title: "Deep reader",
      description: "Push the Reading band to 7.0.",
      icon: Headphones,
      earned: profile.bands.reading >= 7,
      progress: `${profile.bands.reading.toFixed(1)}/7.0`,
    },
    {
      id: "writer",
      title: "Clear writer",
      description: "Reach Band 6.5 in Writing.",
      icon: PenLine,
      earned: profile.bands.writing >= 6.5,
      progress: `${profile.bands.writing.toFixed(1)}/6.5`,
    },
    {
      id: "goal-week",
      title: "Goal keeper",
      description: "Hit your weekly practice-hour goal.",
      icon: Target,
      earned: profile.completedHours >= profile.weeklyGoalHours,
      progress: `${profile.completedHours}h/${profile.weeklyGoalHours}h`,
    },
    {
      id: "vocab-5",
      title: "Vocab starter",
      description: "Master 5 words in the vocabulary trainer.",
      icon: BookMarked,
      earned: mastered >= 5,
      progress: `${mastered}/5 words`,
    },
    {
      id: "vocab-15",
      title: "Word collector",
      description: "Master 15 words across the academic deck.",
      icon: Medal,
      earned: mastered >= 15,
      progress: `${mastered}/15 words`,
    },
    {
      id: "quiz-pro",
      title: "Quiz champion",
      description: "Score 8 or higher in a vocabulary quiz.",
      icon: TrendingUp,
      earned: (profile.vocabQuizBest ?? 0) >= 8,
      progress: `Best ${profile.vocabQuizBest ?? 0}/10`,
    },
  ];
}

export function AchievementsGrid({
  profile,
  compact = false,
}: {
  profile: StudentLearningProfile;
  compact?: boolean;
}) {
  const achievements = getAchievements(profile);
  const earnedCount = achievements.filter((item) => item.earned).length;

  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Achievements</p>
            <h3 className="font-serif text-2xl font-semibold text-[#17342f]">
              {earnedCount}/{achievements.length} unlocked
            </h3>
          </div>
        </div>
        <div className="rounded-2xl bg-[#17342f]/5 px-4 py-2 text-center">
          <p className="font-mono text-2xl font-bold text-[#17342f]">{Math.round((earnedCount / achievements.length) * 100)}%</p>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b6f39]">complete</p>
        </div>
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4")}>
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.id}
              title={achievement.description}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-2xl border p-3 transition",
                achievement.earned
                  ? "border-[#b9cdc0] bg-[#eef7ef]"
                  : "border-[#e3dac6] bg-white/55 opacity-80",
              )}
            >
              <div
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl",
                  achievement.earned ? "bg-[#17342f] text-[#e3b65f]" : "bg-[#17342f]/8 text-[#315149]",
                )}
              >
                {achievement.earned ? <Icon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <p className={cn("text-sm font-black leading-tight", achievement.earned ? "text-[#17342f]" : "text-[#315149]")}>
                {achievement.title}
              </p>
              {achievement.progress ? (
                <p className="text-[11px] font-bold text-[#8b6f39]">{achievement.progress}</p>
              ) : (
                <p className="text-[11px] font-semibold leading-4 text-[#66746e]">{achievement.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
