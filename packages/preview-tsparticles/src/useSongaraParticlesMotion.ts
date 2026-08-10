import { useReducedMotion } from "@platform/animation";
import {
  resolveParticlesMotion,
  type ParticlesMotionPrefs,
  type ResolvedParticlesMotion,
} from "./resolveParticlesMotion.js";

export type SongaraParticlesMotionState = ResolvedParticlesMotion & {
  reducedMotion: boolean;
};

export function useSongaraParticlesMotion(
  prefs?: ParticlesMotionPrefs,
): SongaraParticlesMotionState {
  const reducedMotion = useReducedMotion();
  return {
    reducedMotion,
    ...resolveParticlesMotion(reducedMotion, prefs),
  };
}
