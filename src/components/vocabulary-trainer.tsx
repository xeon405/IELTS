"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { brainApi } from "@/lib/api";
import {
  buildVocabQuiz,
  shuffle,
  vocabDeck,
  vocabTopics,
  type VocabQuizQuestion,
  type VocabWord,
} from "@/lib/vocabulary";
import type { StudentLearningProfile } from "@/lib/ielts-brain";

type TrainerTab = "flashcards" | "quiz";

export function VocabularyTrainer({
  profile,
  onToggleMastery,
  onRecordQuiz,
}: {
  profile: StudentLearningProfile;
  onToggleMastery: (id: string) => void;
  onRecordQuiz: (score: number) => void;
}) {
  const [tab, setTab] = useState<TrainerTab>("flashcards");
  const mastered = profile.vocabMastered ?? [];
  const masteredSet = useMemo(() => new Set(mastered), [mastered]);

  return (
    <div className="space-y-5">
      <section className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-6 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8b6f39]">Vocabulary trainer</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold text-[#17342f] md:text-5xl">Academic word bank</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#66746e]">
              An endless AI word stream: the Brain mints a fresh word every time you press Next, so you never repeat
              the same vocabulary twice. Mastered words feed the learning memory and unlock achievements.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[2rem] bg-[#17342f] p-3 text-white">
            <VocabStat label="Mastered" value={`${masteredSet.size} words`} />
            <VocabStat label="Quizzes" value={`${profile.vocabQuizzesTaken ?? 0}`} />
            <VocabStat label="Best score" value={`${profile.vocabQuizBest ?? 0}/10`} />
          </div>
        </div>
      </section>

      <div className="flex gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 backdrop-blur-xl">
        {(
          [
            { id: "flashcards", label: "Flashcards", icon: BookMarked },
            { id: "quiz", label: "Quiz", icon: Sparkles },
          ] as { id: TrainerTab; label: string; icon: typeof BookMarked }[]
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
                active ? "bg-[#17342f] text-white shadow-lg" : "text-[#315149] hover:bg-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "flashcards" ? (
        <FlashcardsView masteredSet={masteredSet} onToggleMastery={onToggleMastery} />
      ) : (
        <QuizView profile={profile} onRecordQuiz={onRecordQuiz} />
      )}
    </div>
  );
}

function VocabStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#e3b65f]">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function FlashcardsView({
  masteredSet,
  onToggleMastery,
}: {
  masteredSet: Set<string>;
  onToggleMastery: (id: string) => void;
}) {
  const [queue, setQueue] = useState<VocabWord[]>(() => shuffle(vocabDeck).slice(0, 6));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [fetching, setFetching] = useState(false);
  const seenRef = useRef<Set<string>>(new Set(queue.map((item) => item.id)));

  const refill = useCallback(async () => {
    if (fetching) return;
    setFetching(true);
    const seen = [...seenRef.current];
    try {
      const result = await brainApi.vocab(seen);
      if (result.word) {
        freshWord(result.word);
      } else {
        addFallback();
      }
    } catch {
      addFallback();
    }
    setFetching(false);
  }, [fetching]);

  function freshWord(word: VocabWord) {
    seenRef.current.add(word.id);
    setQueue((current) => [...current, word]);
  }

  function addFallback() {
    const fallback = shuffle(vocabDeck).filter((item) => !seenRef.current.has(item.id)).slice(0, 1);
    if (fallback.length === 0) return;
    const item = fallback[0];
    seenRef.current.add(item.id);
    setQueue((current) => [...current, item]);
  }

  useEffect(() => {
    if (queue.length - index < 4) {
      refill();
    }
  }, [index, queue.length, refill]);

  const current = queue[index];

  function goForward() {
    if (index + 1 >= queue.length) return;
    setFlipped(false);
    setIndex((currentIndex) => currentIndex + 1);
  }

  function goBack() {
    setFlipped(false);
    setIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function reshuffle() {
    setFlipped(false);
    setIndex(0);
    const deck = shuffle(vocabDeck).slice(0, 6);
    seenRef.current = new Set(deck.map((item) => item.id));
    setQueue(deck);
  }

  if (!current) return null;

  const isMastered = masteredSet.has(current.id);
  const isAiWord = current.id.startsWith("ai-");
  const waitingForNext = index + 1 >= queue.length && fetching;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.36fr]">
      <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_22px_80px_rgba(33,72,67,0.12)] backdrop-blur-xl md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
              Card {index + 1} of {queue.length + 3} (AI keeps adding more)
            </p>
            {isAiWord ? (
              <span className="rounded-full bg-[#17342f]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8b5732]">
                Fresh from AI
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {isMastered ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#2f7151] px-3 py-1 text-xs font-bold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Mastered
              </span>
            ) : null}
            <button
              onClick={reshuffle}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[#d8c8a8] bg-white/80 text-[#17342f] transition hover:bg-white"
              aria-label="Shuffle deck"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex h-80 [perspective:1400px]">
          <div
            className={cn(
              "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <div className="absolute inset-0 flex flex-col justify-between rounded-[2rem] border border-[#e3dac6] bg-white/85 p-7 [backface-visibility:hidden]">
              <div>
                <span className="rounded-full bg-[#e3b65f]/25 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#8b5732]">
                  {current.topic}
                </span>
                <h3 className="mt-6 font-serif text-5xl font-semibold text-[#17342f]">{current.word}</h3>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-[#8b6f39]">{current.pos}</p>
              </div>
              <button
                onClick={() => setFlipped(true)}
                className="self-start inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#245f5a]"
              >
                Reveal meaning
              </button>
            </div>

            <div className="absolute inset-0 flex flex-col justify-between rounded-[2rem] border border-[#b9cdc0] bg-[#eef7ef] p-7 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2f7151]">Meaning</p>
                <p className="mt-3 text-lg font-semibold leading-7 text-[#17342f]">{current.meaning}</p>
                <div className="mt-6 rounded-2xl border border-[#cddacf] bg-white/70 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6f39]">Example</p>
                  <p className="mt-2 text-sm leading-6 text-[#4f625b]">{current.example}</p>
                </div>
              </div>
              <button
                onClick={() => setFlipped(false)}
                className="self-start inline-flex items-center gap-2 rounded-2xl border border-[#2f7151]/30 bg-white/80 px-5 py-3 text-sm font-black text-[#2f7151] transition hover:bg-white"
              >
                Back to word
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={goBack}
            disabled={index === 0}
            className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d8c8a8] bg-white/80 text-[#17342f] transition hover:bg-white disabled:opacity-40"
            aria-label="Previous card"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-1 gap-3">
            <button
              onClick={() => {
                onToggleMastery(current.id);
                goForward();
              }}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
                isMastered
                  ? "border border-[#2f7151]/30 bg-white/80 text-[#2f7151] hover:bg-white"
                  : "bg-[#2f7151] text-white shadow-lg shadow-[#2f7151]/20 hover:bg-[#3a8762]",
              )}
            >
              {isMastered ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {isMastered ? "Unmaster" : "Got it"}
            </button>
            <button
              onClick={goForward}
              disabled={waitingForNext}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-4 py-3 text-sm font-black text-[#315149] transition hover:bg-white disabled:cursor-wait disabled:opacity-50"
            >
              {waitingForNext ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI writing next word…
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[2rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_18px_60px_rgba(33,72,67,0.11)] backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Topics in deck</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {vocabTopics.map((topic) => {
              const count = vocabDeck.filter((item) => item.topic === topic).length;
              const masteredInTopic = vocabDeck.filter((item) => item.topic === topic && masteredSet.has(item.id)).length;
              return (
                <div key={topic} className="rounded-2xl bg-[#17342f]/5 px-3 py-2 text-xs font-bold text-[#315149]">
                  {topic} <span className="text-[#8b6f39]">({masteredInTopic}/{count})</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#17342f] p-5 text-white shadow-[0_18px_60px_rgba(33,72,67,0.18)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3b65f]">Examiner tip</p>
          <p className="mt-3 text-sm leading-6 text-[#dbe7e2]">
            IELTS Band 7+ requires accurate collocations, not just long words. The AI Brain mints a new word every time
            you press Next — never the same word twice. Master each one, then test yourself with the quiz.
          </p>
        </div>
      </div>
    </div>
  );
}

function QuizView({
  profile,
  onRecordQuiz,
}: {
  profile: StudentLearningProfile;
  onRecordQuiz: (score: number) => void;
}) {
  const [questions, setQuestions] = useState<VocabQuizQuestion[]>(() => buildVocabQuiz(10));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const current = questions[index];

  function choose(option: string) {
    if (selected) return;
    setSelected(option);
    if (option === current.meaning) {
      setCorrectCount((count) => count + 1);
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      const finalScore = correctCount;
      setDone(true);
      onRecordQuiz(finalScore);
      return;
    }
    setSelected(null);
    setIndex((currentIndex) => currentIndex + 1);
  }

  function restart() {
    setQuestions(buildVocabQuiz(10));
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setDone(false);
  }

  if (!current && !done) return null;

  if (done) {
    const isBest = correctCount >= (profile.vocabQuizBest ?? 0);
    return (
      <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-8 text-center shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-[#17342f] text-[#e3b65f]">
          <Trophy className="h-9 w-9" />
        </div>
        <h3 className="mt-6 font-serif text-4xl font-semibold text-[#17342f]">
          {correctCount}/10 correct
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#66746e]">
          {correctCount >= 8
            ? "Outstanding. You are ready to use these words under exam pressure."
            : correctCount >= 5
              ? "Good effort. Review the missed words in the flashcards and try again."
              : "Keep flipping cards — the words will stick with a few more passes."}
        </p>
        {isBest && correctCount > 0 ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eef7ef] px-4 py-2 text-sm font-bold text-[#2f7151]">
            <Sparkles className="h-4 w-4" /> New best score
          </p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={restart}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17342f] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5"
          >
            <RotateCcw className="h-4 w-4" />
            New quiz
          </button>
          <button
            onClick={() => {
              setQuestions([]);
              setDone(false);
              setIndex(0);
              setSelected(null);
              setCorrectCount(0);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d8c8a8] bg-white/80 px-6 py-3 text-sm font-black text-[#17342f] transition hover:bg-white"
          >
            <GraduationCap className="h-4 w-4" />
            Study flashcards
          </button>
        </div>
      </div>
    );
  }

  const revealed = selected !== null;

  return (
    <div className="rounded-[2.4rem] border border-white/70 bg-[#fffaf0]/88 p-5 shadow-[0_24px_80px_rgba(33,72,67,0.13)] backdrop-blur-xl md:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6f39]">
          Question {index + 1} of {questions.length}
        </p>
        <div className="flex gap-1">
          {questions.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={cn(
                "h-2 w-2 rounded-full",
                dotIndex < index ? "bg-[#17342f]" : dotIndex === index ? "bg-[#e3b65f]" : "bg-[#d8c8a8]",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[2rem] border border-[#e3dac6] bg-white/70 p-6 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b6f39]">Choose the correct meaning</p>
        <h3 className="mt-3 font-serif text-4xl font-semibold text-[#17342f]">{current.word}</h3>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {current.options.map((option) => {
          const isCorrect = option === current.meaning;
          const isSelected = option === selected;
          return (
            <button
              key={option}
              onClick={() => choose(option)}
              disabled={revealed}
              className={cn(
                "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold leading-6 transition",
                !revealed && "border-[#d8c8a8] bg-white/75 text-[#315149] hover:bg-white",
                revealed && isCorrect && "border-[#2f7151] bg-[#eef7ef] text-[#17342f]",
                revealed && isSelected && !isCorrect && "border-[#9c3a2e] bg-[#fae9e6] text-[#17342f]",
                revealed && !isSelected && !isCorrect && "border-[#e3dac6] bg-white/55 text-[#66746e]",
              )}
            >
              {revealed && isCorrect ? (
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#2f7151]" />
              ) : revealed && isSelected ? (
                <XCircle className="mt-1 h-4 w-4 shrink-0 text-[#9c3a2e]" />
              ) : (
                <span className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-[#d8c8a8]" />
              )}
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#315149]">
          Score: <span className="font-mono text-[#17342f]">{correctCount}</span>
        </p>
        <button
          onClick={next}
          disabled={!revealed}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#17342f] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#17342f]/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {index + 1 >= questions.length ? "See result" : "Next"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
