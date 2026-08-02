/**
 * Placement validation — cell bounds, overlap, and surface eligibility.
 * Used by the DnD editor; resolveScenePlacement stays pure geometry.
 */
import { getAsset } from "./assets/catalog.js";
import { surfaceGridSize, type ResolvedSurface } from "./placement.js";
import type {
  AssetKind,
  OccupiedCells,
  PlacementSurface,
  PropInstance,
  SceneBlueprint,
} from "./types.js";

export function cellsOverlap(a: OccupiedCells, b: OccupiedCells): boolean {
  return !(
    a.col + a.width <= b.col ||
    b.col + b.width <= a.col ||
    a.row + a.height <= b.row ||
    b.row + b.height <= a.row
  );
}

export function cellsInBounds(
  surface: PlacementSurface,
  cells: OccupiedCells,
): boolean {
  const { cols, rows } = surfaceGridSize(surface);
  return (
    cells.col >= 0 &&
    cells.row >= 0 &&
    cells.width >= 1 &&
    cells.height >= 1 &&
    cells.col + cells.width <= cols &&
    cells.row + cells.height <= rows
  );
}

export function clampCellsToSurface(
  surface: PlacementSurface,
  cells: OccupiedCells,
): OccupiedCells {
  const { cols, rows } = surfaceGridSize(surface);
  const width = Math.min(cells.width, cols);
  const height = Math.min(cells.height, rows);
  return {
    col: Math.max(0, Math.min(cells.col, cols - width)),
    row: Math.max(0, Math.min(cells.row, rows - height)),
    width,
    height,
  };
}

/** Snap a footprint so its centre cell is nearest to (col, row). */
export function snapOccupiedCells(
  surface: PlacementSurface,
  col: number,
  row: number,
  footprint: Pick<OccupiedCells, "width" | "height">,
): OccupiedCells {
  const originCol = col - Math.floor((footprint.width - 1) / 2);
  const originRow = row - Math.floor((footprint.height - 1) / 2);
  return clampCellsToSurface(surface, {
    col: originCol,
    row: originRow,
    width: footprint.width,
    height: footprint.height,
  });
}

export function surfaceAcceptsAssetKind(
  surface: PlacementSurface,
  kind: AssetKind,
): boolean {
  return surface.supportedPropTypes.includes(kind);
}

export function assetAcceptsSurface(
  assetId: string,
  surfaceId: string,
): boolean {
  const asset = getAsset(assetId);
  if (!asset) return false;
  if (!asset.supportedSurfaces) return true;
  return asset.supportedSurfaces.includes(surfaceId);
}

export type PlacementVerdict = {
  ok: boolean;
  reason?: string;
};

/** Cell footprint from preferred / default asset size on a surface grid. */
export function defaultOccupiedFootprint(
  surface: PlacementSurface,
  assetId: string,
): Pick<OccupiedCells, "width" | "height"> {
  const asset = getAsset(assetId);
  if (!asset) return { width: 1, height: 1 };
  const width = asset.preferredWidth || asset.footprintWidth;
  const depth = asset.preferredDepth || asset.footprintDepth;
  return {
    width: Math.max(1, Math.round(width / surface.cellWidth)),
    height: Math.max(1, Math.round(depth / surface.cellHeight)),
  };
}

function zoneForAsset(assetId: string): PropInstance["zone"] {
  const asset = getAsset(assetId);
  if (!asset) return "furniture";
  if (asset.kind === "decoration") return "decoration";
  if (asset.kind === "keepsake-slot") return "keepsake";
  if (asset.renderLayer === "wall") return "wall";
  return "furniture";
}

/** Can an asset sit on a surface with cells given other props. */
export function canPlaceAsset(args: {
  scene: SceneBlueprint;
  assetId: string;
  surfaceId: string;
  cells: OccupiedCells;
  ignorePropIds?: readonly string[];
  /** Zone used for overlap policy (defaults from asset kind). */
  zone?: PropInstance["zone"];
}): PlacementVerdict {
  const surfaceDef = args.scene.surfaces.find((s) => s.id === args.surfaceId);
  if (!surfaceDef) return { ok: false, reason: "unknown-surface" };

  const asset = getAsset(args.assetId);
  if (!asset) return { ok: false, reason: "unknown-asset" };

  if (!surfaceAcceptsAssetKind(surfaceDef, asset.kind)) {
    return { ok: false, reason: "surface-rejects-kind" };
  }
  if (!assetAcceptsSurface(args.assetId, args.surfaceId)) {
    return { ok: false, reason: "asset-rejects-surface" };
  }
  if (!cellsInBounds(surfaceDef, args.cells)) {
    return { ok: false, reason: "out-of-bounds" };
  }

  const ignore = new Set(args.ignorePropIds ?? []);
  const zone = args.zone ?? zoneForAsset(args.assetId);

  for (const other of args.scene.props) {
    if (ignore.has(other.id)) continue;
    if (other.parentSurface !== args.surfaceId) continue;
    if (!cellsOverlap(args.cells, other.occupiedCells)) continue;

    // Rug/decoration may share cells with furniture only — never furniture↔furniture
    // or keepsake↔keepsake. Surface allowOverlap is ignored for same-kind clashes.
    const aDeco = zone === "decoration";
    const bDeco = other.zone === "decoration";
    if (aDeco !== bDeco) continue;

    return { ok: false, reason: "occupied" };
  }

  return { ok: true };
}

/** Can an existing prop sit on a surface with cells. */
export function canPlaceProp(args: {
  scene: SceneBlueprint;
  propId: string;
  surfaceId: string;
  cells: OccupiedCells;
  ignorePropIds?: readonly string[];
}): PlacementVerdict {
  const prop = args.scene.props.find((p) => p.id === args.propId);
  if (!prop) return { ok: false, reason: "unknown-prop" };
  return canPlaceAsset({
    scene: args.scene,
    assetId: prop.assetId,
    surfaceId: args.surfaceId,
    cells: args.cells,
    ignorePropIds: args.ignorePropIds ?? [args.propId],
    zone: prop.zone,
  });
}

/** Candidate surfaces the prop may land on (authoring + asset rules). */
export function eligibleSurfacesForProp(
  scene: SceneBlueprint,
  prop: PropInstance,
): PlacementSurface[] {
  return eligibleSurfacesForAsset(scene, prop.assetId);
}

export function eligibleSurfacesForAsset(
  scene: SceneBlueprint,
  assetId: string,
): PlacementSurface[] {
  const asset = getAsset(assetId);
  if (!asset) return [];
  return scene.surfaces.filter(
    (surface) =>
      surfaceAcceptsAssetKind(surface, asset.kind) &&
      assetAcceptsSurface(assetId, surface.id),
  );
}

export function cellCenterWorld(
  surface: ResolvedSurface,
  col: number,
  row: number,
): { u: number; v: number } {
  return {
    u: (col + 0.5) * surface.cellWidth,
    v: (row + 0.5) * surface.cellHeight,
  };
}
