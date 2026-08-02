/**
 * Asset thumbnails for the authoring library.
 * Prefer catalog image (raster) or a generated procedural SVG data URI.
 */
import type { AssetDefinition } from "./types.js";

const RASTER = /\.(png|webp|jpe?g)(\?.*)?$/i;

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const KIND_FILL: Record<string, string> = {
  surface: "#9a7a58",
  prop: "#8a909c",
  decoration: "#6e6256",
  "keepsake-slot": "#a8aeb8",
  structure: "#7a6a58",
};

/** Procedural square thumbnail — always valid, never a broken icon. */
export function proceduralThumbnail(asset: AssetDefinition): string {
  const fill = KIND_FILL[asset.kind] ?? "#8a909c";
  const label = (asset.placeholderLabel ?? asset.displayName.slice(0, 6)).slice(
    0,
    8,
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="6" fill="#1a1612"/>
  <rect x="8" y="10" width="48" height="36" rx="4" fill="${fill}"/>
  <text x="32" y="54" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8" fill="#d8dee8">${label}</text>
</svg>`;
  return svgDataUri(svg);
}

/**
 * Thumbnail URL for library previews.
 * Raster catalog images are used as-is; everything else gets a procedural mark.
 */
export function assetThumbnail(asset: AssetDefinition): string {
  if (asset.thumbnail) return asset.thumbnail;
  if (asset.image && RASTER.test(asset.image)) return asset.image;
  return proceduralThumbnail(asset);
}
