/** Shared domain + API types for the telemetry service. */

import type { InboxNotification } from "./notify/inbox-types.js";
import type { RunCompletionSummary } from "@platform/completion-report";

export type {
  FileAreaGroup,
  FileChangeItem,
  RunCompletionSummary,
  TestResultItem,
  TestResultStatus,
} from "@platform/completion-report";

export type RunStatus =
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "abandoned";

/** How a finished run was closed — null while still running/waiting. */
export type CompletionKind = "automatic" | "manual";

export type ManualCompletionReason =
  | "cursor_completed"
  | "cursor_crashed"
  | "terminal_closed"
  | "other";

/** Deterministic reason recorded by the lifecycle supervisor or orphan path. */
export type LifecycleReason =
  | "automatic_timeout"
  | "orphan_unattached"
  | "orphan_attached_review"
  | null;

/** A Task groups one or more Runs from the same conversation into a single unit of work. */
export type TaskStatus =
  | "open"
  | "waiting"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

/** Deterministic reason a Task was closed. */
export type TaskCompletionReason =
  | "all_runs_terminal_with_summary"
  | "automatic_timeout"
  | "manual"
  | "superseded"
  | null;

export type CursorHookEventName =
  | "beforeSubmitPrompt"
  | "afterAgentThought"
  | "afterFileEdit"
  | "afterShellExecution"
  | "afterAgentResponse"
  | "stop"
  | string;

export interface CursorHookPayload {
  hook_event_name?: string;
  conversation_id?: string;
  generation_id?: string;
  model?: string;
  cursor_version?: string;
  workspace_roots?: string[];
  user_email?: string;
  transcript_path?: string;
  prompt?: string;
  text?: string;
  thought?: string;
  content?: string;
  command?: string;
  output?: string;
  cwd?: string;
  file_path?: string;
  path?: string;
  edits?: unknown;
  duration?: number;
  status?: string;
  attachments?: unknown[];
  [key: string]: unknown;
}

export type NormalisedEventType =
  | "prompt_submitted"
  | "agent_thought"
  | "file_edit"
  | "shell_execution"
  | "agent_response"
  | "run_stop"
  | "unknown";

export interface NormalisedEvent {
  type: NormalisedEventType;
  timestamp: string;
  conversationId: string | null;
  generationId: string | null;
  summary: string;
  payload: Record<string, unknown>;
}

export interface PromptRecord {
  id: string;
  prompt: string;
  title: string;
  createdAt: string;
  conversationId: string | null;
  model: string | null;
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
  /** Short plain-text summary (notifications / fallback). */
  summary: string | null;
  /** Structured completion report — persisted metadata, not reconstructed from events. */
  completionSummary: RunCompletionSummary | null;
  conversationId: string | null;
  generationId: string | null;
  phase: string | null;
  latestShell: string | null;
  latestFile: string | null;
  /** automatic = Cursor stop hook; manual = operator Mark Complete; null = still running. */
  completionKind: CompletionKind | null;
  manualCompletionReason: ManualCompletionReason | null;
  manualCompletionNote: string | null;
  /** Supervisor / orphan path reason. */
  lifecycleReason: LifecycleReason;
  /** Idle duration at timeout completion (ms). */
  idleMs: number | null;
  /** Low-confidence orphan attach or unattached orphan — flag for operator review. */
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

export interface EventRecord {
  id: string;
  runId: string;
  timestamp: string;
  type: string;
  summary: string;
  payloadJson: string;
}

export interface NotificationRecord {
  id: string;
  runId: string;
  provider: string;
  sentAt: string;
  success: boolean;
  detail: string | null;
}

export interface SettingsRecord {
  sqlitePath: string;
  notificationProvider: "ntfy" | "none";
  ntfyServer: string;
  ntfyTopic: string;
}

export type {
  ArtifactKind,
  ArtifactPhase,
  CapturePageTarget,
  CreateArtifactInput,
  RunArtifact,
} from "./artifacts/types.js";

export interface LiveRunView {
  run: RunRecord | null;
  prompt: PromptRecord | null;
  events: EventRecord[];
  elapsedMs: number | null;
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

export function calculateDurationMs(startedAt: string, finishedAt: string): number {
  const start = Date.parse(startedAt);
  const end = Date.parse(finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  return end - start;
}

export function titleFromPrompt(prompt: string, max = 72): string {
  const line = prompt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return "Untitled prompt";
  return line.length <= max ? line : `${line.slice(0, max - 1)}…`;
}
