export interface VocabWord {
  id: string;
  word: string;
  pos: string;
  meaning: string;
  example: string;
  topic: string;
}

export interface VocabQuizQuestion {
  word: string;
  meaning: string;
  options: string[];
}

export const vocabDeck: VocabWord[] = [
  {
    id: "v1",
    word: "autonomous",
    pos: "adjective",
    meaning: "able to work or act without control or help from others",
    example: "Autonomous learners manage their own study schedule without constant teacher supervision.",
    topic: "Education",
  },
  {
    id: "v2",
    word: "pedagogy",
    pos: "noun",
    meaning: "the method and practice of teaching",
    example: "Modern pedagogy encourages discussion and project work rather than passive listening.",
    topic: "Education",
  },
  {
    id: "v3",
    word: "curriculum",
    pos: "noun",
    meaning: "the set of subjects and content taught in a course or school",
    example: "A balanced curriculum should include both technical skills and creative subjects.",
    topic: "Education",
  },
  {
    id: "v4",
    word: "acquire",
    pos: "verb",
    meaning: "to learn or gain knowledge, skills, or experience over time",
    example: "Children acquire their first language without formal lessons.",
    topic: "Education",
  },
  {
    id: "v5",
    word: "assess",
    pos: "verb",
    meaning: "to judge or measure the quality, value, or level of something",
    example: "Teachers assess essays against the official band descriptors.",
    topic: "Education",
  },
  {
    id: "v6",
    word: "sustainable",
    pos: "adjective",
    meaning: "able to continue over time without harming the environment",
    example: "Sustainable transport systems reduce emissions while supporting growing cities.",
    topic: "Environment",
  },
  {
    id: "v7",
    word: "biodiversity",
    pos: "noun",
    meaning: "the variety of plant and animal life in a habitat",
    example: "Urban parks can protect biodiversity even in dense city centres.",
    topic: "Environment",
  },
  {
    id: "v8",
    word: "mitigate",
    pos: "verb",
    meaning: "to make something harmful less severe or serious",
    example: "Flood defenses mitigate the damage caused by extreme weather.",
    topic: "Environment",
  },
  {
    id: "v9",
    word: "emission",
    pos: "noun",
    meaning: "gas or substance released into the air, especially by engines or industry",
    example: "Governments are setting stricter limits on carbon emissions.",
    topic: "Environment",
  },
  {
    id: "v10",
    word: "renewable",
    pos: "adjective",
    meaning: "able to be replaced naturally and never run out, such as sun or wind power",
    example: "Renewable energy sources now supply a growing share of national electricity.",
    topic: "Environment",
  },
  {
    id: "v11",
    word: "automation",
    pos: "noun",
    meaning: "the use of machines and computers to do work without people",
    example: "Automation in factories has raised productivity but reduced manual jobs.",
    topic: "Technology",
  },
  {
    id: "v12",
    word: "disruptive",
    pos: "adjective",
    meaning: "causing change that disturbs an existing system or industry",
    example: "Disruptive technology can make established business models obsolete.",
    topic: "Technology",
  },
  {
    id: "v13",
    word: "innovation",
    pos: "noun",
    meaning: "a new idea, method, or device, or the process of introducing one",
    example: "Innovation in medicine has extended the average lifespan.",
    topic: "Technology",
  },
  {
    id: "v14",
    word: "surveillance",
    pos: "noun",
    meaning: "the close watching of people, often by cameras or digital systems",
    example: "Public surveillance raises questions about privacy and personal freedom.",
    topic: "Technology",
  },
  {
    id: "v15",
    word: "digital divide",
    pos: "noun phrase",
    meaning: "the gap between people who have access to technology and those who do not",
    example: "Online education can widen the digital divide for students without reliable internet.",
    topic: "Technology",
  },
  {
    id: "v16",
    word: "preventive",
    pos: "adjective",
    meaning: "intended to stop illness or problems before they happen",
    example: "Preventive healthcare, such as vaccination, is cheaper than treatment.",
    topic: "Health",
  },
  {
    id: "v17",
    word: "sedentary",
    pos: "adjective",
    meaning: "involving a lot of sitting and little physical activity",
    example: "Sedentary office jobs have been linked to rising rates of obesity.",
    topic: "Health",
  },
  {
    id: "v18",
    word: "wellbeing",
    pos: "noun",
    meaning: "the state of being comfortable, healthy, and happy",
    example: "Flexible working hours can improve employees' mental wellbeing.",
    topic: "Health",
  },
  {
    id: "v19",
    word: "longevity",
    pos: "noun",
    meaning: "long life, or the length of time a person or thing lives",
    example: "Research shows that diet and exercise strongly influence longevity.",
    topic: "Health",
  },
  {
    id: "v20",
    word: "remuneration",
    pos: "noun",
    meaning: "payment or reward for work done",
    example: "Fair remuneration is essential for attracting skilled teachers.",
    topic: "Work",
  },
  {
    id: "v21",
    word: "egalitarian",
    pos: "adjective",
    meaning: "believing that all people are equal and should have the same rights",
    example: "An egalitarian education system gives every child the same starting chance.",
    topic: "Society",
  },
  {
    id: "v22",
    word: "marginalize",
    pos: "verb",
    meaning: "to treat a group as unimportant or outside mainstream society",
    example: "Poor digital skills can marginalize older workers in the labour market.",
    topic: "Society",
  },
  {
    id: "v23",
    word: "urbanization",
    pos: "noun",
    meaning: "the process of more people living and working in cities",
    example: "Rapid urbanization has increased pressure on housing and transport.",
    topic: "Society",
  },
  {
    id: "v24",
    word: "infrastructure",
    pos: "noun",
    meaning: "the basic systems and structures a society needs, such as roads and power",
    example: "Good infrastructure supports economic growth and public services.",
    topic: "Society",
  },
];

export const vocabTopics = Array.from(new Set(vocabDeck.map((item) => item.topic)));

export function getVocabWord(id: string): VocabWord | undefined {
  return vocabDeck.find((item) => item.id === id);
}

export function buildVocabQuiz(count = 10): VocabQuizQuestion[] {
  const shuffled = [...vocabDeck].sort(() => Math.random() - 0.5).slice(0, count);
  return shuffled.map((item) => {
    const distractors = vocabDeck
      .filter((other) => other.id !== item.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((other) => other.meaning);
    return {
      word: item.word,
      meaning: item.meaning,
      options: [...distractors, item.meaning].sort(() => Math.random() - 0.5),
    };
  });
}

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}
