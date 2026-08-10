import { useReducedMotion } from "@platform/animation";
import {
  resolveGsapPlayback,
  type ResolvedGsapPlayback,
} from "./resolveGsapPlayback.js";

export type SongaraGsapPlaybackState = ResolvedGsapPlayback & {
  reducedMotion: boolean;
};

export function useSongaraGsapPlayback(): SongaraGsapPlaybackState {
  const reducedMotion = useReducedMotion();
  return { reducedMotion, ...resolveGsapPlayback(reducedMotion) };
}
