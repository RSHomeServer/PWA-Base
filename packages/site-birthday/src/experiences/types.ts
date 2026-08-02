import type { ComponentType } from "react";

/**
 * Static preview assets for launcher → experience camera continuity.
 *
 * Image A (`fullSrc`): first frame of the destination viewport.
 * Image B (`cropSrc`): tight crop of the focal content (e.g. constellation).
 * `bbox` is Image B's rect inside Image A, normalized to [0,1] of A/viewport.
 */
export type PreviewBBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PreviewCenter = {
  x: number;
  y: number;
};

export type ExperiencePreviewAssets = {
  fullSrc: string;
  cropSrc: string;
  bbox: PreviewBBox;
  center: PreviewCenter;
  /** Pixel size of the crop within the capture viewport (documentation). */
  widthPx: number;
  heightPx: number;
};

export type ExperienceLoadState =
  | "idle"
  | "waiting"
  | "loading"
  | "ready"
  | "error";

/**
 * Shared launcher model consumed by Home, Portals, and future entry points.
 */
export type ExperienceDefinition = {
  id: string;
  title: string;
  icon: string;
  route: string;
  description: string;
  /** Destination page component (for registry / future non-static previews). */
  Preview: ComponentType;
  /** Static preview pair used by launchers + enter transition. */
  preview: ExperiencePreviewAssets;
};

export type EnterTransitionPhase =
  | "idle"
  | "selected"
  | "aligning"
  | "filling"
  | "navigating"
  | "settling";

export type EnterTransitionRequest = {
  experienceId: string;
  route: string;
  fromRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  fromRadius: string;
};
