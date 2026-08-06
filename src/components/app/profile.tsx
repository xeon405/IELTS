"use client";

import { BookOpen, CheckCircle2, Database, GraduationCap, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { skillOrder } from "@/lib/app-config";
import { AchievementsGrid } from "@/components/achievements";
import type { StudentLearningProfile } from "@/lib/ielts-brain";

export function LearningProfile({ profile }: { profile: StudentLearningProfile }) {
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
                  <span>{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
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
          <MemoryCard icon={Target} title="Study statistics" value={`${profile.practiceHistory.length} sessions · ${profile.mockHistory.length} mocks · ${profile.studyStreak}-day streak`} />
        </div>
      </section>

      <AchievementsGrid profile={profile} />

      <section className="grid gap-5 xl:grid-cols-2">
        <SignalPanel title="Strong signals" items={profile.strongSignals} />
        <SignalPanel title="Weak topics" items={profile.weakTopics} />
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
