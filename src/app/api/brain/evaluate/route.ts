import { NextResponse } from "next/server";
import {
  createDefaultLearningProfile,
  evaluatePracticeSession,
  type PracticeSession,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = (body.profile ?? createDefaultLearningProfile()) as StudentLearningProfile;
  const session = body.session as PracticeSession | undefined;
  const answers = (body.answers ?? {}) as Record<string, string>;

  if (!session) {
    return NextResponse.json({ error: "Practice session is required." }, { status: 400 });
  }

  return NextResponse.json(evaluatePracticeSession(profile, session, answers));
}
