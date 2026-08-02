import type { TelemetryRuntimeConfig } from "./config.js";
import type { DiagnosticsTracker, HookReceipt } from "./diagnostics.js";
import type { SettingsRecord } from "./types.js";

export interface HealthReport {
  ok: boolean;
  version: string;
  uptimeMs: number;
  uptimeHuman: string;
  configuredHost: string;
  configuredPort: number;
  listener: string;
  sqlite: {
    ok: boolean;
    path: string;
    error: string | null;
  };
  websocket: {
    ok: boolean;
    clients: number;
  };
  notifications: {
    provider: SettingsRecord["notificationProvider"];
    ntfyServer: string;
    ntfyTopicConfigured: boolean;
  };
  lastHook: HookReceipt | null;
}

export function formatUptime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function buildHealthReport(input: {
  config: TelemetryRuntimeConfig;
  diagnostics: DiagnosticsTracker;
  settings: SettingsRecord;
  wsClients: number;
  now?: number;
}): HealthReport {
  const now = input.now ?? Date.now();
  const started = Date.parse(input.diagnostics.snapshot().startedAt);
  const uptimeMs = Number.isFinite(started) ? Math.max(0, now - started) : 0;
  const snap = input.diagnostics.snapshot();
  const sqliteOk = snap.sqliteOk;
  const wsOk = true;

  return {
    ok: sqliteOk && wsOk,
    version: input.config.version,
    uptimeMs,
    uptimeHuman: formatUptime(uptimeMs),
    configuredHost: input.config.host,
    configuredPort: input.config.port,
    listener: `${input.config.host}:${input.config.port}`,
    sqlite: {
      ok: sqliteOk,
      path: input.config.dbPath,
      error: snap.sqliteError,
    },
    websocket: {
      ok: wsOk,
      clients: input.wsClients,
    },
    notifications: {
      provider: input.settings.notificationProvider,
      ntfyServer: input.settings.ntfyServer,
      ntfyTopicConfigured: input.settings.ntfyTopic.trim().length > 0,
    },
    lastHook: snap.lastHook,
  };
}

/** Best-effort client IP from Node request (supports X-Forwarded-For). */
export function clientIpFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(",")[0]!.trim();
  }
  return req.socket.remoteAddress ?? "unknown";
}
