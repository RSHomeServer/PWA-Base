import { describe, expect, it } from "vitest";
import {
  PLATFORM_LOGO_ACCENTS,
  extractDominantColor,
  platformNavLogoAccent,
} from "./logoAccent.js";

describe("logo accents", () => {
  it("maps known nav ids to hex accents", () => {
    expect(platformNavLogoAccent("birthday")).toBe("#be185d");
    expect(platformNavLogoAccent("viz")).toBe("#c2410c");
    expect(platformNavLogoAccent("stats")).toBe("#1d4ed8");
    expect(platformNavLogoAccent("qbt")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("covers every accent entry with a hex colour", () => {
    for (const [id, color] of Object.entries(PLATFORM_LOGO_ACCENTS)) {
      expect(id.length).toBeGreaterThan(0);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("returns null from extractDominantColor without a canvas image", () => {
    expect(extractDominantColor({} as HTMLImageElement)).toBeNull();
  });
});
