/**
 * Authorable geometry constants — renderer builds primitives from these only.
 * No magic numbers in illustration code.
 */

/** Room floor span: length = X (back-wall run), width = Z (into room). */
export const ROOM = {
  length: 14,
  width: 11,
  wallHeight: 5.2,
  cellSize: 0.5,
} as const;

export type RoomParams = {
  length: number;
  width: number;
  wallHeight: number;
};

export const CAMERA_AUTHORING = {
  fitToViewport: true,
  zoom: 1,
  panX: 0,
  panY: 0,
  minZoom: 0.45,
  maxZoom: 2.4,
} as const;

export type CameraAuthoringParams = {
  fitToViewport: boolean;
  zoom: number;
  panX: number;
  panY: number;
};

/** Scandinavian wardrobe — cuboid body, front-face doors, cylinder handles, plinth. */
export const WARDROBE = {
  width: 2.6,
  depth: 1.0,
  height: 1.9,
  /** Door slab thickness along depth (front → back). */
  doorThickness: 0.05,
  /** How far doors sit in from the front face (recess). */
  doorRecess: 0.02,
  /** Frame margin around the door pair (fraction of width / body height). */
  doorMarginX: 0.08,
  doorMarginY: 0.08,
  /** Gap between left and right doors. */
  doorGap: 0.04,
  plinthHeight: 0.08,
  /** Inset of plinth under body (each side). */
  plinthInset: 0.02,
  handleRadius: 0.025,
  /** Handle cylinder length protruding from door front. */
  handleLength: 0.04,
  /** Handle centre as fraction of door height from door bottom. */
  handleY: 0.5,
  /** Handle inset from door inner edge (toward centre gap). */
  handleInsetX: 0.08,
} as const;

export type WardrobeParams = { -readonly [K in keyof typeof WARDROBE]: number };

/** Armillary — base + post + rings + star. Readability via scale, not detail. */
export const ARMILLARY = {
  baseRadius: 0.26,
  baseHeight: 0.07,
  baseSides: 16,
  postRadius: 0.032,
  postHeight: 0.2,
  postSides: 8,
  ringRadius: 0.36,
  ringCount: 4,
  /** Screen stroke weight (SVG units) — readability, not model detail. */
  ringStroke: 3.4,
  starOuterRadius: 0.05,
  starCoreRadius: 0.022,
  starGlowRadius: 0.08,
  /** Vertical lift of ring centre above post top, as fraction of ringRadius. */
  ringLift: 0.55,
} as const;

export type ArmillaryParams = {
  -readonly [K in keyof typeof ARMILLARY]: number;
};

/** Shelf top surface authoring. */
export const SHELF = {
  length: 5.2,
  depth: 0.55,
  cellCount: 12,
  /** Wall-mounted shelf plank thickness (visual). */
  thickness: 0.12,
} as const;

export type ShelfParams = {
  length: number;
  depth: number;
  cellCount: number;
};

/** Keepsake layout on shelf-top. */
export const KEEPSAKE = {
  /** Cell gap between consecutive shelf keepsakes. */
  spacing: 3,
  /** Uniform scale applied to shelf keepsakes (armillary readability). */
  scale: 1.55,
} as const;

export type KeepsakeAuthoringParams = {
  spacing: number;
  scale: number;
};

export type SceneAuthoringParams = {
  room: RoomParams;
  camera: CameraAuthoringParams;
  shelf: ShelfParams;
  keepsake: KeepsakeAuthoringParams;
  wardrobe: WardrobeParams;
  armillary: ArmillaryParams;
};

export function defaultAuthoringParams(): SceneAuthoringParams {
  return {
    room: { length: ROOM.length, width: ROOM.width, wallHeight: ROOM.wallHeight },
    camera: {
      fitToViewport: CAMERA_AUTHORING.fitToViewport,
      zoom: CAMERA_AUTHORING.zoom,
      panX: CAMERA_AUTHORING.panX,
      panY: CAMERA_AUTHORING.panY,
    },
    shelf: {
      length: SHELF.length,
      depth: SHELF.depth,
      cellCount: SHELF.cellCount,
    },
    keepsake: { spacing: KEEPSAKE.spacing, scale: KEEPSAKE.scale },
    wardrobe: { ...WARDROBE },
    armillary: { ...ARMILLARY },
  };
}
