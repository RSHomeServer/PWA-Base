import { describe, expect, it } from "vitest";
import { createSongaraPlanckWorld } from "./createSongaraPlanckWorld.js";
import { songaraFixedStepSeconds } from "./songaraFixedStepSeconds.js";

describe("createSongaraPlanckWorld", () => {
  it("creates a world and steps", () => {
    const world = createSongaraPlanckWorld({ gravity: { x: 0, y: -10 } });
    expect(world).toBeTruthy();
    world.step(songaraFixedStepSeconds(60));
  });
});
