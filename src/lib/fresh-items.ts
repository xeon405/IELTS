const ROTATION_KEY = "ai-ielts-examiner-item-rotation";

function rotationMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROTATION_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveRotation(map: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROTATION_KEY, JSON.stringify(map));
  } catch {
    // storage full or blocked: rotation simply won't persist
  }
}

function scopeKey(module: string, mode: string): string {
  return `${module}::${mode || "default"}`;
}

/** Rotate a freshly fetched question list so the user never sees the same
 * window twice: items are served starting from the stored offset, wrapping
 * only after the whole bank for that module+mode has been seen. */
export function rotateFreshItems<T>(items: T[], module: string, mode: string): T[] {
  if (items.length < 2) return items;
  const offset = rotationMap()[scopeKey(module, mode)] ?? 0;
  if (offset === 0) return items;
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

/** Record that `consumed` questions of this module+mode were practised, so
 * the next fresh open starts after them instead of repeating them. */
export function advanceQuestionWindow(module: string, mode: string, consumed: number): void {
  if (consumed <= 0) return;
  const map = rotationMap();
  const key = scopeKey(module, mode);
  map[key] = (map[key] ?? 0) + Math.min(consumed, 1_000_000_000);
  saveRotation(map);
}