/**
 * Bessel function of the first kind, `J_n(x)`, plus its positive real zeros —
 * the building blocks of circular (drum-like) Chladni plate modes, where a mode
 * shape is `J_n(j_{n,m} * r / R) * cos(n * theta)` for the `m`-th zero `j_{n,m}`.
 *
 * Computed from the convergent power series rather than a hard-coded zero table,
 * so the mode shapes and their resonant "frequencies" stay self-consistent for
 * whatever precision this implementation achieves. Good to `n <= ~10`, `x <= ~60`,
 * which comfortably covers every circular preset this lab offers.
 */

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) {
    f *= i;
  }
  return f;
}

/** `J_n(x)` via its power series, `n >= 0`. Terminates once terms fall below
 * double-precision noise relative to the running sum. */
export function besselJ(n: number, x: number): number {
  if (x === 0) {
    return n === 0 ? 1 : 0;
  }
  const halfX = x / 2;
  const negHalfXSq = -(halfX * halfX);
  let term = halfX ** n / factorial(n);
  let sum = term;
  for (let k = 1; k < 120; k++) {
    term *= negHalfXSq / (k * (n + k));
    sum += term;
    if (Math.abs(term) < 1e-13 * Math.abs(sum) + 1e-14) {
      break;
    }
  }
  return sum;
}

/** Bisects `J_n` between `a` and `b`, which must bracket exactly one root. */
function bisectRoot(n: number, a: number, b: number): number {
  let lo = a;
  let hi = b;
  let fLo = besselJ(n, lo);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fMid = besselJ(n, mid);
    if (fLo < 0 !== fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/** Scans `J_n` for sign changes to bracket its first `count` positive zeros. */
function findZeros(n: number, count: number): number[] {
  const zeros: number[] = [];
  const step = 0.05;
  const maxX = 80;
  let x = step;
  let prev = besselJ(n, x);
  while (zeros.length < count && x < maxX) {
    const next = x + step;
    const value = besselJ(n, next);
    if ((prev <= 0 && value > 0) || (prev >= 0 && value < 0)) {
      zeros.push(bisectRoot(n, x, next));
    }
    x = next;
    prev = value;
  }
  return zeros;
}

const zeroCache = new Map<number, number[]>();

/** The `m`-th (1-indexed) positive zero of `J_n`, cached per `n` for the life of
 * the page. These are the resonant radii of circular Chladni/drum modes. */
export function besselJZero(n: number, m: number): number {
  let zeros = zeroCache.get(n);
  if (!zeros || zeros.length < m) {
    zeros = findZeros(n, Math.max(m, 6));
    zeroCache.set(n, zeros);
  }
  return zeros[m - 1] ?? zeros[zeros.length - 1] ?? 1;
}
