import { describe, expect, it } from "vitest";
import {
  addVec2,
  crossVec2,
  distanceVec2,
  dotVec2,
  lengthVec2,
  lerpVec2,
  normalizeVec2,
  scaleVec2,
  subVec2,
  vec2,
} from "./vec2.js";

describe("Vec2", () => {
  it("creates and adds/subtracts/scales", () => {
    const a = vec2(1, 2);
    const b = vec2(3, 4);
    expect(addVec2(a, b)).toEqual({ x: 4, y: 6 });
    expect(subVec2(b, a)).toEqual({ x: 2, y: 2 });
    expect(scaleVec2(a, 3)).toEqual({ x: 3, y: 6 });
  });

  it("computes dot, cross, length, distance", () => {
    const a = vec2(3, 4);
    const b = vec2(1, 0);
    expect(dotVec2(a, b)).toBe(3);
    expect(crossVec2(a, b)).toBe(-4);
    expect(lengthVec2(a)).toBe(5);
    expect(distanceVec2(vec2(0, 0), a)).toBe(5);
  });

  it("normalizes and lerps", () => {
    const n = normalizeVec2(vec2(0, 10));
    expect(n.x).toBeCloseTo(0);
    expect(n.y).toBeCloseTo(1);
    expect(normalizeVec2(vec2(0, 0))).toEqual({ x: 0, y: 0 });
    expect(lerpVec2(vec2(0, 0), vec2(10, 20), 0.5)).toEqual({ x: 5, y: 10 });
  });
});
