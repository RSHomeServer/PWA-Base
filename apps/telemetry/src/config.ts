import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function readPackageVersion(): string {
  try {
    const raw = readFileSync(resolve(here, "../package.json"), "utf8");
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export interface TelemetryRuntimeConfig {
  /** Bind address — default `0.0.0.0` (all interfaces). */
  host: string;
  /** Bind port — default `4310`. */
  port: number;
  /** Absolute SQLite path. */
  dbPath: string;
  /** Absolute directory for run artifact files (screenshots, logs). */
  artifactsDir: string;
  /** Service version from package.json. */
  version: string;
  /** Idle timeout before auto `timed_out` (ms). Default 30 minutes. */
  idleTimeoutMs: number;
  /** Soft idle threshold → `waiting` (ms). Default half of idleTimeoutMs. */
  idleSoftMs: number;
  /** Supervisor tick interval (ms). Default 30s. */
  supervisorIntervalMs: number;
  /** Grace after last heavy shell before Task auto-complete (ms). Default 60s. */
  taskCompletionGraceMs: number;
}

/**
 * Loads server-side configuration from the environment.
 * Client machines (Cursor VMs) use `TELEMETRY_ENDPOINT` in the hook script — that
 * variable is intentionally *not* read here.
 */
export function loadRuntimeConfig(env: NodeJS.ProcessEnv = process.env): TelemetryRuntimeConfig {
  const host = env.TELEMETRY_HOST?.trim() || "0.0.0.0";
  const portRaw = env.TELEMETRY_PORT?.trim() || "4310";
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid TELEMETRY_PORT: ${env.TELEMETRY_PORT}`);
  }
  const dbPath = resolve(env.TELEMETRY_DB?.trim() || "./data/telemetry.sqlite");
  const artifactsDir = resolve(
    env.TELEMETRY_ARTIFACTS?.trim() || resolve(dirname(dbPath), "run-artifacts"),
  );
  const idleTimeoutMs = parsePositiveInt(env.TELEMETRY_IDLE_TIMEOUT_MS, 1_800_000);
  const idleSoftMs = parsePositiveInt(
    env.TELEMETRY_IDLE_SOFT_MS,
    Math.max(60_000, Math.floor(idleTimeoutMs / 2)),
  );
  const supervisorIntervalMs = parsePositiveInt(env.TELEMETRY_SUPERVISOR_INTERVAL_MS, 30_000);
  const taskCompletionGraceMs = parsePositiveInt(env.TELEMETRY_TASK_COMPLETION_GRACE_MS, 60_000);
  return {
    host,
    port,
    dbPath,
    artifactsDir,
    version: readPackageVersion(),
    idleTimeoutMs,
    idleSoftMs,
    supervisorIntervalMs,
    taskCompletionGraceMs,
  };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}
