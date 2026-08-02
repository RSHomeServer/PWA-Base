import { describe, expect, it } from "vitest";
import { amplitudeToDb, phaseCorrelation, rms } from "./analysis.js";

describe("analysis", () => {
  it("computes RMS of a constant signal", () => {
    const buf = new Float32Array([0.5, 0.5, 0.5, 0.5]);
    expect(rms(buf)).toBeCloseTo(0.5, 5);
  });

  it("maps unity amplitude to 0 dB and in-phase stereo to +1 correlation", () => {
    expect(amplitudeToDb(1)).toBeCloseTo(0, 5);
    const left = new Float32Array([0.5, -0.25, 0.75]);
    const right = new Float32Array([0.5, -0.25, 0.75]);
    expect(phaseCorrelation(left, right)).toBeCloseTo(1, 5);
  });
});
