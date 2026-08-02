/**
 * Screen-space hit bounds for props — matches rendered artwork, not floor cells.
 */
import { getAsset } from "./assets/catalog.js";
import { artworkBaseCorners, artworkHeight } from "./assetSizing.js";
import { fitArtworkToPlacement } from "./fitting.js";
import { projectPoly, type Point2 } from "./iso.js";
import type { ResolvedProp } from "./placement.js";
import type { AssetDefinition } from "./types.js";

const RASTER_ARTWORK = /\.(png|webp|jpe?g)(\?.*)?$/i;

export function usesImportedArtwork(asset: AssetDefinition | undefined): boolean {
  return Boolean(
    asset?.image &&
      asset.artworkBoundingBox &&
      asset.artworkOrigin &&
      RASTER_ARTWORK.test(asset.image),
  );
}

export type ArtworkHitRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Axis-aligned screen rect covering the visible prop artwork.
 * Uses preferred-size base when preserveAspectRatio is set.
 */
export function artworkHitRect(
  resolved: ResolvedProp,
  offset: Point2,
): ArtworkHitRect {
  const asset = getAsset(resolved.prop.assetId);

  if (usesImportedArtwork(asset) && asset) {
    const fitted = fitArtworkToPlacement(asset, resolved);
    if (fitted) {
      return {
        x: fitted.left - offset.x,
        y: fitted.top - offset.y,
        width: fitted.width,
        height: fitted.height,
      };
    }
  }

  const height = artworkHeight(resolved);
  const base = artworkBaseCorners(resolved);
  const bottom = projectPoly(base);
  const top = projectPoly(
    base.map((c) => ({ x: c.x, y: c.y + height, z: c.z })),
  );
  const pts = [...bottom, ...top];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: minX - offset.x,
    y: minY - offset.y,
    width: Math.max(8, maxX - minX),
    height: Math.max(8, maxY - minY),
  };
}
