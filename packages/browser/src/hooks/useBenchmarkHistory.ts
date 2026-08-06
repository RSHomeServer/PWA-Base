import { useCallback, useEffect, useState } from "react";

export interface HistoryEntry {
  score: number;
  timestamp: number;
}

export interface RecordOutcome {
  isNewBest: boolean;
  previousBest: number | null;
}

export interface BenchmarkHistory {
  /** Past runs, oldest first, most recent last. Excludes the just-recorded run. */
  entries: HistoryEntry[];
  best: number | null;
  record: (score: number) => RecordOutcome;
  clear: () => void;
}

const MAX_ENTRIES = 10;
const STORAGE_PREFIX = "pwa-browser:bench-history:";

function readHistory(key: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is HistoryEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as HistoryEntry).score === "number" &&
        typeof (entry as HistoryEntry).timestamp === "number",
    );
  } catch {
    return [];
  }
}

function writeHistory(key: string, entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entries));
  } catch {
    /* storage disabled, full, or unavailable in this context — skip persistence */
  }
}

/**
 * Persists benchmark run scores to localStorage under `key` so a device's
 * best result and recent trend survive page reloads. `higherIsBetter`
 * controls which direction counts as a new best (most metrics are
 * throughput/fps where higher wins; a few, like latency, are inverted).
 */
export function useBenchmarkHistory(
  key: string | undefined,
  higherIsBetter = true,
): BenchmarkHistory {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => (key ? readHistory(key) : []));

  useEffect(() => {
    setEntries(key ? readHistory(key) : []);
  }, [key]);

  const bestOf = useCallback(
    (list: HistoryEntry[]): number | null => {
      if (list.length === 0) return null;
      return higherIsBetter
        ? Math.max(...list.map((e) => e.score))
        : Math.min(...list.map((e) => e.score));
    },
    [higherIsBetter],
  );

  const record = useCallback(
    (score: number): RecordOutcome => {
      const previousBest = bestOf(entries);
      const isNewBest =
        previousBest === null || (higherIsBetter ? score > previousBest : score < previousBest);
      if (key) {
        const next = [...entries, { score, timestamp: Date.now() }].slice(-MAX_ENTRIES);
        setEntries(next);
        writeHistory(key, next);
      }
      return { isNewBest, previousBest };
    },
    [bestOf, entries, higherIsBetter, key],
  );

  const clear = useCallback(() => {
    if (!key) return;
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      /* ignore */
    }
  }, [key]);

  return { entries, best: bestOf(entries), record, clear };
}
