import { useReducedMotion } from "@platform/animation";
import {
  resolveLottiePlayback,
  type LottiePlaybackPrefs,
  type ResolvedLottiePlayback,
} from "./resolveLottiePlayback.js";

export type SongaraLottiePlaybackState = ResolvedLottiePlayback & {
  /** `true` when `prefers-reduced-motion: reduce` is active. */
  reducedMotion: boolean;
};

/**
 * Songara Lottie preference + reduced-motion-aware playback flags.
 * Prefer this over ad-hoc `prefers-reduced-motion` checks so apps share one foundation signal.
 */
export function useSongaraLottiePlayback(
  prefs?: LottiePlaybackPrefs,
): SongaraLottiePlaybackState {
  const reducedMotion = useReducedMotion();
  return {
    reducedMotion,
    ...resolveLottiePlayback(reducedMotion, prefs),
  };
}
