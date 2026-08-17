import type {
  AdaptiveRecommendation,
  BandMap,
  BlueprintMeta,
  DiagnosticQuestion,
  EvaluationResult,
  ItemFeedback,
  MockExamResult,
  PracticalMockPaper,
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
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }
  return response.json() as Promise<T>;
}

async function backendGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE}${path}${query ? `?${query}` : ""}`, { method: "GET", headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = (error as { detail?: string }).detail ?? `Backend request failed (${response.status})`;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    (err as Error & { status?: number }).status = response.status;
    throw err;
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

/** Backend-first with local fallback — but ONLY when the backend is actually
 * unreachable. Auth errors (401), missing routes (404/405) and server errors
 * are business errors and must surface instead of silently degrading. */
async function brainCall<T>(backend: () => Promise<T>, local: () => Promise<T>): Promise<T> {
  const up = await isBackendUp();
  if (!up) return local();
  try {
    return await backend();
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    const isNetworkError = !status || status >= 500;
    // An unauthenticated visitor (401 with no stored token) can't be served
    // by the backend at all — fall back to the offline brain instead of
    // surfacing a dead auth error. A 401 WITH a token is a real auth problem
    // and must surface.
    if (status === 401 && !getToken()) return local();
    if (!isNetworkError) throw error;
    return local();
  }
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
  check(session: Pick<PracticeSession, "id" | "module" | "mode">, answers: Record<string, string>): Promise<ItemFeedback[]> {
    return brainCall(
      () => backendFetch<{ itemFeedback: ItemFeedback[] }>("/brain/check", { session, answers }).then((response) => response.itemFeedback),
      () => postJSON<{ itemFeedback: ItemFeedback[] }>("/api/brain/check", { session, answers }).then((response) => response.itemFeedback),
    );
  },
  mock(
    profile: StudentLearningProfile,
    answers: Record<string, string>,
    sessions?: Partial<Record<Skill, PracticeSession>>,
    timing?: Partial<Record<string, { totalSeconds?: number }>>,
  ): Promise<MockResponse> {
    return brainCall(
      () => backendFetch<MockResponse>("/brain/mock", { profile, answers, sessions, timing }),
      () => postJSON<MockResponse>("/api/brain/mock", { profile, answers, sessions, timing }),
    );
  },
  mockPaper(profile: StudentLearningProfile, set: number): Promise<{ paper: PracticalMockPaper; count: number }> {
    return brainCall(
      () => backendFetch<{ paper: PracticalMockPaper; count: number }>("/brain/mockexam", { profile, session: { set } }),
      () => Promise.reject(new Error("Mock papers require the backend")),
    );
  },
  tutor(profile: StudentLearningProfile, question: string, history?: { role: string; text: string }[]): Promise<TutorReply> {
    return brainCall(
      () => backendFetch<TutorReply>("/brain/tutor", { profile, question, history }),
      () => postJSON<TutorReply>("/api/brain/tutor", { profile, question, history }),
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
      () => backendGet<BlueprintMeta[]>("/brain/blueprints", { module }),
      () => getJSON(`/api/brain/blueprints?module=${module}`),
    );
  },
  blueprint(module: Skill): Promise<ReadingBlueprint> {
    return brainCall(
      () => backendGet<ReadingBlueprint>("/brain/blueprint", { module }),
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
  bank(profile: StudentLearningProfile, module: Skill, mode: string, questionCount?: number): Promise<{ session: PracticeSession; total: number; currentBand?: number; targetBand?: number }> {
    return brainCall(
      () =>
        backendFetch<{ session: PracticeSession; total: number; currentBand?: number; targetBand?: number }>("/brain/bank", {
          profile,
          session: { module, mode, ...(questionCount ? { questionCount } : {}) },
        }),
      () => {
        const { getPracticeBlueprints } = require("@/lib/ielts-brain") as {
          getPracticeBlueprints: (module: Skill) => PracticeSession[];
        };
        const blueprints = getPracticeBlueprints(module);
        const matching = blueprints.filter((session) => (session.questionTypes ?? []).includes(mode));
        const pool = matching.length > 0 ? matching.flatMap((session) => session.items) : [];
        if (pool.length === 0) return Promise.reject(new Error("No local bank for this type"));
        const items = (questionCount && questionCount > 0 ? pool.slice(0, questionCount) : pool).map((item) => {
          const { correctAnswer: _correctAnswer, explanation: _explanation, logic: _logic, tip: _tip, suggestions: _suggestions, bandAdvice: _bandAdvice, ...safe } = item;
          return safe;
        });
        const session: PracticeSession = {
          id: `bank-local-${module}-${mode}`,
          module,
          mode,
          title: `${mode} bank`,
          subtitle: `${pool.length} ready questions for ${mode} — answer as many as you want.`,
          durationMinutes:
            module === "listening"
              ? 10
              : module === "writing"
                ? (mode.startsWith("Task 1") || mode.includes("Task 1") ? 20 : 40)
                : module === "speaking"
                  ? 5
                  : 12,
          questionCount: items.length,
          questionTypes: [mode],
          difficultyBand: 6.0,
          examinerIntent: `Work through the full ${mode} bank with instant per-question feedback.`,
          items,
          source: "offline",
        };
        return Promise.resolve({ session, total: items.length });
      },
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
