"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Lock, Pause, Play, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";

const WORDS_PER_SECOND = 2.4;

function estimateSeconds(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(12, Math.ceil(words / WORDS_PER_SECOND));
}

function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function AudioPlayer({ script, examLocked = false }: { script: string; examLocked?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const durationSeconds = estimateSeconds(script);
  const timerRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const complete = useCallback(() => {
    setPlaying(false);
    setFinished(true);
    setRevealed(true);
    if (examLocked) setLocked(true);
  }, [examLocked]);

  useEffect(() => {
    if (playing) {
      timerRef.current = window.setInterval(() => {
        setElapsed((current) => {
          const next = current + 1;
          if (next >= durationSeconds) {
            window.clearInterval(timerRef.current ?? undefined);
            setPlaying(false);
          }
          return next;
        });
      }, 250);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, durationSeconds]);

  const stopSpeech = useCallback(() => {
    try {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopSpeech();
    };
  }, [stopSpeech]);

  function toggle() {
    if (locked || finished) return;
    if (playing) {
      try {
        window.speechSynthesis.pause();
      } catch {
        /* noop */
      }
      setPlaying(false);
      return;
    }
    setElapsed(0);
    setPlaying(true);
    if (speechSupported()) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = "en-GB";
        utterance.onend = complete;
        utterance.onerror = complete;
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch {
        setNoVoice(true);
      }
    } else {
      setNoVoice(true);
    }
  }

  function reset() {
    stopSpeech();
    setPlaying(false);
    setElapsed(0);
    setFinished(false);
    setRevealed(false);
    if (!examLocked) setLocked(false);
  }

  const bars = Array.from({ length: 24 }, (_, index) => {
    const active = Math.floor((elapsed / durationSeconds) * 24) >= index;
    const height = 6 + ((index * 7) % 18);
    return (
      <span
        key={index}
        className={cn("w-1 rounded-full transition-all", active ? "bg-[#17342f]" : "bg-[#17342f]/20")}
        style={{ height: `${playing || finished ? height : 8}px` }}
      />
    );
  });

  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          onClick={toggle}
          disabled={locked || finished}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17342f] text-white transition hover:bg-[#245f5a] disabled:opacity-50"
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-[#8b6f39]" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
              {examLocked ? "Exam audio — plays once" : "Listening audio"}
            </p>
            {locked ? (
              <span className="flex items-center gap-1 rounded-full bg-[#9c3a2e] px-2 py-0.5 text-[10px] font-black text-white">
                <Lock className="h-3 w-3" /> Played once
              </span>
            ) : finished ? (
              <span className="rounded-full bg-[#2f7151] px-2 py-0.5 text-[10px] font-black text-white">Replay allowed</span>
            ) : null}
          </div>
          <div className="mt-2 flex h-8 items-center gap-1 overflow-hidden">
            {bars}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold tabular-nums text-[#17342f]">
            {String(Math.min(elapsed, durationSeconds)).padStart(2, "0")}:{String(durationSeconds - Math.min(elapsed, durationSeconds)).padStart(2, "0")}
          </span>
          {!examLocked && !locked ? (
            <button
              onClick={reset}
              className="rounded-xl border border-[#d8c8a8] bg-white/80 px-3 py-1.5 text-xs font-bold text-[#17342f] transition hover:bg-white"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {noVoice ? (
        <p className="mt-3 text-xs font-semibold text-[#8b8f88]">
          This browser cannot read audio aloud — the script appears below and the timer still follows the listening duration.
        </p>
      ) : null}

      {revealed ? (
        <div className="mt-4 rounded-2xl bg-[#f8f0d9] p-4">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-[#8b6f39]" />
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Audio transcript</p>
          </div>
          <p className="mt-2 text-sm leading-7 text-[#4f625b]">{script}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-[#8b8f88]">
          {examLocked
            ? "Play once, then answer. The transcript appears after the audio finishes."
            : "Play to hear the script read aloud, then answer the questions."}
        </p>
      )}
    </div>
  );
}
