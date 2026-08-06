import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Gauge,
  Headphones,
  MessageCircleQuestion,
  Mic,
  PenLine,
  Settings,
  Trophy,
  UserRound,
} from "lucide-react";
import type { Skill } from "@/lib/ielts-brain";

export type ViewId = "dashboard" | Skill | "mock" | "reports" | "tutor" | "vocabulary" | "profile" | "settings";
export type MockSection = "intro" | Skill | "result";

export const storageKey = "ai-ielts-examiner-profile";
export const lastSessionKey = "ai-ielts-examiner-last-session";
export const skillOrder: Skill[] = ["listening", "reading", "writing", "speaking"];

export const navItems: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "listening", label: "Listening", icon: Headphones },
  { id: "writing", label: "Writing", icon: PenLine },
  { id: "speaking", label: "Speaking", icon: Mic },
  { id: "mock", label: "Full Mock", icon: Trophy },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "tutor", label: "AI Tutor", icon: MessageCircleQuestion },
  { id: "vocabulary", label: "Vocabulary", icon: BookMarked },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

export const moduleConfig: Record<
  Skill,
  {
    label: string;
    icon: LucideIcon;
    accent: string;
    soft: string;
    ring: string;
    gradient: string;
    description: string;
    modes: string[];
  }
> = {
  reading: {
    label: "Reading",
    icon: BookOpen,
    accent: "bg-[#1d5f8f] text-white",
    soft: "bg-[#dcebfa] text-[#1a5077]",
    ring: "ring-[#1d5f8f]/25",
    gradient: "from-[#d9e8f5] via-[#e6eef5] to-[#c9dfee]",
    description: "Passages and questions with blue focus: headings, inference, detail, and timing.",
    modes: ["Full Reading Section", "Passage 1", "Passage 2", "Passage 3", "Individual Question Types", "Quick Practice"],
  },
  listening: {
    label: "Listening",
    icon: Headphones,
    accent: "bg-[#1e7d3d] text-white",
    soft: "bg-[#dcf0e1] text-[#1b6b35]",
    ring: "ring-[#1e7d3d]/25",
    gradient: "from-[#d7ecdb] via-[#eaf0df] to-[#cfe6c8]",
    description: "Four-part listening practice with green focus, distractors and map language.",
    modes: ["Full Listening Section", "Part 1", "Part 2", "Part 3", "Part 4", "Individual Question Types", "Quick Practice"],
  },
  writing: {
    label: "Writing",
    icon: PenLine,
    accent: "bg-[#c96f1e] text-white",
    soft: "bg-[#fae8d3] text-[#a85c14]",
    ring: "ring-[#c96f1e]/25",
    gradient: "from-[#f7e4c8] via-[#f6ecdb] to-[#f3dabe]",
    description: "Task 1 and Task 2 workflows with orange focus, evaluated by band descriptors.",
    modes: ["Full Writing Section", "Task 1", "Task 2", "Essay Types", "Quick Practice"],
  },
  speaking: {
    label: "Speaking",
    icon: Mic,
    accent: "bg-[#7a4fc4] text-white",
    soft: "bg-[#e9def8] text-[#6a44aa]",
    ring: "ring-[#7a4fc4]/25",
    gradient: "from-[#e6ddf6] via-[#f0ebfb] to-[#d9ccef]",
    description: "Interview, cue-card, and Part 3 extension with purple focus and examiner feedback.",
    modes: ["Full Speaking Section", "Part 1", "Part 2", "Part 3", "Topic Practice", "Quick Practice"],
  },
};

export const sampleResponses: Record<Skill, string> = {
  reading:
    "The paragraph is mainly about connected shade networks, not isolated trees. The claim about shop revenue is false because the text only proves foot traffic increased. The missing word is planning.",
  listening:
    "The compost area is the second fenced space on the right after the tool shed. Visitors now pay 7 pounds. They must bring gloves or a water bottle.",
  writing:
    "Plan: one paragraph on overdependence, one on independence, and my opinion that technology helps when schools teach self-management. Example: students using online feedback can revise essays independently. Full essay: Technology can create passive habits if students copy answers without thinking, but it can also make learners more independent when it gives access to explanations, practice, and feedback. In my view, the result depends on how teachers design tasks. If students must compare sources, write reflections, and correct their own errors, devices become tools for autonomy rather than shortcuts.",
  speaking:
    "I usually concentrate best in a small public library near my apartment. It is quiet but not completely silent, so I feel calm without feeling isolated. I normally read articles there, plan essays, and review vocabulary. The place helps me focus because everyone around me is also working, and that atmosphere keeps me disciplined. After spending time there, I feel organized and more confident about my study plan.",
};

export function isSkill(view: ViewId): view is Skill {
  return view === "reading" || view === "listening" || view === "writing" || view === "speaking";
}

export function getSampleAnswers(session: {
  items: { id: string; options?: string[] }[];
}, module: Skill): Record<string, string> {
  return Object.fromEntries(
    session.items.map((item, index) => {
      if (item.options?.length) {
        return [item.id, item.options[Math.min(1, item.options.length - 1)]];
      }
      return [
        item.id,
        `${sampleResponses[module]} ${index === 0 ? "" : "This answer extends the same reasoning with a clearer example."}`,
      ];
    }),
  );
}

export function completionPercent(session: { items: { id: string }[] }, answers: Record<string, string>): number {
  if (session.items.length === 0) return 0;
  const answered = session.items.filter((item) => answers[item.id]?.trim()).length;
  return Math.round((answered / session.items.length) * 100);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
