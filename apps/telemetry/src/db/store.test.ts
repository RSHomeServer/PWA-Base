import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { openStore } from "./store.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("TelemetryStore", () => {
  it("persists prompts, runs, and events", () => {
    const dir = mkdtempSync(join(tmpdir(), "telemetry-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));

    store.insertPrompt({
      id: "p1",
      prompt: "Hello",
      title: "Hello",
      createdAt: "2026-01-01T00:00:00.000Z",
      conversationId: "c1",
      model: "test",
    });
    store.insertTask({
      id: "t1",
      title: "Hello",
      promptText: "Hello",
      conversationId: "c1",
      createdAt: "2026-01-01T00:00:00.000Z",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: null,
      durationMs: null,
      status: "open",
      completionSummary: null,
      completionKind: null,
      manualCompletionReason: null,
      manualCompletionNote: null,
      completionReason: null,
      needsReview: false,
    });
    store.insertRun({
      id: "r1",
      promptId: "p1",
      taskId: "t1",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: null,
      durationMs: null,
      status: "running",
      summary: null,
      completionSummary: null,
      conversationId: "c1",
      generationId: "g1",
      phase: "starting",
      latestShell: null,
      latestFile: null,
      completionKind: null,
      manualCompletionReason: null,
      manualCompletionNote: null,
      lifecycleReason: null,
      idleMs: null,
      needsReview: false,
    });
    store.insertEvent({
      id: "e1",
      runId: "r1",
      timestamp: "2026-01-01T00:00:01.000Z",
      type: "prompt_submitted",
      summary: "Hello",
      payloadJson: "{}",
    });

    expect(store.getPrompt("p1")?.title).toBe("Hello");
    expect(store.getActiveRun()?.id).toBe("r1");
    expect(store.listEvents("r1")).toHaveLength(1);
    expect(store.countEvents("r1")).toBe(1);

    store.updateSettings({ ntfyTopic: "songara-dev" });
    expect(store.getSettings().ntfyTopic).toBe("songara-dev");

    expect(store.deleteRun("r1")).toBe(true);
    expect(store.getRun("r1")).toBeNull();
    expect(store.getPrompt("p1")).toBeNull();
    expect(store.listEvents("r1")).toHaveLength(0);

    store.close();
  });

  it("persists completion_kind for manual vs automatic runs", () => {
    const dir = mkdtempSync(join(tmpdir(), "telemetry-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));

    store.insertPrompt({
      id: "p2",
      prompt: "Hello",
      title: "Hello",
      createdAt: "2026-01-01T00:00:00.000Z",
      conversationId: null,
      model: null,
    });
    store.insertTask({
      id: "t2",
      title: "Hello",
      promptText: "Hello",
      conversationId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:01:00.000Z",
      durationMs: 60_000,
      status: "completed",
      completionSummary: null,
      completionKind: "manual",
      manualCompletionReason: "cursor_crashed",
      manualCompletionNote: "hung",
      completionReason: "manual",
      needsReview: false,
    });
    store.insertRun({
      id: "r2",
      promptId: "p2",
      taskId: "t2",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:01:00.000Z",
      durationMs: 60_000,
      status: "completed",
      summary: null,
      completionSummary: null,
      conversationId: null,
      generationId: null,
      phase: "finished",
      latestShell: null,
      latestFile: null,
      completionKind: "manual",
      manualCompletionReason: "cursor_crashed",
      manualCompletionNote: "hung",
      lifecycleReason: null,
      idleMs: null,
      needsReview: false,
    });
    const run = store.getRun("r2");
    expect(run?.completionKind).toBe("manual");
    expect(run?.manualCompletionReason).toBe("cursor_crashed");
    expect(run?.manualCompletionNote).toBe("hung");
    store.close();
  });

  it("finds recent finished runs for orphan attach", () => {
    const dir = mkdtempSync(join(tmpdir(), "telemetry-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    store.insertPrompt({
      id: "p3",
      prompt: "x",
      title: "x",
      createdAt: "2026-07-20T12:00:00.000Z",
      conversationId: "c1",
      model: null,
    });
    store.insertTask({
      id: "t3",
      title: "x",
      promptText: "x",
      conversationId: "c1",
      createdAt: "2026-07-20T12:00:00.000Z",
      startedAt: "2026-07-20T12:00:00.000Z",
      finishedAt: "2026-07-20T12:10:00.000Z",
      durationMs: 600_000,
      status: "completed",
      completionSummary: null,
      completionKind: "automatic",
      manualCompletionReason: null,
      manualCompletionNote: null,
      completionReason: "all_runs_terminal_with_summary",
      needsReview: false,
    });
    store.insertRun({
      id: "r3",
      promptId: "p3",
      taskId: "t3",
      startedAt: "2026-07-20T12:00:00.000Z",
      finishedAt: "2026-07-20T12:10:00.000Z",
      durationMs: 600_000,
      status: "completed",
      summary: null,
      completionSummary: null,
      conversationId: "c1",
      generationId: "g1",
      phase: "finished",
      latestShell: null,
      latestFile: null,
      completionKind: "automatic",
      manualCompletionReason: null,
      manualCompletionNote: null,
      lifecycleReason: null,
      idleMs: null,
      needsReview: false,
    });
    const found = store.findRecentFinishedRun({
      conversationId: "c1",
      generationId: "g1",
      lookbackMs: 15 * 60 * 1000,
      nowIso: "2026-07-20T12:20:00.000Z",
    });
    expect(found?.id).toBe("r3");
    expect(
      store.findRecentFinishedRun({
        conversationId: "c1",
        generationId: "g1",
        lookbackMs: 60_000,
        nowIso: "2026-07-20T12:20:00.000Z",
      }),
    ).toBeNull();
    store.close();
  });
});

describe("TelemetryStore tasks", () => {
  it("links runs to tasks and finds the open task for a conversation", () => {
    const dir = mkdtempSync(join(tmpdir(), "telemetry-tasks-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));

    store.insertPrompt({
      id: "p1",
      prompt: "Do the thing",
      title: "Do the thing",
      createdAt: "2026-01-01T00:00:00.000Z",
      conversationId: "conv-a",
      model: null,
    });
    store.insertTask({
      id: "task-1",
      title: "Do the thing",
      promptText: "Do the thing",
      conversationId: "conv-a",
      createdAt: "2026-01-01T00:00:00.000Z",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: null,
      durationMs: null,
      status: "open",
      completionSummary: null,
      completionKind: null,
      manualCompletionReason: null,
      manualCompletionNote: null,
      completionReason: null,
      needsReview: false,
    });
    store.insertRun({
      id: "run-1",
      promptId: "p1",
      taskId: "task-1",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: null,
      durationMs: null,
      status: "running",
      summary: null,
      completionSummary: null,
      conversationId: "conv-a",
      generationId: "gen-1",
      phase: "starting",
      latestShell: null,
      latestFile: null,
      completionKind: null,
      manualCompletionReason: null,
      manualCompletionNote: null,
      lifecycleReason: null,
      idleMs: null,
      needsReview: false,
    });

    expect(store.getTask("task-1")?.title).toBe("Do the thing");
    expect(store.getOpenTaskByConversation("conv-a")?.id).toBe("task-1");
    expect(store.countRunsForTask("task-1")).toBe(1);
    expect(store.listRunsForTask("task-1").map((r) => r.id)).toEqual(["run-1"]);

    const finishedTask = { ...store.getTask("task-1")! };
    finishedTask.status = "completed";
    finishedTask.finishedAt = "2026-01-01T00:05:00.000Z";
    finishedTask.durationMs = 300_000;
    finishedTask.completionKind = "automatic";
    finishedTask.completionReason = "all_runs_terminal_with_summary";
    store.updateTask(finishedTask);

    expect(store.getOpenTaskByConversation("conv-a")).toBeNull();
    const found = store.findRecentFinishedTask({
      conversationId: "conv-a",
      lookbackMs: 15 * 60 * 1000,
      nowIso: "2026-01-01T00:10:00.000Z",
    });
    expect(found?.id).toBe("task-1");
    expect(
      store.findRecentFinishedTask({
        conversationId: "conv-a",
        lookbackMs: 60_000,
        nowIso: "2026-01-01T00:10:00.000Z",
      }),
    ).toBeNull();

    expect(store.listTasks().map((t) => t.id)).toEqual(["task-1"]);
    store.close();
  });

  it("backfills tasks from pre-existing runs, grouping by conversation", () => {
    const dir = mkdtempSync(join(tmpdir(), "telemetry-backfill-"));
    dirs.push(dir);
    const dbPath = join(dir, "t.sqlite");

    // Simulate a pre-Task database (no tasks table, no runs.task_id column)
    // by writing the legacy schema directly with raw SQL, then let openStore
    // run the one-time migration + backfill against it.
    const legacyDb = new DatabaseSync(dbPath);
    legacyDb.exec(`
      CREATE TABLE prompts (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        conversation_id TEXT,
        model TEXT
      );
      CREATE TABLE runs (
        id TEXT PRIMARY KEY,
        prompt_id TEXT NOT NULL REFERENCES prompts(id),
        started_at TEXT NOT NULL,
        finished_at TEXT,
        duration_ms INTEGER,
        status TEXT NOT NULL,
        summary TEXT,
        completion_summary_json TEXT,
        conversation_id TEXT,
        generation_id TEXT,
        phase TEXT,
        latest_shell TEXT,
        latest_file TEXT,
        completion_kind TEXT,
        manual_completion_reason TEXT,
        manual_completion_note TEXT,
        lifecycle_reason TEXT,
        idle_ms INTEGER,
        needs_review INTEGER NOT NULL DEFAULT 0
      );
    `);
    const insertPromptStmt = legacyDb.prepare(
      `INSERT INTO prompts (id, prompt, title, created_at, conversation_id, model)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    insertPromptStmt.run(
      "p-conv",
      "First in conversation",
      "First in conversation",
      "2026-01-01T00:00:00.000Z",
      "conv-legacy",
      null,
    );
    insertPromptStmt.run(
      "p-conv-2",
      "Second in conversation",
      "Second in conversation",
      "2026-01-01T00:05:00.000Z",
      "conv-legacy",
      null,
    );
    insertPromptStmt.run(
      "p-solo",
      "Standalone",
      "Standalone",
      "2026-01-01T00:10:00.000Z",
      null,
      null,
    );

    const insertRunStmt = legacyDb.prepare(
      `INSERT INTO runs (
        id, prompt_id, started_at, finished_at, duration_ms, status, summary,
        completion_summary_json, conversation_id, generation_id, phase, latest_shell, latest_file,
        completion_kind, manual_completion_reason, manual_completion_note,
        lifecycle_reason, idle_ms, needs_review
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    // Two runs sharing a conversation (chronological), plus one solo run
    // with no conversation_id.
    insertRunStmt.run(
      "run-conv-1",
      "p-conv",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:02:00.000Z",
      120_000,
      "completed",
      "done 1",
      null,
      "conv-legacy",
      "gen-1",
      "finished",
      null,
      null,
      "automatic",
      null,
      null,
      null,
      null,
      0,
    );
    insertRunStmt.run(
      "run-conv-2",
      "p-conv-2",
      "2026-01-01T00:05:00.000Z",
      "2026-01-01T00:08:00.000Z",
      180_000,
      "completed",
      "done 2",
      null,
      "conv-legacy",
      "gen-2",
      "finished",
      null,
      null,
      "automatic",
      null,
      null,
      null,
      null,
      0,
    );
    insertRunStmt.run(
      "run-solo",
      "p-solo",
      "2026-01-01T00:10:00.000Z",
      null,
      null,
      "running",
      null,
      null,
      null,
      null,
      "starting",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      0,
    );
    legacyDb.close();

    const migrated = openStore(dbPath);

    const convRun1 = migrated.getRun("run-conv-1");
    const convRun2 = migrated.getRun("run-conv-2");
    const soloRun = migrated.getRun("run-solo");

    expect(convRun1?.taskId).toBeTruthy();
    expect(convRun1?.taskId).toBe(convRun2?.taskId);
    expect(soloRun?.taskId).toBeTruthy();
    expect(soloRun?.taskId).not.toBe(convRun1?.taskId);

    const convTask = migrated.getTask(convRun1!.taskId);
    expect(convTask?.title).toBe("First in conversation");
    expect(convTask?.conversationId).toBe("conv-legacy");
    expect(convTask?.status).toBe("completed");
    expect(convTask?.startedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(convTask?.finishedAt).toBe("2026-01-01T00:08:00.000Z");
    expect(migrated.countRunsForTask(convRun1!.taskId)).toBe(2);

    const soloTask = migrated.getTask(soloRun!.taskId);
    expect(soloTask?.title).toBe("Standalone");
    expect(soloTask?.conversationId).toBeNull();
    expect(soloTask?.status).toBe("open");
    expect(migrated.countRunsForTask(soloRun!.taskId)).toBe(1);

    // Re-opening again is idempotent: no duplicate tasks are created.
    migrated.close();
    const reopened = openStore(dbPath);
    expect(reopened.listTasks()).toHaveLength(2);
    reopened.close();
  });
});
