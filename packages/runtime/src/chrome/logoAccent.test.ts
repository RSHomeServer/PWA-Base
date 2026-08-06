import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOGO_ACCENT,
  extractDominantColor,
  platformNavLogoAccent,
} from "./logoAccent.js";

describe("logo accents", () => {
  it("uses injected accents when provided", () => {
    expect(platformNavLogoAccent("hello", { hello: "#0f766e" })).toBe("#0f766e");
  });

  it("falls back to the default accent", () => {
    expect(platformNavLogoAccent("unknown")).toBe(DEFAULT_LOGO_ACCENT);
    expect(platformNavLogoAccent("unknown", {})).toBe(DEFAULT_LOGO_ACCENT);
  });

  it("returns null from extractDominantColor without a canvas image", () => {
    expect(extractDominantColor({} as HTMLImageElement)).toBeNull();
  });
});
