import type {
  AdaptiveRecommendation,
  BandMap,
  BlueprintMeta,
  DiagnosticQuestion,
  EvaluationResult,
  ItemFeedback,
  MockExamResult,
  PracticeSession,
  ReadingBlueprint,
  ReportData,
  Skill,
  StudentLearningProfile,
  TutorReply,
} from "@/lib/ielts-brain";
import type { VocabWord } from "@/lib/vocabulary";
import { getDiagnosticQuestions, getListeningBlueprint, getReadingBlueprint, getSpeakingBlueprint, getWritingBlueprint, migrateProfile, submitLocalDiagnostic } from "@/lib/ielts-brain";
import { API_BASE, getToken, isBackendUp } from "@/lib/backend";

export interface VocabResponse {
  word: VocabWord | null;
  source: string;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error ?? "The AI Brain could not complete the request.");
  }
  return response.json() as Promise<T>;
}

async function getJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { error?: string }).error ?? "The AI Brain could not complete the request.");
  }
  return response.json() as Promise<T>;
}

async function backendFetch<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = (error as { detail?: string }).detail ?? `Backend request failed (${response.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export interface RecommendationResponse {
  recommendation: AdaptiveRecommendation;
  session: PracticeSession;
}

export interface EvaluateResponse {
  evaluation: EvaluationResult;
  updatedProfile: StudentLearningProfile;
}

export interface MockResponse {
  result: MockExamResult;
  updatedProfile: StudentLearningProfile;
}

export interface DiagnosticResponse {
  bands: BandMap;
  overallBand: number;
  summary: string;
  weakQuestionTypes: string[];
  profile: StudentLearningProfile;
}

/** Run the backend call; if the backend is unreachable, use the local brain. */
async function brainCall<T>(backend: () => Promise<T>, local: () => Promise<T>): Promise<T> {
  const up = await isBackendUp();
  if (up) {
    try {
      return await backend();
    } catch {
      return local();
    }
  }
  return local();
}

async function patchJSON<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = (error as { detail?: string }).detail ?? `Backend request failed (${response.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export const brainApi = {
  createSession(profile: StudentLearningProfile, module?: Skill, mode?: string, questionType?: string): Promise<RecommendationResponse> {
    return brainCall(
      () => backendFetch<RecommendationResponse>("/brain/recommendation", { profile, module, mode, questionType }),
      () => postJSON<RecommendationResponse>("/api/brain/recommendation", { profile, module, mode, questionType }),
    );
  },
  recommendation(profile: StudentLearningProfile): Promise<RecommendationResponse> {
    return brainCall(
      () => backendFetch<RecommendationResponse>("/brain/recommendation", { profile }),
      () => postJSON<RecommendationResponse>("/api/brain/recommendation", { profile }),
    );
  },
  evaluate(
    profile: StudentLearningProfile,
    session: PracticeSession,
    answers: Record<string, string>,
    timing?: { totalSeconds?: number | null },
  ): Promise<EvaluateResponse> {
    return brainCall(
      () =>
        backendFetch<EvaluateResponse & { itemFeedback?: ItemFeedback[] }>("/brain/evaluate", { profile, session, answers, timing }).then(
          (response) => {
            if (response.itemFeedback?.length) {
              response.evaluation = { ...response.evaluation, perItemFeedback: response.itemFeedback };
            }
            return response;
          },
        ),
      () =>
        postJSON<EvaluateResponse & { itemFeedback?: ItemFeedback[] }>("/api/brain/evaluate", { profile, session, answers, timing }).then(
          (response) => {
            if (response.itemFeedback?.length) {
              response.evaluation = { ...response.evaluation, perItemFeedback: response.itemFeedback };
            }
            return response;
          },
        ),
    );
  },
  mock(
    profile: StudentLearningProfile,
    answers: Record<string, string>,
    timing?: Partial<Record<string, { totalSeconds?: number }>>,
  ): Promise<MockResponse> {
    return brainCall(
      () => backendFetch<MockResponse>("/brain/mock", { profile, answers, timing }),
      () => postJSON<MockResponse>("/api/brain/mock", { profile, answers, timing }),
    );
  },
  tutor(profile: StudentLearningProfile, question: string): Promise<TutorReply> {
    return brainCall(
      () => backendFetch<TutorReply>("/brain/tutor", { profile, question }),
      () => postJSON<TutorReply>("/api/brain/tutor", { profile, question }),
    );
  },
  vocab(seenWords: string[]): Promise<VocabResponse> {
    return brainCall(
      () => backendFetch<VocabResponse>("/brain/vocab", { vocabSeen: seenWords }),
      () => postJSON<VocabResponse>("/api/brain/vocab", { vocabSeen: seenWords }),
    );
  },
  report(profile: StudentLearningProfile): Promise<ReportData> {
    return brainCall(
      () => backendFetch<ReportData>("/brain/report", { profile }),
      () => postJSON<ReportData>("/api/brain/report", { profile }),
    );
  },
  blueprints(module: Skill): Promise<BlueprintMeta[]> {
    return brainCall(
      () => backendFetch<BlueprintMeta[]>("/brain/blueprints", { module }),
      () => getJSON(`/api/brain/blueprints?module=${module}`),
    );
  },
  blueprint(module: Skill): Promise<ReadingBlueprint> {
    return brainCall(
      () => backendFetch<ReadingBlueprint>("/brain/blueprint", { module }),
      () =>
        getJSON<ReadingBlueprint>(`/api/brain/blueprint?module=${module}`).catch(() =>
          module === "listening"
            ? getListeningBlueprint()
            : module === "writing"
              ? getWritingBlueprint()
              : module === "speaking"
                ? getSpeakingBlueprint()
                : getReadingBlueprint(),
        ),
    );
  },
};

async function authedJSON<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = (error as { detail?: string }).detail ?? (error as { error?: string }).error ?? `Backend request failed (${response.status})`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return response.json() as Promise<T>;
}

export const onboardingApi = {
  async setTestType(profile: StudentLearningProfile, testType: "academic" | "general", targetBand?: number): Promise<StudentLearningProfile> {
    const up = await isBackendUp();
    if (up) {
      try {
        const updated = await patchJSON<StudentLearningProfile>("/brain/profile", {
          test_type: testType,
          target_band: targetBand,
        });
        return { ...migrateProfile(updated), diagnosticCompleted: profile.diagnosticCompleted };
      } catch {
        // fall through to local update
      }
    }
    return { ...profile, testType, ...(targetBand ? { targetBand } : {}) };
  },
  async startDiagnostic(): Promise<DiagnosticQuestion[]> {
    const up = await isBackendUp();
    if (up) {
      try {
        const response = await authedJSON<{ completed: boolean; questions?: { items?: DiagnosticQuestion[] } }>(
          `${API_BASE}/diagnostic/start`,
        );
        const items = response.questions?.items;
        if (!response.completed && Array.isArray(items) && items.length > 0) return items;
      } catch {
        // fall through to the offline diagnostic
      }
    }
    return getDiagnosticQuestions();
  },
  async submitDiagnostic(profile: StudentLearningProfile, answers: Record<string, string>): Promise<DiagnosticResponse> {
    const up = await isBackendUp();
    if (up) {
      try {
        const response = await authedJSON<{
          result: { results: Record<Skill, number>; overallBand: number };
          profile: StudentLearningProfile;
        }>(`${API_BASE}/diagnostic/submit`, { method: "POST", body: JSON.stringify({ answers }) });
        const results = response.result.results ?? {};
        const bands: BandMap = {
          reading: results.reading ?? 5.5,
          listening: results.listening ?? 5.5,
          writing: results.writing ?? 5.5,
          speaking: results.speaking ?? 5.5,
        };
        const weakest = (Object.entries(bands) as [Skill, number][]).sort((a, b) => a[1] - b[1])[0][0];
        const updated = migrateProfile(response.profile);
        return {
          bands,
          overallBand: response.result.overallBand ?? (bands.reading + bands.listening + bands.writing + bands.speaking) / 4,
          summary: `The AI examiner estimates your current overall band at ${(response.result.overallBand ?? 5.5).toFixed(1)} (${weakest} is your lowest section at ${bands[weakest].toFixed(1)}).`,
          weakQuestionTypes: updated.weakQuestionTypes ?? [],
          profile: { ...updated, diagnosticCompleted: true },
        };
      } catch {
        // fall through to the offline brain
      }
    }
    return submitLocalDiagnostic(profile, answers);
  },
};
