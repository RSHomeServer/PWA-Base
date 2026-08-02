import { describe, expect, it } from "vitest";
import { eulerScalar, rk2Scalar, rk4Scalar } from "./scalar.js";
import { semiImplicitEulerScalar, semiImplicitEulerStep } from "./semiImplicit.js";
import { createRk4Scratch, eulerState, rk4State } from "./stateArray.js";

describe("integrators", () => {
  it("eulerScalar advances y += dydt * dt", () => {
    expect(eulerScalar(1, 2, 0.5)).toBe(2);
  });

  it("rk2/rk4 integrate dy/dt = y exactly for exponential growth", () => {
    const f = (_t: number, y: number) => y;
    const y0 = 1;
    const dt = 0.1;
    const expected = Math.exp(dt);

    const rk2 = rk2Scalar(y0, 0, dt, f);
    const rk4 = rk4Scalar(y0, 0, dt, f);
    expect(Math.abs(rk4 - expected)).toBeLessThan(Math.abs(rk2 - expected));
    expect(Math.abs(rk4 - expected)).toBeLessThan(1e-5);
  });

  it("semiImplicitEuler updates velocity then position", () => {
    const { x, v } = semiImplicitEulerScalar(0, 0, 10, 0.1);
    expect(v).toBeCloseTo(1);
    expect(x).toBeCloseTo(0.1);
  });

  it("semiImplicitEulerStep mutates SoA arrays in place", () => {
    const x = new Float32Array([0, 1]);
    const y = new Float32Array([0, 0]);
    const vx = new Float32Array([0, 0]);
    const vy = new Float32Array([0, 0]);
    const ax = new Float32Array([2, 0]);
    const ay = new Float32Array([0, 4]);
    semiImplicitEulerStep(x, y, vx, vy, ax, ay, 2, 0.5);
    expect(vx[0]).toBeCloseTo(1);
    expect(x[0]).toBeCloseTo(0.5);
    expect(vy[1]).toBeCloseTo(2);
    expect(y[1]).toBeCloseTo(1);
  });

  it("rk4State integrates a 1D state vector", () => {
    const state = new Float64Array([1]);
    const scratch = createRk4Scratch(1);
    rk4State(
      state,
      0,
      0.1,
      (_t, s, out) => {
        out[0] = s[0]!;
      },
      scratch,
    );
    expect(state[0]).toBeCloseTo(Math.exp(0.1), 5);
  });

  it("eulerState is first-order accurate", () => {
    const state = new Float64Array([1]);
    const scratch = new Float64Array(1);
    eulerState(
      state,
      0,
      0.1,
      (_t, s, out) => {
        out[0] = s[0]!;
      },
      scratch,
    );
    expect(state[0]).toBeCloseTo(1.1);
  });
});
