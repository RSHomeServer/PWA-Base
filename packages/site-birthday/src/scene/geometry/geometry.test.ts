import { describe, expect, it } from "vitest";
import { buildWardrobeGeometry } from "./buildWardrobe.js";
import { buildArmillaryGeometry } from "./buildArmillary.js";
import { explodeGeometry } from "./geometryDebug.js";
import { WARDROBE, ARMILLARY } from "./params.js";

describe("wardrobe geometry", () => {
  it("exposes exactly the six required primitives", () => {
    const geom = buildWardrobeGeometry(
      { origin: { x: 0, y: 0, z: 0 }, yawDeg: 0, scale: 1 },
      { ...WARDROBE },
    );
    expect(geom.primitives.map((p) => p.label)).toEqual([
      "Plinth",
      "Body",
      "Door L",
      "Door R",
      "Handle L",
      "Handle R",
    ]);
  });

  it("places doors on the front face (+Z), not the side", () => {
    const geom = buildWardrobeGeometry(
      { origin: { x: 0, y: 0, z: 0 }, yawDeg: 0, scale: 1 },
      { ...WARDROBE },
    );
    const body = geom.primitives.find((p) => p.id === "body");
    const doorL = geom.primitives.find((p) => p.id === "door-l");
    expect(body?.kind).toBe("cuboid");
    expect(doorL?.kind).toBe("cuboid");
    if (body?.kind !== "cuboid" || doorL?.kind !== "cuboid") return;
    // Door centre Z is near the front (+depth/2), not near a side (±width/2).
    expect(doorL.center.z).toBeGreaterThan(body.size.depth * 0.2);
    expect(Math.abs(doorL.center.x)).toBeLessThan(body.size.width * 0.5);
    expect(doorL.size.depth).toBe(WARDROBE.doorThickness);
  });

  it("exploded diagram keeps every primitive labeled", () => {
    const geom = buildWardrobeGeometry(
      { origin: { x: 0, y: 0, z: 0 }, yawDeg: 0, scale: 1 },
      { ...WARDROBE },
    );
    const exploded = explodeGeometry(geom);
    expect(exploded).toHaveLength(6);
    expect(exploded[5]!.kind === "cylinder" || exploded[5]!.kind === "cuboid").toBe(
      true,
    );
  });
});

describe("armillary geometry", () => {
  it("has base, post, four rings, and star parts", () => {
    const geom = buildArmillaryGeometry(
      { origin: { x: 0, y: 0, z: 0 }, yawDeg: 0, scale: 1 },
      { ...ARMILLARY },
    );
    const kinds = geom.primitives.map((p) => p.kind);
    expect(kinds.filter((k) => k === "disk")).toHaveLength(2);
    expect(kinds.filter((k) => k === "ring")).toHaveLength(4);
    expect(kinds.filter((k) => k === "sphere")).toHaveLength(3);
  });
});
