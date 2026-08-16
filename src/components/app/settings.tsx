"use client";

import { useEffect, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { Bell, Check, CreditCard, Download, Globe, UserRound, Upload } from "lucide-react";

import { skillOrder } from "@/lib/app-config";
import { toast } from "@/hooks/use-toast";
import { readStoredTheme, persistTheme, THEMES, type ThemeId } from "@/lib/theme";
import {
  calculateOverallBand,
  migrateProfile,
  type Skill,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

const settingsKey = "ai-ielts-examiner-settings";

export function SettingsPanel({
  profile,
  setProfile,
  onReset,
}: {
  profile: StudentLearningProfile;
  setProfile: Dispatch<SetStateAction<StudentLearningProfile>>;
  onReset: () => void;
}) {
  const cached = useState(() => {
    try {
      const raw = window.localStorage.getItem(settingsKey);
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  })[0];
  const storedSettings = (cached ?? {}) as {
    practice?: boolean;
    mock?: boolean;
    tips?: boolean;
    theme?: string;
    plan?: string;
  };
  const [notifications, setNotifications] = useState(() => ({
    practice: storedSettings.practice ?? true,
    mock: storedSettings.mock ?? true,
    tips: storedSettings.tips ?? false,
  }));
  const [theme, setTheme] = useState<ThemeId>(() => {
    const stored = readStoredTheme();
    return stored;
  });
  const [plan, setPlan] = useState(() =>
    storedSettings.plan === "Pro" || storedSettings.plan === "Tutor Plus" ? storedSettings.plan : "Free",
  );

  useEffect(() => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({ theme, plan, notifications }),
    );
    document.documentElement.dataset.theme = theme;
  }, [theme, plan, notifications]);

  function applyTheme(option: ThemeId) {
    setTheme(option);
    persistTheme(option);
    const chosen = THEMES.find((entry) => entry.id === option);
    toast({
      title: `${chosen?.label ?? option} theme applied`,
      description:
        option === "dark"
          ? "Reduced-light surface for evening study."
          : option === "warm"
            ? "Warm parchment tones across the app shell."
            : option === "ocean"
              ? "Cool, focused blues for long study days."
              : option === "graphite"
                ? "Neutral charcoal surfaces with clean contrast."
                : option === "royal"
                  ? "Premium violet surfaces with a refined edge."
                  : "Default exam-style theme restored.",
    });
  }

  function updateNotifications(key: keyof typeof notifications, value: boolean) {
    setNotifications((current) => ({ ...current, [key]: value }));
    toast({ title: value ? "Notification enabled" : "Notification disabled", description: `We will ${value ? "send" : "not send"} ${key === "practice" ? "practice reminders" : key === "mock" ? "mock scheduling notices" : "weekly AI study tips"}.` });
  }

  function updatePlan(option: string) {
    setPlan(option);
    toast({ title: `Plan set to ${option}`, description: option === "Free" ? "Free plan: unlimited adaptive practice with AI feedback." : option === "Pro" ? "Pro plan: everything in Free plus full mocks and reports." : "Tutor Plus: Pro features plus unlimited AI tutor conversations." });
  }

  function updateBand(skill: Skill, value: number) {
    setProfile((current) => {
      const bands = { ...current.bands, [skill]: value };
      return { ...current, bands, currentBand: calculateOverallBand(bands) };
    });
  }

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ielts-examiner-memory.json";
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup downloaded", description: "Your learning memory was saved as a JSON file." });
  }

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as StudentLearningProfile;
        setProfile(migrateProfile(parsed));
        toast({ title: "Memory restored", description: `Loaded the learning profile for ${parsed.name}.` });
      } catch {
        toast({ title: "Import failed", description: "That file is not a valid learning-memory backup." });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Settings</p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">Account, notifications, theme & plan</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">
          Manage your study preferences. The AI recommendation recalculates instantly when bands change.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-white">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Account</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Personal details</h3>
            </div>
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8b6f39]">Display name</span>
            <input
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
            />
          </label>
          <SettingSlider
            label="Target IELTS band"
            value={profile.targetBand}
            min={5}
            max={9}
            step={0.5}
            onChange={(value) => setProfile((current) => ({ ...current, targetBand: value }))}
          />
          <SettingSlider
            label="Weekly study goal"
            value={profile.weeklyGoalHours}
            min={2}
            max={25}
            step={1}
            suffix="h"
            onChange={(value) => setProfile((current) => ({ ...current, weeklyGoalHours: value }))}
          />
          <SettingSlider
            label="AI confidence signal"
            value={profile.confidenceLevel}
            min={30}
            max={100}
            step={1}
            suffix="%"
            onChange={(value) => setProfile((current) => ({ ...current, confidenceLevel: value }))}
          />
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Skill band controls</p>
          <div className="mt-4 space-y-4">
            {skillOrder.map((skill) => (
              <SettingSlider
                key={skill}
                label={skill.charAt(0).toUpperCase() + skill.slice(1)}
                value={profile.bands[skill]}
                min={4}
                max={9}
                step={0.5}
                onChange={(value) => updateBand(skill, value)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Notifications</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">What to send</h3>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <ToggleRow label="Practice reminders" checked={notifications.practice} onChange={(value) => updateNotifications("practice", value)} />
            <ToggleRow label="Mock test scheduling" checked={notifications.mock} onChange={(value) => updateNotifications("mock", value)} />
            <ToggleRow label="Weekly AI study tips" checked={notifications.tips} onChange={(value) => updateNotifications("tips", value)} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-white">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Theme</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Appearance</h3>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {THEMES.map((option) => (
              <button
                key={option.id}
                onClick={() => applyTheme(option.id)}
                className={`relative flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition ${
                  theme === option.id
                    ? "border-[#17342f] bg-white/85 shadow-lg shadow-[#17342f]/10"
                    : "border-[#d8c8a8] bg-white/60 hover:border-[#b8a888] hover:bg-white/85"
                }`}
              >
                <span
                  aria-hidden
                  className="h-9 w-9 shrink-0 rounded-xl border border-black/5 shadow-inner"
                  style={{ background: option.swatch }}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-black leading-tight text-[#17342f]">{option.label}</span>
                  <span className="block truncate text-[10px] font-semibold text-[#8b8f88]">{option.tagline}</span>
                </span>
                {theme === option.id ? (
                  <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#17342f] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#8b8f88]">Six exam-grade themes — the choice applies to the whole site and saves automatically.</p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Subscription</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Your plan</h3>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {["Free", "Pro", "Tutor Plus"].map((option) => (
              <button
                key={option}
                onClick={() => updatePlan(option)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                  plan === option ? "border-[#17342f] bg-[#17342f] text-white" : "border-[#d8c8a8] bg-white/70 text-[#315149] hover:bg-white"
                }`}
              >
                {option}
                {option === "Pro" ? <span className="rounded-full bg-[#e3b65f] px-2 py-0.5 text-[10px] font-black text-[#17342f]">POPULAR</span> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Backup</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Download learning memory</h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#66746e]">
            Save all bands, history, achievements, and vocabulary progress as a JSON file you can restore later or on another device.
          </p>
          <button
            onClick={downloadBackup}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            <Download className="h-4 w-4" />
            Download backup
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3b65f] text-[#17342f]">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Restore</p>
              <h3 className="font-serif text-2xl font-semibold text-[#17342f]">Import a backup file</h3>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#66746e]">
            Upload a previously downloaded backup to continue exactly where you left off. Missing fields are migrated automatically.
          </p>
          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-5 py-3 text-sm font-black text-[#17342f] transition hover:bg-white">
            <Upload className="h-4 w-4" />
            Choose backup file
            <input type="file" accept="application/json,.json" className="hidden" onChange={handleImportFile} />
          </label>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#e0c7a4] bg-[#f8e5c8]/85 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.1)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b5732]">Demo control</p>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-[#17342f]">Reset local learning memory</h3>
            <p className="mt-1 text-sm text-[#6a5d4d]">This clears demo progress stored in the browser and restores the default student profile.</p>
          </div>
          <button onClick={onReset} className="rounded-2xl bg-[#8b5732] px-5 py-3 text-sm font-black text-white">
            Reset demo
          </button>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-[#e3dac6] bg-white/65 px-4 py-3">
      <span className="text-sm font-bold text-[#17342f]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#17342f]" : "bg-[#d8c8a8]"}`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

function SettingSlider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-4 block rounded-2xl border border-[#e3dac6] bg-white/65 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-[#17342f]">{label}</span>
        <span className="font-mono text-lg font-bold text-[#17342f]">
          {value.toFixed(step < 1 ? 1 : 0)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-[#17342f]"
      />
    </label>
  );
}
