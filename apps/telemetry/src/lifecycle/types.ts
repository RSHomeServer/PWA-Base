import type { EventRecord, RunRecord } from "../types.js";

/** Inputs for idle / waiting evaluation (pure rules). */
export interface IdleEvaluationInput {
  run: RunRecord;
  /** Most recent activity timestamp (ISO), including events and run start. */
  lastActivityAt: string;
  nowMs: number;
  idleSoftMs: number;
  idleTimeoutMs: number;
}

export type IdleDecision =
  | { action: "none" }
  | { action: "mark_waiting"; idleMs: number }
  | { action: "timeout"; idleMs: number };

/** Orphan attach confidence tiers. */
export type OrphanAttachConfidence = "high" | "medium" | "none";

export interface OrphanAttachDecision {
  confidence: OrphanAttachConfidence;
  /** Finished run to append to when confidence is high or medium. */
  run: RunRecord | null;
  needsReview: boolean;
}

export interface OrphanAttachInput {
  conversationId: string | null;
  generationId: string | null;
  nowIso: string;
  /** High-confidence: conversation + generation within this window. */
  highLookbackMs: number;
  /** Medium-confidence: conversation-only within this window. */
  mediumLookbackMs: number;
  findFinished: (opts: {
    conversationId: string;
    generationId?: string | null;
    lookbackMs: number;
    nowIso: string;
  }) => RunRecord | null;
}

/** Activity event types that reset idle for the supervisor. */
export const ACTIVITY_EVENT_TYPES = new Set([
  "agent_thought",
  "agent_response",
  "shell_execution",
  "file_edit",
  "prompt_submitted",
  "manual_completion",
  "run_stop",
]);

export function lastActivityFromEvents(
  run: RunRecord,
  events: Pick<EventRecord, "timestamp" | "type">[],
): string {
  let latest = run.startedAt;
  for (const ev of events) {
    if (!ACTIVITY_EVENT_TYPES.has(ev.type) && ev.type !== "orphan_flagged") continue;
    if (ev.timestamp > latest) latest = ev.timestamp;
  }
  // Shell / file path updates without matching events still count via run fields timestamps —
  // those are reflected when events are appended; fall back to startedAt / finished null.
  return latest;
}
