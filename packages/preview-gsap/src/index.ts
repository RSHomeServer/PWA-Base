/**
 * Preview: thin GSAP integration.
 * Public import: `@songara/pwa-base/preview/gsap`
 *
 * API may evolve. Intended Stable home when graduated:
 * `@songara/pwa-base/animation`.
 *
 * Licence diligence is mandatory for commercial Songara use (GSAP / Club plugins).
 */

export { default as gsap } from "gsap";

export { useReducedMotion } from "@platform/animation";

export { resolveGsapPlayback } from "./resolveGsapPlayback.js";
export type { ResolvedGsapPlayback } from "./resolveGsapPlayback.js";
export { useSongaraGsapPlayback } from "./useSongaraGsapPlayback.js";
export type { SongaraGsapPlaybackState } from "./useSongaraGsapPlayback.js";
