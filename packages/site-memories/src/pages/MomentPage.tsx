import { detectPlatformRuntimeMode } from "@platform/runtime";
import { FindUsMoment } from "../moments/FindUsMoment.js";
import { ConstellationAlignmentTool } from "../moments/alignment/index.js";

/**
 * Playground route for Find Us.
 * Development Mode (`detectPlatformRuntimeMode`) exposes the alignment tool;
 * production mode renders the Moment only — no editor chrome.
 */
export function MomentPage() {
  const developmentMode = detectPlatformRuntimeMode() === "development";
  if (developmentMode) {
    return <ConstellationAlignmentTool />;
  }
  return <FindUsMoment />;
}
