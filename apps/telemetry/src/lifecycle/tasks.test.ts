import { describe, expect, it } from "vitest";
import {
  canAutoCompleteTask,
  decideTaskPlacement,
  isHeavyShellCommand,
  overviewLooksThin,
} from "./tasks.js";
import type { TaskRecord } from "../types.js";

function task(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: "t1",
    title: "Hello",
    promptText: "Hello",
    conversationId: "c1",
    createdAt: "2026-07-20T12:00:00.000Z",
    startedAt: "2026-07-20T12:00:00.000Z",
    finishedAt: null,
    durationMs: null,
    status: "open",
    completionSummary: null,
    completionKind: null,
    manualCompletionReason: null,
    manualCompletionNote: null,
    completionReason: null,
    needsReview: false,
    ...overrides,
  };
}

describe("task consolidation helpers", () => {
  it("reuses open and waiting tasks", () => {
    expect(decideTaskPlacement("c1", task()).action).toBe("reuse_open_task");
    expect(decideTaskPlacement("c1", task({ status: "waiting" })).action).toBe("reuse_open_task");
    expect(decideTaskPlacement("c1", null).action).toBe("create_task");
  });

  it("detects heavy shell commands", () => {
    expect(isHeavyShellCommand("pnpm test:e2e")).toBe(true);
    expect(isHeavyShellCommand("playwright test")).toBe(true);
    expect(isHeavyShellCommand("ls -la")).toBe(false);
  });

  it("requires terminal runs + summary + no heavy activity", () => {
    expect(
      canAutoCompleteTask({
        allRunsTerminal: true,
        hasStructuredSummary: true,
        noRecentHeavyActivity: true,
        openRunCount: 0,
        summarySource: "task",
      }),
    ).toBe(true);
    expect(
      canAutoCompleteTask({
        allRunsTerminal: false,
        hasStructuredSummary: true,
        noRecentHeavyActivity: true,
        openRunCount: 1,
        summarySource: "task",
      }),
    ).toBe(false);
  });

  it("flags thin overviews", () => {
    expect(overviewLooksThin("short")).toBe(true);
    expect(overviewLooksThin("E2E fixture for Actions Required panel.")).toBe(true);
    expect(
      overviewLooksThin(
        "Implemented Task consolidation so explore agents share one Task. Validated with unit tests.",
      ),
    ).toBe(false);
  });
});
