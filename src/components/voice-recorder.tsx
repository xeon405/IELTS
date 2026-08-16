"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Pause, Play, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { API_BASE, getToken, voiceApi } from "@/lib/backend";

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

const MAX_RECORD_SECONDS = 180;

function pickRecorderMime(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "";
}

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
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [liveSpeech, setLiveSpeech] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [level, setLevel] = useState(0);
  const [silent, setSilent] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const recordingRef = useRef(false);
  const blobRef = useRef<Blob | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const speechSupported = typeof window !== "undefined" && Boolean(getRecognitionCtor());

  function getAudioContextCtor(): (new () => AudioContext) | null {
    if (typeof window === "undefined") return null;
    const w = window as unknown as { AudioContext?: new () => AudioContext; webkitAudioContext?: new () => AudioContext };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
  }

  function stopLevelMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setLevel(0);
    setSilent(false);
  }

  function micErrorMessage(err: unknown): string {
    const name = err instanceof DOMException ? (err.name ?? "") : err && typeof err === "object" && "name" in err ? String((err as { name?: unknown }).name ?? "") : "";
    if (/NotAllowed|PermissionDenied/i.test(name)) {
      return "Microphone access is blocked. Click the padlock (or the microphone icon) in the browser address bar, allow Microphone for this site, then try again. Windows: Settings > Privacy & security > Microphone must also allow the browser.";
    }
    if (/NotFound|DevicesNotFound/i.test(name)) {
      return "No microphone was found. Plug in a microphone, then check Windows Settings > System > Sound > Input, and try again.";
    }
    return "Microphone not available. Type your spoken answer below instead.";
  }

  function startLevelMeter(stream: MediaStream) {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    const ctx = new Ctor();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const buffer = new Float32Array(analyser.fftSize);
    const tick = () => {
      const analyserCurrent = analyserRef.current;
      if (!analyserCurrent) return;
      analyserCurrent.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i += 1) sum += buffer[i] * buffer[i];
      const rms = Math.sqrt(sum / buffer.length);
      setLevel(Math.min(100, Math.round(rms * 350)));
      setSilent(rms < 0.01);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }

  async function blobHasSpeech(blob: Blob): Promise<boolean> {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return true;
    try {
      const ctx = new Ctor();
      const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
      const data = decoded.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      await ctx.close().catch(() => {});
      return rms > 0.008;
    } catch {
      return true;
    }
  }

  function emitTranscript() {
    const combined = [finalRef.current, interimRef.current].filter(Boolean).join(" ").trim();
    const cleaned = stripFillers(combined);
    setNote(cleaned);
    onTranscript?.(cleaned);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        resolve(result.includes(",") ? result.split(",")[1] ?? "" : result);
      };
      reader.onerror = () => reject(new Error("Could not read the recording."));
      reader.readAsDataURL(blob);
    });
  }

  async function transcribeRecording(blob: Blob) {
    setError(null);
    setTranscribing(true);
    try {
      // Keep payloads well under the backend's 50MB body cap (base64 inflates
      // by ~33%): reject oversized recordings before uploading.
      const MAX_RECORDING_BYTES = 30 * 1024 * 1024;
      if (blob.size > MAX_RECORDING_BYTES) {
        setError("This recording is too large to transcribe — please record a shorter answer or type it instead.");
        return;
      }
      const audible = await blobHasSpeech(blob);
      if (!audible) {
        setError("No speech was detected in the recording — your microphone may be muted or off. Check your mic and try again, or type your answer.");
        return;
      }
      const base64 = await blobToBase64(blob);
      const result = await voiceApi.transcribe(base64, blob.type || "audio/webm");
      const text = String(result.text ?? "").trim();
      if (text) {
        finalRef.current = text;
        interimRef.current = "";
        emitTranscript();
      } else {
        setError("Nothing was detected in the recording — try again or type your answer.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(/abort|timeout/i.test(message) ? "Transcription is taking too long — type your answer instead." : message || "Could not transcribe the voice note — type your answer instead.");
    } finally {
      setTranscribing(false);
    }
  }

  function stopStreamTracks(stream: MediaStream | undefined) {
    stream?.getTracks?.().forEach((track) => track.stop());
  }

  async function start() {
    if (recordingRef.current || busy) return;
    if (typeof MediaRecorder === "undefined") {
      setError("This browser does not support voice recording. Type your spoken answer below instead.");
      return;
    }
    setError(null);
    setBusy(true);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      setBusy(false);
      setError(micErrorMessage(err));
      return;
    }
    try {
      const mimeType = pickRecorderMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stopStreamTracks(stream);
      };
      recorder.onstop = () => {
        stopStreamTracks(stream);
        const recordedChunks = chunksRef.current;
        const recordedBlob = recordedChunks.length ? new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" }) : null;
        if (!recordedBlob || !recordedBlob.size) {
          setError("No audio was captured — your microphone may be off or blocked. Check the mic icon in the address bar and try again, or type your answer.");
          setRecording(false);
          return;
        }
        blobRef.current = recordedBlob;
        setAudioUrl(URL.createObjectURL(recordedBlob));
        if (!finalRef.current.trim() && getToken()) {
          transcribeRecording(recordedBlob);
        }
      };
      recorder.start(250);
      mediaRef.current = recorder;
      recordingRef.current = true;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((current) => {
          if (current + 1 >= MAX_RECORD_SECONDS) stop();
          return current + 1;
        });
      }, 1000);
    } catch (err) {
      stopStreamTracks(stream);
      setError(micErrorMessage(err));
      setBusy(false);
      return;
    }
    setBusy(false);

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
    stopLevelMeter();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      mediaRef.current?.stop();
    } catch {
      /* noop */
    }
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
    emitTranscript();
  }

  function reset() {
    finalRef.current = "";
    interimRef.current = "";
    stop();
    setSeconds(0);
    setAudioUrl(null);
    setNote("");
    blobRef.current = null;
    onTranscript?.("");
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      stopLevelMeter();
      recordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
      }
      try {
        mediaRef.current?.stop();
      } catch {
        /* noop */
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
            disabled={Boolean(audioUrl) || busy}
            className={cn(
              "grid h-12 w-12 place-items-center rounded-2xl text-white transition",
              recording ? "animate-brain-pulse bg-[#9c3a2e]" : "bg-[#2f7151] hover:bg-[#245f5a]",
              (audioUrl || busy) && "opacity-40",
            )}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Voice recorder</p>
            <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-[#17342f]">
              {recording ? `00:${String(seconds).padStart(2, "0")}` : "Ready"}
            </p>
          </div>
          {recording ? (
            <div className="flex items-center gap-1.5" aria-label="Input level meter">
              {[0, 1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={cn(
                    "h-8 w-1.5 rounded-full transition-all duration-100",
                    level > bar * 20 ? (silent ? "bg-[#c9b995]" : "bg-[#2f7151]") : "bg-[#e8ddc6]",
                  )}
                  style={level > bar * 20 ? { height: `${Math.max(8, 12 + ((level - bar * 20) / 20) * 20)}px` } : undefined}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recording && silent ? (
            <span className="rounded-full bg-[#f8e8e2] px-3 py-1 text-[11px] font-bold text-[#a2532e]">
              No sound is reaching the microphone — check your mic
            </span>
          ) : null}
          {liveSpeech ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f0ea] px-3 py-1 text-[11px] font-bold text-[#2f7151]">
              <Pause className="h-3 w-3 animate-pulse" />
              Live transcribing — fillers like &quot;umm&quot; are ignored
            </span>
          ) : speechSupported ? null : getToken() ? (
            <span className="rounded-full bg-[#f5eddc] px-3 py-1 text-[11px] font-bold text-[#8b5732]">
              Live transcription unavailable — your recording will be transcribed automatically
            </span>
          ) : (
            <span className="rounded-full bg-[#f8e8e2] px-3 py-1 text-[11px] font-bold text-[#a2532e]">
              Speech recognition unavailable — type your answer instead
            </span>
          )}
          {audioUrl ? (
            <>
              <audio controls src={audioUrl} className="h-10 max-w-56" />
              <button
                onClick={() => blobRef.current && transcribeRecording(blobRef.current)}
                disabled={transcribing}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8c8a8] bg-white/80 px-3 py-2 text-xs font-bold text-[#17342f] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {transcribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Transcribing…
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    Transcribe recording
                  </>
                )}
              </button>
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