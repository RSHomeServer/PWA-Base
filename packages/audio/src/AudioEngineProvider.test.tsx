import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AudioEngineProvider } from "./AudioEngineProvider.js";
import { useAudioEngine } from "./useAudioEngine.js";

function createHappyDomAudioContext() {
  const connect = vi.fn(function (this: unknown) {
    return this;
  });

  const makeParam = (value: number) => ({
    value,
    setTargetAtTime: vi.fn(),
  });

  class MockAudioContext {
    state: AudioContextState = "running";
    sampleRate = 44_100;
    currentTime = 0;
    destination = {};
    createGain = vi.fn(() => ({ gain: makeParam(1), connect }));
    createAnalyser = vi.fn(() => ({ fftSize: 0, smoothingTimeConstant: 0, connect }));
    createDynamicsCompressor = vi.fn(() => ({
      threshold: makeParam(0),
      knee: makeParam(0),
      ratio: makeParam(0),
      attack: makeParam(0),
      release: makeParam(0),
      connect,
    }));
    addEventListener = vi.fn();
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  }

  return MockAudioContext as unknown as typeof AudioContext;
}

describe("AudioEngineProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => {
      root?.unmount();
    });
    container?.remove();
  });

  it("lazily creates and closes the shared graph via the hook API", async () => {
    const MockAudioContext = createHappyDomAudioContext();
    vi.stubGlobal("AudioContext", MockAudioContext);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const snapshots: Array<ReturnType<typeof useAudioEngine>> = [];

    function Probe() {
      const api = useAudioEngine();
      useEffect(() => {
        snapshots.push(api);
      }, [api]);
      return null;
    }

    await act(async () => {
      root.render(createElement(AudioEngineProvider, null, createElement(Probe)));
    });

    const initial = snapshots.at(-1)!;
    expect(initial.peekEngine()).toBeNull();
    expect(initial.contextState).toBe("unstarted");

    let nodes: ReturnType<typeof initial.ensureEngine> | undefined;
    await act(async () => {
      nodes = initial.ensureEngine();
    });

    const api = snapshots.at(-1)!;
    expect(nodes).toBeDefined();
    expect(api.peekEngine()).toBe(nodes);
    expect(nodes!.ctx.sampleRate).toBe(44_100);

    await act(async () => {
      await api.resume();
    });

    await act(async () => {
      api.setMasterVolume(0.5);
    });
    expect(snapshots.at(-1)!.masterVolume).toBe(0.5);

    await act(async () => {
      root.unmount();
    });
    expect(nodes!.ctx.close).toHaveBeenCalled();
  });
});
