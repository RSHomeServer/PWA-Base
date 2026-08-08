export type LottiePlaybackPrefs = {
  autoplay?: boolean;
  loop?: boolean | number;
};

export type ResolvedLottiePlayback = {
  autoplay: boolean;
  loop: boolean | number;
};

/** Playback that freezes the player (no autoplay, no loop). */
export const FROZEN_LOTTIE_PLAYBACK = {
  autoplay: false,
  loop: false,
} as const satisfies ResolvedLottiePlayback;

/**
 * Returns playback prefs when motion is allowed, otherwise a freeze.
 * Pure helper for Songara reduced-motion policy on Lottie players.
 */
export function resolveLottiePlayback(
  reducedMotion: boolean,
  prefs?: LottiePlaybackPrefs,
): ResolvedLottiePlayback {
  if (reducedMotion) return { ...FROZEN_LOTTIE_PLAYBACK };
  return {
    autoplay: prefs?.autoplay ?? true,
    loop: prefs?.loop ?? true,
  };
}
