import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openStore } from "../db/store.js";
import { TelemetryService } from "../service.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("task consolidation + auto-complete", () => {
  it("consolidates two prompt_submitted into one Task with two Runs", async () => {
    const dir = mkdtempSync(join(tmpdir(), "task-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);

    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-multi",
      generation_id: "g1",
      prompt: "Implement the feature",
    });
    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-multi",
      generation_id: "g2",
      prompt: "Explore follow-up",
    });

    const tasks = store.listTasks();
    expect(tasks).toHaveLength(1);
    expect(store.listRunsForTask(tasks[0]!.id)).toHaveLength(2);
    expect(store.listOpenRuns().length).toBeGreaterThanOrEqual(1);
    store.close();
  });

  it("attaches late orphan event under open Task without new Task", async () => {
    const dir = mkdtempSync(join(tmpdir(), "task-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);

    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-or",
      generation_id: "g1",
      prompt: "Main work",
    });
    const before = store.listTasks().length;
    await service.ingest({
      hook_event_name: "afterAgentResponse",
      conversation_id: "conv-or",
      generation_id: "g-late",
      text: "explore agents finished",
    });
    expect(store.listTasks()).toHaveLength(before);
    expect(store.listRuns().length).toBeGreaterThanOrEqual(2);
    store.close();
  });

  it("auto-completes Task when runs finish and summary is written", async () => {
    const dir = mkdtempSync(join(tmpdir(), "task-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);
    service.setLifecycleIdleConfig({
      idleTimeoutMs: 1_800_000,
      idleSoftMs: 900_000,
      taskCompletionGraceMs: 0,
    });

    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-done",
      generation_id: "g1",
      prompt: "Ship it",
    });
    const run = store.getActiveRun()!;
    await service.ingest({
      hook_event_name: "stop",
      conversation_id: "conv-done",
      generation_id: "g1",
      status: "completed",
    });
    service.updateTaskCompletionSummary(run.taskId, {
      schemaVersion: 2,
      overview:
        "Implemented task consolidation so related Cursor executions share one Task. Validated with unit tests. Remaining: dashboard History UI.",
      executiveSummary: "Task auto-complete works",
      userVisibleChanges: ["Task grouping"],
      architectureChanges: [],
      filesModified: [],
      configurationChanges: [],
      testingPerformed: [{ check: "unit", status: "pass", detail: "ok" }],
      knownLimitations: [],
      recommendedNextMilestone: null,
      filesChanged: 1,
      testsPassed: true,
      gitCommit: null,
      source: "structured",
    });
    const task = store.getTask(run.taskId);
    expect(task?.status).toBe("completed");
    expect(task?.completionReason).toBe("all_runs_terminal_with_summary");
    expect(task?.completionKind).toBe("automatic");
    store.close();
  });

  it("manualCompleteTask closes open task", async () => {
    const dir = mkdtempSync(join(tmpdir(), "task-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);

    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-man",
      generation_id: "g1",
      prompt: "Manual path",
    });
    const taskId = store.getActiveRun()!.taskId;
    const out = service.manualCompleteTask(taskId, "cursor_crashed", "hung");
    expect(out?.task.status).toBe("completed");
    expect(out?.task.completionReason).toBe("manual");
    expect(store.listOpenRuns()).toHaveLength(0);
    store.close();
  });
});
