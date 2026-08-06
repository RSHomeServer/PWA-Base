import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mulberry32 } from "./utils/rng.js";
import { useAnimationFrame } from "./hooks/useAnimationFrame.js";
import { LabShell } from "./lab/LabShell.js";

function installMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function renderHook<T>(useHook: () => T): { result: { current: T }; unmount: () => void } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  let root: Root | null = createRoot(host);
  const result = { current: undefined as T };

  function Probe() {
    result.current = useHook();
    return null;
  }

  act(() => {
    root!.render(createElement(Probe));
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root?.unmount();
        root = null;
      });
      host.remove();
    },
  };
}

describe("mulberry32", () => {
  it("returns deterministic values for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("returns values in [0, 1)", () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 20; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("useAnimationFrame", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fires once with zero dt when reduced motion is preferred", () => {
    installMatchMedia(true);
    const callback = vi.fn();
    const { unmount } = renderHook(() => useAnimationFrame(callback, true));
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(0, 0);
    unmount();
  });

  it("does not start a loop when running is false", () => {
    installMatchMedia(false);
    const raf = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => 0);
    const callback = vi.fn();
    const { unmount } = renderHook(() => useAnimationFrame(callback, false));
    expect(raf).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });
});

describe("LabShell", () => {
  it("renders title and stub children without product site imports", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => {
      root.render(
        createElement(
          LabShell,
          {
            title: "Test Lab",
            about: "About this lab",
            shortcuts: [{ keys: "R", label: "Reset" }],
          },
          createElement("canvas", { "data-testid": "stage-canvas" }),
        ),
      );
    });

    expect(host.textContent).toContain("Test Lab");
    expect(host.querySelector('[data-testid="stage-canvas"]')).not.toBeNull();

    act(() => root.unmount());
    host.remove();
  });
});
