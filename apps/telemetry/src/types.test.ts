import { describe, expect, it } from "vitest";
import { calculateDurationMs, titleFromPrompt } from "./types.js";

describe("calculateDurationMs", () => {
  it("returns positive delta", () => {
    expect(calculateDurationMs("2026-01-01T00:00:00.000Z", "2026-01-01T00:01:30.000Z")).toBe(
      90_000,
    );
  });

  it("returns 0 for inverted or invalid ranges", () => {
    expect(calculateDurationMs("2026-01-01T01:00:00.000Z", "2026-01-01T00:00:00.000Z")).toBe(0);
    expect(calculateDurationMs("bad", "also-bad")).toBe(0);
  });
});

describe("titleFromPrompt", () => {
  it("uses the first non-empty line", () => {
    expect(titleFromPrompt("\n  Ship it\nmore")).toBe("Ship it");
  });

  it("truncates long titles", () => {
    const long = "x".repeat(100);
    expect(titleFromPrompt(long).endsWith("…")).toBe(true);
  });
});
