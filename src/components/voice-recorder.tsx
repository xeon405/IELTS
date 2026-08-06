"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square } from "lucide-react";

import { cn } from "@/lib/utils";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; length: number; [index: number]: { transcript: string } }>;
};

const FILLERS = new Set(["umm", "um", "uh", "er", "eh", "ah", "hmm", "hm", "huh", "mm", "ahem"]);

export function stripFillers(text: string): string {
  return text
    .split(/\s+/)
    .filter((word) => !FILLERS.has(word.trim().toLowerCase().replace(/[.,!?;:()"']/g, "")))
    .join(" ");
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return typeof SpeechRecognition === "function" ? (SpeechRecognition as new () => SpeechRecognitionLike) : null;
}

export function VoiceRecorder({ onTranscript }: { onTranscript?: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [liveSpeech, setLiveSpeech] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const recordingRef = useRef(false);

  const speechSupported = typeof window !== "undefined" && Boolean(getRecognitionCtor());

  function emitTranscript() {
    const combined = [finalRef.current, interimRef.current].filter(Boolean).join(" ").trim();
    const cleaned = stripFillers(combined);
    setNote(cleaned);
    onTranscript?.(cleaned);
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRef.current = recorder;
      recordingRef.current = true;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    } catch {
      setError("Microphone not available. Type your spoken answer below instead.");
      return;
    }

    if (speechSupported) {
      const Recognition = getRecognitionCtor()!;
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) finalChunk += (finalChunk ? " " : "") + text.trim();
          else interimChunk += (interimChunk ? " " : "") + text.trim();
        }
        finalRef.current = [finalRef.current || "", finalChunk].filter(Boolean).join(" ").trim();
        interimRef.current = interimChunk;
        emitTranscript();
      };
      recognition.onerror = (event) => {
        if (!recordingRef.current) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setLiveSpeech(false);
          return;
        }
        try {
          recognition.start();
        } catch {
          /* already running */
        }
      };
      recognition.onend = () => {
        // The browser can auto-stop the recogniser after a pause. Restart it
        // WITHOUT clearing the transcript so settings like 'umm' never cause a
        // restart from the beginning.
        if (!recordingRef.current) return;
        try {
          recognition.start();
        } catch {
          /* already running */
        }
      };
      recognitionRef.current = recognition;
      setLiveSpeech(true);
      try {
        recognition.start();
      } catch {
        /* already running */
      }
    }
  }

  function stop() {
    recordingRef.current = false;
    mediaRef.current?.stop();
    mediaRef.current = null;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    interimRef.current = "";
    setLiveSpeech(false);
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    emitTranscript();
  }

  function reset() {
    finalRef.current = "";
    interimRef.current = "";
    stop();
    setSeconds(0);
    setAudioUrl(null);
    setNote("");
    onTranscript?.("");
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recognitionRef.current) {
        recordingRef.current = false;
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
      mediaRef.current?.stream?.getTracks?.().forEach?.((track) => track.stop());
    };
  }, []);

  return (
    <div className="rounded-2xl border border-[#e3dac6] bg-white/70 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={recording ? stop : start}
            disabled={Boolean(audioUrl)}
            className={cn(
              "grid h-12 w-12 place-items-center rounded-2xl text-white transition",
              recording ? "animate-brain-pulse bg-[#9c3a2e]" : "bg-[#2f7151] hover:bg-[#245f5a]",
              audioUrl && "opacity-40",
            )}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Voice recorder</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-[#17342f]">
              {recording ? `00:${String(seconds).padStart(2, "0")}` : "Ready"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {liveSpeech ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f0ea] px-3 py-1 text-[11px] font-bold text-[#2f7151]">
              <Pause className="h-3 w-3 animate-pulse" />
              Live transcribing — fillers like &quot;umm&quot; are ignored
            </span>
          ) : speechSupported ? null : (
            <span className="rounded-full bg-[#f8e8e2] px-3 py-1 text-[11px] font-bold text-[#a2532e]">
              Speech recognition unavailable — type your answer instead
            </span>
          )}
          {audioUrl ? (
            <>
              <audio controls src={audioUrl} className="h-10 max-w-56" />
              <button
                onClick={reset}
                className="rounded-xl border border-[#d8c8a8] bg-white/80 px-3 py-2 text-xs font-bold text-[#17342f] transition hover:bg-white"
              >
                Re-record
              </button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-xs font-bold text-[#9c3a2e]">{error}</p> : null}

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <Play className="h-4 w-4 text-[#8b6f39]" />
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Spoken answer notes</p>
        </div>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            onTranscript?.(event.target.value);
          }}
          rows={4}
          placeholder={
            speechSupported
              ? "Your words appear here as you speak. Fillers such as 'umm' and 'ah' are removed automatically, and the evaluation never restarts because of them."
              : "Type your spoken answer here so the AI examiner can evaluate your pronunciation, fluency, grammar, vocabulary and coherence."
          }
          className="mt-2 w-full resize-y rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm leading-6 text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
        />
      </div>
    </div>
  );
}