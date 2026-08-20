"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brain } from "lucide-react";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/use-toast";
import { Sidebar, MobileNav, TopBar } from "@/components/app/shell";
import { Dashboard } from "@/components/app/dashboard";
import { PracticeModule } from "@/components/app/practice";
import { MockExam } from "@/components/app/mock";
import { Reports } from "@/components/app/reports";
import { TutorChat } from "@/components/app/tutor";
import { LearningProfile } from "@/components/app/profile";
import { SettingsPanel } from "@/components/app/settings";
import { VocabularyTrainer } from "@/components/vocabulary-trainer";
import { Onboarding } from "@/components/app/onboarding";

import { brainApi } from "@/lib/api";
import { cacheGet, cacheSet } from "@/lib/click-cache";
import { authApi, clearAuth, getToken } from "@/lib/backend";
import { computeTimingMetrics } from "@/lib/timing";
import { advanceQuestionWindow, rotateFreshItems } from "@/lib/fresh-items";
import { modeToBackend, moduleConfig } from "@/lib/app-config";
import {
  getSampleAnswers,
  isSkill,
  lastSessionKey,
  skillOrder,
  storageKey,
  type MockSection,
  type ViewId,
} from "@/lib/app-config";
import {
  createDefaultLearningProfile,
  createNewStudentProfile,
  formatSkill,
  getAdaptiveRecommendation,
  getBandGap,
  isQuestionTypeMode,
  listeningQuestionTypes,
  migrateProfile,
  readingQuestionTypes,
  speakingQuestionTypes,
  writingQuestionTypes,
  type AdaptiveRecommendation,
  type EvaluationResult,
  type MockExamResult,
  type PracticeSession,
  type Skill,
  type StudentLearningProfile,
} from "@/lib/ielts-brain";

const MOCK_FULL_MODES: Record<Skill, string> = {
  listening: "Full Listening Section",
  reading: "Full Reading Section",
  writing: "Full Writing Section",
  speaking: "Full Speaking Section",
};

const mockWritingSample =
  "The chart compares the figures over the period shown. Overall, there was clear growth, most of it concentrated in the later years, and the differences between the categories widened considerably.";

export default function AppPage() {
  const [profile, setProfile] = useState<StudentLearningProfile>(() => createDefaultLearningProfile());
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingProfile, setOnboardingProfile] = useState<StudentLearningProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [menuOpen, setMenuOpen] = useState(true);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [mockSection, setMockSection] = useState<MockSection>("intro");
  const [mockAnswers, setMockAnswers] = useState<Record<string, string>>({});
  const [mockResult, setMockResult] = useState<MockExamResult | null>(null);
  const [mockSections, setMockSections] = useState<Partial<Record<Skill, PracticeSession | null>>>({});
  const [mockGenerating, setMockGenerating] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastSession, setLastSession] = useState<PracticeSession | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const mockTimingRef = useRef<Partial<Record<Skill, number>>>({});
  const mockPaperRef = useRef(1);
  const preLaunchViewRef = useRef<ViewId>("dashboard");
  const viewRef = useRef<ViewId>("dashboard");
  viewRef.current = activeView;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("ai-ielts-examiner-settings");
      const parsed = raw ? (JSON.parse(raw) as { theme?: string }) : null;
      if (parsed?.theme === "warm" || parsed?.theme === "dark") {
        document.documentElement.dataset.theme = parsed.theme;
      }
    } catch {
      document.documentElement.dataset.theme = "light";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = window.localStorage.getItem(storageKey);
      const raw = stored ? (JSON.parse(stored) as Partial<StudentLearningProfile>) : null;
      const valid = raw !== null && typeof raw === "object" && !Array.isArray(raw);
      const initial = valid ? (raw as StudentLearningProfile) : createDefaultLearningProfile();
      const migrated = migrateProfile(initial);
      if (!cancelled) {
        setProfile(migrated);
        const savedSession = window.localStorage.getItem(lastSessionKey);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession) as PracticeSession;
            if (parsed && typeof parsed === "object" && isSkill(parsed.module) && Array.isArray(parsed.items)) {
              setLastSession(parsed);
            } else {
              setLastSession(null);
            }
          } catch {
            setLastSession(null);
          }
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      if (!cancelled) setHasLoaded(true);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    let cancelled = false;

    async function decideOnboarding() {
      const token = getToken();
      if (token) {
        try {
          const auth = await authApi.me();
          if (cancelled) return;
          if (auth.requires_diagnostic) {
            setOnboardingProfile(migrateProfile(auth.profile));
            setNeedsOnboarding(true);
          } else {
            setProfile(migrateProfile(auth.profile));
            setNeedsOnboarding(false);
          }
          setCheckingOnboarding(false);
          return;
        } catch {
          // Token invalid or backend down — fall back to local mode below.
        }
      }
      try {
        const stored = window.localStorage.getItem(storageKey);
        const raw = stored ? (JSON.parse(stored) as Partial<StudentLearningProfile>) : null;
        const hasSavedProfile = raw !== null && typeof raw === "object" && !Array.isArray(raw);
        if (cancelled) return;
        if (hasSavedProfile) {
          setNeedsOnboarding(false);
        } else {
          setOnboardingProfile(createNewStudentProfile("", "academic", 7.0));
          setNeedsOnboarding(true);
        }
      } catch {
        if (!cancelled) setNeedsOnboarding(true);
      } finally {
        if (!cancelled) setCheckingOnboarding(false);
      }
    }

    decideOnboarding();
    return () => {
      cancelled = true;
    };
  }, [hasLoaded]);

  const completeOnboarding = useCallback((updated: StudentLearningProfile) => {
    setProfile(updated);
    setNeedsOnboarding(false);
    setActiveView("dashboard");
    toast({ title: "Welcome to your dashboard", description: "Your learning profile is ready. The AI Brain will now adapt every session to it." });
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [hasLoaded, profile]);

  useEffect(() => {
    if (!hasLoaded) return;
    if (lastSession) {
      window.localStorage.setItem(lastSessionKey, JSON.stringify(lastSession));
    } else {
      window.localStorage.removeItem(lastSessionKey);
    }
  }, [hasLoaded, lastSession]);

  const recommendation = useMemo<AdaptiveRecommendation>(() => getAdaptiveRecommendation(profile), [profile]);

  const [liveRecommendation, setLiveRecommendation] = useState<AdaptiveRecommendation | null>(null);

  useEffect(() => {
    if (needsOnboarding) return;
    let cancelled = false;
    brainApi
      .recommendation(profile)
      .then((response) => {
        if (!cancelled) setLiveRecommendation(response.recommendation);
      })
      .catch(() => {
        if (!cancelled) setLiveRecommendation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profile, needsOnboarding]);

  const activeRecommendation = liveRecommendation ?? recommendation;
  const bandGap = useMemo(() => getBandGap(profile), [profile]);

  const prefetchingRef = useRef(false);
  useEffect(() => {
    if (needsOnboarding || prefetchingRef.current) return;
    const module = activeRecommendation?.module;
    if (!module) return;
    prefetchingRef.current = true;
    const lastOtherModule = lastSession && lastSession.module !== module ? lastSession.module : null;
    const targetModule = (lastOtherModule ?? module) as Skill;
    const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    (async () => {
      const modes = new Set<string>();
      const typeLists: Record<Skill, string[]> = {
        reading: [...readingQuestionTypes] as string[],
        listening: [...listeningQuestionTypes] as string[],
        writing: [...writingQuestionTypes] as string[],
        speaking: [...speakingQuestionTypes] as string[],
      };
      ([module, targetModule] as Skill[]).forEach((m) => {
        (moduleConfig[m]?.modes ?? []).forEach((label) => {
          const mapped = modeToBackend(m, label);
          if (mapped && !["Blueprint", "Practice by Question Type"].includes(label)) modes.add(mapped);
        });
      });
      if (module !== "writing") modes.add("Question by Question");
      const prefetchSession = async (m: Skill, mode: string) => {
        const key = `session:${m}:${mode}`;
        if (cacheGet(key)) return;
        try {
          const response = await brainApi.createSession(profile, m, mode);
          cacheSet(key, response.session);
        } catch {
          // Background prefetch failures are silent.
        }
      };
      const prefetchBank = async (m: Skill, type: string) => {
        const key = `bank:${m}:${type}`;
        if (cacheGet(key)) return;
        try {
          const response = await brainApi.bank(profile, m, type);
          cacheSet(key, response.session);
        } catch {
          // Background prefetch failures are silent.
        }
      };
      const prefetchMeta = async (m: Skill) => {
        const metaKey = `blueprints:${m}`;
        if (!cacheGet(metaKey)) {
          try {
            const meta = await brainApi.blueprints(m);
            cacheSet(metaKey, meta);
          } catch {
            // Background prefetch failures are silent.
          }
        }
        const detailKey = `blueprint:${m}`;
        if (!cacheGet(detailKey)) {
          try {
            const detail = await brainApi.blueprint(m);
            cacheSet(detailKey, detail);
          } catch {
            // Background prefetch failures are silent.
          }
        }
      };
      const rec = activeRecommendation;
      const recMode = rec && modes.has(rec.mode) ? rec.mode : [...modes][0];
      const recType =
        rec && "focusQuestionTypes" in rec && Array.isArray((rec as Record<string, unknown>).focusQuestionTypes) && (rec as { focusQuestionTypes: string[] }).focusQuestionTypes.length
          ? (rec as { focusQuestionTypes: string[] }).focusQuestionTypes[0]
          : typeLists[targetModule][0];
      const recBankKey = `bank:${targetModule}:${recType}`;
      const priority = [
        Promise.allSettled([
          prefetchMeta(targetModule),
          recMode ? prefetchSession(targetModule, recMode) : Promise.resolve(),
          cacheGet(recBankKey) ? Promise.resolve() : prefetchBank(targetModule, recType),
        ]),
      ];
      await Promise.allSettled(priority);
      await delay(6000);
      for (const mode of modes) {
        if (mode === recMode) continue;
        await prefetchSession(targetModule, mode);
        await delay(1500);
      }
      // Banks are large (hundreds of items) and would blow the localStorage
      // quota if every type of every module were prefetched. The recommended
      // type is already cached above; the rest load+cache on first click.
    })().finally(() => {
      prefetchingRef.current = false;
    });
  }, [needsOnboarding, profile, activeRecommendation, lastSession?.module]);

  const launchPractice = useCallback(
    async (module?: Skill, mode?: string) => {
      const cacheKey = `session:${module ?? "reading"}:${mode ?? "recommended"}`;
      const cached = cacheGet<PracticeSession>(cacheKey);
      const applySession = (session: PracticeSession) => {
        setSession({
          ...session,
          items: rotateFreshItems(session.items, session.module, session.mode),
        });
        setAnswers({});
        setEvaluation(null);
        setLastSession(session);
        setActiveView(session.module);
      };
      if (cached) {
        preLaunchViewRef.current = viewRef.current;
        applySession(cached);
      }
      setPracticeLoading(!cached);
      try {
        const isType = isQuestionTypeMode(module ?? "reading", mode);
        const response = await brainApi.createSession(profile, module, isType ? undefined : mode, isType ? mode : undefined);
        cacheSet(cacheKey, response.session);
        preLaunchViewRef.current = viewRef.current;
        applySession(response.session);
      } catch (error) {
        if (!cached) {
          toast({ title: "AI Brain unavailable", description: error instanceof Error ? error.message : "Could not generate a session." });
        }
      } finally {
        setPracticeLoading(false);
      }
    },
    [profile],
  );

  const continuePractice = useCallback(() => {
    if (lastSession) {
      preLaunchViewRef.current = viewRef.current;
      setSession(lastSession);
      setAnswers({});
      setEvaluation(null);
      setActiveView(lastSession.module);
    } else {
      launchPractice();
    }
  }, [lastSession, launchPractice]);

  const quickPractice = useCallback(
    async (module?: Skill) => {
      const target = module ?? activeRecommendation.module;
      await launchPractice(target, "Quick Practice");
    },
    [launchPractice, activeRecommendation.module],
  );

  const submitPractice = useCallback(async (elapsedSeconds?: number) => {
    if (!session) return;
    setPracticeLoading(true);
    try {
      const timing = { totalSeconds: elapsedSeconds && elapsedSeconds > 0 ? elapsedSeconds : undefined };
      const response = await brainApi.evaluate(profile, session, answers, timing);
      advanceQuestionWindow(
        session.module,
        session.mode,
        Object.values(answers).filter((value) => (value ?? "").trim().length > 0).length,
      );
      setEvaluation(response.evaluation);
      setProfile(response.updatedProfile);
      toast({
        title: "AI examiner report ready",
        description: `${formatSkill(session.module)} evaluated at Band ${response.evaluation.predictedBand.toFixed(1)}.`,
      });
    } catch (error) {
      toast({ title: "Evaluation failed", description: error instanceof Error ? error.message : "The AI Brain could not evaluate." });
    } finally {
      setPracticeLoading(false);
    }
  }, [profile, session, answers]);

  const updateAnswer = useCallback((id: string, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createDefaultLearningProfile();
    setProfile(fresh);
    setSession(null);
    setAnswers({});
    setEvaluation(null);
    setMockSection("intro");
    setMockAnswers({});
    setMockResult(null);
    setLastSession(null);
    mockTimingRef.current = {};
    toast({ title: "Demo memory reset", description: "Default student profile restored." });
  }, []);

  const logout = useCallback(() => {
    if (typeof window === "undefined") return;
    clearAuth();
    window.localStorage.removeItem("ielts_user");
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(lastSessionKey);
    window.location.href = "/login";
  }, []);

  const toggleVocabMastery = useCallback((id: string) => {
    setProfile((current) => {
      const mastered = current.vocabMastered ?? [];
      const next = mastered.includes(id) ? mastered.filter((wordId) => wordId !== id) : [...mastered, id];
      return { ...current, vocabMastered: next };
    });
  }, []);

  const recordVocabQuiz = useCallback((score: number) => {
    setProfile((current) => ({
      ...current,
      vocabQuizzesTaken: (current.vocabQuizzesTaken ?? 0) + 1,
      vocabQuizBest: Math.max(current.vocabQuizBest ?? 0, score),
    }));
  }, []);

  const startMockExam = useCallback(
    async (paperNumber?: number) => {
      setMockGenerating(true);
      setMockSections({});
      setMockAnswers({});
      setMockResult(null);
      mockTimingRef.current = {};
      setActiveView("mock");
      try {
        const paperNo = paperNumber ?? mockPaperRef.current;
        const paper = await brainApi.mockPaper(profile, paperNo);
        mockPaperRef.current = paperNo;
        const built: Partial<Record<Skill, PracticeSession | null>> = {};
        skillOrder.forEach((skill) => {
          const session = paper.paper.sections[skill];
          built[skill] = session
            ? {
                ...session,
                items: rotateFreshItems(session.items, skill, MOCK_FULL_MODES[skill]),
              }
            : null;
        });
        setMockSections(built);
      } catch (error) {
        setMockSections({});
        toast({
          title: "Mock paper unavailable",
          description: error instanceof Error ? error.message : "The AI Brain could not print this paper. Is the backend running?",
        });
      } finally {
        setMockGenerating(false);
        setMockSection("listening");
      }
    },
    [profile],
  );

  const fillMockDemo = useCallback(() => {
    const filled: Record<string, string> = {};
    skillOrder.forEach((skill) => {
      const session = mockSections[skill];
      if (!session) return;
      Object.assign(filled, getSampleAnswers(session, skill));
      if (skill === "writing") {
        session.items.forEach((item, index) => {
          if (!filled[item.id]) filled[item.id] = `${mockWritingSample} ${index === 0 ? "" : "This argument extends the reasoning with a clearer example."}`;
        });
      }
      if (skill === "speaking") {
        session.items.forEach((item) => {
          if (!filled[item.id]) filled[item.id] = "I concentrate best in a small library near my home. It is quiet but not completely silent, so I feel calm without feeling isolated, and everyone around me is working, which keeps me disciplined.";
        });
      }
    });
    setMockAnswers((current) => ({ ...filled, ...current }));
  }, [mockSections]);

  const finishMockExam = useCallback(async () => {
    setPracticeLoading(true);
    try {
      const evals: Partial<Record<Skill, EvaluationResult>> = {};
      let finalProfile: StudentLearningProfile = profile;
      for (const skill of skillOrder) {
        const session = mockSections[skill];
        if (!session) continue;
        const sectionAnswers = Object.fromEntries(
          Object.entries(mockAnswers).filter(([id]) => session.items.some((item) => item.id === id)),
        );
        if (Object.keys(sectionAnswers).length === 0) continue;
        try {
          const timing = { totalSeconds: mockTimingRef.current[skill] || undefined };
          const response = await brainApi.evaluate(finalProfile, session, sectionAnswers, timing);
          evals[skill] = response.evaluation;
          finalProfile = response.updatedProfile;
          advanceQuestionWindow(skill, MOCK_FULL_MODES[skill], Object.keys(sectionAnswers).length);
        } catch {
          // skip a section that could not be evaluated
        }
      }
      setProfile(finalProfile);

      const bands: Record<Skill, number> = {
        listening: evals.listening?.predictedBand ?? profile.bands.listening,
        reading: evals.reading?.predictedBand ?? profile.bands.reading,
        writing: evals.writing?.predictedBand ?? profile.bands.writing,
        speaking: evals.speaking?.predictedBand ?? profile.bands.speaking,
      };
      const overallBand = Math.round(((bands.listening + bands.reading + bands.writing + bands.speaking) / 4) * 2) / 2;
      const strengths = skillOrder.flatMap((skill) => evals[skill]?.strengths ?? []);
      const weaknesses = skillOrder.flatMap((skill) => evals[skill]?.weaknesses ?? []);
      const improvementPlan = skillOrder.flatMap((skill) => evals[skill]?.nextPlan ?? []);
      const timingDetail: MockExamResult["timing"] = {};
      let totalAccuracy = 0;
      let accuracyCount = 0;
      skillOrder.forEach((skill) => {
        const session = mockSections[skill];
        if (!session) return;
        const live = computeTimingMetrics(skill, session.items.length, mockAnswers, session.durationMinutes, mockTimingRef.current[skill] ?? 0);
        timingDetail[skill] = live.timing;
        if (evals[skill]) {
          totalAccuracy += evals[skill]!.accuracy ?? 0;
          accuracyCount += 1;
        }
      });

      const result: MockExamResult = {
        id: `mock-${Date.now()}`,
        listeningBand: bands.listening,
        readingBand: bands.reading,
        writingBand: bands.writing,
        speakingBand: bands.speaking,
        overallBand,
        sectionFeedback: Object.fromEntries(
          skillOrder.map((skill) => [skill, evals[skill]?.examinerSummary ?? "This section could not be scored."]),
        ) as MockExamResult["sectionFeedback"],
        improvementPlan: improvementPlan.length ? Array.from(new Set(improvementPlan)).slice(0, 5) : ["Keep a fixed weekly rhythm: one full mock, then targeted practice on your lowest section."],
        strengths: strengths.length ? Array.from(new Set(strengths)).slice(0, 4) : ["You attempted every section of the full mock."],
        weaknesses: weaknesses.length ? Array.from(new Set(weaknesses)).slice(0, 4) : ["Review the section blueprint for the flagged question types."],
        accuracy: accuracyCount ? Math.round(totalAccuracy / accuracyCount) : undefined,
        speed: evals.listening?.speed ?? evals.reading?.speed ?? evals.writing?.speed ?? evals.speaking?.speed,
        timeManagement: evals.listening?.timeManagement ?? evals.reading?.timeManagement ?? evals.writing?.timeManagement ?? evals.speaking?.timeManagement,
        timing: timingDetail,
      };
      setMockResult(result);
      setMockSection("result");
      toast({
        title: "Full mock report ready",
        description: `Overall Band ${result.overallBand.toFixed(1)} across all four sections.`,
      });
    } catch (error) {
      toast({ title: "Mock evaluation failed", description: error instanceof Error ? error.message : "The AI Brain could not score the mock." });
    } finally {
      setPracticeLoading(false);
    }
  }, [profile, mockAnswers, mockSections]);

  const moveMockForward = useCallback(
    (elapsedSeconds?: number) => {
      if (mockSection === "intro" || mockSection === "result") {
        mockTimingRef.current = {};
        startMockExam();
        return;
      }
      if (elapsedSeconds && elapsedSeconds > 0) {
        mockTimingRef.current[mockSection as Skill] = elapsedSeconds;
      }
      const index = skillOrder.indexOf(mockSection);
      if (index < skillOrder.length - 1) {
        setMockSection(skillOrder[index + 1]);
        return;
      }
      finishMockExam();
    },
    [mockSection, startMockExam, finishMockExam],
  );

  if (checkingOnboarding) {
    return (
      <main className="exam-grid grid min-h-screen place-items-center bg-[#f5eddc] text-[#17342f]">
        <div className="animate-soft-rise flex flex-col items-center gap-4 text-center">
          <div className="grid h-14 w-14 animate-pulse place-items-center rounded-2xl bg-[#17342f] text-[#e3b65f]">
            <Brain className="h-7 w-7" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8b6f39]">Loading your AI memory…</p>
        </div>
      </main>
    );
  }

  if (needsOnboarding && onboardingProfile) {
    return <Onboarding profile={onboardingProfile} onComplete={completeOnboarding} />;
  }

  const content = (() => {
    if (activeView === "dashboard") {
      return (
        <Dashboard
          profile={profile}
          recommendation={activeRecommendation}
          bandGap={bandGap}
          lastSession={lastSession}
          onLaunchPractice={(module, mode) => launchPractice(module, mode)}
          onContinue={continuePractice}
          onQuick={(module) => quickPractice(module)}
          onStartMock={startMockExam}
          onGoTo={setActiveView}
        />
      );
    }

    if (isSkill(activeView)) {
      return (
        <PracticeModule
          module={activeView}
          profile={profile}
          session={session}
          answers={answers}
          evaluation={evaluation}
          loading={practiceLoading}
          fullscreen={session !== null && session.module === activeView}
          onExit={() => {
            setSession(null);
            setAnswers({});
            setEvaluation(null);
            setActiveView(preLaunchViewRef.current);
          }}
          onAnswer={updateAnswer}
          onLaunch={(module, mode) => launchPractice(module, mode)}
          onSubmit={(elapsedSeconds) => submitPractice(elapsedSeconds)}
          onUseSample={() => session && setAnswers(getSampleAnswers(session, session.module))}
        />
      );
    }

    if (activeView === "mock") {
      return (
        <MockExam
          section={mockSection}
          answers={mockAnswers}
          result={mockResult}
          loading={mockGenerating}
          sections={mockSections}
          papersCount={10}
          onStart={startMockExam}
          onAnswer={(id, value) => setMockAnswers((current) => ({ ...current, [id]: value }))}
          onFillDemo={fillMockDemo}
          onNext={(elapsedSeconds) => moveMockForward(elapsedSeconds)}
        />
      );
    }

    if (activeView === "reports") {
      return <Reports profile={profile} />;
    }

    if (activeView === "tutor") {
      return <TutorChat profile={profile} />;
    }

    if (activeView === "vocabulary") {
      return (
        <VocabularyTrainer
          profile={profile}
          onToggleMastery={toggleVocabMastery}
          onRecordQuiz={recordVocabQuiz}
        />
      );
    }

    if (activeView === "profile") {
      return <LearningProfile profile={profile} />;
    }

    return <SettingsPanel profile={profile} setProfile={setProfile} onReset={resetDemo} />;
  })();

  const inFullPractice = isSkill(activeView) && session !== null && session.module === activeView;

  return (
    <main className="exam-grid min-h-screen overflow-hidden bg-[#f5eddc] text-[#17342f]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-slow-drift pointer-events-none max-sm:hidden absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#d69b5b]/30 blur-3xl" />
        <div className="animate-slow-drift pointer-events-none max-sm:hidden absolute right-[-8rem] top-40 h-[30rem] w-[30rem] rounded-full bg-[#6da894]/25 blur-3xl [animation-delay:2s]" />
        <div className="pointer-events-none max-sm:hidden absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-[#e8c872]/25 blur-3xl" />
      </div>

      <div className={cn("relative mx-auto flex w-full flex-col gap-5 px-4 py-4", inFullPractice ? "max-w-[1200px]" : "max-w-[1520px] lg:px-6")}>
        {inFullPractice ? null : <MobileNav activeView={activeView} setActiveView={setActiveView} onLogout={logout} />}

        {inFullPractice ? null : (
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            profile={profile}
            onReset={resetDemo}
            onLogout={logout}
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
          />
        )}

        <section className="min-w-0 flex-1 space-y-5">
          {inFullPractice ? null : (
            <TopBar
              profile={profile}
              recommendation={activeRecommendation}
              onAdaptive={() => launchPractice()}
              onMock={startMockExam}
              onMenu={() => setMenuOpen(true)}
            />
          )}
          <div className="animate-soft-rise">{content}</div>
        </section>
      </div>
      <Toaster />
    </main>
  );
}
