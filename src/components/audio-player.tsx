"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Loader2, Lock, Pause, Play, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { API_BASE, getToken, speakText } from "@/lib/backend";

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
  const [noAudio, setNoAudio] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const durationSeconds = estimateSeconds(script);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const preparingRef = useRef(false);

  const complete = useCallback(() => {
    setPlaying(false);
    setFinished(true);
    setRevealed(true);
    if (examLocked) setLocked(true);
  }, [examLocked]);

  const stopAll = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch {
      /* noop */
    }
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
      stopAll();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    };
  }, [stopAll]);

  useEffect(() => {
    if (sourceUrl && audioRef.current) {
      const element = audioRef.current;
      element.onended = complete;
      element.onerror = () => {
        setNoAudio(true);
        setPlaying(false);
      };
      element
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          setNoAudio(true);
          setPlaying(false);
        });
    }
  }, [sourceUrl, complete]);

  useEffect(() => {
    if (playing) {
      timerRef.current = window.setInterval(() => {
        setElapsed((current) => {
          const next = current + 1;
          if (next >= durationSeconds) {
            window.clearInterval(timerRef.current ?? undefined);
            timerRef.current = null;
            setPlaying(false);
          }
          return next;
        });
      }, 250);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, durationSeconds]);

  useEffect(() => {
    setFinished(false);
    setLocked(false);
    setRevealed(false);
    setElapsed(0);
    setNoAudio(false);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSourceUrl(null);
    stopAll();
  }, [script, stopAll]);

  function playServerAudio(blob: Blob) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    setSourceUrl(url);
    setNoAudio(false);
  }

  function playBrowserTTS() {
    if (!speechSupported()) {
      setNoAudio(true);
      setPlaying(false);
      return;
    }
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
      setPlaying(true);
    } catch {
      setNoAudio(true);
      setPlaying(false);
    }
  }

  async function toggle() {
    if (locked || finished || preparing) return;
    if (playing) {
      stopAll();
      setPlaying(false);
      return;
    }
    if (preparingRef.current) return;
    preparingRef.current = true;
    setPreparing(true);
    setNoAudio(false);
    setElapsed(0);
    try {
      const blob = await speakText(script.length > 1900 ? script.slice(0, 1900) : script);
      if (blob) {
        playServerAudio(blob);
        return;
      }
      playBrowserTTS();
    } catch {
      playBrowserTTS();
    } finally {
      preparingRef.current = false;
      setPreparing(false);
    }
  }

  function reset() {
    stopAll();
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
      <audio ref={audioRef} src={sourceUrl ?? undefined} preload="auto" className="pointer-events-none absolute -left-96 h-10 w-10 opacity-0" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          onClick={toggle}
          disabled={locked || finished || preparing}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17342f] text-white transition hover:bg-[#245f5a] disabled:opacity-50"
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {preparing ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
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

      {noAudio ? (
        <p className="mt-3 text-xs font-semibold text-[#8b8f88]">
          Audio is unavailable in this browser — the script appears below and the timer still follows the listening duration.
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
