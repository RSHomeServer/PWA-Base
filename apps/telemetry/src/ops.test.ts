import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "./db/store.js";
import { DiagnosticsTracker } from "./diagnostics.js";
import { buildNetworkRows, buildOpsReport, enrichEventRows } from "./ops.js";
import type { TelemetryRuntimeConfig } from "./config.js";
import { buildHealthReport } from "./health.js";

describe("ops report builders", () => {
  it("builds network rows and pipeline from diagnostics", () => {
    const dir = mkdtempSync(join(tmpdir(), "ops-"));
    const dbPath = join(dir, "t.sqlite");
    const store = openStore(dbPath);
    const diagnostics = new DiagnosticsTracker();
    diagnostics.recordHook({
      receivedAt: new Date().toISOString(),
      sourceIp: "10.0.0.2",
      userAgent: "test",
      hookType: "beforeSubmitPrompt",
    });
    diagnostics.markSqliteOk();
    const config: TelemetryRuntimeConfig = {
      host: "0.0.0.0",
      port: 4310,
      dbPath,
      artifactsDir: join(dir, "artifacts"),
      version: "0.1.7-test",
      idleTimeoutMs: 1_800_000,
      idleSoftMs: 900_000,
      supervisorIntervalMs: 30_000,
      taskCompletionGraceMs: 60_000,
    };
    const report = buildOpsReport({
      config,
      diagnostics,
      store,
      settings: store.getSettings(),
      wsClients: 1,
      environment: "test",
    });
    expect(report.network.some((r) => r.id === "telemetry-api")).toBe(true);
    expect(report.pipeline[0]?.id).toBe("hook");
    expect(report.pipeline[0]?.totalProcessed).toBeGreaterThan(0);
    expect(report.database.path).toBe(dbPath);
    expect(report.runtime.websocketEnabled).toBe(true);
    expect(typeof report.runtime.dockerBackend).toBe("boolean");
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("marks websocket amber when no clients", () => {
    const health = buildHealthReport({
      config: {
        host: "0.0.0.0",
        port: 4310,
        dbPath: "/tmp/x.sqlite",
        artifactsDir: "/tmp/x-artifacts",
        version: "0.1.7",
      idleTimeoutMs: 1_800_000,
      idleSoftMs: 900_000,
      supervisorIntervalMs: 30_000,
      taskCompletionGraceMs: 60_000,
      },
      diagnostics: new DiagnosticsTracker(),
      settings: {
        sqlitePath: "/tmp/x.sqlite",
        notificationProvider: "none",
        ntfyServer: "https://ntfy.sh",
        ntfyTopic: "",
      },
      wsClients: 0,
    });
    const rows = buildNetworkRows({
      config: {
        host: "0.0.0.0",
        port: 4310,
        dbPath: "/tmp/x.sqlite",
        artifactsDir: "/tmp/x-artifacts",
        version: "0.1.7",
      idleTimeoutMs: 1_800_000,
      idleSoftMs: 900_000,
      supervisorIntervalMs: 30_000,
      taskCompletionGraceMs: 60_000,
      },
      health,
      wsClients: 0,
    });
    expect(rows.find((r) => r.id === "websocket")?.tone).toBe("amber");
  });

  it("enriches recent events with run metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "ops-ev-"));
    const store = openStore(join(dir, "t.sqlite"));
    store.insertPrompt({
      id: "p1",
      prompt: "hi",
      title: "hi",
      createdAt: "2026-01-01T00:00:00.000Z",
      conversationId: "c1",
      model: null,
    });
    store.insertTask({
      id: "t1",
      title: "hi",
      promptText: "hi",
      conversationId: "c1",
      createdAt: "2026-01-01T00:00:00.000Z",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:05.000Z",
      durationMs: 5000,
      status: "completed",
      completionSummary: null,
      completionKind: "automatic",
      manualCompletionReason: null,
      manualCompletionNote: null,
      completionReason: "all_runs_terminal_with_summary",
      needsReview: false,
    });
    store.insertRun({
      id: "r1",
      promptId: "p1",
      taskId: "t1",
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: "2026-01-01T00:00:05.000Z",
      durationMs: 5000,
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
    store.insertEvent({
      id: "e1",
      runId: "r1",
      timestamp: "2026-01-01T00:00:01.000Z",
      type: "prompt_submitted",
      summary: "hi",
      payloadJson: JSON.stringify({
        generation_id: "g1",
        _telemetry: { sourceIp: "1.2.3.4", userAgent: "ua" },
      }),
    });
    const rows = enrichEventRows(store, { limit: 10 });
    expect(rows[0]?.eventType).toBe("prompt_submitted");
    expect(rows[0]?.promptId).toBe("p1");
    expect(rows[0]?.sourceIp).toBe("1.2.3.4");
    expect(rows[0]?.correlationId).toBe("g1");
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
