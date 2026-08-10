export type ResolvedToneTransport = {
  /** Suggested Transport state for ambience / autoplay demos. */
  shouldRun: boolean;
};

/**
 * Pure Songara reduced-motion / autoplay policy for Tone.Transport demos.
 * Does **not** start audio — callers must still unlock AudioContext via user gesture.
 * Never use this Preview as a substitute for Stable `AudioEngineProvider`.
 */
export function resolveToneTransport(reducedMotion: boolean): ResolvedToneTransport {
  return { shouldRun: !reducedMotion };
}
