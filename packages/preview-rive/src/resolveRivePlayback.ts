export type RivePlaybackPrefs = {
  autoplay?: boolean;
};

export type ResolvedRivePlayback = {
  autoplay: boolean;
};

/** Playback that keeps the Rive runtime paused. */
export const FROZEN_RIVE_PLAYBACK = {
  autoplay: false,
} as const satisfies ResolvedRivePlayback;

/**
 * Returns autoplay when motion is allowed, otherwise a freeze.
 * Pure helper for Songara reduced-motion policy on Rive players.
 */
export function resolveRivePlayback(
  reducedMotion: boolean,
  prefs?: RivePlaybackPrefs,
): ResolvedRivePlayback {
  if (reducedMotion) return { ...FROZEN_RIVE_PLAYBACK };
  return { autoplay: prefs?.autoplay ?? true };
}
