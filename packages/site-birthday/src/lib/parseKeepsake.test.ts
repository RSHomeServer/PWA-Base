import { describe, expect, it } from "vitest";
import { DEFAULT_KEEPSAKE } from "./constants.js";
import { mergeKeepsakeDocument, parseKeepsakeJson } from "./parseKeepsake.js";

describe("parseKeepsake", () => {
  it("returns defaults for invalid JSON", () => {
    expect(parseKeepsakeJson("{not-json", DEFAULT_KEEPSAKE)).toEqual(DEFAULT_KEEPSAKE);
  });

  it("merges partial pack fields over defaults", () => {
    const merged = mergeKeepsakeDocument(
      {
        schemaVersion: 1,
        recipientName: "Ada",
        chapters: {
          hello: { title: "Ada" },
          moments: {
            moments: [{ number: 1, caption: "First light", src: "media/photos/01.jpg" }],
          },
        },
      },
      DEFAULT_KEEPSAKE,
    );
    expect(merged.recipientName).toBe("Ada");
    expect(merged.chapters.hello.title).toBe("Ada");
    expect(merged.chapters.hello.kicker).toBe(DEFAULT_KEEPSAKE.chapters.hello.kicker);
    expect(merged.chapters.moments.moments[0]?.src).toBe("media/photos/01.jpg");
    expect(merged.chapters.letters.letters.length).toBeGreaterThan(0);
  });
});
