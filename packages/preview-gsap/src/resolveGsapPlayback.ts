export type ResolvedGsapPlayback = {
  /** When false, callers should kill tweens and leave static values. */
  allowMotion: boolean;
  /** Suggested GSAP global/timeline timeScale (0 freezes). */
  timeScale: number;
};

/**
 * Pure Songara reduced-motion policy for GSAP timelines/tweens.
 */
export function resolveGsapPlayback(
  reducedMotion: boolean,
): ResolvedGsapPlayback {
  if (reducedMotion) return { allowMotion: false, timeScale: 0 };
  return { allowMotion: true, timeScale: 1 };
}
