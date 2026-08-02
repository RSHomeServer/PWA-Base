import { describe, expect, it } from "vitest";
import { AdsrEnvelope, sawtooth, sine, square, triangle } from "./oscillators.js";

describe("oscillators", () => {
  it("sine is 0 at t=0 and peaks at quarter period", () => {
    expect(sine(0, 1)).toBeCloseTo(0);
    expect(sine(0.25, 1)).toBeCloseTo(1);
    expect(sine(0.5, 1)).toBeCloseTo(0);
    expect(sine(0.75, 1)).toBeCloseTo(-1);
  });

  it("square alternates between amplitude extremes", () => {
    expect(square(0.1, 1, 0, 2)).toBe(2);
    expect(square(0.6, 1, 0, 2)).toBe(-2);
  });

  it("sawtooth ramps from -amp to +amp", () => {
    expect(sawtooth(0, 1)).toBeCloseTo(-1);
    expect(sawtooth(0.5, 1)).toBeCloseTo(0);
    expect(sawtooth(0.999, 1)).toBeCloseTo(0.998, 2);
  });

  it("triangle ramps between extremes", () => {
    expect(triangle(0, 1)).toBeCloseTo(1);
    expect(triangle(0.25, 1)).toBeCloseTo(0);
    expect(triangle(0.5, 1)).toBeCloseTo(-1);
  });

  it("AdsrEnvelope follows attack/decay/sustain/release", () => {
    const env = new AdsrEnvelope(0.1, 0.1, 0.5, 0.2);
    expect(env.value(0)).toBe(0);
    env.noteOn(0);
    expect(env.value(0.05)).toBeCloseTo(0.5);
    expect(env.value(0.1)).toBeCloseTo(1);
    expect(env.value(0.2)).toBeCloseTo(0.5);
    expect(env.value(0.25)).toBeCloseTo(0.5);
    env.noteOff(0.3);
    expect(env.value(0.4)).toBeCloseTo(0.25);
    expect(env.value(0.5)).toBeCloseTo(0);
    expect(env.isActive).toBe(false);
  });
});
