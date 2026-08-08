import { useReducedMotion } from "@platform/animation";
import type { Transition } from "motion/react";
import { resolveTransition } from "./resolveTransition.js";

export type SongaraMotionState = {
  /** `true` when `prefers-reduced-motion: reduce` is active. */
  reducedMotion: boolean;
  /** Transition that snaps when `reducedMotion` is true. */
  transition: Transition;
};

/**
 * Songara motion preference + a reduced-motion-aware default transition.
 * Prefer this over Motion's own `useReducedMotion` so apps share one foundation signal.
 */
export function useSongaraMotion(transition?: Transition): SongaraMotionState {
  const reducedMotion = useReducedMotion();
  return {
    reducedMotion,
    transition: resolveTransition(reducedMotion, transition),
  };
}
