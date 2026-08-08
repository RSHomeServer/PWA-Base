/**
 * Preview: thin lottie-react player integration.
 * Public import: `@songara/pwa-base/preview/lottie`
 *
 * API may evolve. Intended Stable home when graduated:
 * `@songara/pwa-base/animation` (alongside existing reduced-motion / viewport hooks).
 */

// Re-export core lottie-react surface (OSS-shaped).
export { default as Lottie, useLottie, useLottieInteractivity } from "lottie-react";
export type {
  LottieComponentProps,
  LottieOptions,
  LottieRef,
  LottieRefCurrentProps,
  PartialLottieComponentProps,
  PartialLottieOptions,
} from "lottie-react";

// Foundation reduced-motion (same hook as `@songara/pwa-base/animation`).
export { useReducedMotion } from "@platform/animation";

// Songara helpers
export {
  FROZEN_LOTTIE_PLAYBACK,
  resolveLottiePlayback,
} from "./resolveLottiePlayback.js";
export type {
  LottiePlaybackPrefs,
  ResolvedLottiePlayback,
} from "./resolveLottiePlayback.js";
export { useSongaraLottiePlayback } from "./useSongaraLottiePlayback.js";
export type { SongaraLottiePlaybackState } from "./useSongaraLottiePlayback.js";
export { SongaraLottie } from "./SongaraLottie.js";
export type { SongaraLottieProps } from "./SongaraLottie.js";
