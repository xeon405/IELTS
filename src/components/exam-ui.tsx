"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function useCountdown(seconds: number, running: boolean, onEnd?: () => void) {
  const [remaining, setRemaining] = useState(seconds);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clearInterval(timer);
          onEndRef.current?.();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const minutes = Math.floor(remaining / 60);
  const secondsPart = remaining % 60;
  return {
    remaining,
    mmss: `${String(minutes).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}`,
    low: remaining <= 60 && remaining > 0,
    expired: remaining <= 0,
  };
}

export function ExamClock({
  label,
  time,
  low,
  expired,
  inverted,
}: {
  label: string;
  time: string;
  low: boolean;
  expired: boolean;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-2.5 text-center",
        inverted ? "border-white/15 bg-white/10" : "border-[#e3dac6] bg-white/75",
        low || expired ? "animate-pulse" : "",
      )}
    >
      <p className={cn("text-[10px] font-black uppercase tracking-[0.18em]", inverted ? "text-[#e3b65f]" : "text-[#8b6f39]")}>
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-bold tabular-nums",
          inverted ? "text-white" : expired ? "text-[#b3261e]" : low ? "text-[#b3261e]" : "text-[#17342f]",
        )}
      >
        {expired ? "00:00" : time}
      </p>
    </div>
  );
}

export function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function WordCounter({
  text,
  target,
  inverted,
}: {
  text: string;
  target: number;
  inverted?: boolean;
}) {
  const count = wordCount(text);
  const over = count >= target;
  return (
    <div className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5", inverted ? "border-white/15 bg-white/10" : "border-[#e3dac6] bg-white/75")}>
      <span className={cn("font-mono text-sm font-bold tabular-nums", inverted ? "text-white" : "text-[#17342f]")}>
        {count}
      </span>
      <span className={cn("text-xs", inverted ? "text-white/70" : "text-[#66746e]")}>/ {target} words</span>
      <span className={cn("h-2 w-2 rounded-full", over ? "bg-[#2f7151]" : "bg-[#e3b65f]")} />
    </div>
  );
}

export function QuestionNavigator({
  count,
  current,
  answered,
  onJump,
  columns = 10,
}: {
  count: number;
  current: number;
  answered: Record<number, boolean>;
  onJump: (index: number) => void;
  columns?: number;
}) {
  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">Question navigator</p>
        <p className="text-xs font-bold text-[#5c6b64]">
          {Object.values(answered).filter(Boolean).length}/{count} answered
        </p>
      </div>
      <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(columns, count)}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            onClick={() => onJump(index)}
            className={cn(
              "rounded-lg py-1.5 text-xs font-bold transition",
              index === current
                ? "bg-[#17342f] text-white"
                : answered[index]
                  ? "bg-[#17342f]/10 text-[#17342f]"
                  : "bg-[#f1e9d6] text-[#6d756f] hover:bg-[#e9dfc8]",
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AnswerSheetInput({
  id,
  number,
  value,
  onChange,
  onFocus,
  current,
  letter,
}: {
  id: string;
  number: number;
  value: string;
  onChange: (id: string, value: string) => void;
  onFocus?: (index: number) => void;
  current?: boolean;
  letter?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition",
        current ? "border-[#17342f] bg-[#17342f]/5" : "border-[#e3dac6] bg-[#fffdf7]",
        value.trim() ? "border-[#17342f]/40" : "",
      )}
    >
      <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-[#8b6f39]">{number}</span>
      <input
        value={value}
        onChange={(event) => onChange(id, event.target.value)}
        onFocus={() => onFocus?.(number - 1)}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#17342f] outline-none",
          letter ? "uppercase" : "",
        )}
        placeholder="..."
      />
    </label>
  );
}

export function SectionTransition({
  title,
  note,
  nextLabel,
  accent,
  onNext,
}: {
  title: string;
  note: string;
  nextLabel: string;
  accent: string;
  onNext: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-8 text-center shadow-[0_24px_80px_rgba(33,72,67,0.13)]">
      <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em]", accent)}>
        Next section
      </div>
      <h2 className="mt-5 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">{title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-[#5c6b64]">{note}</p>
      <button
        onClick={onNext}
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
      >
        {nextLabel}
      </button>
    </div>
  );
}
