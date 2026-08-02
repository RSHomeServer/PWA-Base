import { describe, expect, it } from "vitest";
import { clamp, lerp, linspace, mean, stdevSample } from "./index.js";

describe("@platform/math", () => {
  it("clamps and lerps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("builds linspace and sample stats", () => {
    expect(linspace(0, 1, 3)).toEqual([0, 0.5, 1]);
    expect(mean([1, 2, 3])).toBe(2);
    expect(stdevSample([1, 2, 3])).toBeGreaterThan(0);
  });
});
