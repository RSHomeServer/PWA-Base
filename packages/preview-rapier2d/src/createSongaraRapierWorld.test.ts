import { describe, expect, it } from "vitest";
import {
  createSongaraRapierWorld,
  initSongaraRapier,
} from "./createSongaraRapierWorld.js";

describe("createSongaraRapierWorld", () => {
  it("initialises WASM and creates a world", async () => {
    const api = await initSongaraRapier();
    expect(api).toBeTruthy();
    const { world, RAPIER } = await createSongaraRapierWorld({
      gravity: { x: 0, y: -10 },
    });
    expect(RAPIER).toBe(api);
    expect(world.gravity.x).toBe(0);
    expect(world.gravity.y).toBe(-10);
    world.free();
  }, 30_000);
});
