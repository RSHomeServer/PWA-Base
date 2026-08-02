/**
 * Position-based dynamics (PBD) style constraints: directly correct position arrays
 * in-place rather than accumulating forces. This is what makes stiff constraints
 * (cloth edges, rigid links) stable at interactive timesteps without tiny substeps.
 *
 * `invMass` of `0` means "infinitely heavy" (pinned/immovable) — standard PBD convention.
 */

/** Corrects `i` and `j` so the distance between them relaxes toward `restLength`,
 * distributing the correction by inverse mass. `stiffness` in `[0, 1]` blends between
 * no correction (0) and a full, one-step correction (1). */
export function solveDistanceConstraint(
  x: Float32Array,
  y: Float32Array,
  invMass: Float32Array,
  i: number,
  j: number,
  restLength: number,
  stiffness = 1,
): void {
  const dx = x[j]! - x[i]!;
  const dy = y[j]! - y[i]!;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1e-12) {
    return;
  }

  const wi = invMass[i]!;
  const wj = invMass[j]!;
  const wSum = wi + wj;
  if (wSum <= 0) {
    return;
  }

  const diff = ((dist - restLength) / dist) * stiffness;
  const nx = dx * diff;
  const ny = dy * diff;

  x[i]! += nx * (wi / wSum);
  y[i]! += ny * (wi / wSum);
  x[j]! -= nx * (wj / wSum);
  y[j]! -= ny * (wj / wSum);
}

/** Pulls point `i` toward a fixed anchor `(targetX, targetY)`. `stiffness` of 1 snaps
 * it exactly to the target; lower values relax toward it gradually over many steps. */
export function solvePinConstraint(
  x: Float32Array,
  y: Float32Array,
  i: number,
  targetX: number,
  targetY: number,
  stiffness = 1,
): void {
  x[i]! += (targetX - x[i]!) * stiffness;
  y[i]! += (targetY - y[i]!) * stiffness;
}
