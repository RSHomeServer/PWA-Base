import { vi } from "vitest";

vi.stubGlobal(
  "matchMedia",
  vi.fn(() => ({
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })),
);
