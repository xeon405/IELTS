import { NextResponse } from "next/server";import {  createDefaultLearningProfile,  evaluateMockExam,  type PracticeSession,  type StudentLearningProfile,} from "@/lib/ielts-brain";export async function POST(request: Request) {  const body = await request.json().catch(() => ({}));  const profile = {    ...createDefaultLearningProfile(),    ...(body.profile && typeof body.profile === "object" ? body.profile : {}),  } as StudentLearningProfile;  const answers = (body.answers ?? {}) as Record<string, string>;  const timing = (body.timing ?? {}) as Partial<Record<"listening" | "reading" | "writing" | "speaking", { totalSeconds?: number }>>;  const sections = (body.sessions ?? {}) as Partial<Record<"listening" | "reading" | "writing" | "speaking", PracticeSession>>;  return NextResponse.json(
    evaluateMockExam(
      profile,
      answers,
      Object.fromEntries(
        (Object.entries(timing) as [string, { totalSeconds?: number }][]).map(([skill, value]) => [skill, value?.totalSeconds]),
      ),
      sections,
    ),
  );}