import { describe, expect, it } from "vitest";
import { resolveGsapPlayback } from "./resolveGsapPlayback.js";

describe("resolveGsapPlayback", () => {
  it("disables motion when reduced", () => {
    expect(resolveGsapPlayback(true)).toEqual({
      allowMotion: false,
      timeScale: 0,
    });
  });

  it("allows motion otherwise", () => {
    expect(resolveGsapPlayback(false)).toEqual({
      allowMotion: true,
      timeScale: 1,
    });
  });
});
