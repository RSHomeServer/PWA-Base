export type { Vec2 } from "./vec2.js";
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
} from "./vec2.js";

export type { Vec3 } from "./vec3.js";
export {
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
} from "./vec3.js";

// Re-exported so consumers can do all scalar + vector math from one module.
export { clamp, lerp, inverseLerp, linspace } from "@platform/math";
