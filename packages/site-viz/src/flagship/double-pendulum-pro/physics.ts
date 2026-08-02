export interface PendulumState {
  theta1: number;
  omega1: number;
  theta2: number;
  omega2: number;
}

export interface PendulumParams {
  length1: number;
  length2: number;
  mass1: number;
  mass2: number;
  gravity: number;
}

/** Semi-implicit Euler integration of the classic double-pendulum Lagrangian. */
export function stepPendulum(s: PendulumState, p: PendulumParams, dt: number): void {
  const { length1: l1, length2: l2, mass1: m1, mass2: m2, gravity: g } = p;
  const { theta1, theta2, omega1, omega2 } = s;
  const delta = theta2 - theta1;
  const sinD = Math.sin(delta);
  const cosD = Math.cos(delta);
  const sin1 = Math.sin(theta1);

  const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));
  const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));

  const num1 =
    -g * (2 * m1 + m2) * sin1 -
    m2 * g * Math.sin(theta1 - 2 * theta2) -
    2 * sinD * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * cosD);
  const num2 =
    2 *
    sinD *
    (omega1 * omega1 * l1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(theta1) +
      omega2 * omega2 * l2 * m2 * cosD);

  const alpha1 = num1 / den1;
  const alpha2 = num2 / den2;

  s.omega1 += alpha1 * dt;
  s.omega2 += alpha2 * dt;
  s.theta1 += s.omega1 * dt;
  s.theta2 += s.omega2 * dt;
}

/** Total mechanical energy (kinetic + potential), useful as a near-conservation readout. */
export function totalEnergy(s: PendulumState, p: PendulumParams): number {
  const { length1: l1, length2: l2, mass1: m1, mass2: m2, gravity: g } = p;
  const { theta1, theta2, omega1, omega2 } = s;
  const v1x = l1 * omega1 * Math.cos(theta1);
  const v1y = l1 * omega1 * Math.sin(theta1);
  const v2x = v1x + l2 * omega2 * Math.cos(theta2);
  const v2y = v1y + l2 * omega2 * Math.sin(theta2);
  const ke = 0.5 * m1 * (v1x * v1x + v1y * v1y) + 0.5 * m2 * (v2x * v2x + v2y * v2y);
  const y1 = -l1 * Math.cos(theta1);
  const y2 = y1 - l2 * Math.cos(theta2);
  const pe = m1 * g * y1 + m2 * g * y2;
  return ke + pe;
}

export function bobPositions(
  s: PendulumState,
  p: PendulumParams,
  pivotX: number,
  pivotY: number,
  scale: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const x1 = pivotX + p.length1 * scale * Math.sin(s.theta1);
  const y1 = pivotY + p.length1 * scale * Math.cos(s.theta1);
  const x2 = x1 + p.length2 * scale * Math.sin(s.theta2);
  const y2 = y1 + p.length2 * scale * Math.cos(s.theta2);
  return { x1, y1, x2, y2 };
}
