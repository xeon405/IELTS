"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function CountdownTimer({
  minutes,
  resetKey,
  variant = "practice",
  onTimeUp,
  onChange,
}: {
  minutes: number;
  resetKey: string;
  variant?: "practice" | "exam";
  onTimeUp?: () => void;
  onChange?: (elapsedSeconds: number) => void;
}) {
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    setPaused(false);
    setFinished(false);
  }, [resetKey, totalSeconds]);

  useEffect(() => {
    if (finished || paused || remaining <= 0) return;
    const id = window.setTimeout(() => {
      setRemaining((current) => {
        const next = Math.max(0, current - 1);
        return next;
      });
    }, 1000);
    return () => window.clearTimeout(id);
  }, [finished, paused, remaining]);

  useEffect(() => {
    onChange?.(totalSeconds - remaining);
  }, [remaining, totalSeconds, onChange]);

  useEffect(() => {
    if (remaining === 0 && !finished) {
      setFinished(true);
      onTimeUp?.();
    }
  }, [remaining, finished, onTimeUp]);

  const status = useMemo(() => {
    if (finished || remaining === 0) return "over";
    if (remaining <= totalSeconds * 0.2) return "danger";
    if (remaining <= totalSeconds * 0.5) return "warning";
    return "ok";
  }, [finished, remaining, totalSeconds]);

  const isExam = variant === "exam";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl px-4 py-3 text-white transition-colors",
        isExam ? "bg-[#17342f]" : "border border-[#e3dac6] bg-white/70 text-[#17342f]",
        status === "danger" && "bg-[#9c3a2e]",
        status === "warning" && !isExam && "border-[#e3c47a] bg-[#fdf3d9]",
        status === "warning" && isExam && "bg-[#8a6a24]",
        status === "over" && "bg-[#17342f] text-[#e3b65f]",
      )}
    >
      <div className="min-w-16">
        <p
          className={cn(
            "text-[10px] font-black uppercase tracking-[0.16em]",
            isExam ? "text-[#e3b65f]" : "text-[#8b6f39]",
            (status === "danger" || status === "over") && "text-white",
          )}
        >
          {finished ? "Time up" : status === "danger" ? "Hurry" : "Timer"}
        </p>
        <p
          className={cn(
            "font-mono text-xl font-bold tabular-nums",
            isExam ? "text-white" : "text-[#17342f]",
            status === "danger" && "text-white",
            status === "over" && "text-[#e3b65f]",
          )}
        >
          {formatTime(remaining)}
        </p>
      </div>
      {!isExam ? (
        <button
          onClick={() => setPaused((current) => !current)}
          disabled={finished}
          className="grid h-9 w-9 place-items-center rounded-xl bg-[#17342f] text-white transition hover:bg-[#245f5a] disabled:opacity-40"
          aria-label={paused ? "Resume timer" : "Pause timer"}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      ) : (
        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[#e3b65f] transition-all"
            style={{ width: `${totalSeconds === 0 ? 0 : (remaining / totalSeconds) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
