import { describe, expect, it } from "vitest";
import { createWorld } from "./World.js";

describe("World recording / playback", () => {
  it("records params each step and roundtrips via playRecording", () => {
    const world = createWorld({ fixedDt: 0.1 });
    const seen: number[] = [];
    world.addSystem({
      id: "reader",
      step(w) {
        seen.push(Number(w.getParams().amp ?? 0));
      },
    });

    world.startRecording();
    world.setParams({ amp: 1 });
    world.stepOnce();
    world.setParams({ amp: 2 });
    world.stepOnce();
    world.setParams({ amp: 3 });
    world.stepOnce();
    const rec = world.stopRecording();
    expect(rec).not.toBeNull();
    expect(rec!.frames).toHaveLength(3);
    expect(rec!.fixedDt).toBe(0.1);
    expect(world.isRecording).toBe(false);

    world.reset();
    seen.length = 0;
    world.setParams({ amp: 0 });
    world.playRecording(rec!);
    expect(world.isPlaying).toBe(true);
    world.stepOnce();
    world.stepOnce();
    world.stepOnce();
    expect(seen).toEqual([1, 2, 3]);
    world.stepOnce();
    expect(world.isPlaying).toBe(false);
  });

  it("loops playback when requested", () => {
    const world = createWorld({ fixedDt: 0.1 });
    const seen: number[] = [];
    world.addSystem({
      id: "reader",
      step(w) {
        seen.push(Number(w.getParams().n ?? -1));
      },
    });

    world.startRecording();
    world.setParams({ n: 10 });
    world.stepOnce();
    world.setParams({ n: 20 });
    world.stepOnce();
    const rec = world.stopRecording()!;

    world.reset();
    seen.length = 0;
    world.playRecording(rec, { loop: true });
    world.stepOnce();
    world.stepOnce();
    world.stepOnce();
    world.stepOnce();
    expect(seen).toEqual([10, 20, 10, 20]);
    world.stopPlayback();
    expect(world.isPlaying).toBe(false);
  });

  it("stopRecording returns null when not recording", () => {
    const world = createWorld();
    expect(world.stopRecording()).toBeNull();
  });
});
