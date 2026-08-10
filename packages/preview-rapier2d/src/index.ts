/**
 * Preview: thin Rapier2D (@dimforge/rapier2d-compat) bootstrap.
 * Public import: `@songara/pwa-base/preview/rapier2d`
 *
 * Keep `@songara/pwa-base/physics` separate (generic fixed-step SoA engine).
 * Intended Stable home when graduated: dedicated physics-engine kit or extend
 * `/physics` only if the API stays thin and multi-app.
 */

export { default as RAPIER } from "@dimforge/rapier2d-compat";

export {
  createSongaraRapierWorld,
  initSongaraRapier,
} from "./createSongaraRapierWorld.js";
export type {
  CreateSongaraRapierWorldOptions,
  SongaraRapierGravity,
} from "./createSongaraRapierWorld.js";
export { songaraFixedStepSeconds } from "./songaraFixedStepSeconds.js";
