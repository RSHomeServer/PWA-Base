import type { Transition } from "motion/react";

/** Zero-duration transition for `prefers-reduced-motion: reduce`. */
export const INSTANT_TRANSITION = { duration: 0 } as const satisfies Transition;

/**
 * Returns `transition` when motion is allowed, otherwise an instant snap.
 * Pure helper for Songara reduced-motion policy on Motion transitions.
 */
export function resolveTransition(
  reducedMotion: boolean,
  transition?: Transition,
): Transition {
  if (reducedMotion) return INSTANT_TRANSITION;
  return transition ?? {};
}
