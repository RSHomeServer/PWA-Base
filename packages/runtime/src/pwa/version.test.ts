import { describe, expect, it } from "vitest";
import { formatDdMmHhMm } from "./version.js";

describe("formatDdMmHhMm", () => {
  it("formats local dd/mm HH:MM", () => {
    // Fixed UTC instant — assert shape only (timezone-safe).
    const formatted = formatDdMmHhMm("2026-07-26T18:05:00.000Z");
    expect(formatted).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/);
  });

  it("returns em dash for invalid input", () => {
    expect(formatDdMmHhMm("not-a-date")).toBe("—");
  });
});
