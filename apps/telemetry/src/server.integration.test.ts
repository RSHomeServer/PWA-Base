import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { openStore } from "./db/store.js";
import { DiagnosticsTracker } from "./diagnostics.js";
import { createTelemetryServer } from "./server.js";
import { TelemetryService } from "./service.js";
import type { TelemetryRuntimeConfig } from "./config.js";

const dirs: string[] = [];
const closers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (closers.length) {
    const close = closers.pop();
    if (close) await close();
  }
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

async function boot(bindHost = "127.0.0.1") {
  const dir = mkdtempSync(join(tmpdir(), "telemetry-srv-"));
  dirs.push(dir);
  const dbPath = join(dir, "t.sqlite");
  const store = openStore(dbPath);
  const diagnostics = new DiagnosticsTracker();
  const config: TelemetryRuntimeConfig = {
    host: bindHost,
    port: 0,
    dbPath,
    artifactsDir: join(dir, "artifacts"),
    version: "0.1.6-test",
      idleTimeoutMs: 1_800_000,
      idleSoftMs: 900_000,
      supervisorIntervalMs: 30_000,
      taskCompletionGraceMs: 60_000,
  };
  const hubHolder: { broadcast: (m: unknown) => void } = {
    broadcast: () => undefined,
  };
  const service = new TelemetryService(
    store,
    (m) => hubHolder.broadcast(m),
    () => diagnostics.markWebsocketBroadcast(),
  );
  const server = await createTelemetryServer(service, {
    host: bindHost,
    port: 0,
    config,
    diagnostics,
  });
  hubHolder.broadcast = (m) => server.hub.broadcast(m as never);
  closers.push(async () => {
    await server.close();
    store.close();
  });
  const base = `http://127.0.0.1:${server.port}`;
  return { server, service, store, base, diagnostics, config };
}

describe("telemetry server (integration)", () => {
  it("binds, serves enriched health, and only then is reachable", async () => {
    const { base, server } = await boot();
    expect(server.port).toBeGreaterThan(0);
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      version: string;
      configuredHost: string;
      listener: string;
      sqlite: { ok: boolean; path: string };
      websocket: { clients: number };
      notifications: { provider: string };
    };
    expect(body.ok).toBe(true);
    expect(body.version).toBe("0.1.6-test");
    expect(body.configuredHost).toBe("127.0.0.1");
    expect(body.sqlite.ok).toBe(true);
    expect(body.websocket.clients).toBe(0);
    expect(body.notifications.provider).toBeTruthy();
  });

  it("binds on 0.0.0.0 when configured", async () => {
    const { server } = await boot("0.0.0.0");
    expect(server.host).toBe("0.0.0.0");
    expect(server.port).toBeGreaterThan(0);
    const res = await fetch(`http://127.0.0.1:${server.port}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { configuredHost: string; listener: string };
    expect(body.configuredHost).toBe("0.0.0.0");
    expect(body.listener.startsWith("0.0.0.0:")).toBe(true);
  });

  it("rejects a second bind on the same port with a clear error", async () => {
    const { server, config } = await boot();
    const dir = mkdtempSync(join(tmpdir(), "telemetry-srv2-"));
    dirs.push(dir);
    const store = openStore(join(dir, "t2.sqlite"));
    const service = new TelemetryService(store, () => undefined);
    await expect(
      createTelemetryServer(service, {
        host: "127.0.0.1",
        port: server.port,
        config: { ...config, host: "127.0.0.1", port: server.port },
        diagnostics: new DiagnosticsTracker(),
      }),
    ).rejects.toThrow(/already in use/);
    store.close();
  }, 10_000);

  it("ingests a full prompt→stop lifecycle over HTTP and records source diagnostics", async () => {
    const { base, diagnostics } = await boot();

    const start = await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "integration-test/1.0" },
      body: JSON.stringify({
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: "c-int",
        generation_id: "g-int",
        prompt: "Integration smoke test",
      }),
    });
    expect(start.status).toBe(200);
    const startBody = (await start.json()) as { runId: string; eventType: string };
    expect(startBody.eventType).toBe("prompt_submitted");
    expect(startBody.runId).toBeTruthy();

    const snap = diagnostics.snapshot();
    expect(snap.lastHook?.hookType).toBe("beforeSubmitPrompt");
    expect(snap.lastHook?.userAgent).toBe("integration-test/1.0");
    expect(snap.lastHook?.sourceIp).toBeTruthy();

    const live = await fetch(`${base}/api/live`);
    const liveBody = (await live.json()) as {
      run: { status: string; id: string } | null;
      prompt: { title: string } | null;
    };
    expect(liveBody.run?.status).toBe("running");
    expect(liveBody.prompt?.title).toBe("Integration smoke test");

    await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "afterShellExecution",
        conversation_id: "c-int",
        generation_id: "g-int",
        command: "pnpm test",
      }),
    });

    await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "stop",
        conversation_id: "c-int",
        generation_id: "g-int",
        status: "completed",
      }),
    });

    const runs = await fetch(`${base}/api/runs`);
    const runsBody = (await runs.json()) as {
      items: Array<{ run: { status: string; durationMs: number | null }; eventCount: number }>;
    };
    expect(runsBody.items[0]?.run.status).toBe("completed");
    expect(runsBody.items[0]?.run.durationMs).toBeGreaterThanOrEqual(0);
    expect(runsBody.items[0]?.eventCount).toBeGreaterThanOrEqual(3);

    const detail = await fetch(`${base}/api/runs/${encodeURIComponent(startBody.runId)}`);
    const detailBody = (await detail.json()) as {
      events: Array<{ payloadJson: string }>;
    };
    const firstPayload = JSON.parse(detailBody.events[0]!.payloadJson) as {
      _telemetry?: { sourceIp?: string };
    };
    expect(firstPayload._telemetry?.sourceIp).toBeTruthy();

    const after = await fetch(`${base}/api/live`);
    const afterBody = (await after.json()) as {
      run: { status: string; id: string; completionSummary?: { executiveSummary?: string } | null } | null;
    };
    // Completed run remains visible until the next prompt starts.
    expect(afterBody.run?.status).toBe("completed");
    expect(afterBody.run?.id).toBe(startBody.runId);

    const summaryPut = await fetch(
      `${base}/api/runs/${encodeURIComponent(startBody.runId)}/completion-summary`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executiveSummary: "Integration executive summary",
          filesModified: [{ area: "API", files: ["server.ts"] }],
          testingPerformed: [{ check: "integration", status: "pass", detail: "" }],
          testsPassed: true,
          gitCommit: "abcdef1",
        }),
      },
    );
    expect(summaryPut.status).toBe(200);
    const summaryBody = (await summaryPut.json()) as {
      run: { completionSummary: { executiveSummary: string; gitCommit: string } };
    };
    expect(summaryBody.run.completionSummary.executiveSummary).toBe("Integration executive summary");
    expect(summaryBody.run.completionSummary.gitCommit).toBe("abcdef1");
  });

  it("pushes websocket hello and run updates", async () => {
    const { server, base } = await boot();

    const frames: Array<{ kind: string }> = [];
    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("ws hello timeout")), 5000);
      ws.once("error", reject);
      ws.once("message", (data) => {
        clearTimeout(timer);
        frames.push(JSON.parse(String(data)) as { kind: string });
        resolve();
      });
    });
    expect(frames[0]?.kind).toBe("hello");

    const gotUpdate = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("ws update timeout")), 5000);
      ws.on("message", (data) => {
        frames.push(JSON.parse(String(data)) as { kind: string });
        if (frames.some((f) => f.kind === "run.updated")) {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    const ingest = await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "beforeSubmitPrompt",
        prompt: "WS probe",
      }),
    });
    expect(ingest.status).toBe(200);

    await gotUpdate;
    ws.close();
    expect(frames.some((f) => f.kind === "run.updated")).toBe(true);
  }, 10_000);

  it("rejects invalid JSON on /hooks", async () => {
    const { base } = await boot();
    const res = await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("serves ops report, event stream, and connectivity tests", async () => {
    const { base } = await boot();

    const opsRes = await fetch(`${base}/api/ops`);
    expect(opsRes.status).toBe(200);
    const ops = (await opsRes.json()) as {
      network: Array<{ id: string }>;
      pipeline: Array<{ id: string }>;
      database: { writable: boolean; path: string };
      runtime: { version: string; websocketEnabled: boolean };
    };
    expect(ops.network.some((r) => r.id === "telemetry-api")).toBe(true);
    expect(ops.pipeline.map((p) => p.id)).toEqual([
      "hook",
      "api",
      "sqlite",
      "websocket",
      "dashboard",
    ]);
    expect(ops.database.writable).toBe(true);
    expect(ops.runtime.websocketEnabled).toBe(true);

    const apiTest = await fetch(`${base}/api/ops/test/api`, { method: "POST", body: "{}" });
    expect(apiTest.status).toBe(200);
    expect(((await apiTest.json()) as { ok: boolean }).ok).toBe(true);

    const sqliteTest = await fetch(`${base}/api/ops/test/sqlite`, { method: "POST", body: "{}" });
    expect(sqliteTest.status).toBe(200);

    const wsTest = await fetch(`${base}/api/ops/test/websocket`, { method: "POST", body: "{}" });
    expect(wsTest.status).toBe(200);

    const eventTest = await fetch(`${base}/api/ops/test/event`, { method: "POST", body: "{}" });
    expect(eventTest.status).toBe(200);
    const eventBody = (await eventTest.json()) as { ok: boolean; runId?: string };
    expect(eventBody.ok).toBe(true);
    expect(eventBody.runId).toBeTruthy();

    const eventsRes = await fetch(`${base}/api/ops/events?limit=50`);
    expect(eventsRes.status).toBe(200);
    const events = (await eventsRes.json()) as {
      items: Array<{ eventType: string; runId: string }>;
    };
    expect(events.items.length).toBeGreaterThan(0);
    expect(events.items[0]?.eventType).toBeTruthy();

    const filtered = await fetch(`${base}/api/ops/events?type=prompt_submitted`);
    const filteredBody = (await filtered.json()) as { items: Array<{ eventType: string }> };
    expect(filteredBody.items.every((e) => e.eventType === "prompt_submitted")).toBe(true);
  });

  it("wires a run_completed inbox notification and pushes it over websocket", async () => {
    const { base, server } = await boot();

    const frames: Array<Record<string, unknown>> = [];
    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("ws hello timeout")), 5000);
      ws.once("message", (data) => {
        clearTimeout(timer);
        frames.push(JSON.parse(String(data)) as Record<string, unknown>);
        resolve();
      });
    });

    const gotNotification = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("notification.created timeout")), 5000);
      ws.on("message", (data) => {
        const frame = JSON.parse(String(data)) as Record<string, unknown>;
        frames.push(frame);
        if (frame.kind === "notification.created") {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: "c-notif",
        generation_id: "g-notif",
        prompt: "Notification wiring test",
      }),
    });
    await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "stop",
        conversation_id: "c-notif",
        generation_id: "g-notif",
        status: "completed",
      }),
    });

    await gotNotification;
    ws.close();

    const created = frames.find((f) => f.kind === "notification.created") as
      | { notification: { category: string; runId: string } }
      | undefined;
    expect(created?.notification.category).toBe("run_completed");
    expect(created?.notification.runId).toBeTruthy();

    const unreadRes = await fetch(`${base}/api/inbox/unread-count`);
    const unread = (await unreadRes.json()) as { count: number };
    expect(unread.count).toBeGreaterThanOrEqual(1);

    const listRes = await fetch(`${base}/api/inbox?category=run_completed`);
    const listBody = (await listRes.json()) as { items: Array<{ id: string; category: string }> };
    expect(listBody.items.length).toBeGreaterThanOrEqual(1);
    expect(listBody.items[0]?.category).toBe("run_completed");
  }, 10_000);

  it("exposes the inbox CRUD API for system-posted events (deploy scripts, capture CLI)", async () => {
    const { base } = await boot();

    const created = await fetch(`${base}/api/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "deployment_completed",
        title: "Deploy finished",
        body: "Production deploy finished cleanly",
        metadata: { env: "prod" },
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      notification: { id: string; readAt: string | null };
    };
    const id = createdBody.notification.id;
    expect(createdBody.notification.readAt).toBeNull();

    const listRes = await fetch(`${base}/api/inbox`);
    const listBody = (await listRes.json()) as { items: Array<{ id: string }> };
    expect(listBody.items.some((n) => n.id === id)).toBe(true);

    const patchRes = await fetch(`${base}/api/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = (await patchRes.json()) as { readAt: string | null };
    expect(patchBody.readAt).not.toBeNull();

    const unreadRes = await fetch(`${base}/api/inbox?unread=1`);
    const unreadBody = (await unreadRes.json()) as { items: Array<{ id: string }> };
    expect(unreadBody.items.some((n) => n.id === id)).toBe(false);

    const markAll = await fetch(`${base}/api/inbox/mark-all-read`, { method: "POST" });
    expect(markAll.status).toBe(200);
    const markAllBody = (await markAll.json()) as { updated: number };
    expect(markAllBody.updated).toBeGreaterThanOrEqual(0);

    const prefsRes = await fetch(`${base}/api/notification-preferences`);
    const prefsBody = (await prefsRes.json()) as { items: Array<{ category: string }> };
    expect(prefsBody.items.length).toBeGreaterThanOrEqual(11);

    const prefsPut = await fetch(`${base}/api/notification-preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: [{ category: "deployment_completed", browserEnabled: false }],
      }),
    });
    expect(prefsPut.status).toBe(200);
    const prefsPutBody = (await prefsPut.json()) as {
      items: Array<{ category: string; browserEnabled: boolean }>;
    };
    expect(
      prefsPutBody.items.find((p) => p.category === "deployment_completed")?.browserEnabled,
    ).toBe(false);

    const suppressed = await fetch(`${base}/api/inbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "deployment_completed",
        title: "Should be suppressed",
        body: "Browser channel disabled",
      }),
    });
    const suppressedBody = (await suppressed.json()) as { notification: unknown | null };
    expect(suppressedBody.notification).toBeNull();

    const deleteRes = await fetch(`${base}/api/inbox/${id}`, { method: "DELETE" });
    expect(deleteRes.status).toBe(200);

    const clearRes = await fetch(`${base}/api/inbox`, { method: "DELETE" });
    expect(clearRes.status).toBe(200);
    const afterClear = await fetch(`${base}/api/inbox`);
    const afterClearBody = (await afterClear.json()) as { items: unknown[] };
    expect(afterClearBody.items).toHaveLength(0);
  });

  it("supports manual completion override for a running run", async () => {
    const { base } = await boot();
    const started = await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: "c-manual",
        generation_id: "g-manual",
        prompt: "Manual completion test",
      }),
    });
    const startBody = (await started.json()) as { runId: string };
    const res = await fetch(`${base}/api/runs/${encodeURIComponent(startBody.runId)}/manual-complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "terminal_closed", note: "Operator override" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      run: {
        status: string;
        completionKind: string | null;
        manualCompletionReason: string | null;
        manualCompletionNote: string | null;
      };
      event: { type: string; payloadJson: string };
    };
    expect(body.run.status).toBe("completed");
    expect(body.run.completionKind).toBe("manual");
    expect(body.run.manualCompletionReason).toBe("terminal_closed");
    expect(body.run.manualCompletionNote).toBe("Operator override");
    expect(body.event.type).toBe("manual_completion");
    expect(JSON.parse(body.event.payloadJson)).toEqual({
      reason: "terminal_closed",
      note: "Operator override",
    });
  });

  it("deletes a run via DELETE /api/runs/:id", async () => {
    const { base } = await boot();
    const started = await fetch(`${base}/hooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: "c-delete",
        generation_id: "g-delete",
        prompt: "Delete me",
      }),
    });
    const startBody = (await started.json()) as { runId: string };
    const del = await fetch(`${base}/api/runs/${encodeURIComponent(startBody.runId)}`, {
      method: "DELETE",
    });
    expect(del.status).toBe(200);
    const missing = await fetch(`${base}/api/runs/${encodeURIComponent(startBody.runId)}`);
    expect(missing.status).toBe(404);
  });
});
