/**
 * 2D vector value type and pure/allocating + zero-allocation ("Into") function pairs.
 *
 * Vectors are plain `{x, y}` objects rather than classes so they can be created as
 * literals, structurally compared in tests, and (de)serialized trivially by the
 * recording/snapshot system in `core/`.
 */
export interface Vec2 {
  x: number;
  y: number;
}

/** Creates a new vector. */
export function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

/** Copies `b`'s components into `a` and returns `a` (zero-allocation). */
export function copyVec2(out: Vec2, source: Vec2): Vec2 {
  out.x = source.x;
  out.y = source.y;
  return out;
}

export function addVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function addVec2Into(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
}

export function subVec2(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function subVec2Into(out: Vec2, a: Vec2, b: Vec2): Vec2 {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
}

export function scaleVec2(a: Vec2, scalar: number): Vec2 {
  return { x: a.x * scalar, y: a.y * scalar };
}

export function scaleVec2Into(out: Vec2, a: Vec2, scalar: number): Vec2 {
  out.x = a.x * scalar;
  out.y = a.y * scalar;
  return out;
}

export function dotVec2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** 2D cross product yields a scalar (the z-component of the 3D cross product). */
export function crossVec2(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function lengthSqVec2(a: Vec2): number {
  return a.x * a.x + a.y * a.y;
}

export function lengthVec2(a: Vec2): number {
  return Math.sqrt(lengthSqVec2(a));
}

export function distanceVec2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distanceSqVec2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function normalizeVec2(a: Vec2): Vec2 {
  const len = lengthVec2(a);
  if (len < 1e-12) {
    return { x: 0, y: 0 };
  }
  return { x: a.x / len, y: a.y / len };
}

export function normalizeVec2Into(out: Vec2, a: Vec2): Vec2 {
  const len = lengthVec2(a);
  if (len < 1e-12) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  out.x = a.x / len;
  out.y = a.y / len;
  return out;
}

export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function lerpVec2Into(out: Vec2, a: Vec2, b: Vec2, t: number): Vec2 {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  return out;
}

export function negateVec2(a: Vec2): Vec2 {
  return { x: -a.x, y: -a.y };
}

export function setVec2(out: Vec2, x: number, y: number): Vec2 {
  out.x = x;
  out.y = y;
  return out;
}

export const ZERO_VEC2: Readonly<Vec2> = Object.freeze({ x: 0, y: 0 });
