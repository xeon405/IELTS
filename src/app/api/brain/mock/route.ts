import { NextResponse } from "next/server";
import {
  createDefaultLearningProfile,
  evaluateMockExam,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";
import { aiMockEvaluation, hasGeminiKey } from "@/lib/gemini-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = (body.profile ?? createDefaultLearningProfile()) as StudentLearningProfile;
  const answers = (body.answers ?? {}) as Record<string, string>;

  const local = evaluateMockExam(profile, answers);
  if (!hasGeminiKey()) {
    return NextResponse.json(local);
  }

  const ai = await aiMockEvaluation(profile, answers);
  return NextResponse.json(ai ?? local);
}
