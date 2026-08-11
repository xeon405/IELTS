import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Check,
  Mic,
  PenLine,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

const highlights = [
  { icon: Timer, text: "Full mock exams with official timings — Listening, Reading, Writing, Speaking" },
  { icon: BookOpen, text: "Question-type labs for every official IELTS question type" },
  { icon: Sparkles, text: "AI band-descriptor feedback and a final band report after every session" },
  { icon: Brain, text: "Adaptive practice that targets your weakest question types first" },
  { icon: Mic, text: "Speaking parts 1–3 with voice recorder and examiner analysis" },
  { icon: PenLine, text: "Task 1 & Task 2 editors with live word counts and timers" },
];

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="exam-grid flex min-h-screen flex-col bg-[#f5eddc] text-[#17342f]">
      {/* ---- Website header ---- */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <Brain className="h-6 w-6" />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight">Mkg.IELTS.COM</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-bold text-[#315149] md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-[#17342f]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-2xl px-4 py-2 text-sm font-bold text-[#17342f] transition hover:bg-white/60 sm:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-[#17342f] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Create account
          </Link>
        </div>
      </header>

      {/* ---- Split hero: pitch + form ---- */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Left: marketing panel */}
        <section className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8b6f39]">Adaptive AI training</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl">
            Your personal IELTS examiner is one login away.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#5c6b64]">
            Every practice question, every band score, every piece of feedback — generated and graded
            by the AI Brain, and shaped around you.
          </p>

          <ul className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/40 px-4 py-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8b6f39]" />
                <span className="text-sm font-semibold leading-5 text-[#315149]">{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center gap-4 rounded-3xl border border-white/70 bg-[#fffaf0]/70 px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e8d9b4] text-[#17342f]">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm leading-5 text-[#5c6b64]">
              <span className="font-bold text-[#17342f]">One account.</span> Four skills, ten full mock
              papers, unlimited practice, and progress reports that follow you.
            </p>
          </div>
        </section>

        {/* Right: form card */}
        <section className="w-full max-w-md">
          <div className="rounded-[2.2rem] border border-white/70 bg-[#fffaf0]/90 p-8 shadow-[0_24px_80px_rgba(33,72,67,0.14)]">
            <h1 className="font-serif text-3xl font-semibold text-[#17342f]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[#5c6b64]">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#5c6b64] transition hover:text-[#17342f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </section>
      </main>

      {/* ---- Website footer ---- */}
      <footer className="mt-16 border-t border-[#e3dac6] bg-[#17342f] text-[#f5eddc]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3b65f] text-[#17342f]">
                <Brain className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-semibold">Mkg.IELTS.COM</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#c9d6d0]">
              Adaptive AI training for the IELTS exam — question generation, evaluation, and
              recommendations handled entirely by the backend AI Brain.
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Product</p>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-[#c9d6d0]">
              <li><Link href="/#features" className="transition hover:text-white">Features</Link></li>
              <li><Link href="/#pricing" className="transition hover:text-white">Pricing</Link></li>
              <li><Link href="/#faq" className="transition hover:text-white">FAQ</Link></li>
              <li><Link href="/app" className="transition hover:text-white">Open the app</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Account</p>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-[#c9d6d0]">
              <li><Link href="/login" className="transition hover:text-white">Log in</Link></li>
              <li><Link href="/register" className="transition hover:text-white">Create account</Link></li>
              <li><Link href="/forgot-password" className="transition hover:text-white">Forgot password</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#315149]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs font-semibold text-[#9fb3aa] sm:flex-row">
            <p>© {new Date().getFullYear()} Mkg.IELTS.COM. Built for serious preparation.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#e3b65f]" />
              Your progress stays yours.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
