const PREFIX = "ielts-click-cache";
const TTL_MS = 5 * 60 * 1000;

type Cached<T> = { savedAt: number; data: T };

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}:${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Cached<T>;
    if (!entry || typeof entry.savedAt !== "number" || Date.now() - entry.savedAt > TTL_MS) {
      window.localStorage.removeItem(`${PREFIX}:${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, data: unknown): void {
  try {
    const entry: Cached<unknown> = { savedAt: Date.now(), data };
    window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — the click simply fetches live instead.
  }
}
