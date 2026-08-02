import { describe, expect, it } from "vitest";
import { createWorld } from "./World.js";
import type { System } from "./System.js";

function countingSystem(id: string, priority = 0): System & { steps: number } {
  const system: System & { steps: number } = {
    id,
    priority,
    steps: 0,
    step() {
      system.steps += 1;
    },
  };
  return system;
}

describe("World", () => {
  it("advances time and frame on stepOnce", () => {
    const world = createWorld({ fixedDt: 0.1 });
    expect(world.time).toBe(0);
    expect(world.frame).toBe(0);
    world.stepOnce();
    expect(world.time).toBeCloseTo(0.1);
    expect(world.frame).toBe(1);
  });

  it("pause prevents tick from stepping", () => {
    const world = createWorld({ fixedDt: 1 / 60 });
    const sys = countingSystem("a");
    world.addSystem(sys);
    world.pause();
    world.tick(1);
    expect(sys.steps).toBe(0);
    expect(world.paused).toBe(true);
    world.resume();
    world.tick(1 / 60);
    expect(sys.steps).toBe(1);
  });

  it("timeScale scales how many fixed steps tick runs", () => {
    const world = createWorld({ fixedDt: 0.1, maxSubsteps: 20 });
    const sys = countingSystem("a");
    world.addSystem(sys);
    world.timeScale = 2;
    world.tick(0.1);
    expect(sys.steps).toBe(2);
  });

  it("stepOnce works while paused", () => {
    const world = createWorld({ fixedDt: 0.05 });
    const sys = countingSystem("a");
    world.addSystem(sys);
    world.pause();
    world.stepOnce();
    expect(sys.steps).toBe(1);
    expect(world.frame).toBe(1);
  });

  it("runs systems in priority order", () => {
    const world = createWorld({ fixedDt: 0.1 });
    const order: string[] = [];
    world.addSystem({
      id: "late",
      priority: 10,
      step() {
        order.push("late");
      },
    });
    world.addSystem({
      id: "early",
      priority: -5,
      step() {
        order.push("early");
      },
    });
    world.stepOnce();
    expect(order).toEqual(["early", "late"]);
  });

  it("reset clears clock and calls system.reset", () => {
    const world = createWorld({ fixedDt: 0.1 });
    let resets = 0;
    world.addSystem({
      id: "r",
      step() {},
      reset() {
        resets += 1;
      },
    });
    world.stepOnce();
    world.stepOnce();
    world.reset();
    expect(world.time).toBe(0);
    expect(world.frame).toBe(0);
    expect(resets).toBe(1);
  });

  it("setParams / getParams / snapshot / restore roundtrip", () => {
    const world = createWorld();
    world.setParams({ gain: 2, enabled: true, mode: "wave" });
    expect(world.getParams()).toEqual({ gain: 2, enabled: true, mode: "wave" });
    const snap = world.snapshotParams();
    world.setParams({ gain: 9 });
    expect(world.getParams().gain).toBe(9);
    world.restoreParams(snap);
    expect(world.getParams()).toEqual({ gain: 2, enabled: true, mode: "wave" });
  });

  it("caps substeps at maxSubsteps", () => {
    const world = createWorld({ fixedDt: 0.1, maxSubsteps: 3 });
    const sys = countingSystem("a");
    world.addSystem(sys);
    world.tick(10);
    expect(sys.steps).toBe(3);
  });
});
