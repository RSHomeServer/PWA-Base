import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FROZEN_LOTTIE_PLAYBACK } from "./resolveLottiePlayback.js";
import { useSongaraLottiePlayback } from "./useSongaraLottiePlayback.js";

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

describe("useSongaraLottiePlayback", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports reducedMotion and frozen playback when preferred", () => {
    installMatchMedia(true);
    const { result, unmount } = renderHook(() =>
      useSongaraLottiePlayback({ autoplay: true, loop: true }),
    );
    expect(result.current.reducedMotion).toBe(true);
    expect(result.current.autoplay).toBe(FROZEN_LOTTIE_PLAYBACK.autoplay);
    expect(result.current.loop).toBe(FROZEN_LOTTIE_PLAYBACK.loop);
    unmount();
  });

  it("passes through prefs when motion is allowed", () => {
    installMatchMedia(false);
    const { result, unmount } = renderHook(() =>
      useSongaraLottiePlayback({ autoplay: false, loop: 1 }),
    );
    expect(result.current.reducedMotion).toBe(false);
    expect(result.current.autoplay).toBe(false);
    expect(result.current.loop).toBe(1);
    unmount();
  });
});
