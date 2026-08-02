const FAVOURITES_KEY = "viz-gallery-favourites";
const RECENT_KEY = "viz-gallery-recent";
const MAX_RECENT = 8;

function readJsonArray(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key: string, values: string[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(values));
}

export function getFavourites(): string[] {
  return readJsonArray(FAVOURITES_KEY);
}

export function isFavourite(id: string): boolean {
  return getFavourites().includes(id);
}

export function toggleFavourite(id: string): string[] {
  const current = getFavourites();
  const next = current.includes(id) ? current.filter((entry) => entry !== id) : [id, ...current];
  writeJsonArray(FAVOURITES_KEY, next);
  return next;
}

export function getRecentlyViewed(): string[] {
  return readJsonArray(RECENT_KEY);
}

/** Call from exhibit pages when a visitor opens an experience. */
export function recordDemoView(id: string): void {
  if (typeof window === "undefined" || !id) {
    return;
  }
  const recent = getRecentlyViewed().filter((entry) => entry !== id);
  recent.unshift(id);
  writeJsonArray(RECENT_KEY, recent.slice(0, MAX_RECENT));
}
