import type { TaskRecord } from "../types.js";

/** Default grace after last heavy activity before auto-completing a Task (ms). */
export const TASK_COMPLETION_GRACE_MS = 60_000;

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
  | "overview_quality_warn"
  | "report_validation_error"
  | "report_validation_warn";

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

export interface TaskCompletionEvidence {
  allRunsTerminal: boolean;
  hasStructuredSummary: boolean;
  noRecentHeavyActivity: boolean;
  openRunCount: number;
  summarySource: "task" | "run" | "none";
}

const HEAVY_SHELL_RE = /\b(playwright|vite\s+build|pnpm\s+(?:test|build)|npm\s+(?:test|run\s+build)|docker\s+compose)\b/i;

export function isHeavyShellCommand(command: string | null | undefined): boolean {
  if (!command) return false;
  return HEAVY_SHELL_RE.test(command);
}

/**
 * Decide whether a Task may auto-complete given evidence.
 */
export function canAutoCompleteTask(evidence: TaskCompletionEvidence): boolean {
  return (
    evidence.allRunsTerminal &&
    evidence.hasStructuredSummary &&
    evidence.noRecentHeavyActivity &&
    evidence.openRunCount === 0
  );
}

/**
 * Soft overview quality check — warn only, never block.
 */
export function overviewLooksThin(overview: string | null | undefined): boolean {
  if (!overview) return true;
  const t = overview.trim();
  if (t.length < 40) return true;
  if (/^e2e\s+fixture/i.test(t)) return true;
  return false;
}

export function decideTaskPlacement(
  conversationId: string | null,
  openTask: TaskRecord | null,
): { action: "reuse_open_task" | "create_task"; confidence: "high" | "medium" } {
  if (conversationId && openTask && openTask.status === "open") {
    return { action: "reuse_open_task", confidence: "high" };
  }
  if (conversationId && openTask && openTask.status === "waiting") {
    return { action: "reuse_open_task", confidence: "high" };
  }
  return { action: "create_task", confidence: "high" };
}
