import { describe, expect, it } from "vitest";
import { createSongaraCannonWorld } from "./createSongaraCannonWorld.js";
import { songaraFixedStepSeconds } from "./songaraFixedStepSeconds.js";

describe("createSongaraCannonWorld", () => {
  it("creates a world with gravity", () => {
    const world = createSongaraCannonWorld();
    expect(world.gravity.y).toBeCloseTo(-9.82);
    world.step(songaraFixedStepSeconds(60));
  });
});
