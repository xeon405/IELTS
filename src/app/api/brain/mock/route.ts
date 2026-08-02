import { NextResponse } from "next/server";
import {
  createDefaultLearningProfile,
  evaluateMockExam,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = (body.profile ?? createDefaultLearningProfile()) as StudentLearningProfile;
  const answers = (body.answers ?? {}) as Record<string, string>;

  return NextResponse.json(evaluateMockExam(profile, answers));
}
