import { describe, expect, it } from "vitest";
import { getAsset } from "./assets/catalog.js";
import { artworkBaseCorners, shouldStretchToCells } from "./assetSizing.js";
import { bedroomScene } from "./bedroom/bedroomScene.js";
import { resolveScenePlacement } from "./placement.js";

describe("assetSizing", () => {
  it("keepsakes preserve aspect and do not stretch to cells", () => {
    const asset = getAsset("keepsake.armillary-sphere")!;
    expect(asset.preserveAspectRatio).toBe(true);
    expect(asset.allowNonUniformScale).toBe(false);
    expect(shouldStretchToCells(asset)).toBe(false);
  });

  it("armillary artwork base is preferred size, not shelf cell size", () => {
    const placement = resolveScenePlacement(bedroomScene);
    const armillary = placement.props.find(
      (p) => p.prop.id === "keepsake-armillary",
    )!;
    const asset = getAsset("keepsake.armillary-sphere")!;
    const base = artworkBaseCorners(armillary);
    const xs = base.map((c) => c.x);
    const zs = base.map((c) => c.z);
    const width = Math.max(...xs) - Math.min(...xs);
    const depth = Math.max(...zs) - Math.min(...zs);
    expect(width).toBeCloseTo(asset.preferredWidth! * armillary.prop.scale, 5);
    expect(depth).toBeCloseTo(asset.preferredDepth! * armillary.prop.scale, 5);
    // Preferred artwork may exceed the occupied shelf cell.
    expect(shouldStretchToCells(asset)).toBe(false);
  });

  it("shelf supports cutaway walls only", () => {
    const shelf = getAsset("surface.shelf")!;
    expect(shelf.supportedSurfaces).toEqual(["wall-left", "wall-back"]);
  });
});
