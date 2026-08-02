import { describe, expect, it } from "vitest";
import {
  decideOrphanAttach,
  evaluateIdle,
  openRunMatchesIds,
  ORPHAN_HIGH_LOOKBACK_MS,
  ORPHAN_MEDIUM_LOOKBACK_MS,
} from "./rules.js";
import type { RunRecord } from "../types.js";

function baseRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    id: "r1",
    promptId: "p1",
    taskId: "t1",
    startedAt: "2026-07-20T12:00:00.000Z",
    finishedAt: null,
    durationMs: null,
    status: "running",
    summary: null,
    completionSummary: null,
    conversationId: "c1",
    generationId: "g1",
    phase: "working",
    latestShell: null,
    latestFile: null,
    completionKind: null,
    manualCompletionReason: null,
    manualCompletionNote: null,
    lifecycleReason: null,
    idleMs: null,
    needsReview: false,
    ...overrides,
  };
}

describe("evaluateIdle", () => {
  const soft = 900_000;
  const timeout = 1_800_000;

  it("marks waiting at soft threshold", () => {
    const decision = evaluateIdle({
      run: baseRun(),
      lastActivityAt: "2026-07-20T12:00:00.000Z",
      nowMs: Date.parse("2026-07-20T12:00:00.000Z") + soft,
      idleSoftMs: soft,
      idleTimeoutMs: timeout,
    });
    expect(decision).toEqual({ action: "mark_waiting", idleMs: soft });
  });

  it("times out at full threshold", () => {
    const decision = evaluateIdle({
      run: baseRun({ status: "waiting" }),
      lastActivityAt: "2026-07-20T12:00:00.000Z",
      nowMs: Date.parse("2026-07-20T12:00:00.000Z") + timeout,
      idleSoftMs: soft,
      idleTimeoutMs: timeout,
    });
    expect(decision).toEqual({ action: "timeout", idleMs: timeout });
  });

  it("does nothing below soft threshold", () => {
    const decision = evaluateIdle({
      run: baseRun(),
      lastActivityAt: "2026-07-20T12:00:00.000Z",
      nowMs: Date.parse("2026-07-20T12:00:00.000Z") + soft - 1,
      idleSoftMs: soft,
      idleTimeoutMs: timeout,
    });
    expect(decision).toEqual({ action: "none" });
  });
});

describe("decideOrphanAttach", () => {
  const finished = baseRun({
    id: "finished",
    status: "completed",
    finishedAt: "2026-07-20T12:10:00.000Z",
    durationMs: 600_000,
    completionKind: "automatic",
  });

  it("attaches high confidence with conversation + generation", () => {
    const decision = decideOrphanAttach({
      conversationId: "c1",
      generationId: "g1",
      nowIso: "2026-07-20T12:20:00.000Z",
      highLookbackMs: ORPHAN_HIGH_LOOKBACK_MS,
      mediumLookbackMs: ORPHAN_MEDIUM_LOOKBACK_MS,
      findFinished: (opts) => {
        if (opts.generationId === "g1") return finished;
        return null;
      },
    });
    expect(decision.confidence).toBe("high");
    expect(decision.needsReview).toBe(false);
    expect(decision.run?.id).toBe("finished");
  });

  it("attaches medium confidence with conversation only", () => {
    const decision = decideOrphanAttach({
      conversationId: "c1",
      generationId: "g-other",
      nowIso: "2026-07-20T12:12:00.000Z",
      highLookbackMs: ORPHAN_HIGH_LOOKBACK_MS,
      mediumLookbackMs: ORPHAN_MEDIUM_LOOKBACK_MS,
      findFinished: (opts) => {
        if (opts.generationId) return null;
        return finished;
      },
    });
    expect(decision.confidence).toBe("medium");
    expect(decision.needsReview).toBe(true);
  });

  it("returns none when no match", () => {
    const decision = decideOrphanAttach({
      conversationId: "c1",
      generationId: null,
      nowIso: "2026-07-20T12:20:00.000Z",
      highLookbackMs: ORPHAN_HIGH_LOOKBACK_MS,
      mediumLookbackMs: ORPHAN_MEDIUM_LOOKBACK_MS,
      findFinished: () => null,
    });
    expect(decision.confidence).toBe("none");
    expect(decision.needsReview).toBe(true);
  });
});

describe("openRunMatchesIds", () => {
  it("rejects mismatched generation when both present", () => {
    expect(openRunMatchesIds(baseRun({ generationId: "g1" }), "c1", "g2")).toBe(false);
  });

  it("accepts matching conversation", () => {
    expect(openRunMatchesIds(baseRun({ generationId: null }), "c1", null)).toBe(true);
  });
});
