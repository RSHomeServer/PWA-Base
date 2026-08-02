/**
 * Apply authoring params onto placement surfaces + props without changing
 * the Placement Engine (cells / surfaces remain the spatial source of truth).
 */
import type { PlacementSurface, PropInstance, RoomBounds } from "../types.js";
import { ROOM, SHELF } from "./params.js";
import type { SceneAuthoringParams } from "./params.js";

const FLOOR_CELL = ROOM.cellSize;

export function roomBoundsFromAuthoring(
  params: SceneAuthoringParams["room"],
): RoomBounds {
  return {
    width: params.length,
    depth: params.width,
    wallHeight: params.wallHeight,
  };
}

/** Resize structural surfaces to match room length / width / wall height. */
export function applyRoomToSurfaces(
  surfaces: readonly PlacementSurface[],
  room: SceneAuthoringParams["room"],
): PlacementSurface[] {
  const L = room.length;
  const W = room.width;
  const H = room.wallHeight;
  return surfaces.map((surface) => {
    if (surface.id === "floor") {
      return {
        ...surface,
        dimensions: { width: L, depth: W },
        cellWidth: FLOOR_CELL,
        cellHeight: FLOOR_CELL,
      };
    }
    if (surface.id === "wall-left") {
      return {
        ...surface,
        dimensions: { width: W, depth: H },
      };
    }
    if (surface.id === "wall-back") {
      return {
        ...surface,
        dimensions: { width: L, depth: H },
      };
    }
    return surface;
  });
}

/** Resize shelf-top from shelf length / depth; keep cell count. */
export function applyShelfToSurfaces(
  surfaces: readonly PlacementSurface[],
  shelf: SceneAuthoringParams["shelf"],
): PlacementSurface[] {
  return surfaces.map((surface) => {
    if (surface.id !== "shelf-top") return surface;
    const len = shelf.length;
    const depth = shelf.depth;
    const cells = Math.max(2, Math.round(shelf.cellCount));
    const half = len / 2;
    return {
      ...surface,
      dimensions: { width: len, depth },
      cellWidth: len / cells,
      cellHeight: depth,
      transform: {
        ...surface.transform,
        origin: {
          x: surface.transform.origin.x,
          y: surface.transform.origin.y,
          z: -half,
        },
      },
    };
  });
}

const SHELF_KEEPSAKE_IDS = ["keepsake-armillary", "keepsake-lantern"] as const;

/**
 * Apply keepsake scale + spacing on the shelf.
 * Spacing = cell gap between consecutive shelf keepsakes (starting at col 1).
 * Columns are clamped so keepsakes stay on the shelf grid.
 */
export function applyKeepsakeAuthoring(
  props: readonly PropInstance[],
  keepsake: SceneAuthoringParams["keepsake"],
  shelfCells: number = SHELF.cellCount,
): PropInstance[] {
  const spacing = Math.max(1, Math.round(keepsake.spacing));
  const scale = Math.max(0.25, keepsake.scale);
  const maxCol = Math.max(0, Math.round(shelfCells) - 1);
  let shelfIndex = 0;
  return props.map((prop) => {
    const isShelfKeepsake = (SHELF_KEEPSAKE_IDS as readonly string[]).includes(
      prop.id,
    );
    if (!isShelfKeepsake) return prop;
    const col = Math.min(maxCol, 1 + shelfIndex * spacing);
    shelfIndex += 1;
    return {
      ...prop,
      scale,
      occupiedCells: {
        ...prop.occupiedCells,
        col,
        row: 0,
        width: 1,
        height: 1,
      },
    };
  });
}
