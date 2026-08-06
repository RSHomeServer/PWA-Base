import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./ParticleField.module.css", () => ({
  default: new Proxy(
    {},
    {
      get: (_target, property: string) => property,
    },
  ),
}));

import { ParticleField } from "./ParticleField.js";
import type { ParticleLabel } from "./types.js";

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

const SAMPLE_POOL: readonly ParticleLabel[] = [
  { text: "First wish", toneId: "softAmber", textColor: "#c07828" },
  { text: "Second wish", toneId: "peach", textColor: "#c47a52" },
];

function renderField(
  props: Partial<ComponentProps<typeof ParticleField>> = {},
): { host: HTMLDivElement; unmount: () => void } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  let root: Root | null = createRoot(host);

  act(() => {
    root!.render(
      createElement(ParticleField, {
        pool: SAMPLE_POOL,
        distantCount: 2,
        hintActive: "Tap to release",
        hintDone: "All released",
        liveRegionLabel: (released, total) => `${released}/${total} done`,
        ...props,
      }),
    );
  });

  return {
    host,
    unmount: () => {
      act(() => {
        root?.unmount();
        root = null;
      });
      host.remove();
    },
  };
}

describe("ParticleField", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders hint and live region", () => {
    installMatchMedia(false);
    const { host, unmount } = renderField();
    expect(host.textContent).toContain("Tap to release");
    expect(host.textContent).toContain("0/2 done");
    unmount();
  });

  it("uses static particle classes when reduced motion is preferred", () => {
    installMatchMedia(true);
    const { host, unmount } = renderField();
    act(() => undefined);
    expect(host.querySelector(".particleStatic")).toBeNull();
    expect(host.querySelector(".distantStatic")).not.toBeNull();

    act(() => {
      host.querySelector('[role="presentation"]')?.dispatchEvent(
        new MouseEvent("click", { clientX: 100, bubbles: true }),
      );
    });

    const particle = host.querySelector(".particleStatic");
    expect(particle).not.toBeNull();
    expect(
      SAMPLE_POOL.some((label) => particle?.textContent?.includes(label.text)),
    ).toBe(true);
    unmount();
  });

  it("spawns a labelled particle on click and fires onAllReleased", () => {
    installMatchMedia(false);
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const onAllReleased = vi.fn();
    const { host, unmount } = renderField({
      pool: [{ text: "Only one", toneId: "softAmber", textColor: "#000" }],
      onAllReleased,
    });

    const field = host.querySelector('[role="presentation"]') as HTMLDivElement;
    Object.defineProperty(field, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ left: 0, width: 200, top: 0, height: 100, right: 200, bottom: 100 }),
    });

    act(() => {
      field.dispatchEvent(new MouseEvent("click", { clientX: 100, bubbles: true }));
    });

    expect(host.textContent).toContain("Only one");
    expect(host.textContent).toContain("1/1 done");
    expect(host.textContent).toContain("All released");
    expect(onAllReleased).toHaveBeenCalledTimes(1);
    unmount();
  });
});
