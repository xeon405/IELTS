export type ThemeId = "light" | "warm" | "dark" | "ocean" | "graphite" | "royal" | "mint";

export const settingsKey = "ai-ielts-examiner-settings";

export const THEMES: {
  id: ThemeId;
  label: string;
  tagline: string;
  swatch: string;
}[] = [
  { id: "light", label: "Light", tagline: "Exam paper", swatch: "linear-gradient(135deg, #fffaf0 0%, #e3b65f 100%)" },
  { id: "warm", label: "Warm", tagline: "Parchment", swatch: "linear-gradient(135deg, #fbf1dd 0%, #d9a45c 100%)" },
  { id: "mint", label: "Mint", tagline: "Fresh sage", swatch: "linear-gradient(135deg, #eaf7ec 0%, #7fc58a 100%)" },
  { id: "dark", label: "Dark", tagline: "Night study", swatch: "linear-gradient(135deg, #1b2722 0%, #e3b65f 100%)" },
  { id: "ocean", label: "Ocean", tagline: "Cool focus", swatch: "linear-gradient(135deg, #eef4fb 0%, #4a8db7 100%)" },
  { id: "graphite", label: "Graphite", tagline: "Charcoal", swatch: "linear-gradient(135deg, #f4f4f1 0%, #6e7278 100%)" },
  { id: "royal", label: "Royal", tagline: "Premium violet", swatch: "linear-gradient(135deg, #f3eefb 0%, #8a6ab5 100%)" },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function readStoredTheme(): ThemeId {
  try {
    const raw = window.localStorage.getItem(settingsKey);
    if (!raw) return "light";
    const parsed = JSON.parse(raw) as { theme?: unknown };
    return isThemeId(parsed?.theme) ? parsed.theme : "light";
  } catch {
    return "light";
  }
}

export function persistTheme(id: ThemeId): void {
  try {
    const raw = window.localStorage.getItem(settingsKey);
    const current = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    current.theme = id;
    window.localStorage.setItem(settingsKey, JSON.stringify(current));
  } catch {
    // storage unavailable — theme still applies for this session
  }
  document.documentElement.dataset.theme = id;
}