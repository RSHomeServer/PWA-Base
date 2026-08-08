import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSTANT_TRANSITION } from "./resolveTransition.js";
import { useMotionTransition } from "./useMotionTransition.js";
import { useSongaraMotion } from "./useSongaraMotion.js";

type MatchMediaListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(matches: boolean) {
  const listeners = new Set<MatchMediaListener>();
  const mq = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener as MatchMediaListener);
    },
    removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.delete(listener as MatchMediaListener);
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } satisfies MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mq),
  );

  return {
    setMatches(next: boolean) {
      mq.matches = next;
      for (const listener of listeners) {
        listener({ matches: next } as MediaQueryListEvent);
      }
    },
  };
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

describe("useSongaraMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports reducedMotion and an instant transition when preferred", () => {
    installMatchMedia(true);
    const base = { duration: 0.5 };
    const { result, unmount } = renderHook(() => useSongaraMotion(base));
    expect(result.current.reducedMotion).toBe(true);
    expect(result.current.transition).toEqual(INSTANT_TRANSITION);
    unmount();
  });

  it("passes through the base transition when motion is allowed", () => {
    installMatchMedia(false);
    const base = { duration: 0.5 };
    const { result, unmount } = renderHook(() => useSongaraMotion(base));
    expect(result.current.reducedMotion).toBe(false);
    expect(result.current.transition).toBe(base);
    unmount();
  });
});

describe("useMotionTransition", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("snaps when reduced motion is preferred", () => {
    installMatchMedia(true);
    const { result, unmount } = renderHook(() =>
      useMotionTransition({ duration: 0.25, delay: 0.1 }),
    );
    expect(result.current).toEqual(INSTANT_TRANSITION);
    unmount();
  });

  it("keeps the transition when motion is allowed", () => {
    installMatchMedia(false);
    const base = { duration: 0.25, delay: 0.1 };
    const { result, unmount } = renderHook(() => useMotionTransition(base));
    expect(result.current).toBe(base);
    unmount();
  });
});
