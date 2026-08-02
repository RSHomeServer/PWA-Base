export interface HookReceipt {
  receivedAt: string;
  sourceIp: string;
  userAgent: string | null;
  hookType: string;
}

export type PipelineStageId = "hook" | "api" | "sqlite" | "websocket" | "dashboard";

export interface PipelineStageStats {
  id: PipelineStageId;
  label: string;
  lastActivityAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  totalProcessed: number;
  errors: number;
}

export interface ServiceDiagnostics {
  startedAt: string;
  lastHook: HookReceipt | null;
  sqliteOk: boolean;
  sqliteError: string | null;
  pipeline: Record<PipelineStageId, PipelineStageStats>;
}

function emptyStage(id: PipelineStageId, label: string): PipelineStageStats {
  return {
    id,
    label,
    lastActivityAt: null,
    lastSuccessAt: null,
    lastFailureAt: null,
    lastFailureMessage: null,
    totalProcessed: 0,
    errors: 0,
  };
}

/**
 * In-memory operational diagnostics for /health, /api/ops, and the dashboard.
 * Not persisted — resets on process restart (intentional for ops visibility).
 */
export class DiagnosticsTracker {
  readonly startedAt = new Date().toISOString();
  private lastHook: HookReceipt | null = null;
  private sqliteOk = true;
  private sqliteError: string | null = null;
  private readonly pipeline: Record<PipelineStageId, PipelineStageStats> = {
    hook: emptyStage("hook", "Cursor Hook"),
    api: emptyStage("api", "Telemetry API"),
    sqlite: emptyStage("sqlite", "SQLite"),
    websocket: emptyStage("websocket", "WebSocket"),
    dashboard: emptyStage("dashboard", "Dashboard"),
  };

  recordHook(receipt: HookReceipt): void {
    this.lastHook = receipt;
    this.recordSuccess("hook");
    this.recordSuccess("api");
    console.log(
      `[telemetry] hook type=${receipt.hookType} ip=${receipt.sourceIp} ua=${receipt.userAgent ?? "-"} at=${receipt.receivedAt}`,
    );
  }

  recordSuccess(stage: PipelineStageId): void {
    const now = new Date().toISOString();
    const entry = this.pipeline[stage];
    entry.lastActivityAt = now;
    entry.lastSuccessAt = now;
    entry.totalProcessed += 1;
  }

  recordFailure(stage: PipelineStageId, message: string): void {
    const now = new Date().toISOString();
    const entry = this.pipeline[stage];
    entry.lastActivityAt = now;
    entry.lastFailureAt = now;
    entry.lastFailureMessage = message;
    entry.errors += 1;
  }

  markSqliteOk(): void {
    this.sqliteOk = true;
    this.sqliteError = null;
    this.recordSuccess("sqlite");
  }

  markSqliteError(message: string): void {
    this.sqliteOk = false;
    this.sqliteError = message;
    this.recordFailure("sqlite", message);
    console.error(`[telemetry] sqlite error: ${message}`);
  }

  markWebsocketBroadcast(): void {
    this.recordSuccess("websocket");
  }

  markDashboardPoll(): void {
    this.recordSuccess("dashboard");
  }

  snapshot(): ServiceDiagnostics {
    return {
      startedAt: this.startedAt,
      lastHook: this.lastHook,
      sqliteOk: this.sqliteOk,
      sqliteError: this.sqliteError,
      pipeline: {
        hook: { ...this.pipeline.hook },
        api: { ...this.pipeline.api },
        sqlite: { ...this.pipeline.sqlite },
        websocket: { ...this.pipeline.websocket },
        dashboard: { ...this.pipeline.dashboard },
      },
    };
  }
}
