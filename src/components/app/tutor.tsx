"use client";

import { useState } from "react";
import { Brain, Lightbulb, Send, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudentLearningProfile, TutorMessage } from "@/lib/ielts-brain";

const suggestionChips = [
  "How do I improve my Listening map labelling?",
  "What is the best strategy for True / False / Not Given?",
  "How should I structure Writing Task 2?",
  "How can I improve my speaking fluency?",
  "How much time should I spend on each Reading passage?",
];

export function TutorChat({ profile }: { profile: StudentLearningProfile }) {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      role: "tutor",
      text: `Hi ${profile.name.split(" ")[0]}, I am your AI tutor. Ask me about any IELTS strategy, study doubt, or skill. I use your learning profile to make the advice specific to you.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"ai" | "offline" | null>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setMessages((current) => [...current, { role: "student", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-6).map((message) => ({ role: message.role, text: message.text }));
      const response = await fetch("/api/brain/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, question, history }),
      });
      if (!response.ok) throw new Error("Tutor request failed");
      const data = (await response.json()) as { reply: string; tips: string[]; source?: string };
      setSource(data.source === "offline" ? "offline" : "ai");
      setMessages((current) => [
        ...current,
        { role: "tutor", text: data.reply },
        ...data.tips.map((tip) => ({ role: "tutor", text: `💡 ${tip}` } as TutorMessage)),
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "tutor", text: "I could not reach the AI Brain. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <div className="flex items-center gap-4">
          <div className="relative grid h-16 w-16 place-items-center rounded-3xl bg-[#17342f] text-white">
            <span className="animate-brain-pulse absolute inset-0 rounded-3xl bg-[#e3b65f]/30" />
            <Brain className="relative h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">AI Tutor</p>
            <h2 className="mt-1 font-serif text-4xl font-semibold text-[#17342f]">Ask doubts, get study tips</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#66746e]">
              Every answer comes from the AI Brain, shaped by your bands and weakness map.
            </p>
            {source ? (
              <span
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em]",
                  source === "offline"
                    ? "border-[#d8c8a8] bg-[#f5eddc] text-[#8b5732]"
                    : "border-[#17342f]/15 bg-[#e4f0ea] text-[#2f7151]",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {source === "offline" ? "Offline mode — live AI is down" : "AI live"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="rounded-full border border-[#d8c8a8] bg-white/70 px-4 py-2 text-xs font-bold text-[#17342f] transition hover:bg-white"
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      <section className="flex h-[520px] flex-col rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl">
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div key={index} className={cn("flex", message.role === "student" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6",
                  message.role === "student"
                    ? "bg-[#17342f] text-white shadow-lg shadow-[#17342f]/15"
                    : "border border-[#e3dac6] bg-white/80 text-[#315149]",
                )}
              >
                {message.role === "tutor" && message.text.startsWith("💡") ? (
                  <span className="flex gap-2">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#e3b65f]" />
                    <span>{message.text.replace("💡 ", "")}</span>
                  </span>
                ) : (
                  message.text
                )}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-[#e3dac6] bg-white/80 px-4 py-3 text-sm text-[#66746e]">
                <Sparkles className="h-4 w-4 animate-spin" />
                The AI Brain is thinking…
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about any IELTS skill, strategy, or study plan…"
            className="min-w-0 flex-1 rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17342f] text-white transition hover:bg-[#245f5a] disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </section>
    </div>
  );
}
