import type { ParamValues } from "@platform/controls";
import { exhibits } from "../exhibits/registry.js";
import type { ExhibitDraw } from "../exhibits/types.js";
import { flagshipPreviewFor } from "./flagshipPreviews.js";
import { legacyPreviewFor } from "./legacyPreviews.js";

export interface PreviewSource {
  draw: ExhibitDraw;
  animated: boolean;
  defaults: ParamValues;
}

export function resolvePreviewSource(demoId: string, path: string): PreviewSource | null {
  const flagship = flagshipPreviewFor(demoId);
  if (flagship) {
    return flagship;
  }

  const exhibit = exhibits.find((entry) => entry.id === demoId || entry.path === path);
  if (exhibit) {
    return {
      draw: exhibit.draw,
      animated: exhibit.animated ?? false,
      defaults: exhibit.defaults,
    };
  }

  const legacy = legacyPreviewFor(demoId);
  if (legacy) {
    return {
      draw: legacy.draw,
      animated: legacy.animated ?? false,
      defaults: legacy.defaults,
    };
  }

  return null;
}
