/** Right-hand side of a scalar ODE dy/dt = f(t, y). */
export type ScalarDerivative = (t: number, y: number) => number;

/** Explicit (forward) Euler: y' = y + f(t,y) * dt. First order, cheap, least stable. */
export function eulerScalar(y: number, dydt: number, dt: number): number {
  return y + dydt * dt;
}

/** Midpoint-style RK2 (Heun's method averaging the two slope estimates). Second order. */
export function rk2Scalar(y: number, t: number, dt: number, f: ScalarDerivative): number {
  const k1 = f(t, y);
  const k2 = f(t + dt, y + dt * k1);
  return y + (dt / 2) * (k1 + k2);
}

/** Classic 4th-order Runge-Kutta. Good default for smooth scalar dynamics (e.g. envelopes). */
export function rk4Scalar(y: number, t: number, dt: number, f: ScalarDerivative): number {
  const halfDt = dt / 2;
  const k1 = f(t, y);
  const k2 = f(t + halfDt, y + halfDt * k1);
  const k3 = f(t + halfDt, y + halfDt * k2);
  const k4 = f(t + dt, y + dt * k3);
  return y + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}
