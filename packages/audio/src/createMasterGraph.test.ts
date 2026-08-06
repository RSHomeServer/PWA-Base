import { describe, expect, it, vi } from "vitest";
import { createMasterGraph } from "./createMasterGraph.js";

function createMockAudioContext() {
  const destination = { kind: "destination" as const };
  const connections: Array<{ from: unknown; to: unknown }> = [];

  const connect = vi.fn(function (this: unknown, target: unknown) {
    connections.push({ from: this, to: target });
    return target;
  });

  const makeParam = (value: number) => ({
    value,
    setTargetAtTime: vi.fn(),
  });

  const ctx = {
    state: "running" as AudioContextState,
    sampleRate: 48_000,
    currentTime: 0,
    destination,
    createGain: vi.fn(() => ({
      gain: makeParam(1),
      connect,
    })),
    createAnalyser: vi.fn(() => ({
      fftSize: 0,
      smoothingTimeConstant: 0,
      connect,
    })),
    createDynamicsCompressor: vi.fn(() => ({
      threshold: makeParam(0),
      knee: makeParam(0),
      ratio: makeParam(0),
      attack: makeParam(0),
      release: makeParam(0),
      connect,
    })),
    addEventListener: vi.fn(),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return { ctx, connections, connect };
}

describe("createMasterGraph", () => {
  it("constructs the master chain and tears down without viz dependencies", async () => {
    const { ctx, connections } = createMockAudioContext();
    const MockAudioContext = vi.fn(function MockAudioContext(this: typeof ctx) {
      return ctx;
    }) as unknown as typeof AudioContext;

    const nodes = createMasterGraph(MockAudioContext);

    expect(MockAudioContext).toHaveBeenCalledOnce();
    expect(nodes.ctx).toBe(ctx);
    expect(nodes.masterGain.gain.value).toBe(0.85);
    expect(nodes.masterAnalyser.fftSize).toBe(2048);
    expect(nodes.masterCompressor.threshold.value).toBe(-18);

    expect(connections).toEqual([
      { from: nodes.masterGain, to: nodes.masterCompressor },
      { from: nodes.masterCompressor, to: nodes.masterAnalyser },
      { from: nodes.masterAnalyser, to: ctx.destination },
    ]);

    await nodes.ctx.close();
    expect(ctx.close).toHaveBeenCalledOnce();
  });
});
