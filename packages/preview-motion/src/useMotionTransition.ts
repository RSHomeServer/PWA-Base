import { useReducedMotion } from "@platform/animation";
import type { Transition } from "motion/react";
import { resolveTransition } from "./resolveTransition.js";

/**
 * Motion transition that snaps when the user prefers reduced motion.
 * Composes foundation `@platform/animation` `useReducedMotion`.
 */
export function useMotionTransition(transition?: Transition): Transition {
  const reducedMotion = useReducedMotion();
  return resolveTransition(reducedMotion, transition);
}
