/**
 * Preview: thin Rive (@rive-app/react-canvas) integration.
 * Public import: `@songara/pwa-base/preview/rive`
 *
 * API may evolve. Intended Stable home when graduated:
 * `@songara/pwa-base/animation` (alongside reduced-motion / viewport hooks).
 */

export {
  Alignment,
  Fit,
  Layout,
  useRive,
  useStateMachineInput,
} from "@rive-app/react-canvas";
export type { UseRiveParameters, UseRiveOptions } from "@rive-app/react-canvas";

export { useReducedMotion } from "@platform/animation";

export {
  FROZEN_RIVE_PLAYBACK,
  resolveRivePlayback,
} from "./resolveRivePlayback.js";
export type {
  ResolvedRivePlayback,
  RivePlaybackPrefs,
} from "./resolveRivePlayback.js";
export { useSongaraRivePlayback } from "./useSongaraRivePlayback.js";
export type { SongaraRivePlaybackState } from "./useSongaraRivePlayback.js";
