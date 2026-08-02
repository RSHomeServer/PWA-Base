export type RunStatus =
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "abandoned";

/** A Task groups one or more Runs from the same conversation into a single unit of work. */
export type TaskStatus =
  | "open"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

export type CompletionKind = "automatic" | "manual";

export type ManualCompletionReason =
  | "cursor_completed"
  | "cursor_crashed"
  | "terminal_closed"
  | "other";

export type LifecycleReason =
  | "automatic_timeout"
  | "orphan_unattached"
  | "orphan_attached_review"
  | null;

/** Deterministic reason a Task was closed. */
export type TaskCompletionReason =
  | "all_runs_terminal_with_summary"
  | "automatic_timeout"
  | "manual"
  | "superseded"
  | null;

/** "Actions Required" rollup used on the Task list row. */
export type ActionsRequiredSummary = "required" | "recommended" | "none";

export interface PromptRecord {
  id: string;
  prompt: string;
  title: string;
  createdAt: string;
  conversationId: string | null;
  model: string | null;
}

export interface FileAreaGroup {
  area: string;
  files: string[];
}

export type TestResultStatus = "pass" | "fail" | "skip";

export interface TestResultItem {
  check: string;
  status: TestResultStatus;
  detail: string;
}

/**
 * Mirrors telemetry `RunCompletionSummary` (`apps/telemetry/src/types.ts`) — change there first.
 * Section registry / validation: `apps/telemetry/src/completion-report-contract.ts`.
 */
export interface RunCompletionSummary {
  schemaVersion: 1 | 2;
  /** Long-form prose overview — the primary narrative shown first in the report UI. */
  overview: string | null;
  executiveSummary: string | null;
  userVisibleChanges: string[];
  architectureChanges: string[];
  filesModified: FileAreaGroup[];
  configurationChanges: string[];
  testingPerformed: TestResultItem[];
  knownLimitations: string[];
  recommendedNextMilestone: string | null;
  filesChanged: number | null;
  testsPassed: boolean | null;
  gitCommit: string | null;
  source: "structured" | "markdown" | "legacy" | null;
}

export interface RunRecord {
  id: string;
  promptId: string;
  /** Task this run belongs to — Runs are grouped into Tasks by conversation. */
  taskId: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  status: RunStatus;
  summary: string | null;
  completionSummary: RunCompletionSummary | null;
  conversationId: string | null;
  generationId: string | null;
  phase: string | null;
  latestShell: string | null;
  latestFile: string | null;
  completionKind: CompletionKind | null;
  manualCompletionReason: ManualCompletionReason | null;
  manualCompletionNote: string | null;
  lifecycleReason: LifecycleReason;
  idleMs: number | null;
  needsReview: boolean;
}

/**
 * A Task groups the Runs belonging to a single conversation (chronologically)
 * into one unit of work — this is the primary lifecycle entity above Run.
 */
export interface TaskRecord {
  id: string;
  title: string;
  promptText: string;
  conversationId: string | null;
  createdAt: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  status: TaskStatus;
  /** Structured completion report — mirrors the closing run's, once terminal. */
  completionSummary: RunCompletionSummary | null;
  /** automatic = derived from run lifecycle; manual = operator action; null = still open. */
  completionKind: CompletionKind | null;
  manualCompletionReason: ManualCompletionReason | null;
  manualCompletionNote: string | null;
  /** Deterministic reason the task closed. */
  completionReason: TaskCompletionReason;
  /** Low-confidence orphan attach or unattached orphan on any constituent run. */
  needsReview: boolean;
}

/** Row shape returned by GET /api/tasks. */
export interface TaskListItem {
  task: TaskRecord;
  runCount: number;
  openRunCount: number;
  filesChanged: number | null;
  testsPassed: boolean | null;
  actionsRequiredSummary: ActionsRequiredSummary;
}

/** Completion readiness signals shown in the Task Detail checklist. */
export interface TaskChecklist {
  allRunsTerminal: boolean;
  summaryWritten: boolean;
  validationComplete: boolean;
  actionsEvaluated: boolean;
  openRunCount: number;
}

export type ConsolidationDecisionKind =
  | "reuse_open_task"
  | "create_task"
  | "orphan_attach_open_task"
  | "orphan_attach_finished_task"
  | "orphan_create_task"
  | "supersede_generation"
  | "task_auto_complete"
  | "task_manual_complete"
  | "task_waiting"
  | "task_timed_out"
  | "overview_quality_warn";

export interface LifecycleDiagnosticEntry {
  id: string;
  at: string;
  kind: ConsolidationDecisionKind;
  confidence: "high" | "medium" | "low" | "none";
  conversationId: string | null;
  taskId: string | null;
  runId: string | null;
  detail: string;
}

/** Response shape for GET /api/tasks/:id. */
export interface TaskDetail {
  task: TaskRecord;
  runs: RunRecord[];
  events: EventRecord[];
  artifacts: RunArtifact[];
  checklist: TaskChecklist;
  diagnostics: LifecycleDiagnosticEntry[];
}

/** Response shape for GET /api/lifecycle/diagnostics. */
export interface LifecycleDiagnosticsReport {
  currentTasks: TaskRecord[];
  activeRuns: RunRecord[];
  recentDecisions: LifecycleDiagnosticEntry[];
}

export interface EventRecord {
  id: string;
  runId: string;
  timestamp: string;
  type: string;
  summary: string;
  payloadJson: string;
}

export interface SettingsRecord {
  sqlitePath: string;
  notificationProvider: "ntfy" | "none";
  ntfyServer: string;
  ntfyTopic: string;
}

export interface NotificationRecord {
  id: string;
  runId: string;
  provider: string;
  sentAt: string;
  success: boolean;
  detail: string | null;
}

export type ArtifactKind =
  | "screenshot"
  | "image_diff"
  | "build_log"
  | "test_report"
  | "markdown_summary";

export type ArtifactPhase = "before" | "after" | null;

export interface RunArtifact {
  id: string;
  runId: string;
  kind: ArtifactKind;
  pageKey: string | null;
  pageLabel: string | null;
  phase: ArtifactPhase;
  filename: string;
  relativePath: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
  caption: string | null;
}

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
    provider: "ntfy" | "none";
    ntfyServer: string;
    ntfyTopicConfigured: boolean;
  };
  lastHook: {
    receivedAt: string;
    sourceIp: string;
    userAgent: string | null;
    hookType: string;
  } | null;
}

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

export interface PipelineStageStats {
  id: string;
  label: string;
  lastActivityAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastFailureMessage: string | null;
  totalProcessed: number;
  errors: number;
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
  notificationProvider: "ntfy" | "none";
  websocketEnabled: boolean;
  version: string;
  environment: string;
  uptimeHuman: string;
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

export interface ConnectivityTestResult {
  ok: boolean;
  elapsedMs: number;
  message: string;
  clients?: number;
  runId?: string | null;
  eventType?: string;
}

export interface LiveRunView {
  run: RunRecord | null;
  prompt: PromptRecord | null;
  events: EventRecord[];
  elapsedMs: number | null;
}

export interface RunListItem {
  run: RunRecord;
  prompt: PromptRecord | null;
  eventCount: number;
}

export type NotificationCategory =
  | "run_completed"
  | "run_failed"
  | "build_failed"
  | "tests_failed"
  | "deployment_completed"
  | "deployment_failed"
  | "telemetry_warning"
  | "system_health"
  | "screenshot_capture"
  | "artifacts_generated"
  | "validation_failed";

export interface InboxNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string | null;
  runId: string | null;
  readAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface NotificationPreference {
  category: NotificationCategory;
  browserEnabled: boolean;
  pwaEnabled: boolean;
  mobileEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  slackEnabled: boolean;
}

export type WsMessage =
  | { kind: "run.updated"; run: RunRecord; prompt: PromptRecord | null }
  | { kind: "event.appended"; event: EventRecord; run: RunRecord }
  | { kind: "run.finished"; run: RunRecord; prompt: PromptRecord | null }
  | { kind: "run.deleted"; runId: string }
  | { kind: "task.updated"; task: TaskRecord }
  | { kind: "task.finished"; task: TaskRecord }
  | { kind: "settings.updated"; settings: SettingsRecord }
  | { kind: "notification.created"; notification: InboxNotification }
  | { kind: "hello"; serverTime: string };
