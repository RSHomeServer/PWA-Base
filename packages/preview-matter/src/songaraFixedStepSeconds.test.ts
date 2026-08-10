import { describe, expect, it } from "vitest";
import { songaraFixedStepSeconds } from "./songaraFixedStepSeconds.js";

describe("songaraFixedStepSeconds", () => {
  it("returns 1/hz", () => {
    expect(songaraFixedStepSeconds(60)).toBeCloseTo(1 / 60);
    expect(songaraFixedStepSeconds(120)).toBeCloseTo(1 / 120);
  });

  it("rejects non-positive hz", () => {
    expect(() => songaraFixedStepSeconds(0)).toThrow(/hz/);
    expect(() => songaraFixedStepSeconds(-1)).toThrow(/hz/);
    expect(() => songaraFixedStepSeconds(Number.NaN)).toThrow(/hz/);
  });
});
