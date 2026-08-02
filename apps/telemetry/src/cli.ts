import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ArtifactFsStore } from "./artifacts/fs-store.js";
import { loadRuntimeConfig } from "./config.js";
import { DiagnosticsTracker } from "./diagnostics.js";
import { openStore } from "./db/store.js";
import { LifecycleSupervisor } from "./lifecycle/supervisor.js";
import { createTelemetryServer } from "./server.js";
import { TelemetryService } from "./service.js";

async function main(): Promise<void> {
  const config = loadRuntimeConfig();
  mkdirSync(dirname(config.dbPath), { recursive: true });

  const diagnostics = new DiagnosticsTracker();
  let store;
  try {
    store = openStore(config.dbPath);
    diagnostics.markSqliteOk();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    diagnostics.markSqliteError(message);
    throw new Error(`SQLite unavailable at ${config.dbPath}: ${message}`);
  }

  mkdirSync(config.artifactsDir, { recursive: true });
  const artifactsFs = new ArtifactFsStore(config.artifactsDir);

  const hubHolder: { broadcast: (m: unknown) => void } = {
    broadcast: () => undefined,
  };

  const service = new TelemetryService(
    store,
    (msg) => hubHolder.broadcast(msg),
    () => diagnostics.markWebsocketBroadcast(),
    artifactsFs,
  );
  service.setLifecycleIdleConfig({
    idleTimeoutMs: config.idleTimeoutMs,
    idleSoftMs: config.idleSoftMs,
    taskCompletionGraceMs: config.taskCompletionGraceMs,
  });
  const supervisor = new LifecycleSupervisor(service, config);
  supervisor.start();

  const server = await createTelemetryServer(service, {
    host: config.host,
    port: config.port,
    config,
    diagnostics,
  });
  hubHolder.broadcast = (msg) => server.hub.broadcast(msg as never);

  console.log(`[telemetry] v${config.version} listening on http://${server.host}:${server.port}`);
  console.log(`[telemetry] bind ${config.host}:${config.port} (all interfaces when host=0.0.0.0)`);
  console.log(`[telemetry] sqlite: ${config.dbPath}`);
  console.log(`[telemetry] artifacts: ${config.artifactsDir}`);
  console.log(`[telemetry] hooks POST /hooks  ·  health GET /health  ·  ws /ws  ·  api /api/*`);
  console.log(
    `[telemetry] Docker is canonical — publish :${config.port} via compose; clients set TELEMETRY_ENDPOINT=http://<host>:${config.port}`,
  );

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[telemetry] ${signal} — shutting down`);
    try {
      supervisor.stop();
      await server.close();
      store.close();
      process.exit(0);
    } catch (err) {
      console.error("[telemetry] shutdown failed", err);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[telemetry] failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
