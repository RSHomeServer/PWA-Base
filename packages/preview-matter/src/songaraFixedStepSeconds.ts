/**
 * Fixed simulation step in seconds for Songara physics Previews.
 * Keeps engines on a predictable tick (default 60 Hz).
 */
export function songaraFixedStepSeconds(hz = 60): number {
  if (!Number.isFinite(hz) || hz <= 0) {
    throw new Error(
      `songaraFixedStepSeconds: hz must be a positive finite number (got ${hz})`,
    );
  }
  return 1 / hz;
}
