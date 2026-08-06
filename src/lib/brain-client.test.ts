import { describe, expect, it } from "bun:test";
import { createDefaultLearningProfile, type PracticeSession } from "./ielts-brain";
import { getAdaptiveBrainRecommendation, submitPracticeEvaluation } from "./brain-client";

describe("adaptive brain client", () => {
  it("returns a recommendation and a matching session", async () => {
    const profile = createDefaultLearningProfile();
    const recommendation = await getAdaptiveBrainRecommendation(profile, async () =>
      new Response(
        JSON.stringify({
          recommendation: {
            module: "writing",
            mode: "Task 2",
            priority: "High value",
            reason: "Writing is the main gap.",
            targetWeakness: "Task 2 Coherence",
            expectedBandLift: "+0.25 after 2 focused sessions",
            difficultyBand: 6.5,
          },
          session: {
            id: "session-test",
            module: "writing",
            mode: "Task 2",
            title: "Test Session",
            subtitle: "Test subtitle",
            durationMinutes: 20,
            questionCount: 2,
            questionTypes: ["Task 2"],
            difficultyBand: 6.5,
            examinerIntent: "Test intent",
            items: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    expect(recommendation.recommendation.module).toBe("writing");
    expect(recommendation.session.module).toBe("writing");
    expect(recommendation.session.mode).toBe("Task 2");
  });

  it("returns an evaluation payload for a completed practice session", async () => {
    const profile = createDefaultLearningProfile();
    const session: PracticeSession = {
      id: "session-test-2",
      module: "speaking",
      mode: "Part 2",
      title: "Talk about a place",
      subtitle: "Short cue-card practice",
      durationMinutes: 4,
      questionCount: 1,
      questionTypes: ["Part 2"],
      difficultyBand: 6.5,
      examinerIntent: "Test intent",
      items: [{
        id: "s1",
        type: "speaking-cue",
        title: "Cue card",
        prompt: "Describe a place.",
        expectedFocus: "Fluency",
        descriptorFocus: "Speaking",
      }],
    };

    const evaluation = await submitPracticeEvaluation(profile, session, { s1: "I like the library." }, async () =>
      new Response(
        JSON.stringify({
          evaluation: {
            sessionId: session.id,
            module: "speaking",
            predictedBand: 6.5,
            accuracy: 72,
            examinerSummary: "Good starter response.",
            strengths: ["Fluency"],
            weaknesses: ["Part 3 extension"],
            nextPlan: ["Practice more."],
            bandDescriptorNotes: ["Keep extending answers."],
          },
          updatedProfile: profile,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    expect(evaluation.evaluation.predictedBand).toBe(6.5);
    expect(evaluation.evaluation.module).toBe("speaking");
  });
});
