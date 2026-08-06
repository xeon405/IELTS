import { NextResponse } from "next/server";
import {
  createDiagnosticProfile,
  estimateDiagnosticFromAnswers,
} from "@/lib/ielts-brain";
import { aiDiagnostic, hasGeminiKey } from "@/lib/gemini-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "IELTS Student";
  const answers = (body.answers ?? {}) as Record<string, string>;

  const fallback = createDiagnosticProfile(name, estimateDiagnosticFromAnswers(answers));

  if (!hasGeminiKey()) {
    return NextResponse.json({ profile: fallback, source: "local" });
  }

  const ai = await aiDiagnostic(name, answers);
  const profile = ai ? createDiagnosticProfile(name, ai) : fallback;

  return NextResponse.json({ profile, source: ai ? "gemini" : "local" });
}
