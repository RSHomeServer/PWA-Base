/**
 * Preview: thin tsparticles (slim + React) integration.
 * Public import: `@songara/pwa-base/preview/tsparticles`
 *
 * Prefer foundation `ParticleField` (`@songara/pwa-base/animation`) when branded
 * glyphs matter. This Preview is for configurable ambient OSS fields.
 *
 * Intended Stable home: `@songara/pwa-base/animation` or a dedicated particles kit.
 */

export {
  Particles,
  ParticlesProvider,
  useParticlesProvider,
} from "@tsparticles/react";
export type {
  IParticlesProps,
  IParticlesProviderProps,
  ParticlesPluginRegistrar,
} from "@tsparticles/react";
export { loadSlim } from "@tsparticles/slim";

export { useReducedMotion } from "@platform/animation";

export {
  FROZEN_PARTICLES_MOTION,
  resolveParticlesMotion,
} from "./resolveParticlesMotion.js";
export type {
  ParticlesMotionPrefs,
  ResolvedParticlesMotion,
} from "./resolveParticlesMotion.js";
export { useSongaraParticlesMotion } from "./useSongaraParticlesMotion.js";
export type { SongaraParticlesMotionState } from "./useSongaraParticlesMotion.js";
