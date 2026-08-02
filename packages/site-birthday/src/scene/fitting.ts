/**
 * Artwork fitting — consumes ResolvedProp from the placement engine only.
 */
import { projectIso, projectPoly } from "./iso.js";
import type { ResolvedProp } from "./placement.js";
import type { AssetDefinition } from "./types.js";

export type FittedArtwork = {
  left: number;
  top: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  scale: number;
};

/**
 * Fit artwork so artworkOrigin lands on the resolved prop world origin,
 * scaled to the occupied-cell footprint. Aspect ratio preserved.
 */
export function fitArtworkToPlacement(
  asset: AssetDefinition,
  placement: ResolvedProp,
): FittedArtwork | null {
  if (!asset.image || !asset.artworkBoundingBox || !asset.artworkOrigin) {
    return null;
  }

  const pts = projectPoly(placement.footprintCorners);
  const xs = pts.map((p) => p.x);
  const screenFootprintW = Math.max(...xs) - Math.min(...xs);
  /**
   * Map sprite width → occupied-cell screen width.
   * 0.96 leaves a small transparent margin typical of isometric packs
   * without stretching or per-prop pixel offsets.
   */
  const imageFootprintW = Math.max(1, asset.artworkBoundingBox.width * 0.97);
  const scale = Math.max(
    0.01,
    (screenFootprintW / imageFootprintW) *
      asset.defaultScale *
      placement.prop.scale,
  );

  const originScreen = projectIso(
    placement.worldOrigin.x,
    placement.worldOrigin.y,
    placement.worldOrigin.z,
  );
  const width = asset.artworkBoundingBox.width * scale;
  const height = asset.artworkBoundingBox.height * scale;

  return {
    left: originScreen.x - asset.artworkOrigin.x * width,
    top: originScreen.y - asset.artworkOrigin.y * height,
    width,
    height,
    originX: originScreen.x,
    originY: originScreen.y,
    scale,
  };
}
