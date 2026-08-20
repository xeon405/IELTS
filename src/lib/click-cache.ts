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

function writeEntry(key: string, entry: Cached<unknown>): void {
  window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(entry));
}

export function cacheSet(key: string, data: unknown): void {
  const entry: Cached<unknown> = { savedAt: Date.now(), data };
  try {
    writeEntry(key, entry);
    return;
  } catch {
    // Storage full (large banks) or unavailable. Evict the oldest cached
    // entries (bounded effort) and retry so one big write never breaks the
    // whole cache.
  }
  try {
    const prefix = `${PREFIX}:`;
    const oldest = Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .sort((a, b) => {
        try {
          return (
            (JSON.parse(window.localStorage.getItem(a) || "{}").savedAt || 0) -
            (JSON.parse(window.localStorage.getItem(b) || "{}").savedAt || 0)
          );
        } catch {
          return 0;
        }
      });
    for (const k of oldest.slice(0, Math.min(6, oldest.length))) {
      window.localStorage.removeItem(k);
      try {
        writeEntry(key, entry);
        return;
      } catch {
        // Keep evicting older entries until the write fits.
      }
    }
  } catch {
    // Give up quietly; the click then fetches live.
  }
}
