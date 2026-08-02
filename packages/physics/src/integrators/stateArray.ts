/** Writes dY/dt for the given state vector into `out`. Must not allocate. */
export type StateDerivative = (t: number, state: Float64Array, out: Float64Array) => void;

/** Pre-allocated scratch buffers for {@link rk4State}, sized once and reused across steps. */
export interface Rk4Scratch {
  readonly k1: Float64Array;
  readonly k2: Float64Array;
  readonly k3: Float64Array;
  readonly k4: Float64Array;
  readonly temp: Float64Array;
}

/** Pre-allocated scratch buffers for {@link rk2State}. */
export interface Rk2Scratch {
  readonly k1: Float64Array;
  readonly k2: Float64Array;
  readonly temp: Float64Array;
}

export function createRk4Scratch(length: number): Rk4Scratch {
  return {
    k1: new Float64Array(length),
    k2: new Float64Array(length),
    k3: new Float64Array(length),
    k4: new Float64Array(length),
    temp: new Float64Array(length),
  };
}

export function createRk2Scratch(length: number): Rk2Scratch {
  return {
    k1: new Float64Array(length),
    k2: new Float64Array(length),
    temp: new Float64Array(length),
  };
}

/** Explicit Euler over a whole state vector, in-place: `state += f(t, state) * dt`.
 * Requires a `scratch` buffer the same length as `state` (allocate once, reuse). */
export function eulerState(
  state: Float64Array,
  t: number,
  dt: number,
  deriv: StateDerivative,
  scratch: Float64Array,
): void {
  deriv(t, state, scratch);
  for (let i = 0; i < state.length; i++) {
    state[i] += scratch[i]! * dt;
  }
}

/** RK2 (Heun) over a whole state vector, in-place. Zero allocations given a reused `scratch`. */
export function rk2State(
  state: Float64Array,
  t: number,
  dt: number,
  deriv: StateDerivative,
  scratch: Rk2Scratch,
): void {
  const { k1, k2, temp } = scratch;
  const n = state.length;

  deriv(t, state, k1);
  for (let i = 0; i < n; i++) {
    temp[i] = state[i]! + dt * k1[i]!;
  }
  deriv(t + dt, temp, k2);
  for (let i = 0; i < n; i++) {
    state[i] += (dt / 2) * (k1[i]! + k2[i]!);
  }
}

/** RK4 over a whole state vector, in-place. Zero allocations given a reused `scratch`. */
export function rk4State(
  state: Float64Array,
  t: number,
  dt: number,
  deriv: StateDerivative,
  scratch: Rk4Scratch,
): void {
  const { k1, k2, k3, k4, temp } = scratch;
  const n = state.length;
  const halfDt = dt / 2;

  deriv(t, state, k1);

  for (let i = 0; i < n; i++) {
    temp[i] = state[i]! + halfDt * k1[i]!;
  }
  deriv(t + halfDt, temp, k2);

  for (let i = 0; i < n; i++) {
    temp[i] = state[i]! + halfDt * k2[i]!;
  }
  deriv(t + halfDt, temp, k3);

  for (let i = 0; i < n; i++) {
    temp[i] = state[i]! + dt * k3[i]!;
  }
  deriv(t + dt, temp, k4);

  for (let i = 0; i < n; i++) {
    state[i] += (dt / 6) * (k1[i]! + 2 * k2[i]! + 2 * k3[i]! + k4[i]!);
  }
}
