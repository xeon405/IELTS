import Link from "next/link";
import { Brain, ArrowLeft } from "lucide-react";

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
    <main className="exam-grid flex min-h-screen flex-col items-center justify-center bg-[#f5eddc] px-4 py-12 text-[#17342f]">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-[#5c6b64] transition hover:text-[#17342f]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f] shadow-lg shadow-[#17342f]/25">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <p className="font-serif text-xl font-semibold leading-tight text-[#17342f]">IELTS Examiner</p>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Adaptive AI training</p>
        </div>
      </div>

      <div className="mt-8 w-full max-w-md rounded-[2.2rem] border border-white/70 bg-[#fffaf0]/90 p-8 shadow-[0_24px_80px_rgba(33,72,67,0.14)]">
        <h1 className="font-serif text-3xl font-semibold text-[#17342f]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#5c6b64]">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
