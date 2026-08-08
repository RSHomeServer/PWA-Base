/**
 * Preview: Motion (ex-Framer Motion) thin integration.
 * Public import: `@songara/pwa-base/preview/motion`
 *
 * API may evolve. Intended Stable home when graduated:
 * `@songara/pwa-base/animation` (alongside existing reduced-motion / viewport hooks).
 */

// Re-export core Motion React primitives (OSS-shaped surface).
export {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useAnimate,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
export type {
  HTMLMotionProps,
  MotionProps,
  Transition,
  Variants,
} from "motion/react";

// Foundation reduced-motion (same hook as `@songara/pwa-base/animation`).
export { useReducedMotion } from "@platform/animation";

// Songara helpers
export { INSTANT_TRANSITION, resolveTransition } from "./resolveTransition.js";
export { useMotionTransition } from "./useMotionTransition.js";
export { useSongaraMotion } from "./useSongaraMotion.js";
export type { SongaraMotionState } from "./useSongaraMotion.js";
