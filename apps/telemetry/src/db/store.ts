import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  CompletionKind,
  EventRecord,
  ManualCompletionReason,
  NotificationRecord,
  PromptRecord,
  RunArtifact,
  RunCompletionSummary,
  RunRecord,
  RunStatus,
  SettingsRecord,
  TaskCompletionReason,
  TaskRecord,
  TaskStatus,
} from "../types.js";
import { calculateDurationMs } from "../types.js";
import type { ArtifactKind, ArtifactPhase } from "../artifacts/types.js";
import { normaliseCompletionSummary } from "../completion-summary.js";
import {
  NOTIFICATION_CATEGORIES,
  defaultPreference,
  type InboxNotification,
  type ListInboxOptions,
  type NotificationCategory,
  type NotificationChannelPreference,
} from "../notify/inbox-types.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  conversation_id TEXT,
  model TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  conversation_id TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  completion_summary_json TEXT,
  completion_kind TEXT,
  manual_completion_reason TEXT,
  manual_completion_note TEXT,
  completion_reason TEXT,
  needs_review INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES prompts(id),
  task_id TEXT REFERENCES tasks(id),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  summary TEXT,
  completion_summary_json TEXT,
  conversation_id TEXT,
  generation_id TEXT,
  phase TEXT,
  latest_shell TEXT,
  latest_file TEXT,
  completion_kind TEXT,
  manual_completion_reason TEXT,
  manual_completion_note TEXT,
  lifecycle_reason TEXT,
  idle_ms INTEGER,
  needs_review INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  provider TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  success INTEGER NOT NULL,
  detail TEXT
);

CREATE TABLE IF NOT EXISTS run_artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  kind TEXT NOT NULL,
  page_key TEXT,
  page_label TEXT,
  phase TEXT,
  filename TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  caption TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sqlite_path TEXT NOT NULL,
  notification_provider TEXT NOT NULL,
  ntfy_server TEXT NOT NULL,
  ntfy_topic TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inbox_notifications (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  run_id TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  category TEXT PRIMARY KEY,
  browser_enabled INTEGER NOT NULL,
  pwa_enabled INTEGER NOT NULL,
  mobile_enabled INTEGER NOT NULL,
  email_enabled INTEGER NOT NULL,
  webhook_enabled INTEGER NOT NULL,
  slack_enabled INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_runs_started ON runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_run ON events(run_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_conversation ON tasks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_started ON tasks(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_run ON run_artifacts(run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_inbox_created ON inbox_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_category ON inbox_notifications(category);
`;


function parseCompletionSummaryJson(raw: unknown): RunCompletionSummary | null {
  if (raw == null) return null;
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    return normaliseCompletionSummary(JSON.parse(raw));
  } catch {
    return null;
  }
}

const ALLOWED_MANUAL_REASONS = new Set([
  "cursor_completed",
  "cursor_crashed",
  "terminal_closed",
  "other",
]);

function parseCompletionKind(raw: unknown): CompletionKind | null {
  const s = raw == null ? null : String(raw);
  return s === "automatic" || s === "manual" ? s : null;
}

function parseManualCompletionReason(raw: unknown): ManualCompletionReason | null {
  if (raw == null) return null;
  const s = String(raw);
  return ALLOWED_MANUAL_REASONS.has(s) ? (s as ManualCompletionReason) : null;
}

const ALLOWED_TASK_STATUSES = new Set([
  "open",
  "waiting",
  "completed",
  "failed",
  "cancelled",
  "timed_out",
]);

function parseTaskStatus(raw: unknown): TaskStatus {
  const s = String(raw);
  return ALLOWED_TASK_STATUSES.has(s) ? (s as TaskStatus) : "open";
}

const ALLOWED_TASK_COMPLETION_REASONS = new Set([
  "all_runs_terminal_with_summary",
  "automatic_timeout",
  "manual",
  "superseded",
]);

function parseTaskCompletionReason(raw: unknown): TaskCompletionReason {
  if (raw == null) return null;
  const s = String(raw);
  return ALLOWED_TASK_COMPLETION_REASONS.has(s) ? (s as TaskCompletionReason) : null;
}

function rowPrompt(row: Record<string, unknown>): PromptRecord {
  return {
    id: String(row.id),
    prompt: String(row.prompt),
    title: String(row.title),
    createdAt: String(row.created_at),
    conversationId: row.conversation_id == null ? null : String(row.conversation_id),
    model: row.model == null ? null : String(row.model),
  };
}

function rowRun(row: Record<string, unknown>): RunRecord {
  return {
    id: String(row.id),
    promptId: String(row.prompt_id),
    taskId: row.task_id == null ? "" : String(row.task_id),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at == null ? null : String(row.finished_at),
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    status: String(row.status) as RunStatus,
    summary: row.summary == null ? null : String(row.summary),
    completionSummary: parseCompletionSummaryJson(row.completion_summary_json),
    conversationId: row.conversation_id == null ? null : String(row.conversation_id),
    generationId: row.generation_id == null ? null : String(row.generation_id),
    phase: row.phase == null ? null : String(row.phase),
    latestShell: row.latest_shell == null ? null : String(row.latest_shell),
    latestFile: row.latest_file == null ? null : String(row.latest_file),
    completionKind: parseCompletionKind(row.completion_kind),
    manualCompletionReason: parseManualCompletionReason(row.manual_completion_reason),
    manualCompletionNote:
      row.manual_completion_note == null ? null : String(row.manual_completion_note),
    lifecycleReason: parseLifecycleReason(row.lifecycle_reason),
    idleMs: row.idle_ms == null ? null : Number(row.idle_ms),
    needsReview: Number(row.needs_review ?? 0) === 1,
  };
}

function rowTask(row: Record<string, unknown>): TaskRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    promptText: String(row.prompt_text),
    conversationId: row.conversation_id == null ? null : String(row.conversation_id),
    createdAt: String(row.created_at),
    startedAt: String(row.started_at),
    finishedAt: row.finished_at == null ? null : String(row.finished_at),
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    status: parseTaskStatus(row.status),
    completionSummary: parseCompletionSummaryJson(row.completion_summary_json),
    completionKind: parseCompletionKind(row.completion_kind),
    manualCompletionReason: parseManualCompletionReason(row.manual_completion_reason),
    manualCompletionNote:
      row.manual_completion_note == null ? null : String(row.manual_completion_note),
    completionReason: parseTaskCompletionReason(row.completion_reason),
    needsReview: Number(row.needs_review ?? 0) === 1,
  };
}

function parseLifecycleReason(raw: unknown): RunRecord["lifecycleReason"] {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  if (
    s === "automatic_timeout" ||
    s === "orphan_unattached" ||
    s === "orphan_attached_review"
  ) {
    return s;
  }
  return null;
}

function rowEvent(row: Record<string, unknown>): EventRecord {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    timestamp: String(row.timestamp),
    type: String(row.type),
    summary: String(row.summary),
    payloadJson: String(row.payload_json),
  };
}

function rowNotification(row: Record<string, unknown>): NotificationRecord {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    provider: String(row.provider),
    sentAt: String(row.sent_at),
    success: Number(row.success) === 1,
    detail: row.detail == null ? null : String(row.detail),
  };
}

function parseMetadataJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "string" || raw.length === 0) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function rowInboxNotification(row: Record<string, unknown>): InboxNotification {
  return {
    id: String(row.id),
    category: String(row.category) as NotificationCategory,
    title: String(row.title),
    body: String(row.body),
    href: row.href == null ? null : String(row.href),
    runId: row.run_id == null ? null : String(row.run_id),
    readAt: row.read_at == null ? null : String(row.read_at),
    createdAt: String(row.created_at),
    metadata: parseMetadataJson(row.metadata_json),
  };
}

function rowNotificationPreference(row: Record<string, unknown>): NotificationChannelPreference {
  return {
    category: String(row.category) as NotificationCategory,
    browserEnabled: Number(row.browser_enabled) === 1,
    pwaEnabled: Number(row.pwa_enabled) === 1,
    mobileEnabled: Number(row.mobile_enabled) === 1,
    emailEnabled: Number(row.email_enabled) === 1,
    webhookEnabled: Number(row.webhook_enabled) === 1,
    slackEnabled: Number(row.slack_enabled) === 1,
  };
}

function rowArtifact(row: Record<string, unknown>): RunArtifact {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    kind: String(row.kind) as ArtifactKind,
    pageKey: row.page_key == null ? null : String(row.page_key),
    pageLabel: row.page_label == null ? null : String(row.page_label),
    phase: (row.phase == null ? null : String(row.phase)) as ArtifactPhase,
    filename: String(row.filename),
    relativePath: String(row.relative_path),
    mimeType: String(row.mime_type),
    byteSize: Number(row.byte_size),
    createdAt: String(row.created_at),
    caption: row.caption == null ? null : String(row.caption),
  };
}

export interface TelemetryStore {
  readonly dbPath: string;
  close(): void;
  getSettings(): SettingsRecord;
  updateSettings(patch: Partial<SettingsRecord>): SettingsRecord;
  insertPrompt(prompt: PromptRecord): void;
  getPrompt(id: string): PromptRecord | null;
  listPrompts(limit?: number): PromptRecord[];
  insertRun(run: RunRecord): void;
  updateRun(run: RunRecord): void;
  getRun(id: string): RunRecord | null;
  getActiveRun(): RunRecord | null;
  /** Open runs (`running` or `waiting`). */
  listOpenRuns(): RunRecord[];
  getLatestRun(): RunRecord | null;
  /**
   * Latest finished run for orphan attach, filtered by conversation (required)
   * and optional generation, with finished_at within lookbackMs of `nowIso`.
   */
  findRecentFinishedRun(opts: {
    conversationId: string;
    generationId?: string | null;
    lookbackMs: number;
    nowIso?: string;
  }): RunRecord | null;
  listRuns(opts?: {
    sort?: "started_at" | "duration_ms" | "status";
    dir?: "asc" | "desc";
  }): RunRecord[];
  listRunsForPrompt(promptId: string): RunRecord[];
  insertTask(task: TaskRecord): void;
  updateTask(task: TaskRecord): void;
  getTask(id: string): TaskRecord | null;
  /** Open (`open` or `waiting`) task for a conversation, if any. */
  getOpenTaskByConversation(conversationId: string): TaskRecord | null;
  listTasks(opts?: {
    sort?: "started_at" | "duration_ms" | "status";
    dir?: "asc" | "desc";
  }): TaskRecord[];
  listRunsForTask(taskId: string): RunRecord[];
  /**
   * Latest finished task for a conversation, with finished_at within
   * lookbackMs of `nowIso`. Used to decide whether a new prompt continues
   * a recently-closed task or starts a fresh one.
   */
  findRecentFinishedTask(opts: {
    conversationId: string;
    lookbackMs: number;
    nowIso?: string;
  }): TaskRecord | null;
  countRunsForTask(taskId: string): number;
  /** Deletes a run and related events/artifacts/notifications. Orphans the prompt when unused. */
  deleteRun(id: string): boolean;
  insertEvent(event: EventRecord): void;
  listEvents(runId: string): EventRecord[];
  listRecentEvents(limit?: number, type?: string): EventRecord[];
  countEvents(runId: string): number;
  getAggregateStats(): {
    runCount: number;
    eventCount: number;
    promptCount: number;
    oldestEventAt: string | null;
    newestEventAt: string | null;
    lastWriteAt: string | null;
  };
  insertNotification(n: NotificationRecord): void;
  listNotifications(runId: string): NotificationRecord[];
  insertArtifact(artifact: RunArtifact): void;
  getArtifact(id: string): RunArtifact | null;
  listArtifacts(runId: string): RunArtifact[];
  deleteArtifact(id: string): boolean;
  findArtifactByPagePhase(
    runId: string,
    pageKey: string,
    phase: ArtifactPhase,
  ): RunArtifact | null;
  insertInboxNotification(notification: InboxNotification): void;
  getInboxNotification(id: string): InboxNotification | null;
  listInboxNotifications(opts?: ListInboxOptions): InboxNotification[];
  countUnreadInboxNotifications(): number;
  markInboxRead(id: string, read: boolean): InboxNotification | null;
  markAllInboxRead(): number;
  deleteInboxNotification(id: string): boolean;
  clearInboxNotifications(): void;
  listNotificationPreferences(): NotificationChannelPreference[];
  upsertNotificationPreference(pref: NotificationChannelPreference): NotificationChannelPreference;
  ensureDefaultPreferences(): void;
}

function mapRunStatusToTaskStatus(status: string): TaskStatus {
  switch (status) {
    case "running":
      return "open";
    case "waiting":
      return "waiting";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "timed_out":
      return "timed_out";
    case "abandoned":
      return "failed";
    default:
      return "completed";
  }
}

/**
 * One-time migration for pre-Task databases: groups existing runs by
 * conversation_id (chronologically) into backfilled Tasks, using the title
 * of the first prompt in each group. Runs with a null conversation_id each
 * get their own solo Task. Mutates runs.task_id in place.
 */
function backfillTasksFromRuns(db: DatabaseSync): void {
  const rows = db
    .prepare(
      `SELECT r.*, p.prompt AS prompt_text, p.title AS prompt_title
       FROM runs r LEFT JOIN prompts p ON p.id = r.prompt_id
       ORDER BY r.started_at ASC, r.id ASC`,
    )
    .all() as Record<string, unknown>[];
  if (rows.length === 0) return;

  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const conversationId = row.conversation_id == null ? null : String(row.conversation_id);
    const key = conversationId ?? `solo:${String(row.id)}`;
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const insertTaskStmt = db.prepare(
    `INSERT INTO tasks (
      id, title, prompt_text, conversation_id, created_at, started_at, finished_at,
      duration_ms, status, completion_summary_json, completion_kind,
      manual_completion_reason, manual_completion_note, completion_reason, needs_review
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const updateRunTaskStmt = db.prepare("UPDATE runs SET task_id = ? WHERE id = ?");

  for (const groupRows of groups.values()) {
    const first = groupRows[0]!;
    const last = groupRows[groupRows.length - 1]!;
    const taskId = randomUUID();
    const title = first.prompt_title == null ? "Untitled" : String(first.prompt_title);
    const promptText = first.prompt_text == null ? "" : String(first.prompt_text);
    const conversationId = first.conversation_id == null ? null : String(first.conversation_id);
    const startedAt = String(first.started_at);

    const allFinished = groupRows.every((r) => r.finished_at != null);
    const anyRunning = groupRows.some((r) => String(r.status) === "running");
    const anyWaiting = groupRows.some((r) => String(r.status) === "waiting");
    const status: TaskStatus = anyRunning
      ? "open"
      : anyWaiting
        ? "waiting"
        : mapRunStatusToTaskStatus(String(last.status));
    const isTerminal = status !== "open" && status !== "waiting";

    const finishedAt =
      isTerminal && allFinished && last.finished_at != null ? String(last.finished_at) : null;
    const durationMs = finishedAt ? calculateDurationMs(startedAt, finishedAt) : null;
    const completionKind = isTerminal ? parseCompletionKind(last.completion_kind) : null;
    const manualCompletionReason = isTerminal
      ? parseManualCompletionReason(last.manual_completion_reason)
      : null;
    const manualCompletionNote =
      isTerminal && last.manual_completion_note != null
        ? String(last.manual_completion_note)
        : null;
    const completionSummary = isTerminal
      ? parseCompletionSummaryJson(last.completion_summary_json)
      : null;
    const needsReview = groupRows.some((r) => Number(r.needs_review ?? 0) === 1);

    let completionReason: TaskCompletionReason = null;
    if (isTerminal) {
      if (completionKind === "manual") {
        completionReason = "manual";
      } else if (status === "timed_out") {
        completionReason = "automatic_timeout";
      } else if (completionSummary != null) {
        completionReason = "all_runs_terminal_with_summary";
      }
    }

    insertTaskStmt.run(
      taskId,
      title,
      promptText,
      conversationId,
      startedAt,
      startedAt,
      finishedAt,
      durationMs,
      status,
      completionSummary ? JSON.stringify(completionSummary) : null,
      completionKind,
      manualCompletionReason,
      manualCompletionNote,
      completionReason,
      needsReview ? 1 : 0,
    );

    for (const row of groupRows) {
      updateRunTaskStmt.run(taskId, String(row.id));
    }
  }
}

export function openStore(dbPath: string): TelemetryStore {
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  const cols = db.prepare("PRAGMA table_info(runs)").all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "completion_summary_json")) {
    db.exec("ALTER TABLE runs ADD COLUMN completion_summary_json TEXT");
  }
  if (!cols.some((c) => c.name === "completion_kind")) {
    db.exec("ALTER TABLE runs ADD COLUMN completion_kind TEXT");
  }
  if (!cols.some((c) => c.name === "manual_completion_reason")) {
    db.exec("ALTER TABLE runs ADD COLUMN manual_completion_reason TEXT");
  }
  if (!cols.some((c) => c.name === "manual_completion_note")) {
    db.exec("ALTER TABLE runs ADD COLUMN manual_completion_note TEXT");
  }
  if (!cols.some((c) => c.name === "lifecycle_reason")) {
    db.exec("ALTER TABLE runs ADD COLUMN lifecycle_reason TEXT");
  }
  if (!cols.some((c) => c.name === "idle_ms")) {
    db.exec("ALTER TABLE runs ADD COLUMN idle_ms INTEGER");
  }
  if (!cols.some((c) => c.name === "needs_review")) {
    db.exec("ALTER TABLE runs ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.some((c) => c.name === "task_id")) {
    db.exec("ALTER TABLE runs ADD COLUMN task_id TEXT");
    backfillTasksFromRuns(db);
  }
  // Created here (not in SCHEMA) so it never runs before the task_id ALTER above
  // on pre-existing databases that predate the tasks table.
  db.exec("CREATE INDEX IF NOT EXISTS idx_runs_task ON runs(task_id)");

  const defaults: SettingsRecord = {
    sqlitePath: dbPath,
    notificationProvider: "ntfy",
    ntfyServer: "https://ntfy.sh",
    ntfyTopic: "",
  };

  const existing = db.prepare("SELECT * FROM settings WHERE id = 1").get() as
    Record<string, unknown> | undefined;
  if (!existing) {
    db.prepare(
      `INSERT INTO settings (id, sqlite_path, notification_provider, ntfy_server, ntfy_topic)
       VALUES (1, ?, ?, ?, ?)`,
    ).run(
      defaults.sqlitePath,
      defaults.notificationProvider,
      defaults.ntfyServer,
      defaults.ntfyTopic,
    );
  } else {
    db.prepare("UPDATE settings SET sqlite_path = ? WHERE id = 1").run(dbPath);
  }

  const store: TelemetryStore = {
    dbPath,

    close() {
      db.close();
    },

    getSettings() {
      const row = db.prepare("SELECT * FROM settings WHERE id = 1").get() as Record<
        string,
        unknown
      >;
      return {
        sqlitePath: String(row.sqlite_path),
        notificationProvider: String(
          row.notification_provider,
        ) as SettingsRecord["notificationProvider"],
        ntfyServer: String(row.ntfy_server),
        ntfyTopic: String(row.ntfy_topic),
      };
    },

    updateSettings(patch) {
      const current = store.getSettings();
      const next: SettingsRecord = {
        sqlitePath: patch.sqlitePath ?? current.sqlitePath,
        notificationProvider: patch.notificationProvider ?? current.notificationProvider,
        ntfyServer: patch.ntfyServer ?? current.ntfyServer,
        ntfyTopic: patch.ntfyTopic ?? current.ntfyTopic,
      };
      db.prepare(
        `UPDATE settings SET sqlite_path = ?, notification_provider = ?, ntfy_server = ?, ntfy_topic = ?
         WHERE id = 1`,
      ).run(next.sqlitePath, next.notificationProvider, next.ntfyServer, next.ntfyTopic);
      return next;
    },

    insertPrompt(prompt) {
      db.prepare(
        `INSERT INTO prompts (id, prompt, title, created_at, conversation_id, model)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        prompt.id,
        prompt.prompt,
        prompt.title,
        prompt.createdAt,
        prompt.conversationId,
        prompt.model,
      );
    },

    getPrompt(id) {
      const row = db.prepare("SELECT * FROM prompts WHERE id = ?").get(id) as
        Record<string, unknown> | undefined;
      return row ? rowPrompt(row) : null;
    },

    listPrompts(limit = 100) {
      const rows = db
        .prepare("SELECT * FROM prompts ORDER BY created_at DESC LIMIT ?")
        .all(limit) as Record<string, unknown>[];
      return rows.map(rowPrompt);
    },

    insertRun(run) {
      db.prepare(
        `INSERT INTO runs (
          id, prompt_id, task_id, started_at, finished_at, duration_ms, status, summary,
          completion_summary_json, conversation_id, generation_id, phase, latest_shell, latest_file,
          completion_kind, manual_completion_reason, manual_completion_note,
          lifecycle_reason, idle_ms, needs_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        run.id,
        run.promptId,
        run.taskId,
        run.startedAt,
        run.finishedAt,
        run.durationMs,
        run.status,
        run.summary,
        run.completionSummary ? JSON.stringify(run.completionSummary) : null,
        run.conversationId,
        run.generationId,
        run.phase,
        run.latestShell,
        run.latestFile,
        run.completionKind,
        run.manualCompletionReason,
        run.manualCompletionNote,
        run.lifecycleReason,
        run.idleMs,
        run.needsReview ? 1 : 0,
      );
    },

    updateRun(run) {
      db.prepare(
        `UPDATE runs SET
          task_id = ?, finished_at = ?, duration_ms = ?, status = ?, summary = ?,
          completion_summary_json = ?,
          phase = ?, latest_shell = ?, latest_file = ?,
          completion_kind = ?, manual_completion_reason = ?, manual_completion_note = ?,
          lifecycle_reason = ?, idle_ms = ?, needs_review = ?
         WHERE id = ?`,
      ).run(
        run.taskId,
        run.finishedAt,
        run.durationMs,
        run.status,
        run.summary,
        run.completionSummary ? JSON.stringify(run.completionSummary) : null,
        run.phase,
        run.latestShell,
        run.latestFile,
        run.completionKind,
        run.manualCompletionReason,
        run.manualCompletionNote,
        run.lifecycleReason,
        run.idleMs,
        run.needsReview ? 1 : 0,
        run.id,
      );
    },

    getRun(id) {
      const row = db.prepare("SELECT * FROM runs WHERE id = ?").get(id) as
        Record<string, unknown> | undefined;
      return row ? rowRun(row) : null;
    },

    getActiveRun() {
      const row = db
        .prepare(
          `SELECT * FROM runs WHERE status IN ('running', 'waiting')
           ORDER BY started_at DESC LIMIT 1`,
        )
        .get() as Record<string, unknown> | undefined;
      return row ? rowRun(row) : null;
    },

    listOpenRuns() {
      const rows = db
        .prepare(
          `SELECT * FROM runs WHERE status IN ('running', 'waiting')
           ORDER BY started_at DESC`,
        )
        .all() as Record<string, unknown>[];
      return rows.map(rowRun);
    },

    findRecentFinishedRun(opts) {
      const nowMs = Date.parse(opts.nowIso ?? new Date().toISOString());
      if (!Number.isFinite(nowMs)) return null;
      const cutoff = new Date(nowMs - opts.lookbackMs).toISOString();
      if (opts.generationId) {
        const row = db
          .prepare(
            `SELECT * FROM runs
             WHERE conversation_id = ? AND generation_id = ?
               AND finished_at IS NOT NULL AND finished_at >= ?
             ORDER BY finished_at DESC LIMIT 1`,
          )
          .get(opts.conversationId, opts.generationId, cutoff) as
          | Record<string, unknown>
          | undefined;
        return row ? rowRun(row) : null;
      }
      const row = db
        .prepare(
          `SELECT * FROM runs
           WHERE conversation_id = ?
             AND finished_at IS NOT NULL AND finished_at >= ?
           ORDER BY finished_at DESC LIMIT 1`,
        )
        .get(opts.conversationId, cutoff) as Record<string, unknown> | undefined;
      return row ? rowRun(row) : null;
    },

    getLatestRun() {
      const row = db
        .prepare("SELECT * FROM runs ORDER BY started_at DESC LIMIT 1")
        .get() as Record<string, unknown> | undefined;
      return row ? rowRun(row) : null;
    },

    listRuns(opts = {}) {
      const sort = opts.sort ?? "started_at";
      const dir = opts.dir === "asc" ? "ASC" : "DESC";
      const col =
        sort === "duration_ms" ? "duration_ms" : sort === "status" ? "status" : "started_at";
      const rows = db
        .prepare(`SELECT * FROM runs ORDER BY ${col} ${dir} LIMIT 500`)
        .all() as Record<string, unknown>[];
      return rows.map(rowRun);
    },

    listRunsForPrompt(promptId) {
      const rows = db
        .prepare("SELECT * FROM runs WHERE prompt_id = ? ORDER BY started_at DESC")
        .all(promptId) as Record<string, unknown>[];
      return rows.map(rowRun);
    },

    insertTask(task) {
      db.prepare(
        `INSERT INTO tasks (
          id, title, prompt_text, conversation_id, created_at, started_at, finished_at,
          duration_ms, status, completion_summary_json, completion_kind,
          manual_completion_reason, manual_completion_note, completion_reason, needs_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        task.id,
        task.title,
        task.promptText,
        task.conversationId,
        task.createdAt,
        task.startedAt,
        task.finishedAt,
        task.durationMs,
        task.status,
        task.completionSummary ? JSON.stringify(task.completionSummary) : null,
        task.completionKind,
        task.manualCompletionReason,
        task.manualCompletionNote,
        task.completionReason,
        task.needsReview ? 1 : 0,
      );
    },

    updateTask(task) {
      db.prepare(
        `UPDATE tasks SET
          title = ?, finished_at = ?, duration_ms = ?, status = ?,
          completion_summary_json = ?, completion_kind = ?,
          manual_completion_reason = ?, manual_completion_note = ?,
          completion_reason = ?, needs_review = ?
         WHERE id = ?`,
      ).run(
        task.title,
        task.finishedAt,
        task.durationMs,
        task.status,
        task.completionSummary ? JSON.stringify(task.completionSummary) : null,
        task.completionKind,
        task.manualCompletionReason,
        task.manualCompletionNote,
        task.completionReason,
        task.needsReview ? 1 : 0,
        task.id,
      );
    },

    getTask(id) {
      const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
        Record<string, unknown> | undefined;
      return row ? rowTask(row) : null;
    },

    getOpenTaskByConversation(conversationId) {
      const row = db
        .prepare(
          `SELECT * FROM tasks WHERE conversation_id = ? AND status IN ('open', 'waiting')
           ORDER BY started_at DESC LIMIT 1`,
        )
        .get(conversationId) as Record<string, unknown> | undefined;
      return row ? rowTask(row) : null;
    },

    listTasks(opts = {}) {
      const sort = opts.sort ?? "started_at";
      const dir = opts.dir === "asc" ? "ASC" : "DESC";
      const col =
        sort === "duration_ms" ? "duration_ms" : sort === "status" ? "status" : "started_at";
      const rows = db
        .prepare(`SELECT * FROM tasks ORDER BY ${col} ${dir} LIMIT 500`)
        .all() as Record<string, unknown>[];
      return rows.map(rowTask);
    },

    listRunsForTask(taskId) {
      const rows = db
        .prepare("SELECT * FROM runs WHERE task_id = ? ORDER BY started_at DESC")
        .all(taskId) as Record<string, unknown>[];
      return rows.map(rowRun);
    },

    findRecentFinishedTask(opts) {
      const nowMs = Date.parse(opts.nowIso ?? new Date().toISOString());
      if (!Number.isFinite(nowMs)) return null;
      const cutoff = new Date(nowMs - opts.lookbackMs).toISOString();
      const row = db
        .prepare(
          `SELECT * FROM tasks
           WHERE conversation_id = ?
             AND finished_at IS NOT NULL AND finished_at >= ?
           ORDER BY finished_at DESC LIMIT 1`,
        )
        .get(opts.conversationId, cutoff) as Record<string, unknown> | undefined;
      return row ? rowTask(row) : null;
    },

    countRunsForTask(taskId) {
      const row = db.prepare("SELECT COUNT(*) AS c FROM runs WHERE task_id = ?").get(taskId) as {
        c: number;
      };
      return Number(row.c);
    },

    deleteRun(id) {
      const existing = store.getRun(id);
      if (!existing) return false;
      const promptId = existing.promptId;
      db.prepare("DELETE FROM run_artifacts WHERE run_id = ?").run(id);
      db.prepare("DELETE FROM events WHERE run_id = ?").run(id);
      db.prepare("DELETE FROM notifications WHERE run_id = ?").run(id);
      db.prepare("UPDATE inbox_notifications SET run_id = NULL WHERE run_id = ?").run(id);
      db.prepare("DELETE FROM runs WHERE id = ?").run(id);
      const remaining = store.listRunsForPrompt(promptId);
      if (remaining.length === 0) {
        db.prepare("DELETE FROM prompts WHERE id = ?").run(promptId);
      }
      return true;
    },

    insertEvent(event) {
      db.prepare(
        `INSERT INTO events (id, run_id, timestamp, type, summary, payload_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(event.id, event.runId, event.timestamp, event.type, event.summary, event.payloadJson);
    },

    listEvents(runId) {
      const rows = db
        .prepare("SELECT * FROM events WHERE run_id = ? ORDER BY timestamp ASC")
        .all(runId) as Record<string, unknown>[];
      return rows.map(rowEvent);
    },

    listRecentEvents(limit = 100, type) {
      if (type && type.length > 0) {
        const rows = db
          .prepare(
            "SELECT * FROM events WHERE type = ? ORDER BY timestamp DESC LIMIT ?",
          )
          .all(type, limit) as Record<string, unknown>[];
        return rows.map(rowEvent);
      }
      const rows = db
        .prepare("SELECT * FROM events ORDER BY timestamp DESC LIMIT ?")
        .all(limit) as Record<string, unknown>[];
      return rows.map(rowEvent);
    },

    countEvents(runId) {
      const row = db.prepare("SELECT COUNT(*) AS c FROM events WHERE run_id = ?").get(runId) as {
        c: number;
      };
      return Number(row.c);
    },

    getAggregateStats() {
      const runs = db.prepare("SELECT COUNT(*) AS c FROM runs").get() as { c: number };
      const events = db.prepare("SELECT COUNT(*) AS c FROM events").get() as { c: number };
      const prompts = db.prepare("SELECT COUNT(*) AS c FROM prompts").get() as { c: number };
      const oldest = db.prepare("SELECT MIN(timestamp) AS t FROM events").get() as {
        t: string | null;
      };
      const newest = db.prepare("SELECT MAX(timestamp) AS t FROM events").get() as {
        t: string | null;
      };
      const lastRun = db.prepare("SELECT MAX(started_at) AS t FROM runs").get() as {
        t: string | null;
      };
      const lastWriteCandidates = [newest.t, lastRun.t].filter(Boolean) as string[];
      lastWriteCandidates.sort();
      return {
        runCount: Number(runs.c),
        eventCount: Number(events.c),
        promptCount: Number(prompts.c),
        oldestEventAt: oldest.t ?? null,
        newestEventAt: newest.t ?? null,
        lastWriteAt: lastWriteCandidates.at(-1) ?? null,
      };
    },

    insertNotification(n) {
      db.prepare(
        `INSERT INTO notifications (id, run_id, provider, sent_at, success, detail)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(n.id, n.runId, n.provider, n.sentAt, n.success ? 1 : 0, n.detail);
    },

    listNotifications(runId) {
      const rows = db
        .prepare("SELECT * FROM notifications WHERE run_id = ? ORDER BY sent_at DESC")
        .all(runId) as Record<string, unknown>[];
      return rows.map(rowNotification);
    },

    insertArtifact(artifact) {
      db.prepare(
        `INSERT INTO run_artifacts (
          id, run_id, kind, page_key, page_label, phase, filename,
          relative_path, mime_type, byte_size, created_at, caption
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        artifact.id,
        artifact.runId,
        artifact.kind,
        artifact.pageKey,
        artifact.pageLabel,
        artifact.phase,
        artifact.filename,
        artifact.relativePath,
        artifact.mimeType,
        artifact.byteSize,
        artifact.createdAt,
        artifact.caption,
      );
    },

    getArtifact(id) {
      const row = db.prepare("SELECT * FROM run_artifacts WHERE id = ?").get(id) as
        | Record<string, unknown>
        | undefined;
      return row ? rowArtifact(row) : null;
    },

    listArtifacts(runId) {
      const rows = db
        .prepare("SELECT * FROM run_artifacts WHERE run_id = ? ORDER BY created_at ASC")
        .all(runId) as Record<string, unknown>[];
      return rows.map(rowArtifact);
    },

    deleteArtifact(id) {
      const existing = store.getArtifact(id);
      if (!existing) return false;
      db.prepare("DELETE FROM run_artifacts WHERE id = ?").run(id);
      return true;
    },

    findArtifactByPagePhase(runId, pageKey, phase) {
      const row = db
        .prepare(
          `SELECT * FROM run_artifacts
           WHERE run_id = ? AND page_key = ? AND phase IS ?
           ORDER BY created_at DESC LIMIT 1`,
        )
        .get(runId, pageKey, phase) as Record<string, unknown> | undefined;
      return row ? rowArtifact(row) : null;
    },

    insertInboxNotification(notification) {
      db.prepare(
        `INSERT INTO inbox_notifications (
          id, category, title, body, href, run_id, read_at, created_at, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        notification.id,
        notification.category,
        notification.title,
        notification.body,
        notification.href,
        notification.runId,
        notification.readAt,
        notification.createdAt,
        notification.metadata ? JSON.stringify(notification.metadata) : null,
      );
    },

    getInboxNotification(id) {
      const row = db.prepare("SELECT * FROM inbox_notifications WHERE id = ?").get(id) as
        | Record<string, unknown>
        | undefined;
      return row ? rowInboxNotification(row) : null;
    },

    listInboxNotifications(opts = {}) {
      const clauses: string[] = [];
      const params: (string | number)[] = [];
      if (opts.category) {
        clauses.push("category = ?");
        params.push(opts.category);
      }
      if (opts.unreadOnly) {
        clauses.push("read_at IS NULL");
      }
      if (opts.q && opts.q.trim().length > 0) {
        clauses.push("(title LIKE ? OR body LIKE ?)");
        const like = `%${opts.q.trim()}%`;
        params.push(like, like);
      }
      const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const limit = opts.limit && opts.limit > 0 ? Math.floor(opts.limit) : 200;
      const rows = db
        .prepare(
          `SELECT * FROM inbox_notifications ${where} ORDER BY created_at DESC LIMIT ?`,
        )
        .all(...params, limit) as Record<string, unknown>[];
      return rows.map(rowInboxNotification);
    },

    countUnreadInboxNotifications() {
      const row = db
        .prepare("SELECT COUNT(*) AS c FROM inbox_notifications WHERE read_at IS NULL")
        .get() as { c: number };
      return Number(row.c);
    },

    markInboxRead(id, read) {
      const existing = store.getInboxNotification(id);
      if (!existing) return null;
      const readAt = read ? new Date().toISOString() : null;
      db.prepare("UPDATE inbox_notifications SET read_at = ? WHERE id = ?").run(readAt, id);
      return { ...existing, readAt };
    },

    markAllInboxRead() {
      const now = new Date().toISOString();
      const result = db
        .prepare("UPDATE inbox_notifications SET read_at = ? WHERE read_at IS NULL")
        .run(now);
      return Number(result.changes ?? 0);
    },

    deleteInboxNotification(id) {
      const existing = store.getInboxNotification(id);
      if (!existing) return false;
      db.prepare("DELETE FROM inbox_notifications WHERE id = ?").run(id);
      return true;
    },

    clearInboxNotifications() {
      db.exec("DELETE FROM inbox_notifications");
    },

    listNotificationPreferences() {
      const rows = db
        .prepare("SELECT * FROM notification_preferences ORDER BY category ASC")
        .all() as Record<string, unknown>[];
      return rows.map(rowNotificationPreference);
    },

    upsertNotificationPreference(pref) {
      db.prepare(
        `INSERT INTO notification_preferences (
          category, browser_enabled, pwa_enabled, mobile_enabled, email_enabled, webhook_enabled, slack_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(category) DO UPDATE SET
          browser_enabled = excluded.browser_enabled,
          pwa_enabled = excluded.pwa_enabled,
          mobile_enabled = excluded.mobile_enabled,
          email_enabled = excluded.email_enabled,
          webhook_enabled = excluded.webhook_enabled,
          slack_enabled = excluded.slack_enabled`,
      ).run(
        pref.category,
        pref.browserEnabled ? 1 : 0,
        pref.pwaEnabled ? 1 : 0,
        pref.mobileEnabled ? 1 : 0,
        pref.emailEnabled ? 1 : 0,
        pref.webhookEnabled ? 1 : 0,
        pref.slackEnabled ? 1 : 0,
      );
      return pref;
    },

    ensureDefaultPreferences() {
      const existing = new Set(
        (
          db.prepare("SELECT category FROM notification_preferences").all() as Array<{
            category: string;
          }>
        ).map((r) => r.category),
      );
      for (const category of NOTIFICATION_CATEGORIES) {
        if (!existing.has(category)) {
          store.upsertNotificationPreference(defaultPreference(category));
        }
      }
    },
  };

  return store;
}
