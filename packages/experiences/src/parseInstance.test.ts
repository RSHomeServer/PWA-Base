import { describe, expect, it } from "vitest";
import { parseExperienceInstance } from "./parseInstance.js";

describe("parseExperienceInstance", () => {
  it("parses a snow-globe instance", () => {
    const parsed = parseExperienceInstance({
      id: "paris",
      kind: "snow-globe",
      title: "Paris in Winter",
      centrepiece: { kind: "procedural", id: "eiffel" },
      snowDensity: 0.6,
    });
    expect(parsed.kind).toBe("snow-globe");
    if (parsed.kind === "snow-globe") {
      expect(parsed.centrepiece).toEqual({ kind: "procedural", id: "eiffel" });
      expect(parsed.snowDensity).toBe(0.6);
    }
  });

  it("parses music-box and fridge-door", () => {
    const box = parseExperienceInstance({
      id: "box-1",
      kind: "music-box",
      title: "For You",
      figurine: "bird",
      engravedText: "Always",
    });
    expect(box.kind).toBe("music-box");

    const fridge = parseExperienceInstance({
      id: "fridge-1",
      kind: "fridge-door",
      title: "Sunday",
      items: [{ id: "n1", kind: "note", label: "Milk", x: 20, y: 30 }],
    });
    expect(fridge.kind).toBe("fridge-door");
    if (fridge.kind === "fridge-door") expect(fridge.items).toHaveLength(1);
  });

  it("parses constellation intro and gltf centrepiece", () => {
    const stars = parseExperienceInstance({
      id: "constellation",
      kind: "snow-globe",
      title: "Constellation",
      intro: "constellation-reveal",
      environment: "night-sky",
      centrepiece: { kind: "procedural", id: "constellation" },
    });
    expect(stars.kind).toBe("snow-globe");
    if (stars.kind === "snow-globe") {
      expect(stars.intro).toBe("constellation-reveal");
      expect(stars.centrepiece).toEqual({ kind: "procedural", id: "constellation" });
    }

    const landmark = parseExperienceInstance({
      id: "paris",
      kind: "snow-globe",
      title: "Paris",
      centrepiece: {
        kind: "gltf",
        src: "/models/snow-globe/eiffel.glb",
        scale: 0.05,
        attribution: "CC BY",
      },
    });
    expect(landmark.kind).toBe("snow-globe");
    if (landmark.kind === "snow-globe") {
      expect(landmark.centrepiece.kind).toBe("gltf");
      expect(landmark.intro).toBe("none");
    }
  });

  it("rejects incomplete instances", () => {
    expect(() => parseExperienceInstance({ kind: "snow-globe" })).toThrow(/requires/);
  });
});
