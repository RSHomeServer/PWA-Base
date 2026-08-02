/**
 * Artwork sizing — preferred dimensions vs occupied-cell stretch.
 * Placement cells still decide position / fit; these control drawn size.
 */
import { getAsset } from "./assets/catalog.js";
import { footprintCorners } from "./iso.js";
import type { ResolvedProp } from "./placement.js";
import type { AssetDefinition, Vec3 } from "./types.js";

export function assetPreferredSize(asset: AssetDefinition): {
  width: number;
  depth: number;
  height: number;
} {
  return {
    width: asset.preferredWidth,
    depth: asset.preferredDepth,
    height: asset.preferredHeight,
  };
}

/** True when artwork should fill occupied cells instead of preferred size. */
export function shouldStretchToCells(asset: AssetDefinition | undefined): boolean {
  if (!asset) return true;
  if (asset.preserveAspectRatio) return false;
  return asset.allowNonUniformScale;
}

/**
 * World-space base quad for drawing artwork.
 * Keepsakes (preserveAspectRatio) stay preferred size, centred on world origin.
 */
export function artworkBaseCorners(resolved: ResolvedProp): Vec3[] {
  const asset = getAsset(resolved.prop.assetId);
  if (!asset || shouldStretchToCells(asset)) {
    return resolved.footprintCorners;
  }
  const scale = asset.defaultScale * resolved.prop.scale;
  return footprintCorners(
    resolved.worldOrigin,
    {
      width: asset.preferredWidth * scale,
      depth: asset.preferredDepth * scale,
    },
    resolved.yawDeg,
  );
}

export function artworkHeight(resolved: ResolvedProp): number {
  const asset = getAsset(resolved.prop.assetId);
  if (!asset) return Math.max(0.35, resolved.footprintWidth * 0.5);
  return asset.preferredHeight * asset.defaultScale * resolved.prop.scale;
}
