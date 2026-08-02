export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function circleCircleIntersect(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const radiusSum = r1 + r2;
  return dx * dx + dy * dy <= radiusSum * radiusSum;
}

export function aabbIntersect(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

export function makeAabb(cx: number, cy: number, halfWidth: number, halfHeight: number): AABB {
  return {
    minX: cx - halfWidth,
    minY: cy - halfHeight,
    maxX: cx + halfWidth,
    maxY: cy + halfHeight,
  };
}

/**
 * Resolves a circle-circle collision in-place: separates overlapping positions along
 * the contact normal and applies an equal-and-opposite impulse to the velocities,
 * weighted by inverse mass. Returns `true` if the pair was overlapping (and thus resolved).
 */
export function resolveCircleCollision(
  x: Float32Array,
  y: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  invMass: Float32Array,
  i: number,
  j: number,
  ri: number,
  rj: number,
  restitution = 1,
): boolean {
  const dx = x[j]! - x[i]!;
  const dy = y[j]! - y[i]!;
  const distSq = dx * dx + dy * dy;
  const radiusSum = ri + rj;

  if (distSq >= radiusSum * radiusSum) {
    return false;
  }

  const dist = Math.sqrt(distSq) || 1e-6;
  const nx = dx / dist;
  const ny = dy / dist;

  const wi = invMass[i]!;
  const wj = invMass[j]!;
  const wSum = wi + wj;
  if (wSum > 0) {
    const overlap = radiusSum - dist;
    x[i]! -= nx * overlap * (wi / wSum);
    y[i]! -= ny * overlap * (wi / wSum);
    x[j]! += nx * overlap * (wj / wSum);
    y[j]! += ny * overlap * (wj / wSum);
  }

  const relVx = vx[j]! - vx[i]!;
  const relVy = vy[j]! - vy[i]!;
  const relVelAlongNormal = relVx * nx + relVy * ny;

  if (relVelAlongNormal > 0 || wSum <= 0) {
    return true;
  }

  const impulseMag = (-(1 + restitution) * relVelAlongNormal) / wSum;
  vx[i]! -= nx * impulseMag * wi;
  vy[i]! -= ny * impulseMag * wi;
  vx[j]! += nx * impulseMag * wj;
  vy[j]! += ny * impulseMag * wj;

  return true;
}
