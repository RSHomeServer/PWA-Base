import { describe, expect, it } from "vitest";
import { besselJ, besselJZero } from "./bessel.js";

describe("besselJ", () => {
  it("matches known values at the origin and first root neighborhood", () => {
    expect(besselJ(0, 0)).toBe(1);
    expect(besselJ(1, 0)).toBe(0);
    expect(besselJ(0, 1)).toBeCloseTo(0.7652, 3);
    expect(besselJ(1, 1)).toBeCloseTo(0.4401, 3);
  });

  it("returns the first positive zero of J0 near 2.4048", () => {
    const j01 = besselJZero(0, 1);
    expect(j01).toBeCloseTo(2.4048, 3);
    expect(besselJ(0, j01)).toBeCloseTo(0, 3);
  });
});
