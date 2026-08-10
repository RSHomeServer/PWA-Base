import { describe, expect, it } from "vitest";
import Matter from "matter-js";
import { createSongaraMatterEngine } from "./createSongaraMatterEngine.js";

describe("createSongaraMatterEngine", () => {
  it("creates an engine", () => {
    const engine = createSongaraMatterEngine();
    expect(engine).toBeTruthy();
    expect(engine.world).toBeTruthy();
    Matter.Engine.clear(engine);
  });
});
