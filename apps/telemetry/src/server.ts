import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { WebSocketServer } from "ws";
import type { TelemetryRuntimeConfig } from "./config.js";
import type { DiagnosticsTracker } from "./diagnostics.js";
import { buildHealthReport, clientIpFromRequest } from "./health.js";
import { buildOpsReport, enrichEventRows } from "./ops.js";
import type { TelemetryService } from "./service.js";
import type { SettingsRecord } from "./types.js";
import { isNotificationCategory, type NotificationPreferencePatch } from "./notify/inbox-types.js";
import { WsHub } from "./ws/hub.js";
import type { ManualCompletionReason } from "./service.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(payload);
}

function notFound(res: ServerResponse): void {
  sendJson(res, 404, { error: "not_found" });
}

export interface ServerHandles {
  httpServer: ReturnType<typeof createServer>;
  hub: WsHub;
  host: string;
  port: number;
  close: () => Promise<void>;
}

export interface CreateServerOptions {
  host: string;
  port: number;
  config: TelemetryRuntimeConfig;
  diagnostics: DiagnosticsTracker;
}

/**
 * Creates the HTTP + WebSocket server and waits until the port is actually bound.
 * Rejects with a clear error on EADDRINUSE / other listen failures — callers must
 * not log "listening" until this promise resolves.
 */
export async function createTelemetryServer(
  service: TelemetryService,
  opts: CreateServerOptions,
): Promise<ServerHandles> {
  let hubRef: WsHub | null = null;

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const method = req.method ?? "GET";

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    try {
      if (method === "GET" && url.pathname === "/health") {
        const health = buildHealthReport({
          config: opts.config,
          diagnostics: opts.diagnostics,
          settings: service.getSettings(),
          wsClients: hubRef?.clientCount ?? 0,
        });
        sendJson(res, health.ok ? 200 : 503, health);
        return;
      }

      if (method === "POST" && (url.pathname === "/hooks" || url.pathname === "/ingest")) {
        const rawText = await readBody(req);
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          sendJson(res, 400, {
            error: "invalid_json",
            message: "Hook body must be valid JSON from Cursor stdin.",
          });
          return;
        }

        const sourceIp = clientIpFromRequest(req);
        const userAgentHeader = req.headers["user-agent"];
        const userAgent = typeof userAgentHeader === "string" ? userAgentHeader : null;
        const hookType =
          parsed !== null &&
          typeof parsed === "object" &&
          !Array.isArray(parsed) &&
          typeof (parsed as { hook_event_name?: unknown }).hook_event_name === "string"
            ? String((parsed as { hook_event_name: string }).hook_event_name)
            : "unknown";

        opts.diagnostics.recordHook({
          receivedAt: new Date().toISOString(),
          sourceIp,
          userAgent,
          hookType,
        });

        try {
          const result = await service.ingest(parsed, { sourceIp, userAgent });
          opts.diagnostics.markSqliteOk();
          sendJson(res, 200, { ...result, continue: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (/sqlite|database|disk|readonly/i.test(message)) {
            opts.diagnostics.markSqliteError(message);
            sendJson(res, 503, {
              error: "sqlite_unavailable",
              message,
              continue: true,
            });
            return;
          }
          sendJson(res, 500, {
            error: "ingest_failed",
            message,
            continue: true,
          });
        }
        return;
      }

      if (method === "GET" && url.pathname === "/api/live") {
        sendJson(res, 200, service.getLiveRun());
        return;
      }

      if (method === "GET" && url.pathname === "/api/runs") {
        const sort = (url.searchParams.get("sort") ?? "started_at") as
          "started_at" | "duration_ms" | "status";
        const dir = (url.searchParams.get("dir") ?? "desc") as "asc" | "desc";
        sendJson(res, 200, { items: service.listRuns({ sort, dir }) });
        return;
      }

      if (method === "GET" && url.pathname === "/api/tasks") {
        sendJson(res, 200, { items: service.listTasks() });
        return;
      }

      if (method === "GET" && url.pathname === "/api/lifecycle/diagnostics") {
        sendJson(res, 200, service.getLifecycleDiagnostics());
        return;
      }

      {
        const taskSummary = url.pathname.match(/^\/api\/tasks\/([^/]+)\/completion-summary$/);
        if (method === "PUT" && taskSummary) {
          const id = decodeURIComponent(taskSummary[1]!);
          const rawText = await readBody(req);
          let patch: unknown;
          try {
            patch = JSON.parse(rawText);
          } catch {
            sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
            return;
          }
          const updated = service.updateTaskCompletionSummary(id, patch as never);
          if (!updated) {
            notFound(res);
            return;
          }
          sendJson(res, 200, {
            task: updated.task,
            reportValidation: updated.reportValidation,
          });
          return;
        }
      }

      {
        const taskComplete = url.pathname.match(/^\/api\/tasks\/([^/]+)\/complete$/);
        if (method === "POST" && taskComplete) {
          const id = decodeURIComponent(taskComplete[1]!);
          const rawText = await readBody(req);
          let body: Record<string, unknown> = {};
          try {
            body = rawText.length > 0 ? (JSON.parse(rawText) as Record<string, unknown>) : {};
          } catch {
            sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
            return;
          }
          const reason =
            typeof body.reason === "string" ? body.reason : "cursor_completed";
          const allowed = new Set([
            "cursor_completed",
            "cursor_crashed",
            "terminal_closed",
            "other",
          ]);
          if (!allowed.has(reason)) {
            sendJson(res, 400, {
              error: "invalid_reason",
              message: "Reason must be cursor_completed, cursor_crashed, terminal_closed, or other.",
            });
            return;
          }
          const out = service.manualCompleteTask(
            id,
            reason as ManualCompletionReason,
            typeof body.note === "string" ? body.note : null,
          );
          if (!out) {
            sendJson(res, 409, {
              error: "task_not_open",
              message: "Task not found or already finished.",
            });
            return;
          }
          sendJson(res, 200, out);
          return;
        }
      }

      {
        const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);
        if (method === "GET" && taskMatch) {
          const id = decodeURIComponent(taskMatch[1]!);
          const detail = service.getTaskDetail(id);
          if (!detail) {
            notFound(res);
            return;
          }
          sendJson(res, 200, detail);
          return;
        }
      }

      {
        const summaryMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/completion-summary$/);
        if (method === "PUT" && summaryMatch) {
          const id = decodeURIComponent(summaryMatch[1]!);
          const rawText = await readBody(req);
          let patch: unknown;
          try {
            patch = JSON.parse(rawText);
          } catch {
            sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
            return;
          }
          const updated = service.updateCompletionSummary(id, patch as never);
          if (!updated) {
            notFound(res);
            return;
          }
          sendJson(res, 200, {
            run: updated.run,
            reportValidation: updated.reportValidation,
          });
          return;
        }
      }

      {
        const completeMatch = url.pathname.match(/^\/api\/runs\/([^/]+)\/manual-complete$/);
        if (method === "POST" && completeMatch) {
          const id = decodeURIComponent(completeMatch[1]!);
          const rawText = await readBody(req);
          let body: Record<string, unknown> = {};
          try {
            body = rawText.length > 0 ? (JSON.parse(rawText) as Record<string, unknown>) : {};
          } catch {
            sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
            return;
          }
          const reason =
            typeof body.reason === "string" ? body.reason : "cursor_completed";
          const allowed = new Set<ManualCompletionReason>([
            "cursor_completed",
            "cursor_crashed",
            "terminal_closed",
            "other",
          ]);
          if (!allowed.has(reason as ManualCompletionReason)) {
            sendJson(res, 400, {
              error: "invalid_reason",
              message: "Reason must be cursor_completed, cursor_crashed, terminal_closed, or other.",
            });
            return;
          }
          const out = service.manualCompleteRun(
            id,
            reason as ManualCompletionReason,
            typeof body.note === "string" ? body.note : null,
          );
          if (!out) {
            sendJson(res, 409, {
              error: "run_not_running",
              message: "Run not found or already finished.",
            });
            return;
          }
          sendJson(res, 200, out);
          return;
        }
      }

      {
        const artifactsList = url.pathname.match(/^\/api\/runs\/([^/]+)\/artifacts$/);
        if (artifactsList) {
          const runId = decodeURIComponent(artifactsList[1]!);
          if (method === "GET") {
            if (!service.getRunDetail(runId)) {
              notFound(res);
              return;
            }
            sendJson(res, 200, { items: service.listArtifacts(runId) });
            return;
          }
          if (method === "POST") {
            const rawText = await readBody(req);
            let body: Record<string, unknown>;
            try {
              body = JSON.parse(rawText) as Record<string, unknown>;
            } catch {
              sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
              return;
            }
            const contentBase64 = typeof body.contentBase64 === "string" ? body.contentBase64 : "";
            if (!contentBase64) {
              sendJson(res, 400, {
                error: "missing_content",
                message: "contentBase64 is required (files are not embedded in hook payloads).",
              });
              return;
            }
            let bytes: Buffer;
            try {
              bytes = Buffer.from(contentBase64, "base64");
            } catch {
              sendJson(res, 400, { error: "invalid_base64" });
              return;
            }
            const filename =
              typeof body.filename === "string" && body.filename.length > 0
                ? body.filename
                : "artifact.bin";
            const kind =
              typeof body.kind === "string" ? body.kind : "screenshot";
            try {
              const artifact = service.addArtifact(runId, {
                kind: kind as never,
                pageKey: typeof body.pageKey === "string" ? body.pageKey : null,
                pageLabel: typeof body.pageLabel === "string" ? body.pageLabel : null,
                phase:
                  body.phase === "before" || body.phase === "after" ? body.phase : null,
                filename,
                mimeType: typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream",
                caption: typeof body.caption === "string" ? body.caption : null,
                bytes,
              });
              if (!artifact) {
                notFound(res);
                return;
              }
              sendJson(res, 201, { artifact });
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              sendJson(res, 409, { error: "artifact_conflict", message });
            }
            return;
          }
        }
      }

      {
        const artifactContent = url.pathname.match(
          /^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)\/content$/,
        );
        if (method === "GET" && artifactContent) {
          const artifactId = decodeURIComponent(artifactContent[2]!);
          const packed = service.readArtifactBytes(artifactId);
          if (!packed || packed.artifact.runId !== decodeURIComponent(artifactContent[1]!)) {
            notFound(res);
            return;
          }
          res.writeHead(200, {
            "Content-Type": packed.artifact.mimeType,
            "Content-Length": String(packed.bytes.byteLength),
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(packed.bytes);
          return;
        }
      }

      {
        const artifactOne = url.pathname.match(/^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)$/);
        if (method === "DELETE" && artifactOne) {
          const artifactId = decodeURIComponent(artifactOne[2]!);
          const existing = service.getArtifact(artifactId);
          if (!existing || existing.runId !== decodeURIComponent(artifactOne[1]!)) {
            notFound(res);
            return;
          }
          service.deleteArtifact(artifactId);
          sendJson(res, 200, { ok: true });
          return;
        }
      }

      if (
        (method === "GET" || method === "DELETE") &&
        url.pathname.startsWith("/api/runs/")
      ) {
        const id = url.pathname.slice("/api/runs/".length);
        if (id.includes("/")) {
          notFound(res);
          return;
        }
        if (method === "DELETE") {
          const deleted = service.deleteRun(decodeURIComponent(id));
          if (!deleted) {
            notFound(res);
            return;
          }
          sendJson(res, 200, { ok: true, runId: decodeURIComponent(id) });
          return;
        }
        const detail = service.getRunDetail(decodeURIComponent(id));
        if (!detail) {
          notFound(res);
          return;
        }
        sendJson(res, 200, detail);
        return;
      }

      if (method === "GET" && url.pathname === "/api/prompts") {
        sendJson(res, 200, { items: service.listPrompts() });
        return;
      }

      if (method === "GET" && url.pathname.startsWith("/api/prompts/")) {
        const id = url.pathname.slice("/api/prompts/".length);
        const detail = service.getPromptDetail(id);
        if (!detail) {
          notFound(res);
          return;
        }
        sendJson(res, 200, detail);
        return;
      }

      if (method === "GET" && url.pathname === "/api/settings") {
        sendJson(res, 200, service.getSettings());
        return;
      }

      if (method === "GET" && url.pathname === "/api/diagnostics") {
        opts.diagnostics.markDashboardPoll();
        sendJson(
          res,
          200,
          buildHealthReport({
            config: opts.config,
            diagnostics: opts.diagnostics,
            settings: service.getSettings(),
            wsClients: hubRef?.clientCount ?? 0,
          }),
        );
        return;
      }

      if (method === "GET" && url.pathname === "/api/ops") {
        opts.diagnostics.markDashboardPoll();
        sendJson(
          res,
          200,
          buildOpsReport({
            config: opts.config,
            diagnostics: opts.diagnostics,
            store: service.getStore(),
            settings: service.getSettings(),
            wsClients: hubRef?.clientCount ?? 0,
          }),
        );
        return;
      }

      if (method === "GET" && url.pathname === "/api/ops/events") {
        opts.diagnostics.markDashboardPoll();
        const type = url.searchParams.get("type") ?? undefined;
        const limit = Number(url.searchParams.get("limit") ?? "100");
        sendJson(res, 200, {
          items: enrichEventRows(service.getStore(), {
            type: type || undefined,
            limit: Number.isFinite(limit) ? limit : 100,
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname === "/api/ops/test/api") {
        const started = Date.now();
        sendJson(res, 200, {
          ok: true,
          elapsedMs: Date.now() - started,
          message: "Telemetry API responding",
        });
        return;
      }

      if (method === "POST" && url.pathname === "/api/ops/test/sqlite") {
        const started = Date.now();
        try {
          const settings = service.getSettings();
          service.getStore().getAggregateStats();
          opts.diagnostics.markSqliteOk();
          sendJson(res, 200, {
            ok: true,
            elapsedMs: Date.now() - started,
            message: `SQLite readable at ${settings.sqlitePath}`,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          opts.diagnostics.markSqliteError(message);
          sendJson(res, 503, { ok: false, elapsedMs: Date.now() - started, message });
        }
        return;
      }

      if (method === "POST" && url.pathname === "/api/ops/test/websocket") {
        const started = Date.now();
        const clients = hubRef?.clientCount ?? 0;
        opts.diagnostics.markWebsocketBroadcast();
        sendJson(res, 200, {
          ok: true,
          elapsedMs: Date.now() - started,
          message: `WebSocket hub active with ${clients} connected client(s)`,
          clients,
        });
        return;
      }

      if (method === "POST" && url.pathname === "/api/ops/test/event") {
        const started = Date.now();
        const sourceIp = clientIpFromRequest(req);
        const payload = {
          hook_event_name: "beforeSubmitPrompt",
          conversation_id: `ops-test-${Date.now()}`,
          generation_id: `ops-gen-${Date.now()}`,
          prompt: `[ops] Generated test event at ${new Date().toISOString()}`,
        };
        opts.diagnostics.recordHook({
          receivedAt: new Date().toISOString(),
          sourceIp,
          userAgent: "ops-diagnostics/1.7",
          hookType: "beforeSubmitPrompt",
        });
        try {
          const result = await service.ingest(payload, {
            sourceIp,
            userAgent: "ops-diagnostics/1.7",
          });
          opts.diagnostics.markSqliteOk();
          sendJson(res, 200, {
            ...result,
            ok: true,
            elapsedMs: Date.now() - started,
            message: "Test event ingested",
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          opts.diagnostics.recordFailure("api", message);
          sendJson(res, 500, { ok: false, elapsedMs: Date.now() - started, message });
        }
        return;
      }

      if (method === "PUT" && url.pathname === "/api/settings") {
        const rawText = await readBody(req);
        let patch: Partial<SettingsRecord>;
        try {
          patch = JSON.parse(rawText) as Partial<SettingsRecord>;
        } catch {
          sendJson(res, 400, { error: "invalid_json", message: "Settings body must be JSON." });
          return;
        }
        sendJson(res, 200, service.updateSettings(patch));
        return;
      }

      if (method === "GET" && url.pathname === "/api/inbox/unread-count") {
        sendJson(res, 200, { count: service.getNotifications().unreadCount() });
        return;
      }

      if (method === "GET" && url.pathname === "/api/inbox") {
        const categoryParam = url.searchParams.get("category");
        const category =
          categoryParam && isNotificationCategory(categoryParam) ? categoryParam : undefined;
        const unread = url.searchParams.get("unread");
        const q = url.searchParams.get("q") ?? undefined;
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? Number(limitParam) : undefined;
        sendJson(res, 200, {
          items: service.getNotifications().list({
            category,
            unreadOnly: unread === "1" || unread === "true",
            q,
            limit: limit && Number.isFinite(limit) ? limit : undefined,
          }),
        });
        return;
      }

      if (method === "POST" && url.pathname === "/api/inbox") {
        const rawText = await readBody(req);
        let body: Record<string, unknown>;
        try {
          body = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
          return;
        }
        const category = body.category;
        const title = body.title;
        const notifyBody = body.body;
        if (
          !isNotificationCategory(category) ||
          typeof title !== "string" ||
          title.length === 0 ||
          typeof notifyBody !== "string"
        ) {
          sendJson(res, 400, {
            error: "invalid_notification",
            message: "category, title, and body are required.",
          });
          return;
        }
        const notification = service.getNotifications().notify({
          category,
          title,
          body: notifyBody,
          href: typeof body.href === "string" ? body.href : null,
          runId: typeof body.runId === "string" ? body.runId : null,
          metadata:
            body.metadata !== null && typeof body.metadata === "object"
              ? (body.metadata as Record<string, unknown>)
              : null,
        });
        if (!notification) {
          sendJson(res, 200, { notification: null, message: "Category disabled for browser channel." });
          return;
        }
        sendJson(res, 201, { notification });
        return;
      }

      if (method === "DELETE" && url.pathname === "/api/inbox") {
        service.getNotifications().clear();
        sendJson(res, 200, { ok: true });
        return;
      }

      if (method === "POST" && url.pathname === "/api/inbox/mark-all-read") {
        const updated = service.getNotifications().markAllRead();
        sendJson(res, 200, { updated });
        return;
      }

      {
        const inboxOne = url.pathname.match(/^\/api\/inbox\/([^/]+)$/);
        if (inboxOne) {
          const id = decodeURIComponent(inboxOne[1]!);
          if (method === "PATCH") {
            const rawText = await readBody(req);
            let body: Record<string, unknown>;
            try {
              body = JSON.parse(rawText) as Record<string, unknown>;
            } catch {
              sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
              return;
            }
            const read = body.read !== false;
            const updated = service.getNotifications().markRead(id, read);
            if (!updated) {
              notFound(res);
              return;
            }
            sendJson(res, 200, updated);
            return;
          }
          if (method === "DELETE") {
            const deleted = service.getNotifications().delete(id);
            if (!deleted) {
              notFound(res);
              return;
            }
            sendJson(res, 200, { ok: true });
            return;
          }
        }
      }

      if (method === "GET" && url.pathname === "/api/notification-preferences") {
        sendJson(res, 200, { items: service.getNotifications().getPreferences() });
        return;
      }

      if (method === "PUT" && url.pathname === "/api/notification-preferences") {
        const rawText = await readBody(req);
        let body: unknown;
        try {
          body = JSON.parse(rawText);
        } catch {
          sendJson(res, 400, { error: "invalid_json", message: "Body must be JSON." });
          return;
        }
        const record = body as { preferences?: unknown; category?: unknown };
        const rawPatches = Array.isArray(record.preferences)
          ? record.preferences
          : typeof record.category === "string"
            ? [record]
            : null;
        if (!rawPatches) {
          sendJson(res, 400, {
            error: "invalid_preferences",
            message: "Body must be { preferences: [...] } or a single category patch.",
          });
          return;
        }
        const patches: NotificationPreferencePatch[] = [];
        for (const raw of rawPatches) {
          if (raw == null || typeof raw !== "object") continue;
          const patch = raw as Record<string, unknown>;
          if (!isNotificationCategory(patch.category)) {
            sendJson(res, 400, {
              error: "invalid_category",
              message: `Unknown category: ${String(patch.category)}`,
            });
            return;
          }
          patches.push({
            category: patch.category,
            ...(typeof patch.browserEnabled === "boolean" && { browserEnabled: patch.browserEnabled }),
            ...(typeof patch.pwaEnabled === "boolean" && { pwaEnabled: patch.pwaEnabled }),
            ...(typeof patch.mobileEnabled === "boolean" && { mobileEnabled: patch.mobileEnabled }),
            ...(typeof patch.emailEnabled === "boolean" && { emailEnabled: patch.emailEnabled }),
            ...(typeof patch.webhookEnabled === "boolean" && { webhookEnabled: patch.webhookEnabled }),
            ...(typeof patch.slackEnabled === "boolean" && { slackEnabled: patch.slackEnabled }),
          });
        }
        sendJson(res, 200, { items: service.getNotifications().updatePreferences(patches) });
        return;
      }

      notFound(res);
    } catch (err) {
      sendJson(res, 500, {
        error: "internal_error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // Bind HTTP first so listen failures (EADDRINUSE) reject cleanly before
  // WebSocketServer can re-emit them as unhandled 'error' events.
  await listen(httpServer, opts.port, opts.host);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const hub = new WsHub(wss);
  hubRef = hub;

  const address = httpServer.address();
  const boundPort = typeof address === "object" && address !== null ? address.port : opts.port;

  return {
    httpServer,
    hub,
    host: opts.host,
    port: boundPort,
    close: () =>
      new Promise((resolve, reject) => {
        for (const client of wss.clients) {
          client.terminate();
        }
        wss.close((wssErr) => {
          httpServer.close((err) => {
            if (err ?? wssErr) reject(err ?? wssErr);
            else resolve();
          });
        });
      }),
  };
}

function listen(
  server: ReturnType<typeof createServer>,
  port: number,
  host: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      server.off("listening", onListening);
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use on ${host}. Stop the other telemetry process (or set TELEMETRY_PORT).`,
          ),
        );
        return;
      }
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}
