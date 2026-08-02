import { NextResponse } from "next/server";
import {
  createDefaultLearningProfile,
  createPracticeSession,
  getAdaptiveRecommendation,
  type Skill,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = (body.profile ?? createDefaultLearningProfile()) as StudentLearningProfile;
  const module = body.module as Skill | undefined;
  const mode = body.mode as string | undefined;

  return NextResponse.json({
    recommendation: getAdaptiveRecommendation(profile),
    session: createPracticeSession(profile, module, mode),
  });
}
