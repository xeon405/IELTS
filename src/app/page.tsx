import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Headphones,
  LineChart,
  Mic,
  PenLine,
  Quote,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Brain,
    title: "A real AI Brain",
    text: "Not a question bank. The platform remembers your skill bands, weaknesses, topics, and history — and decides every next session for you.",
  },
  {
    icon: ClipboardList,
    title: "Diagnostic first",
    text: "New students take a short diagnostic. The AI estimates your current bands, grammar, and vocabulary before personalizing anything.",
  },
  {
    icon: Sparkles,
    title: "Original questions",
    text: "Every practice section is generated fresh for you from your weaknesses and target band. Nothing is copied, nothing is random.",
  },
  {
    icon: BarChart3,
    title: "Examiner-grade feedback",
    text: "Your answers are evaluated against official public band descriptors with predicted band scores, strengths, weaknesses, and a next plan.",
  },
  {
    icon: LineChart,
    title: "Adaptive difficulty",
    text: "As your accuracy rises, so does the difficulty. The AI keeps pushing toward your target band at the right pace.",
  },
  {
    icon: Trophy,
    title: "Full mock exams",
    text: "A separate computer-delivered mock that follows the official order, timings, and question counts — then produces one complete AI report.",
  },
];

const pipeline: { step: string; label: string; text: string }[] = [
  { step: "01", label: "Diagnose", text: "A diagnostic estimates your current bands and builds your learning profile." },
  { step: "02", label: "Generate", text: "The AI creates original IELTS-style questions aimed at your weakest skill." },
  { step: "03", label: "Evaluate", text: "A principal-examiner prompt grades your answers against public band descriptors." },
  { step: "04", label: "Adapt", text: "Your profile updates and the next recommendation is recalculated automatically." },
];

const modules: { icon: LucideIcon; label: string; text: string }[] = [
  { icon: BookOpen, label: "Reading", text: "Matching headings, True/False/Not Given, inference, and timing under pressure." },
  { icon: Headphones, label: "Listening", text: "Four-part practice with distractors, map language, and correction signals." },
  { icon: PenLine, label: "Writing", text: "Task 1 and Task 2 workflows evaluated by band descriptors with a rewrite plan." },
  { icon: Mic, label: "Speaking", text: "Interview, cue card, and Part 3 extension with examiner feedback." },
];

const plans: { name: string; price: string; period: string; features: string[]; featured: boolean }[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Diagnostic assessment", "5 AI practice sessions / month", "Full mock exam", "Profile memory"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    features: [
      "Unlimited AI practice sessions",
      "Examiner-grade writing & speaking feedback",
      "Full mock exams with AI report",
      "Adaptive recommendation engine",
      "Progress analytics",
    ],
    featured: true,
  },
  {
    name: "Tutor",
    price: "$29",
    period: "/month",
    features: ["Everything in Pro", "Personal AI tutor chat", "Weekly study plan", "Priority evaluation queue", "Certificate of practice"],
    featured: false,
  },
];

const testimonials: { quote: string; name: string; detail: string }[] = [
  {
    quote: "The AI caught weaknesses in my writing that three teachers had missed. My band went from 6.0 to 7.0 in eight weeks.",
    name: "Amina R.",
    detail: "Targeting Band 7.5 · Writing",
  },
  {
    quote: "It feels like a real examiner, not an app. The diagnostic knew exactly what I was struggling with on the first day.",
    name: "Marco L.",
    detail: "Targeting Band 8.0 · Speaking",
  },
  {
    quote: "I trained only the weak question types the AI chose. Passed my mock with a 7.5 on the first full attempt.",
    name: "Priya S.",
    detail: "Targeting Band 7.5 · Reading",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Is this another IELTS question bank?",
    a: "No. The AI Brain is the product. It runs a diagnostic, builds a learning profile that remembers your weaknesses and history, generates original questions aimed at your weak points, evaluates you against official band descriptors, and adapts the next session to move you toward your target band.",
  },
  {
    q: "How does the diagnostic work?",
    a: "New students answer a short set of questions covering grammar, vocabulary, reading, listening, writing, and speaking. The AI estimates your current bands and builds your personal learning profile before any personalized practice begins.",
  },
  {
    q: "Are the questions from real IELTS exams?",
    a: "No. We never copy copyrighted exam content. Our question generator produces original materials that follow official IELTS formatting, band descriptors, and difficulty levels for your current band.",
  },
  {
    q: "Does it evaluate speaking and writing automatically?",
    a: "Yes. Speaking and writing responses are reviewed by a principal-examiner AI prompt that returns predicted band scores, strengths, weaknesses, and a concrete next plan based on the public band descriptors.",
  },
  {
    q: "What is the full mock exam mode?",
    a: "A separate computer-delivered simulation that follows the official section order (Listening, Reading, Writing, Speaking), timings, and question counts. At the end you receive one complete AI examiner report with bands for every skill.",
  },
  {
    q: "How much does it cost?",
    a: "You can start free and complete a diagnostic plus a full mock exam. The Pro plan unlocks unlimited AI practice and examiner feedback, and the Tutor plan adds a personal AI tutor and a weekly study plan.",
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-center text-xs font-black uppercase tracking-[0.26em] text-[#8b6f39]">{children}</p>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mt-4 text-center font-serif text-4xl font-semibold tracking-tight text-[#17342f] md:text-5xl">
      {children}
    </h2>
  );
}

function SectionSub({ children }: { children: string }) {
  return <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-7 text-[#5c6b64]">{children}</p>;
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f5eddc] text-[#17342f]">
      <Navbar />

      <section className="exam-grid relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
        <div className="pointer-events-none absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pb-20 pt-24 md:pt-32 lg:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d8c8a8] bg-[#fffaf0]/80 px-4 py-2 text-xs font-bold text-[#315149] backdrop-blur">
            <Brain className="h-4 w-4 text-[#8b6f39]" />
            The website is the interface. The AI Brain decides the path.
          </div>

          <h1 className="mt-8 max-w-4xl text-center font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-[#17342f] md:text-7xl">
            An AI examiner that remembers{" "}
            <span className="text-[#8b5732]">everything</span> about you.
          </h1>

          <p className="mt-6 max-w-2xl text-center text-lg leading-8 text-[#5c6b64]">
            AI IELTS Examiner is an adaptive training platform with a real AI Brain. It runs a diagnostic,
            generates original exam-style questions from your weaknesses, grades you against official band
            descriptors, and personalizes every session until you reach your target band.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#17342f]/25 transition hover:-translate-y-0.5"
            >
              Start free with a diagnostic
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-7 py-4 text-sm font-bold text-[#17342f] transition hover:bg-white"
            >
              <Sparkles className="h-4 w-4 text-[#8b6f39]" />
              Try the live demo
            </Link>
          </div>

          <div className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat icon={Target} value="6.0 → 7.5" label="Average band lift reported by Pro students" />
            <HeroStat icon={Trophy} value="4 skills" label="Reading · Listening · Writing · Speaking" />
            <HeroStat icon={Sparkles} value="100%" label="Original AI-generated practice questions" />
            <HeroStat icon={Timer} value="2 min" label="Diagnostic before your first personalized session" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
        <SectionLabel>Features</SectionLabel>
        <SectionTitle>Built like a real examiner, not a question bank</SectionTitle>
        <SectionSub>
          Every feature exists so the platform behaves like a professional IELTS examiner and a personal tutor
          that understands each student individually.
        </SectionSub>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_18px_60px_rgba(33,72,67,0.11)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17342f] text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-[#17342f]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5c6b64]">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
        <SectionLabel>How the AI works</SectionLabel>
        <SectionTitle>Four steps. Zero randomness.</SectionTitle>
        <SectionSub>
          The question-generation pipeline is driven by your profile, learning history, current band, and target
          band. The AI never asks what random question to generate.
        </SectionSub>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pipeline.map((item, index) => (
            <div
              key={item.step}
              className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_18px_60px_rgba(33,72,67,0.11)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-3xl font-bold text-[#e3b65f]">{item.step}</span>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-5 font-serif text-2xl font-semibold text-[#17342f]">{item.label}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5c6b64]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
        <SectionLabel>All four skills</SectionLabel>
        <SectionTitle>Exam-style practice for every section</SectionTitle>
        <SectionSub>
          Choose a full section or an individual question type. The AI generates the section, then waits until
          you submit the whole thing for one examiner-grade evaluation.
        </SectionSub>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.label}
                className="rounded-[2rem] border border-white/70 bg-gradient-to-br from-[#f4e3cd] via-[#f8f0d9] to-[#e4f0ea] p-6 shadow-[0_18px_60px_rgba(33,72,67,0.11)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17342f] text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-[#17342f]">{mod.label}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5c6b64]">{mod.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
        <SectionLabel>Pricing</SectionLabel>
        <SectionTitle>Start free. Upgrade when you are ready.</SectionTitle>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "relative rounded-[2rem] border border-[#17342f] bg-[#17342f] p-7 text-white shadow-[0_24px_80px_rgba(23,52,47,0.3)]"
                  : "rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-7 shadow-[0_18px_60px_rgba(33,72,67,0.11)]"
              }
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-7 rounded-full bg-[#e3b65f] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#17342f]">
                  Most popular
                </span>
              ) : null}
              <p className={plan.featured ? "text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]" : "text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]"}>
                {plan.name}
              </p>
              <p className="mt-4">
                <span className="font-mono text-5xl font-bold">{plan.price}</span>
                <span className="ml-2 text-sm opacity-70">{plan.period}</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-6">
                {plan.features.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#e3b65f]" />
                    <span className={plan.featured ? "text-[#dbe7e2]" : "text-[#4f625b]"}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={
                  plan.featured
                    ? "mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-4 py-3 text-sm font-bold text-[#17342f] transition hover:bg-[#f0c66f]"
                    : "mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-4 py-3 text-sm font-bold text-[#17342f] transition hover:bg-white"
                }
              >
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
        <SectionLabel>Testimonials</SectionLabel>
        <SectionTitle>Students who reached their band</SectionTitle>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/85 p-6 shadow-[0_18px_60px_rgba(33,72,67,0.11)]">
              <Quote className="h-6 w-6 text-[#e3b65f]" />
              <blockquote className="mt-4 text-sm leading-7 text-[#315149]">{t.quote}</blockquote>
              <figcaption className="mt-5">
                <p className="font-bold text-[#17342f]">{t.name}</p>
                <p className="text-xs text-[#8b6f39]">{t.detail}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-20 lg:px-6">
        <SectionLabel>FAQ</SectionLabel>
        <SectionTitle>Questions, answered</SectionTitle>
        <div className="mt-10 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-[1.5rem] border border-white/70 bg-[#fffaf0]/85 p-5 shadow-[0_14px_40px_rgba(33,72,67,0.09)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg font-semibold text-[#17342f]">
                {faq.q}
                <span className="text-[#8b6f39] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-[#5c6b64]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="rounded-[2.6rem] bg-[#17342f] p-10 text-center text-white shadow-[0_24px_90px_rgba(23,52,47,0.3)] md:p-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#e9d29b]">
            <GraduationCap className="h-4 w-4" />
            Begin with a diagnostic
          </div>
          <h2 className="mx-auto mt-6 max-w-2xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
            Let the AI meet you before it teaches you.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#d8e4df]">
            Take the two-minute diagnostic, get your estimated bands, and start training the exact skills that
            hold your score back.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e3b65f] px-8 py-4 text-sm font-black text-[#17342f] transition hover:-translate-y-0.5 hover:bg-[#f0c66f]"
          >
            Create your learning profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#e0d2b9] bg-[#fffaf0]/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between lg:px-6">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#17342f] text-[#e3b65f]">
                <Brain className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-semibold text-[#17342f]">IELTS Examiner</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#66746e]">
              An adaptive IELTS training platform where the AI Brain is the product and the interface is just a
              window into it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="font-black uppercase tracking-[0.18em] text-[#8b6f39]">Product</p>
              <ul className="mt-4 space-y-2">
                <li><a href="#features" className="text-[#4f625b] hover:text-[#17342f]">Features</a></li>
                <li><a href="#pricing" className="text-[#4f625b] hover:text-[#17342f]">Pricing</a></li>
                <li><Link href="/app" className="text-[#4f625b] hover:text-[#17342f]">Live demo</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-black uppercase tracking-[0.18em] text-[#8b6f39]">Account</p>
              <ul className="mt-4 space-y-2">
                <li><Link href="/login" className="text-[#4f625b] hover:text-[#17342f]">Log in</Link></li>
                <li><Link href="/register" className="text-[#4f625b] hover:text-[#17342f]">Sign up</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e0d2b9] py-5 text-center text-xs text-[#8b8b82]">
          © {new Date().getFullYear()} AI IELTS Examiner. Independent IELTS preparation tool. Not affiliated with the
          IELTS partners.
        </div>
      </footer>
    </main>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e0d2b9]/70 bg-[#f5eddc]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#17342f] text-[#e3b65f]">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-serif text-lg font-semibold text-[#17342f]">IELTS Examiner</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#315149] md:flex">
          <a href="#features" className="hover:text-[#17342f]">Features</a>
          <a href="#how" className="hover:text-[#17342f]">How it works</a>
          <a href="#pricing" className="hover:text-[#17342f]">Pricing</a>
          <a href="#faq" className="hover:text-[#17342f]">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-bold text-[#17342f] hover:underline sm:block">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-[#17342f] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroStat({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-[#fffaf0]/85 p-5 text-center shadow-[0_14px_40px_rgba(33,72,67,0.09)] backdrop-blur">
      <Icon className="mx-auto h-5 w-5 text-[#8b6f39]" />
      <p className="mt-3 font-mono text-xl font-bold text-[#17342f]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#66746e]">{label}</p>
    </div>
  );
}
