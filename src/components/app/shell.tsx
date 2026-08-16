"use client";

import { Brain, LogOut, Timer, ArrowRight, RotateCcw, Menu, X } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { isSkill, moduleConfig, navItems, type ViewId } from "@/lib/app-config";
import type { AdaptiveRecommendation, StudentLearningProfile } from "@/lib/ielts-brain";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Sidebar({
  activeView,
  setActiveView,
  profile,
  onReset,
  onLogout,
  open,
  onClose,
}: {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  profile: StudentLearningProfile;
  onReset: () => void;
  onLogout?: () => void;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 hidden bg-[#17342f]/25 backdrop-blur-sm lg:block"
      />
      <aside className="fixed left-4 top-4 z-50 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-white/70 bg-[#fffaf0]/95 p-4 shadow-[0_24px_80px_rgba(33,72,67,0.16)] backdrop-blur-xl animate-in slide-in-from-left-4 duration-300 lg:flex">
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="mb-2 ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#d7cab0] bg-white/70 text-[#6d4d2d] transition hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="rounded-[1.5rem] bg-[#17342f] p-5 text-white shadow-inner shadow-white/10">
<div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f] animate-glow-pulse">
            <Brain className="h-6 w-6" />
          </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#e6c983]">AI-first</p>
              <h1 className="font-serif text-2xl font-semibold leading-none">IELTS Examiner</h1>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs text-[#d8e4df]">Current memory</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="font-mono text-4xl font-bold">{profile.currentBand.toFixed(1)}</span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Target {profile.targetBand.toFixed(1)}</span>
            </div>
          </div>
        </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          const skillConfig = isSkill(item.id) ? moduleConfig[item.id] : null;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                skillConfig
                  ? cn("text-white shadow-lg", skillConfig.accent)
                  : active
                    ? "bg-[#17342f] text-white shadow-lg shadow-[#17342f]/20"
                    : "text-[#34534d] hover:bg-white/80 hover:text-[#17342f]",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-white" : "text-[#8b6f39]")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onReset}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[#d7cab0] bg-white/70 px-4 py-3 text-sm font-semibold text-[#6d4d2d] transition hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" />
        Reset demo memory
      </button>

      {onLogout ? (
        <button
          onClick={onLogout}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-[#f0d5c4] bg-[#fdf1ea] px-4 py-3 text-sm font-bold text-[#a2532e] transition hover:bg-[#fae4d7]"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      ) : null}
    </aside>
    </>
  );
}

export function MobileNav({
  activeView,
  setActiveView,
  onLogout,
}: {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  onLogout?: () => void;
}) {
  return (
    <div className="lg:hidden">
      <div className="mb-3 flex items-center justify-between rounded-3xl bg-[#17342f] px-4 py-3 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-[#e3b65f]" />
          <span className="font-serif text-xl font-semibold">AI IELTS Examiner</span>
        </div>
        <Link href="/" className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#e9d29b]">
          Site
        </Link>
      </div>
      <nav className="flex flex-wrap gap-2 rounded-3xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          const skillConfig = isSkill(item.id) ? moduleConfig[item.id] : null;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold",
                skillConfig
                  ? cn("text-white", skillConfig.accent)
                  : active
                    ? "bg-[#17342f] text-white"
                    : "bg-white/60 text-[#315149]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
        {onLogout ? (
          <button
            onClick={onLogout}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#fdf1ea] px-3 py-2 text-xs font-bold text-[#a2532e]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        ) : null}
      </nav>
    </div>
  );
}

export function TopBar({
  profile,
  recommendation,
  onAdaptive,
  onMock,
  onMenu,
}: {
  profile: StudentLearningProfile;
  recommendation: AdaptiveRecommendation;
  onAdaptive: () => void;
  onMock: () => void;
  onMenu?: () => void;
}) {
  return (
    <header className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/80 p-4 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl lg:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {onMenu ? (
            <button
              onClick={onMenu}
              aria-label="Open menu"
              className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d7cab0] bg-white/80 text-[#17342f] transition hover:bg-white lg:flex"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8b6f39]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3faf7a] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3faf7a]" />
              </span>
              The website is the interface. The AI Brain decides the path.
            </div>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#17342f] md:text-4xl">
              Good to see you, <span className="text-gradient">{profile.name.split(" ")[0]}</span>.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5b6b63]">
              Next best action: {recommendation.mode} for {recommendation.module.charAt(0).toUpperCase() + recommendation.module.slice(1)} because {recommendation.reason}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ThemeSwitcher variant="light" />
          <button
            onClick={onAdaptive}
            className="btn-shine group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Start adaptive practice
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <button
            onClick={onMock}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
          >
            <Timer className="h-4 w-4" />
            Full mock exam
          </button>
        </div>
      </div>
    </header>
  );
}

export function ModuleIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return <Icon className={className} />;
}
