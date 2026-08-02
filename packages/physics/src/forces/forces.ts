import type { Vec2 } from "../math/vec2.js";

/**
 * Force helpers operate directly on flat component arrays (`ax`/`ay`, `x`/`y`, ...)
 * rather than on `ParticleBuffer` specifically, so they're equally usable for cloth
 * nodes, soft-body masses, or any future SoA entity layout.
 */

/** Adds a constant acceleration to every active entry (e.g. gravity: mass-independent). */
export function applyUniformForce(
  ax: Float32Array,
  ay: Float32Array,
  count: number,
  fx: number,
  fy: number,
): void {
  for (let i = 0; i < count; i++) {
    ax[i] += fx;
    ay[i] += fy;
  }
}

/** Alias of {@link applyUniformForce} for readability at call sites. */
export function applyGravity(
  ax: Float32Array,
  ay: Float32Array,
  count: number,
  gx: number,
  gy: number,
): void {
  applyUniformForce(ax, ay, count, gx, gy);
}

/** Linear drag opposing velocity: a -= coefficient * v (optionally scaled by inverse mass). */
export function applyDrag(
  ax: Float32Array,
  ay: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  count: number,
  coefficient: number,
): void {
  for (let i = 0; i < count; i++) {
    ax[i] -= vx[i]! * coefficient;
    ay[i] -= vy[i]! * coefficient;
  }
}

/** Radial force toward (strength > 0) or away from (strength < 0) a point, softened
 * near the point by `minDist` to avoid singularities. Applied to every active entry. */
export function applyPointAttractor(
  ax: Float32Array,
  ay: Float32Array,
  x: Float32Array,
  y: Float32Array,
  count: number,
  px: number,
  py: number,
  strength: number,
  minDist = 1e-3,
): void {
  for (let i = 0; i < count; i++) {
    const dx = px - x[i]!;
    const dy = py - y[i]!;
    const distSq = Math.max(dx * dx + dy * dy, minDist * minDist);
    const dist = Math.sqrt(distSq);
    const magnitude = strength / distSq;
    ax[i] += (dx / dist) * magnitude;
    ay[i] += (dy / dist) * magnitude;
  }
}

/** `applyPointAttractor` with the strength negated, for readability at call sites. */
export function applyPointRepulsor(
  ax: Float32Array,
  ay: Float32Array,
  x: Float32Array,
  y: Float32Array,
  count: number,
  px: number,
  py: number,
  strength: number,
  minDist = 1e-3,
): void {
  applyPointAttractor(ax, ay, x, y, count, px, py, -strength, minDist);
}

/**
 * Cursor/pointer force field: attracts or repels entries within `radius` of `(cx, cy)`,
 * falling off linearly to zero at the edge of the radius. Common for interactive
 * particle/cymatics/slime demos where a pointer perturbs the simulation.
 */
export function applyCursorForceField(
  ax: Float32Array,
  ay: Float32Array,
  x: Float32Array,
  y: Float32Array,
  count: number,
  cx: number,
  cy: number,
  radius: number,
  strength: number,
): void {
  const radiusSq = radius * radius;
  for (let i = 0; i < count; i++) {
    const dx = x[i]! - cx;
    const dy = y[i]! - cy;
    const distSq = dx * dx + dy * dy;
    if (distSq >= radiusSq || distSq < 1e-12) {
      continue;
    }
    const dist = Math.sqrt(distSq);
    const falloff = 1 - dist / radius;
    const magnitude = (strength * falloff) / dist;
    ax[i] += dx * magnitude;
    ay[i] += dy * magnitude;
  }
}

/**
 * Damped Hooke's-law spring force on point 1, pulling it toward point 2 so that the
 * distance between them relaxes toward `restLength`. Apply the negated result to
 * point 2 for the reaction force (Newton's third law).
 */
export function computeSpringForce(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  restLength: number,
  stiffness: number,
  v1x = 0,
  v1y = 0,
  v2x = 0,
  v2y = 0,
  damping = 0,
): Vec2 {
  return computeSpringForceInto(
    { x: 0, y: 0 },
    p1x,
    p1y,
    p2x,
    p2y,
    restLength,
    stiffness,
    v1x,
    v1y,
    v2x,
    v2y,
    damping,
  );
}

/** Zero-allocation variant of {@link computeSpringForce}; writes into `out`. */
export function computeSpringForceInto(
  out: Vec2,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  restLength: number,
  stiffness: number,
  v1x = 0,
  v1y = 0,
  v2x = 0,
  v2y = 0,
  damping = 0,
): Vec2 {
  const dx = p2x - p1x;
  const dy = p2y - p1y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1e-12) {
    out.x = 0;
    out.y = 0;
    return out;
  }

  const nx = dx / dist;
  const ny = dy / dist;
  const stretch = dist - restLength;

  const relVelAlongSpring = (v2x - v1x) * nx + (v2y - v1y) * ny;
  const magnitude = stiffness * stretch + damping * relVelAlongSpring;

  out.x = nx * magnitude;
  out.y = ny * magnitude;
  return out;
}
