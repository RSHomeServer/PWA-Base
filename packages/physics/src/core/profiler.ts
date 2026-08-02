import type { ProfileStats, SystemProfile } from "./types.js";

const EMA_ALPHA = 0.1;

/**
 * Rolling per-system + per-step timing tracker. Uses an exponential moving average
 * rather than a history buffer to stay allocation-free after construction.
 */
export class Profiler {
  private lastStepMs = 0;
  private avgStepMs = 0;
  private readonly systems = new Map<string, SystemProfile>();

  recordSystem(id: string, ms: number): void {
    let entry = this.systems.get(id);
    if (!entry) {
      entry = { lastMs: 0, avgMs: 0, calls: 0 };
      this.systems.set(id, entry);
    }
    entry.lastMs = ms;
    entry.avgMs = entry.calls === 0 ? ms : entry.avgMs + (ms - entry.avgMs) * EMA_ALPHA;
    entry.calls += 1;
  }

  recordStep(ms: number, hasHistory: boolean): void {
    this.lastStepMs = ms;
    this.avgStepMs = hasHistory ? this.avgStepMs + (ms - this.avgStepMs) * EMA_ALPHA : ms;
  }

  removeSystem(id: string): void {
    this.systems.delete(id);
  }

  reset(): void {
    this.lastStepMs = 0;
    this.avgStepMs = 0;
    this.systems.clear();
  }

  snapshot(frame: number, time: number): ProfileStats {
    const systems: Record<string, SystemProfile> = {};
    for (const [id, entry] of this.systems) {
      systems[id] = { lastMs: entry.lastMs, avgMs: entry.avgMs, calls: entry.calls };
    }
    return {
      frame,
      time,
      lastStepMs: this.lastStepMs,
      avgStepMs: this.avgStepMs,
      systems,
    };
  }
}

/** Monotonic millisecond clock. Falls back to `Date.now` when the Performance API
 * isn't in scope (the `ES2022` lib target intentionally excludes DOM types). */
export function nowMs(): number {
  const perf = (globalThis as { performance?: { now(): number } }).performance;
  return perf ? perf.now() : Date.now();
}
