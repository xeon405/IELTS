import { NextResponse } from "next/server";
import {
  createDefaultLearningProfile,
  createPracticeSession,
  getAdaptiveRecommendation,
  type PracticeSession,
  type Skill,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";
import { aiRecommendation, generateSessionWithAI, hasGeminiKey } from "@/lib/gemini-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = (body.profile ?? createDefaultLearningProfile()) as StudentLearningProfile;
  const module = body.module as Skill | undefined;
  const mode = body.mode as string | undefined;
  const generateSession = Boolean(body.generateSession);

  const localRecommendation = getAdaptiveRecommendation(profile);
  const wantGenerated = generateSession || Boolean(module) || Boolean(mode);

  let recommendation = localRecommendation;
  let session: PracticeSession | undefined;

  if (hasGeminiKey()) {
    if (wantGenerated) {
      const targetModule = module ?? localRecommendation.module;
      const targetMode = mode ?? localRecommendation.mode;
      const [rec, generated] = await Promise.all([
        module ? Promise.resolve(localRecommendation) : aiRecommendation(profile),
        generateSessionWithAI(profile, targetModule, targetMode),
      ]);
      recommendation = rec ?? localRecommendation;
      session = generated ?? undefined;
    } else {
      recommendation = (await aiRecommendation(profile)) ?? localRecommendation;
    }
  }

  if (!session) {
    session = createPracticeSession(profile, module, mode, recommendation);
  }

  return NextResponse.json({ recommendation, session });
}
