import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion.js";
import { useSectionReveal } from "./useSectionReveal.js";

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

describe("useReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads the initial matchMedia value", () => {
    installMatchMedia(true);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    unmount();
  });

  it("updates when the media query changes", () => {
    const media = installMatchMedia(false);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.setMatches(true));
    expect(result.current).toBe(true);
    unmount();
  });
});

describe("useSectionReveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("becomes visible when IntersectionObserver reports intersecting", () => {
    installMatchMedia(false);
    const observe = vi.fn();
    const disconnect = vi.fn();
    let callback: IntersectionObserverCallback | null = null;
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn((cb: IntersectionObserverCallback) => {
        callback = cb;
        return { observe, unobserve: vi.fn(), disconnect, takeRecords: () => [] };
      }),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    let visible = false;
    const root = createRoot(host);

    function Probe() {
      const reveal = useSectionReveal<HTMLDivElement>();
      visible = reveal.visible;
      return createElement("div", { ref: reveal.ref });
    }

    act(() => {
      root.render(createElement(Probe));
    });
    expect(visible).toBe(false);
    expect(observe).toHaveBeenCalled();

    act(() => {
      callback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(visible).toBe(true);
    expect(disconnect).toHaveBeenCalled();

    act(() => root.unmount());
    host.remove();
  });

  it("is immediately visible when reduced motion is preferred", () => {
    installMatchMedia(true);
    const observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(() => ({
        observe,
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: () => [],
      })),
    );

    const host = document.createElement("div");
    document.body.appendChild(host);
    let visible = false;
    const root = createRoot(host);

    function Probe() {
      const reveal = useSectionReveal<HTMLDivElement>();
      visible = reveal.visible;
      return createElement("div", { ref: reveal.ref });
    }

    act(() => {
      root.render(createElement(Probe));
    });
    expect(visible).toBe(true);
    expect(observe).not.toHaveBeenCalled();

    act(() => root.unmount());
    host.remove();
  });
});
