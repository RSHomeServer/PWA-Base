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

describe("lifecycle orphan attach + idle supervisor", () => {
  it("attaches a late event to a prior finished conversation run", async () => {
    const dir = mkdtempSync(join(tmpdir(), "lifecycle-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);

    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-attach",
      generation_id: "gen-1",
      prompt: "Original prompt",
    });
    const active = store.getActiveRun();
    expect(active).not.toBeNull();
    await service.ingest({
      hook_event_name: "stop",
      conversation_id: "conv-attach",
      generation_id: "gen-1",
      status: "completed",
    });
    expect(store.getActiveRun()).toBeNull();
    const finishedId = active!.id;

    const beforeCount = store.listRuns().length;
    await service.ingest({
      hook_event_name: "afterFileEdit",
      conversation_id: "conv-attach",
      generation_id: "gen-1",
      file_path: "packages/site-dashboard/src/x.tsx",
    });
    expect(store.listRuns()).toHaveLength(beforeCount);
    expect(store.getRun(finishedId)?.needsReview).toBe(false);
    const events = store.listEvents(finishedId);
    expect(events.some((e) => e.type === "file_edit")).toBe(true);
    store.close();
  });

  it("does not create an orphan when conversation-only attach succeeds", async () => {
    const dir = mkdtempSync(join(tmpdir(), "lifecycle-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);

    await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "conv-med",
      generation_id: "gen-a",
      prompt: "Work",
    });
    const runId = store.getActiveRun()!.id;
    await service.ingest({
      hook_event_name: "stop",
      conversation_id: "conv-med",
      generation_id: "gen-a",
      status: "completed",
    });

    const runCount = store.listRuns().length;
    await service.ingest({
      hook_event_name: "afterAgentResponse",
      conversation_id: "conv-med",
      generation_id: "gen-late",
      text: "late",
    });
    expect(store.listRuns()).toHaveLength(runCount);
    expect(store.getRun(runId)?.needsReview).toBe(true);
    store.close();
  });

  it("times out an idle run via supervisor tick", () => {
    const dir = mkdtempSync(join(tmpdir(), "lifecycle-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);
    service.setLifecycleIdleConfig({ idleSoftMs: 1_000, idleTimeoutMs: 2_000 });

    const oldStart = new Date(Date.now() - 10_000).toISOString();
    store.insertPrompt({
      id: "p-idle",
      prompt: "Idle me",
      title: "Idle me",
      createdAt: oldStart,
      conversationId: "conv-idle",
      model: null,
    });
    store.insertTask({
      id: "t-idle",
      title: "Idle me",
      promptText: "Idle me",
      conversationId: "conv-idle",
      createdAt: oldStart,
      startedAt: oldStart,
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
      id: "r-idle",
      promptId: "p-idle",
      taskId: "t-idle",
      startedAt: oldStart,
      finishedAt: null,
      durationMs: null,
      status: "running",
      summary: null,
      completionSummary: null,
      conversationId: "conv-idle",
      generationId: "gen-idle",
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
      id: "e-idle",
      runId: "r-idle",
      timestamp: oldStart,
      type: "prompt_submitted",
      summary: "Idle me",
      payloadJson: "{}",
    });

    service.evaluateActiveRunsLifecycle(new Date());
    const finished = store.getRun("r-idle");
    expect(finished?.status).toBe("timed_out");
    expect(finished?.lifecycleReason).toBe("automatic_timeout");
    expect(finished?.completionKind).toBe("automatic");
    expect(finished?.idleMs).toBeGreaterThanOrEqual(2_000);
    store.close();
  });
});
