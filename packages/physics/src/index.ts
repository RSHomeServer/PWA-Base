/**
 * `@platform/physics` — a renderer-agnostic, fixed-timestep simulation engine.
 *
 * This package has no DOM/Canvas/React dependencies and no cymatics-specific code.
 * It provides the generic building blocks (`World`/`System` scheduling, vector math,
 * integrators, SoA particle storage, forces, constraints, collision, spatial
 * broadphase, scalar fields, noise, oscillators, damping) that any simulation —
 * cymatics, slime mould, cloth, soft body, fluid, reaction-diffusion, cellular
 * automata, orbital mechanics, granular media, electromagnetism — composes on top of
 * by writing `System`s and calling these helpers from `System.step()`.
 */

// core: World/System scheduling, params, recording/playback, profiling.
export type {
  WorldOptions,
  PlayRecordingOptions,
  System,
  ParamValue,
  ParamRecord,
  ParamSnapshot,
  RecordingFrame,
  Recording,
  SystemProfile,
  ProfileStats,
} from "./core/index.js";
export { World, createWorld, Profiler, nowMs, RecordingController } from "./core/index.js";

// math: Vec2/Vec3 plus re-exported scalar helpers from @platform/math.
export type { Vec2, Vec3 } from "./math/index.js";
export {
  vec2,
  copyVec2,
  addVec2,
  addVec2Into,
  subVec2,
  subVec2Into,
  scaleVec2,
  scaleVec2Into,
  dotVec2,
  crossVec2,
  lengthSqVec2,
  lengthVec2,
  distanceVec2,
  distanceSqVec2,
  normalizeVec2,
  normalizeVec2Into,
  lerpVec2,
  lerpVec2Into,
  negateVec2,
  setVec2,
  ZERO_VEC2,
  vec3,
  copyVec3,
  addVec3,
  addVec3Into,
  subVec3,
  subVec3Into,
  scaleVec3,
  scaleVec3Into,
  dotVec3,
  crossVec3,
  crossVec3Into,
  lengthSqVec3,
  lengthVec3,
  distanceVec3,
  normalizeVec3,
  normalizeVec3Into,
  lerpVec3,
  lerpVec3Into,
  setVec3,
  ZERO_VEC3,
  clamp,
  lerp,
  inverseLerp,
  linspace,
} from "./math/index.js";

// integrators: scalar/state-array Euler, semi-implicit Euler, RK2, RK4.
export type {
  ScalarDerivative,
  FloatArray,
  StateDerivative,
  Rk2Scratch,
  Rk4Scratch,
} from "./integrators/index.js";
export {
  eulerScalar,
  rk2Scalar,
  rk4Scalar,
  semiImplicitEulerStep,
  semiImplicitEulerScalar,
  createRk2Scratch,
  createRk4Scratch,
  eulerState,
  rk2State,
  rk4State,
} from "./integrators/index.js";

// particles: SoA particle storage with zero-allocation spawn/kill/integrate.
export type { ParticleSpawnOptions } from "./particles/index.js";
export { ParticleBuffer } from "./particles/index.js";

// forces: gravity/drag/attractor/repulsor/cursor field/spring, operating on flat arrays.
export {
  applyUniformForce,
  applyGravity,
  applyDrag,
  applyPointAttractor,
  applyPointRepulsor,
  applyCursorForceField,
  computeSpringForce,
  computeSpringForceInto,
} from "./forces/index.js";

// constraints: position-based-dynamics style distance/pin constraints.
export { solveDistanceConstraint, solvePinConstraint } from "./constraints/index.js";

// collision: circle-circle/AABB tests and impulse-based resolution.
export type { AABB } from "./collision/index.js";
export {
  circleCircleIntersect,
  aabbIntersect,
  makeAabb,
  resolveCircleCollision,
} from "./collision/index.js";

// spatial: uniform-grid spatial hash for broadphase queries.
export { SpatialHash2D, UniformGrid } from "./spatial/index.js";

// fields: scalar field grids with bilinear sampling, plus signed distance fields.
export { ScalarField2D, circleSdf, boxSdf } from "./fields/index.js";

// noise: deterministic seeded value noise + fractal Brownian motion.
export type { FbmOptions } from "./noise/index.js";
export { valueNoise2D, fbm } from "./noise/index.js";

// oscillators: periodic waveforms + ADSR envelope (shared with audio later).
export type { AdsrStage } from "./oscillators/index.js";
export { sine, square, sawtooth, triangle, AdsrEnvelope } from "./oscillators/index.js";

// damping: frame-rate-independent exponential decay helpers.
export { expDecay, dampVelocity, halfLifeToDecayRate } from "./damping/index.js";
