"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  GraduationCap,
  Headphones,
  Mic,
  PenLine,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { authApi, setAuth } from "@/lib/backend";
import GoogleSignIn from "@/components/google-sign-in";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const features = [
  {
    icon: Brain,
    title: "AI Brain that learns you",
    text: "Question generation, scoring, adaptive paths, and recommendations all live in the backend AI Brain. The interface never writes questions or marks answers.",
  },
  {
    icon: BookOpen,
    title: "Reading & Listening labs",
    text: "Full sections, passages, parts, and question-type drills with official timers and exam-style submission and results.",
  },
  {
    icon: PenLine,
    title: "Writing with word counter",
    text: "Task 1 and Task 2 editors with live word counts, timers, and detailed band-descriptor feedback after every submit.",
  },
  {
    icon: Mic,
    title: "Speaking with recorder",
    text: "Part 1–3 with a built-in voice recorder, cue cards, and examiner feedback that targets fluency, grammar, and range.",
  },
  {
    icon: Timer,
    title: "Real mock experience",
    text: "Listening → Reading → Writing → Speaking with official timings and a complete final band report.",
  },
  {
    icon: BarChart3,
    title: "Reports that guide you",
    text: "Overall band, section scores, strengths, weaknesses, progress charts, and AI recommendations in one view.",
  },
];

const pricing = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    tagline: "Start your IELTS journey",
    cta: "Start free",
    highlight: false,
    features: ["Unlimited practice sessions", "Full mock exam", "Basic AI feedback", "Vocabulary trainer", "Progress reports"],
  },
  {
    name: "Pro",
    monthly: 12,
    yearly: 9,
    tagline: "Serious prep, faster results",
    cta: "Go Pro",
    highlight: true,
    features: ["Everything in Free", "Adaptive AI recommendation", "AI Tutor chat", "Detailed band-descriptor feedback", "Voice recording analysis", "Priority support"],
  },
  {
    name: "Tutor Plus",
    monthly: 24,
    yearly: 19,
    tagline: "Personal AI coaching",
    cta: "Choose Tutor Plus",
    highlight: false,
    features: ["Everything in Pro", "Weekly study plans", "Personal AI tutor sessions", "Mock exam debriefs", "Achievement tracking", "Multi-device sync"],
  },
];

const testimonials = [
  {
    name: "Amina R.",
    role: "Targeting Band 7.5",
    quote: "The AI recommendations pointed exactly at my weakest question type. Two focused weeks later my Reading jumped half a band.",
  },
  {
    name: "Daniel K.",
    role: "Test in 6 weeks",
    quote: "The full mock interface felt identical to the computer-delivered exam. The final band report told me exactly what to fix.",
  },
  {
    name: "Sofia M.",
    role: "Self-study student",
    quote: "I asked the AI Tutor about True / False / Not Given and got a strategy I could use immediately. It feels like a personal examiner.",
  },
];

const faqs = [
  {
    q: "How does the AI Brain differ from the interface?",
    a: "The frontend only displays the interface and sends your answers to the backend. All question generation, evaluation, scoring, adaptive learning, and recommendations happen inside the AI Brain via API calls — so the interface stays fast and honest.",
  },
  {
    q: "Do you use official IELTS timings?",
    a: "Yes. The full mock follows the official order and timings: Listening 30 minutes, Reading 60, Writing 60, and Speaking about 14 minutes.",
  },
  {
    q: "Can I practice a single part or passage?",
    a: "Absolutely. Reading offers Passage 1, 2, 3 and question-type drills. Listening offers Part 1 through 4, and Speaking offers Part 1, 2, and 3.",
  },
  {
    q: "How is my feedback personalized?",
    a: "Every session you complete updates your learning memory — bands, weak question types, topics, and history. The AI Brain uses that memory to select your next practice and explain your scores.",
  },
  {
    q: "Is my data stored securely?",
    a: "Your learning profile is stored locally in your browser and can be backed up or restored as a JSON file. Nothing is uploaded to third parties.",
  },
];

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5eddc] text-[#17342f]">
      <Background />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <Brain className="h-6 w-6" />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight">Mkg.IELTS.COM</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-bold text-[#315149] md:flex">
          <a href="#features" className="hover:text-[#17342f]">Features</a>
          <a href="#pricing" className="hover:text-[#17342f]">Pricing</a>
          <a href="#testimonials" className="hover:text-[#17342f]">Testimonials</a>
          <a href="#faq" className="hover:text-[#17342f]">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAuthMode("login")}
            className="rounded-2xl px-4 py-2 text-sm font-bold text-[#17342f] transition hover:bg-white/60"
          >
            Log in
          </button>
          <button
            onClick={() => setAuthMode("register")}
            className="rounded-2xl bg-[#17342f] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Get started
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#d8c8a8] bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
          <Sparkles className="h-4 w-4" />
          Powered by a backend AI Brain
        </div>
        <h1 className="mx-auto mt-8 max-w-4xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-[#17342f] md:text-7xl">
          An AI IELTS examiner that <span className="text-[#2f7151]">learns before it teaches.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#5b6b63]">
          Practice all four skills with real exam timings, get band-descriptor feedback, and let the AI Brain
          choose every session from your learning memory. The interface stays clean — the intelligence stays in the backend.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-8 py-4 text-sm font-black text-white shadow-xl shadow-[#17342f]/25 transition hover:-translate-y-1"
          >
            Try the demo app
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="rounded-2xl border border-[#d8c8a8] bg-white/70 px-8 py-4 text-sm font-black text-[#17342f] transition hover:bg-white"
          >
            See how it works
          </a>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 text-left sm:grid-cols-4">
          <HeroStat icon={Timer} label="Real timings" value="Official" />
          <HeroStat icon={Trophy} label="Full mocks" value="4 skills" />
          <HeroStat icon={BarChart3} label="Live reports" value="Every session" />
          <HeroStat icon={ShieldCheck} label="AI in backend" value="Honest UI" />
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionLabel>Features</SectionLabel>
        <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#17342f] md:text-5xl">
          Everything you need to reach your band
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#66746e]">
          From focused single-passage practice to a full computer-delivered mock, every screen is built around
          the AI Brain that decides what you should do next.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl transition hover:-translate-y-1"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17342f] text-white transition group-hover:bg-[#245f5a]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-[#17342f]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f6c66]">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="overflow-hidden rounded-[2.4rem] border border-white/70 bg-[#17342f] p-8 text-white shadow-[0_24px_90px_rgba(23,52,47,0.28)] md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <SectionLabel light>Section flow</SectionLabel>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight">One exam, four skills, one report</h2>
              <p className="mt-4 text-base leading-7 text-[#d8e4df]">
                The full mock mirrors the real computer-delivered IELTS: Listening, then Reading, then Writing,
                then Speaking — with official timings and a final band report that ties all four sections together.
              </p>
              <Link
                href="/app"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-[#e3b65f] px-6 py-3 text-sm font-black text-[#17342f] transition hover:bg-[#f0c66f]"
              >
                Start a full mock
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3">
              {[
                { icon: Headphones, name: "Listening", time: "30 min · 40 questions" },
                { icon: BookOpen, name: "Reading", time: "60 min · 40 questions" },
                { icon: PenLine, name: "Writing", time: "60 min · 2 tasks" },
                { icon: Mic, name: "Speaking", time: "14 min · 3 parts" },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.name} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e3b65f] text-[#17342f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black">{row.name}</p>
                      <p className="text-xs text-[#d8e4df]">{row.time}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#e3b65f]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#17342f] md:text-5xl">
          Simple plans for serious learners
        </h2>
        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/70 p-1">
          {(["monthly", "yearly"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setBilling(option)}
              className={cn(
                "rounded-xl px-5 py-2 text-sm font-black capitalize transition",
                billing === option ? "bg-[#17342f] text-white" : "text-[#315149]",
              )}
            >
              {option}
              {option === "yearly" ? <span className="ml-1 text-[10px] text-[#e3b65f]">-25%</span> : null}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricing.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-[2.4rem] border p-7 backdrop-blur-xl",
                  plan.highlight
                    ? "border-[#17342f] bg-[#17342f] text-white shadow-[0_24px_90px_rgba(23,52,47,0.3)]"
                    : "border-white/70 bg-[#fffaf0]/85 shadow-[0_18px_60px_rgba(33,72,67,0.11)]",
                )}
              >
                {plan.highlight ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#e3b65f] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#17342f]">
                    Most popular
                  </span>
                ) : null}
                <p className={cn("text-xs font-black uppercase tracking-[0.2em]", plan.highlight ? "text-[#e3b65f]" : "text-[#8b6f39]")}>
                  {plan.name}
                </p>
                <p className="mt-1 text-sm">{plan.tagline}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="font-mono text-5xl font-bold">${price}</span>
                  <span className={cn("pb-1.5 text-sm", plan.highlight ? "text-[#d8e4df]" : "text-[#66746e]")}>/ month</span>
                </div>
                <p className={cn("mt-1 text-xs", plan.highlight ? "text-[#d8e4df]" : "text-[#8b8f88]")}>
                  {billing === "yearly" ? "Billed yearly" : "Billed monthly"}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", plan.highlight ? "bg-[#e3b65f] text-[#17342f]" : "bg-[#e4f0ea] text-[#2f7151]")}>
                        <Check className="h-3 w-3" />
                      </span>
                      <span className={plan.highlight ? "text-[#dbe7e2]" : "text-[#315149]"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setAuthMode("register")}
                  className={cn(
                    "mt-7 w-full rounded-2xl px-5 py-3 text-sm font-black transition hover:-translate-y-0.5",
                    plan.highlight ? "bg-[#e3b65f] text-[#17342f] hover:bg-[#f0c66f]" : "bg-[#17342f] text-white hover:bg-[#245f5a]",
                  )}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section id="testimonials" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <SectionLabel>Testimonials</SectionLabel>
        <h2 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#17342f] md:text-5xl">
          Learners who trusted the AI Brain
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
              <div className="flex gap-1 text-[#e3b65f]">
                {"★★★★★".split("").map((star, index) => (
                  <span key={index}>{star}</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4f625b]">"{testimonial.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#17342f] text-sm font-black text-[#e3b65f]">
                  {testimonial.name[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-[#17342f]">{testimonial.name}</p>
                  <p className="text-xs text-[#8b8f88]">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <SectionLabel>FAQ</SectionLabel>
        <h2 className="mt-4 text-center font-serif text-4xl font-semibold tracking-tight text-[#17342f] md:text-5xl">
          Questions, answered
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div key={faq.q} className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 shadow-[0_18px_60px_rgba(33,72,67,0.1)]">
                <button
                  onClick={() => setOpenFaq(open ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-serif text-xl font-semibold text-[#17342f]">{faq.q}</span>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-[#8b6f39] transition", open && "rotate-180")} />
                </button>
                {open ? <p className="px-6 pb-6 text-sm leading-7 text-[#5b6b63]">{faq.a}</p> : null}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#d8c8a8]/60 bg-[#17342f] px-6 py-12 text-[#d8e4df]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3b65f] text-[#17342f]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold text-white">Mkg.IELTS.COM</p>
              <p className="text-xs text-[#b9cdc5]">Interface and AI Brain in one learning loop.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <GraduationCap className="h-4 w-4 text-[#e3b65f]" />
            Built for computer-delivered IELTS preparation
          </div>
        </div>
      </footer>

      {authMode ? <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onSwitch={() => setAuthMode(authMode === "login" ? "register" : "login")} /> : null}
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="animate-slow-drift absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
      <div className="animate-slow-drift absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl [animation-delay:2s]" />
      <div className="absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-[#e8c872]/25 blur-3xl" />
    </div>
  );
}

function SectionLabel({ light = false, children }: { light?: boolean; children: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em]", light ? "text-[#e3b65f]" : "text-[#8b6f39]")}>
      <Sparkles className="h-4 w-4" />
      {children}
    </p>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/70 px-4 py-4 backdrop-blur">
      <Icon className="h-5 w-5 text-[#2f7151]" />
      <p className="mt-3 font-mono text-2xl font-bold text-[#17342f]">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#8b6f39]">{label}</p>
    </div>
  );
}

function AuthModal({ mode, onClose, onSwitch }: { mode: "login" | "register"; onClose: () => void; onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [verifyStep, setVerifyStep] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyDevCode, setVerifyDevCode] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState("");

  async function handleGoogle(credential: string) {
    setGoogleLoading(true);
    setError("");
    try {
      const response = await authApi.google(credential, GOOGLE_CLIENT_ID);
      setAuth(response.access_token, response.profile);
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const response = await authApi.register(name.trim(), email.trim(), password);
        if (response.dev_code) {
          setVerifyDevCode(response.dev_code);
          setVerifyCode(response.dev_code);
        }
        setVerifyNote(response.message);
        setVerifyStep(true);
        return;
      }
      const response = await authApi.login(email.trim(), password);
      setAuth(response.access_token, response.profile);
      window.location.href = "/app";
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/verif/i.test(message)) {
        setVerifyStep(true);
        setError(message);
        authApi
          .resendVerification(email.trim())
          .then((res) => {
            if (res.dev_code) {
              setVerifyDevCode(res.dev_code);
              setVerifyCode(res.dev_code);
            }
          })
          .catch(() => undefined);
      } else if (err instanceof TypeError || /fetch|failed to fetch|load failed|network/i.test(message)) {
        setError("Cannot reach the server. Make sure the backend is running on port 8000, then try again.");
      } else {
        setError(message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyNow(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await authApi.verify(email.trim(), verifyCode.trim());
      setAuth(response.access_token, response.profile);
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Try the code again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError("");
    setLoading(true);
    try {
      const result = await authApi.resendVerification(email.trim());
      if (result.dev_code) {
        setVerifyDevCode(result.dev_code);
        setVerifyCode(result.dev_code);
      }
      setError(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      setForgotSent(true);
      setError(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset instructions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#17342f]/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[2.4rem] border border-white/70 bg-[#fffaf0] p-8 shadow-[0_24px_90px_rgba(23,52,47,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">
              {verifyStep ? "One last thing" : mode === "login" ? "Welcome back" : "Create your account"}
            </p>
            <h3 className="mt-2 font-serif text-3xl font-semibold text-[#17342f]">
              {verifyStep ? "Verify your email" : mode === "login" ? "Log in to Mkg.IELTS.COM" : "Register for Mkg.IELTS.COM"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#66746e] transition hover:bg-[#f5eddc]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {verifyStep ? (
          <form onSubmit={verifyNow} className="mt-6 space-y-4">
            <div className="rounded-2xl bg-[#f5eddc] px-4 py-3 text-sm leading-6 text-[#315149]">
              We sent a 6-digit code to <span className="font-black text-[#17342f]">{email.trim()}</span>. Enter it below to activate
              your account.
            </div>
            {verifyNote ? <p className="text-center text-xs font-semibold text-[#8b6f39]">{verifyNote}</p> : null}
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Verification code</span>
              <input
                value={verifyCode}
                onChange={(event) => setVerifyCode(event.target.value)}
                required
                placeholder="000000"
                className="mt-2 w-full rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
              />
            </label>
            {verifyDevCode ? (
              <p className="text-center text-xs font-bold text-[#8b6f39]">
                Demo code: <span className="font-mono text-sm">{verifyDevCode}</span> (no email is configured — shown for testing)
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Checking…" : "Verify & enter the app"}
            </button>
            <p className="text-center">
              <button type="button" onClick={resendCode} disabled={loading} className="text-xs font-bold text-[#8b6f39] hover:underline">
                Resend code
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" ? (
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Amina Rahman"
                  className="mt-2 w-full rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
                />
              </label>
            ) : null}
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[#8b6f39]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-[#d8c8a8] bg-[#fffdf7] px-4 py-3 text-sm text-[#17342f] outline-none transition focus:border-[#17342f] focus:ring-4 focus:ring-[#17342f]/10"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connecting…" : mode === "login" ? "Log in & enter the app" : "Create account"}
            </button>
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-[#e3dac6]" />
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">or</span>
              <span className="h-px flex-1 bg-[#e3dac6]" />
            </div>
            {googleLoading ? (
              <p className="rounded-2xl bg-[#17342f]/5 px-4 py-3 text-center text-sm font-bold text-[#17342f]">
                Signing in with Google…
              </p>
            ) : (
              <div className="flex justify-center">
                <GoogleSignIn clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} />
              </div>
            )}
          </form>
        )}

        {!verifyStep && mode === "login" ? (
          <p className="mt-3 text-center">
            <button type="button" onClick={handleForgot} disabled={loading} className="text-xs font-bold text-[#8b6f39] hover:underline">
              {forgotSent ? "Resend reset instructions" : "Forgot password?"}
            </button>
          </p>
        ) : null}

        {error ? <p className="mt-4 rounded-2xl border border-[#d8c8a8] bg-[#f5eddc] px-4 py-3 text-center text-sm text-[#8b3a2a]">{error}</p> : null}

        {!verifyStep ? (
          <p className="mt-5 text-center text-sm text-[#66746e]">
            {mode === "login" ? "New to Mkg.IELTS.COM?" : "Already have an account?"}{" "}
            <button onClick={onSwitch} className="font-black text-[#2f7151] hover:underline">
              {mode === "login" ? "Register" : "Log in"}
            </button>
          </p>
        ) : null}
      </div>
    </div>
  );
}
