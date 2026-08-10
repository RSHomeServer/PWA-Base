import { describe, expect, it } from "vitest";
import {
  FROZEN_PARTICLES_MOTION,
  resolveParticlesMotion,
} from "./resolveParticlesMotion.js";

describe("resolveParticlesMotion", () => {
  it("freezes when reduced", () => {
    expect(resolveParticlesMotion(true)).toEqual(FROZEN_PARTICLES_MOTION);
  });

  it("uses defaults / prefs when allowed", () => {
    expect(resolveParticlesMotion(false)).toEqual({
      particleCount: 28,
      moveEnable: true,
      linksEnable: true,
    });
    expect(resolveParticlesMotion(false, { particleCount: 10 }).particleCount).toBe(
      10,
    );
  });
});
