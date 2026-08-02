import { accessSync, constants, statSync } from "node:fs";
import type { TelemetryRuntimeConfig } from "./config.js";
import type { DiagnosticsTracker, PipelineStageStats } from "./diagnostics.js";
import type { TelemetryStore } from "./db/store.js";
import { buildHealthReport, type HealthReport } from "./health.js";
import type { SettingsRecord } from "./types.js";

export type HealthTone = "green" | "amber" | "red";

export interface NetworkServiceRow {
  id: string;
  service: string;
  purpose: string;
  host: string;
  port: number | null;
  listeningAddress: string | null;
  reachable: boolean;
  running: boolean;
  responding: boolean;
  status: string;
  tone: HealthTone;
  detail: string | null;
}

export interface DatabaseStats {
  path: string;
  sizeBytes: number | null;
  writable: boolean;
  runCount: number;
  eventCount: number;
  promptCount: number;
  oldestEventAt: string | null;
  newestEventAt: string | null;
  lastWriteAt: string | null;
}

export interface RuntimeConfigView {
  host: string;
  port: number;
  databasePath: string;
  notificationProvider: SettingsRecord["notificationProvider"];
  websocketEnabled: boolean;
  version: string;
  environment: string;
  uptimeHuman: string;
  /** True when TELEMETRY_DB looks like the Docker volume path. */
  dockerBackend: boolean;
}

export interface OpsEventRow {
  id: string;
  timestamp: string;
  eventType: string;
  runId: string;
  promptId: string | null;
  durationMs: number | null;
  status: string | null;
  sourceIp: string | null;
  userAgent: string | null;
  correlationId: string | null;
  summary: string;
}

export interface OpsReport {
  generatedAt: string;
  health: HealthReport;
  network: NetworkServiceRow[];
  pipeline: PipelineStageStats[];
  database: DatabaseStats;
  runtime: RuntimeConfigView;
}

function toneFrom(ok: boolean, degraded = false): HealthTone {
  if (!ok) return "red";
  if (degraded) return "amber";
  return "green";
}

export function getDatabaseStats(store: TelemetryStore): DatabaseStats {
  const path = store.dbPath;
  let sizeBytes: number | null = null;
  try {
    sizeBytes = statSync(path).size;
  } catch {
    sizeBytes = null;
  }

  let writable = false;
  try {
    accessSync(path, constants.W_OK);
    store.getSettings();
    writable = true;
  } catch {
    writable = false;
  }

  return {
    path,
    sizeBytes,
    writable,
    ...store.getAggregateStats(),
  };
}

export function buildNetworkRows(input: {
  config: TelemetryRuntimeConfig;
  health: HealthReport;
  wsClients: number;
  traefikHint?: boolean;
}): NetworkServiceRow[] {
  const { config, health, wsClients } = input;
  const apiOk = health.ok && health.sqlite.ok;
  const rows: NetworkServiceRow[] = [
    {
      id: "telemetry-api",
      service: "Telemetry API",
      purpose: "Hook ingest + REST",
      host: "localhost / LAN",
      port: config.port,
      listeningAddress: `${config.host}:${config.port}`,
      reachable: true,
      running: true,
      responding: apiOk,
      status: apiOk ? "Healthy" : "Degraded",
      tone: toneFrom(apiOk, !health.ok),
      detail: null,
    },
    {
      id: "sqlite",
      service: "SQLite",
      purpose: "Event persistence",
      host: "local file",
      port: null,
      listeningAddress: config.dbPath,
      reachable: health.sqlite.ok,
      running: health.sqlite.ok,
      responding: health.sqlite.ok,
      status: health.sqlite.ok ? "Healthy" : "Unavailable",
      tone: toneFrom(health.sqlite.ok),
      detail: health.sqlite.error,
    },
    {
      id: "websocket",
      service: "WebSocket",
      purpose: "Live dashboard updates",
      host: "localhost / LAN",
      port: config.port,
      listeningAddress: `${config.host}:${config.port}/ws`,
      reachable: health.websocket.ok,
      running: health.websocket.ok,
      responding: health.websocket.ok,
      status: health.websocket.ok
        ? wsClients > 0
          ? `Healthy (${wsClients} client${wsClients === 1 ? "" : "s"})`
          : "Healthy (no clients)"
        : "Down",
      tone: toneFrom(health.websocket.ok, wsClients === 0),
      detail: null,
    },
    {
      id: "dashboard",
      service: "Dashboard",
      purpose: "Ops UI via Vite / Traefik",
      host: "browser",
      port: null,
      listeningAddress: "/dashboard → /telemetry proxy",
      reachable: true,
      running: true,
      responding: true,
      status: "Proxied",
      tone: "amber",
      detail: "Local Vite and apps.songara.uk both proxy /telemetry to this Docker service",
    },
  ];

  if (input.traefikHint !== false) {
    rows.push({
      id: "traefik",
      service: "Traefik",
      purpose: "Edge routing (optional)",
      host: "apps.songara.uk",
      port: 443,
      listeningAddress: "PathPrefix(/telemetry)",
      reachable: false,
      running: false,
      responding: false,
      status: "Not probed",
      tone: "amber",
      detail: "Configure Traefik labels in docker-compose; not auto-probed from inside the process",
    });
  }

  return rows;
}

export function buildOpsReport(input: {
  config: TelemetryRuntimeConfig;
  diagnostics: DiagnosticsTracker;
  store: TelemetryStore;
  settings: SettingsRecord;
  wsClients: number;
  environment?: string;
}): OpsReport {
  const health = buildHealthReport({
    config: input.config,
    diagnostics: input.diagnostics,
    settings: input.settings,
    wsClients: input.wsClients,
  });
  const snap = input.diagnostics.snapshot();
  const database = getDatabaseStats(input.store);

  return {
    generatedAt: new Date().toISOString(),
    health,
    network: buildNetworkRows({
      config: input.config,
      health,
      wsClients: input.wsClients,
    }),
    pipeline: [
      snap.pipeline.hook,
      snap.pipeline.api,
      snap.pipeline.sqlite,
      snap.pipeline.websocket,
      snap.pipeline.dashboard,
    ],
    database,
    runtime: {
      host: input.config.host,
      port: input.config.port,
      databasePath: input.config.dbPath,
      notificationProvider: input.settings.notificationProvider,
      websocketEnabled: true,
      version: input.config.version,
      environment: input.environment ?? process.env.NODE_ENV ?? "development",
      uptimeHuman: health.uptimeHuman,
      dockerBackend:
        input.config.dbPath === "/data/telemetry.sqlite" ||
        input.config.dbPath.startsWith("/data/"),
    },
  };
}

export function enrichEventRows(
  store: TelemetryStore,
  opts: { type?: string; limit?: number } = {},
): OpsEventRow[] {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const events = store.listRecentEvents(limit, opts.type);
  return events.map((ev) => {
    const run = store.getRun(ev.runId);
    let sourceIp: string | null = null;
    let userAgent: string | null = null;
    let correlationId: string | null = null;
    try {
      const payload = JSON.parse(ev.payloadJson) as {
        conversation_id?: string;
        generation_id?: string;
        _telemetry?: { sourceIp?: string; userAgent?: string | null };
      };
      sourceIp = payload._telemetry?.sourceIp ?? null;
      userAgent = payload._telemetry?.userAgent ?? null;
      correlationId = payload.generation_id ?? payload.conversation_id ?? null;
    } catch {
      // ignore malformed payloads
    }
    return {
      id: ev.id,
      timestamp: ev.timestamp,
      eventType: ev.type,
      runId: ev.runId,
      promptId: run?.promptId ?? null,
      durationMs: run?.durationMs ?? null,
      status: run?.status ?? null,
      sourceIp,
      userAgent,
      correlationId,
      summary: ev.summary,
    };
  });
}
