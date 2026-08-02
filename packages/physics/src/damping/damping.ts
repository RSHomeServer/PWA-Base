/**
 * Frame-rate-independent exponential approach toward `target`: converges at the same
 * *rate* regardless of `dt`, unlike a naive `current + (target - current) * factor`
 * which behaves differently at 30fps vs 144fps. `decayRate` is in `1/seconds`
 * (larger = snappier).
 */
export function expDecay(current: number, target: number, decayRate: number, dt: number): number {
  return target + (current - target) * Math.exp(-decayRate * dt);
}

/** Multiplicatively damps a velocity/quantity toward zero: `v * exp(-coefficient * dt)`. */
export function dampVelocity(v: number, coefficient: number, dt: number): number {
  return v * Math.exp(-coefficient * dt);
}

/** Converts a desired half-life (time to decay 50%) into the `decayRate` expected by
 * {@link expDecay}/{@link dampVelocity}. */
export function halfLifeToDecayRate(halfLife: number): number {
  return halfLife <= 0 ? Infinity : Math.LN2 / halfLife;
}
