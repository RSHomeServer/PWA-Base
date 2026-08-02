export type FloatArray = Float32Array | Float64Array;

/**
 * Semi-implicit (symplectic) Euler over parallel component arrays, in-place and
 * allocation-free. Updates velocity from acceleration first, then position from the
 * *new* velocity — this is what almost every particle/rigid-body hot loop wants
 * because it's unconditionally stable for oscillators (unlike explicit Euler).
 *
 * All arrays must have length >= `count`; only the first `count` entries are touched.
 */
export function semiImplicitEulerStep(
  x: FloatArray,
  y: FloatArray,
  vx: FloatArray,
  vy: FloatArray,
  ax: FloatArray,
  ay: FloatArray,
  count: number,
  dt: number,
): void {
  for (let i = 0; i < count; i++) {
    vx[i] += ax[i]! * dt;
    vy[i] += ay[i]! * dt;
    x[i] += vx[i]! * dt;
    y[i] += vy[i]! * dt;
  }
}

/** Single-component variant of {@link semiImplicitEulerStep}, for scalar oscillators
 * that still want symplectic integration (e.g. a mass-spring driven by a force fn). */
export function semiImplicitEulerScalar(
  x: number,
  v: number,
  a: number,
  dt: number,
): { x: number; v: number } {
  const nv = v + a * dt;
  const nx = x + nv * dt;
  return { x: nx, v: nv };
}
