import { NextResponse } from "next/server";
import {
  createDefaultLearningProfile,
  tutorReply,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const profile = {
    ...createDefaultLearningProfile(),
    ...(body.profile && typeof body.profile === "object" ? body.profile : {}),
  } as StudentLearningProfile;
  const question = typeof body.question === "string" ? body.question : "";

  if (!question.trim()) {
    return NextResponse.json({ error: "A question is required." }, { status: 400 });
  }

  return NextResponse.json({ ...tutorReply(profile, question), source: "offline" });
}
