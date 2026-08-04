import type { PracticeSession, Skill, StudentLearningProfile } from "./ielts-brain";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface BrainRecommendationResponse {
  recommendation: {
    module: Skill;
    mode: string;
    priority: string;
    reason: string;
    targetWeakness: string;
    expectedBandLift: string;
    difficultyBand: number;
  };
  session: PracticeSession;
}

export interface BrainEvaluationResponse {
  evaluation: {
    sessionId: string;
    module: Skill;
    predictedBand: number;
    accuracy: number;
    examinerSummary: string;
    strengths: string[];
    weaknesses: string[];
    nextPlan: string[];
    bandDescriptorNotes: string[];
  };
  updatedProfile: StudentLearningProfile;
}

export interface BrainRecommendationOptions {
  module?: Skill;
  mode?: string;
  generateSession?: boolean;
}

export async function getAdaptiveBrainRecommendation(
  profile: StudentLearningProfile,
  fetchImpl?: FetchLike,
): Promise<BrainRecommendationResponse>;

export async function getAdaptiveBrainRecommendation(
  profile: StudentLearningProfile,
  options: BrainRecommendationOptions,
  fetchImpl?: FetchLike,
): Promise<BrainRecommendationResponse>;

export async function getAdaptiveBrainRecommendation(
  profile: StudentLearningProfile,
  optionsOrFetch: BrainRecommendationOptions | FetchLike = fetch,
  maybeFetch: FetchLike = fetch,
): Promise<BrainRecommendationResponse> {
  const options: BrainRecommendationOptions =
    typeof optionsOrFetch === "function" ? {} : optionsOrFetch;
  const fetchImpl = typeof optionsOrFetch === "function" ? optionsOrFetch : maybeFetch;

  const response = await fetchImpl("/api/brain/recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, ...options }),
  });

  if (!response.ok) {
    throw new Error(`Recommendation request failed with ${response.status}`);
  }

  return response.json() as Promise<BrainRecommendationResponse>;
}

export async function submitPracticeEvaluation(
  profile: StudentLearningProfile,
  session: PracticeSession,
  answers: Record<string, string>,
  fetchImpl: FetchLike = fetch,
): Promise<BrainEvaluationResponse> {
  const response = await fetchImpl("/api/brain/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, session, answers }),
  });

  if (!response.ok) {
    throw new Error(`Evaluation request failed with ${response.status}`);
  }

  return response.json() as Promise<BrainEvaluationResponse>;
}

export async function submitMockEvaluation(
  profile: StudentLearningProfile,
  answers: Record<string, string>,
  fetchImpl: FetchLike = fetch,
): Promise<{ result: unknown; updatedProfile: StudentLearningProfile }> {
  const response = await fetchImpl("/api/brain/mock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, answers }),
  });

  if (!response.ok) {
    throw new Error(`Mock evaluation request failed with ${response.status}`);
  }

  return response.json();
}

export async function submitDiagnostic(
  name: string,
  answers: Record<string, string>,
  fetchImpl: FetchLike = fetch,
): Promise<{ profile: StudentLearningProfile; source: string }> {
  const response = await fetchImpl("/api/brain/diagnostic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, answers }),
  });

  if (!response.ok) {
    throw new Error(`Diagnostic request failed with ${response.status}`);
  }

  return response.json();
}
