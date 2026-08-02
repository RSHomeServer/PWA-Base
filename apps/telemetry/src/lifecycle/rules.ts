import type {
  IdleDecision,
  IdleEvaluationInput,
  OrphanAttachDecision,
  OrphanAttachInput,
} from "./types.js";

/** Default high-confidence orphan window: conversation + generation. */
export const ORPHAN_HIGH_LOOKBACK_MS = 15 * 60 * 1000;
/** Default medium-confidence orphan window: conversation only. */
export const ORPHAN_MEDIUM_LOOKBACK_MS = 5 * 60 * 1000;

/**
 * Evaluate idle soft/full thresholds for an open run.
 * Does not mutate — caller applies waiting / timed_out.
 */
export function evaluateIdle(input: IdleEvaluationInput): IdleDecision {
  const { run, lastActivityAt, nowMs, idleSoftMs, idleTimeoutMs } = input;
  if (run.status !== "running" && run.status !== "waiting") {
    return { action: "none" };
  }
  const lastMs = Date.parse(lastActivityAt);
  if (!Number.isFinite(lastMs)) return { action: "none" };
  const idleMs = Math.max(0, nowMs - lastMs);
  if (idleMs >= idleTimeoutMs) {
    return { action: "timeout", idleMs };
  }
  if (idleMs >= idleSoftMs && run.status === "running") {
    return { action: "mark_waiting", idleMs };
  }
  return { action: "none" };
}

/**
 * Deterministic orphan attachment:
 * 1. conversation + generation within high lookback → high (no review)
 * 2. conversation only within medium lookback → medium (needs review)
 * 3. else → none (caller creates orphan with needs_review)
 */
export function decideOrphanAttach(input: OrphanAttachInput): OrphanAttachDecision {
  const { conversationId, generationId, nowIso, highLookbackMs, mediumLookbackMs, findFinished } =
    input;
  if (!conversationId) {
    return { confidence: "none", run: null, needsReview: true };
  }

  if (generationId) {
    const high = findFinished({
      conversationId,
      generationId,
      lookbackMs: highLookbackMs,
      nowIso,
    });
    if (high) {
      return { confidence: "high", run: high, needsReview: false };
    }
  }

  const medium = findFinished({
    conversationId,
    generationId: null,
    lookbackMs: mediumLookbackMs,
    nowIso,
  });
  if (medium) {
    return { confidence: "medium", run: medium, needsReview: true };
  }

  return { confidence: "none", run: null, needsReview: true };
}

/**
 * Whether an open run may receive an event with the given IDs.
 * Rejects when both sides have IDs that disagree.
 */
export function openRunMatchesIds(
  run: {
    conversationId: string | null;
    generationId: string | null;
  },
  conversationId: string | null,
  generationId: string | null,
): boolean {
  if (generationId && run.generationId) {
    return run.generationId === generationId;
  }
  if (conversationId && run.conversationId) {
    if (run.conversationId !== conversationId) return false;
    // Conversation matches; if event also has generation and run has a different one, reject.
    if (generationId && run.generationId && run.generationId !== generationId) return false;
    return true;
  }
  // Event carries IDs but run has none (or vice versa without conflict): allow only when
  // we are not attaching across mismatched generation/conversation pairs.
  if (generationId && run.generationId && generationId !== run.generationId) return false;
  if (conversationId && run.conversationId && conversationId !== run.conversationId) {
    return false;
  }
  return true;
}
