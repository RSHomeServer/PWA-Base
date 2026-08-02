import { describe, expect, it } from "vitest";
import { bedroomScene } from "./bedroom/bedroomScene.js";
import { cascadeDeleteProp } from "./sceneCascade.js";
import { resolveScenePlacement } from "./placement.js";
import { canPlaceAsset, canPlaceProp } from "./placementValidation.js";

describe("cascadeDeleteProp", () => {
  it("removes desk, desk-top, and hosted keepsakes without dangling surfaces", () => {
    const result = cascadeDeleteProp(
      bedroomScene.props,
      bedroomScene.surfaces,
      "desk",
    );
    expect(result.removedPropIds).toContain("desk");
    expect(result.removedPropIds).toContain("keepsake-record");
    expect(result.removedPropIds).toContain("keepsake-album");
    expect(result.removedPropIds).toContain("laptop");
    expect(result.removedSurfaceIds).toContain("desk-top");
    expect(result.surfaces.find((s) => s.id === "desk-top")).toBeUndefined();
    expect(result.props.find((p) => p.id === "desk")).toBeUndefined();

    const placement = resolveScenePlacement({
      ...bedroomScene,
      props: result.props,
      surfaces: result.surfaces,
    });
    expect(placement.props.every((p) => p.prop.id !== "desk")).toBe(true);
  });
});

describe("collision", () => {
  it("rejects overlapping furniture on floor", () => {
    const bed = bedroomScene.props.find((p) => p.id === "bed")!;
    const verdict = canPlaceProp({
      scene: bedroomScene,
      propId: "wardrobe",
      surfaceId: "floor",
      cells: { ...bed.occupiedCells },
      ignorePropIds: ["wardrobe"],
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toBe("occupied");
  });

  it("rejects overlapping keepsakes on shelf", () => {
    const snow = bedroomScene.props.find((p) => p.id === "keepsake-armillary")!;
    const verdict = canPlaceAsset({
      scene: bedroomScene,
      assetId: "keepsake.paper-lantern",
      surfaceId: "shelf-top",
      cells: { ...snow.occupiedCells },
    });
    expect(verdict.ok).toBe(false);
  });

  it("allows rug under bed (decoration vs furniture)", () => {
    const bed = bedroomScene.props.find((p) => p.id === "bed")!;
    const verdict = canPlaceProp({
      scene: bedroomScene,
      propId: "rug",
      surfaceId: "floor",
      cells: { ...bed.occupiedCells },
      ignorePropIds: ["rug"],
    });
    expect(verdict.ok).toBe(true);
  });
});
