import { useReducedMotion } from "@platform/animation";
import {
  resolveRivePlayback,
  type ResolvedRivePlayback,
  type RivePlaybackPrefs,
} from "./resolveRivePlayback.js";

export type SongaraRivePlaybackState = ResolvedRivePlayback & {
  reducedMotion: boolean;
};

/**
 * Songara Rive preference + reduced-motion-aware autoplay flag.
 */
export function useSongaraRivePlayback(
  prefs?: RivePlaybackPrefs,
): SongaraRivePlaybackState {
  const reducedMotion = useReducedMotion();
  return {
    reducedMotion,
    ...resolveRivePlayback(reducedMotion, prefs),
  };
}
