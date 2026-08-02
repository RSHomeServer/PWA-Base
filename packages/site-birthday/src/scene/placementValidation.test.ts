import { describe, expect, it } from "vitest";
import { bedroomScene } from "./bedroom/bedroomScene.js";
import {
  canPlaceAsset,
  canPlaceProp,
  cellsInBounds,
  cellsOverlap,
  clampCellsToSurface,
  snapOccupiedCells,
} from "./placementValidation.js";
import { resolveScenePlacement } from "./placement.js";

describe("placementValidation", () => {
  const floor = bedroomScene.surfaces.find((s) => s.id === "floor")!;

  it("detects overlap", () => {
    expect(
      cellsOverlap(
        { col: 0, row: 0, width: 2, height: 2 },
        { col: 1, row: 1, width: 2, height: 2 },
      ),
    ).toBe(true);
    expect(
      cellsOverlap(
        { col: 0, row: 0, width: 2, height: 2 },
        { col: 2, row: 0, width: 2, height: 2 },
      ),
    ).toBe(false);
  });

  it("clamps nightstand into floor bounds", () => {
    const clamped = clampCellsToSurface(floor, {
      col: 99,
      row: 2,
      width: 2,
      height: 2,
    });
    expect(cellsInBounds(floor, clamped)).toBe(true);
    // Floor is roomLength/cellWidth cols (28 at default); width-2 → max col 26.
    expect(clamped.col).toBe(26);
  });

  it("rejects wardrobe on shelf-top", () => {
    const verdict = canPlaceProp({
      scene: bedroomScene,
      propId: "wardrobe",
      surfaceId: "shelf-top",
      cells: { col: 0, row: 0, width: 1, height: 1 },
    });
    expect(verdict.ok).toBe(false);
  });

  it("allows keepsake on shelf-top", () => {
    const verdict = canPlaceProp({
      scene: bedroomScene,
      propId: "keepsake-armillary",
      surfaceId: "shelf-top",
      cells: { col: 8, row: 0, width: 1, height: 1 },
    });
    expect(verdict.ok).toBe(true);
  });

  it("rejects keepsake on floor", () => {
    const verdict = canPlaceAsset({
      scene: bedroomScene,
      assetId: "keepsake.armillary-sphere",
      surfaceId: "floor",
      cells: { col: 10, row: 10, width: 1, height: 1 },
    });
    expect(verdict.ok).toBe(false);
  });

  it("snaps footprint centre to a cell", () => {
    const cells = snapOccupiedCells(floor, 10, 10, { width: 4, height: 2 });
    expect(cells.width).toBe(4);
    expect(cells.height).toBe(2);
    expect(cellsInBounds(floor, cells)).toBe(true);
  });

  it("bedroom blueprint resolves without OOB props", () => {
    const placement = resolveScenePlacement(bedroomScene);
    for (const resolved of placement.props) {
      expect(
        cellsInBounds(resolved.surface.surface, resolved.occupiedCells),
      ).toBe(true);
    }
  });

  it("bed footprint is longer along depth than width", () => {
    const bed = bedroomScene.props.find((p) => p.id === "bed")!;
    expect(bed.occupiedCells.height).toBeGreaterThan(bed.occupiedCells.width);
  });
});
