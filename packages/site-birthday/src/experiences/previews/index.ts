import type { ExperiencePreviewAssets } from "../types.js";
import constellationMeta from "./constellation/meta.json" with { type: "json" };

/**
 * Static stills are served from birthday-web `/public/previews/...`
 * so capture tooling can overwrite PNGs without Vite import rewires.
 */
export const constellationPreview: ExperiencePreviewAssets = {
  fullSrc: "/previews/constellation/frame-full.png",
  cropSrc: "/previews/constellation/frame-crop.png",
  bbox: constellationMeta.bbox,
  center: constellationMeta.center,
  widthPx: constellationMeta.widthPx,
  heightPx: constellationMeta.heightPx,
};

export function placeholderPreview(): ExperiencePreviewAssets {
  return {
    fullSrc: "/previews/placeholder-full.svg",
    cropSrc: "/previews/placeholder-crop.svg",
    bbox: { x: 0.12, y: 0.14, width: 0.76, height: 0.72 },
    center: { x: 0.5, y: 0.5 },
    widthPx: 700,
    heightPx: 640,
  };
}
