/** Core spatial primitives for the reusable Scene placement engine. */

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export type Size3 = {
  width: number;
  depth: number;
  height: number;
};

export type SceneZoneId =
  | "wall"
  | "furniture"
  | "keepsake"
  | "decoration"
  | "floor";

export const SCENE_ZONE_ORDER: readonly SceneZoneId[] = [
  "floor",
  "wall",
  "furniture",
  "decoration",
  "keepsake",
] as const;

export type AnchorId =
  | "Wall.Left"
  | "Wall.Centre"
  | "Wall.Right"
  | "Floor.Left"
  | "Floor.Centre"
  | "Floor.Right";

export type AssetKind =
  | "structure"
  | "surface"
  | "prop"
  | "decoration"
  | "keepsake-slot";

/** Authoring library grouping ? structures are never listed. */
export type AssetLibraryCategory = "furniture" | "keepsakes" | "decoration";

export type AssetRenderLayer =
  | "floor"
  | "wall"
  | "surface"
  | "object"
  | "decoration"
  | "overlay";

export const ASSET_RENDER_LAYER_ORDER: readonly AssetRenderLayer[] = [
  "floor",
  "wall",
  "decoration",
  "surface",
  "object",
  "overlay",
] as const;

export type ArtworkOrigin = {
  x: number;
  y: number;
};

export type ArtworkBoundingBox = {
  width: number;
  height: number;
};

/**
 * Reusable Asset ? artwork + default footprint sizing.
 * Placement is NOT stored here; props place via surfaces + cells.
 */
export type AssetDefinition = {
  id: string;
  displayName: string;
  kind: AssetKind;
  defaultSize: Size3;
  defaultOrientation: number;
  boundingBox: Size3;
  supportedSurfaces: readonly string[] | null;
  childConstraints: {
    maxChildren?: number;
    allowedAssetKinds?: readonly AssetKind[];
  } | null;
  placeholderLabel?: string;
  /** When set, asset appears in the Scene Authoring Asset Library. */
  libraryCategory?: AssetLibraryCategory;
  /** Optional explicit library thumbnail URL (raster or data URI). */
  thumbnail?: string | null;
  image: string | null;
  footprintWidth: number;
  footprintDepth: number;
  artworkBoundingBox: ArtworkBoundingBox | null;
  artworkOrigin: ArtworkOrigin | null;
  renderLayer: AssetRenderLayer;
  defaultScale: number;
  defaultRotation: number;
  /** Preferred world width when not stretching to occupied cells. */
  preferredWidth: number;
  preferredDepth: number;
  preferredHeight: number;
  /** When true, artwork uses preferred size centred on origin (not cell stretch). */
  preserveAspectRatio: boolean;
  /** When true with preserveAspectRatio false, artwork fills occupied cells. */
  allowNonUniformScale: boolean;
};

/**
 * How a surface's local (u,v) axes map into the parent frame.
 * - xz: horizontal (floor, shelf top, desk top)
 * - zy: vertical wall facing +X (left wall)
 * - xy: vertical wall facing +Z (back wall)
 */
export type SurfacePlane = "xz" | "zy" | "xy";

/** Axis-aligned rectangle of cells on a surface grid (inclusive origin). */
export type OccupiedCells = {
  /** Column of the min corner (u axis). */
  col: number;
  /** Row of the min corner (v axis). */
  row: number;
  /** Cells along u. */
  width: number;
  /** Cells along v. */
  height: number;
};

export type PlacementConstraints = {
  marginCells?: number;
  allowOverlap?: boolean;
};

/**
 * Somewhere props may exist. Owns its logical grid.
 * Transform is relative to the parent scene, or derived from a parent prop.
 */
export type PlacementSurface = {
  id: string;
  plane: SurfacePlane;
  /** World-unit extent along local u (width) and v (depth / wall height). */
  dimensions: { width: number; depth: number };
  cellWidth: number;
  cellHeight: number;
  cellDepth?: number;
  supportedPropTypes: readonly AssetKind[];
  maximumHeight?: number;
  placementConstraints?: PlacementConstraints;
  /**
   * Local origin = cell (0,0) corner.
   * If `attachToPropId` is set, origin is that prop's resolved world origin + localOffset.
   * Otherwise origin is scene-world (parentSurfaceId reserved for future nesting).
   */
  transform: {
    parentSurfaceId: string | null;
    attachToPropId?: string;
    origin: Vec3;
    yawDeg: number;
  };
  /** Optional structure asset for shell visuals (floor / walls). */
  structureAssetId?: string;
};

/**
 * A prop placed on exactly one surface via occupied cells.
 * No arbitrary world coordinates.
 */
export type PropInstance = {
  id: string;
  assetId: string;
  parentSurface: string;
  occupiedCells: OccupiedCells;
  /** Extra yaw relative to the parent surface. */
  orientation: number;
  scale: number;
  zone: SceneZoneId;
  anchor?: AnchorId;
  metadata?: Record<string, unknown>;
  /** Nested placement surface hosted by this prop (desk top, nightstand, shelf top). */
  hostedSurfaceId?: string;
  launchRoute?: string;
};

export type SceneCameraConfig = {
  pitchDeg: number;
  yawDeg: number;
  aspectRatio: string;
  allowZoom: boolean;
  allowPan: boolean;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
};

export type RoomBounds = {
  width: number;
  depth: number;
  wallHeight: number;
};

/**
 * Scene = surfaces + props + camera.
 * World positions are never authored on props ? only derived.
 */
export type SceneBlueprint = {
  id: string;
  title: string;
  eyebrow?: string;
  camera: SceneCameraConfig;
  room: RoomBounds;
  /** Named markers derived from the same placement math (for overlay / nav). */
  anchors: Record<AnchorId, { surfaceId: string; cells: OccupiedCells }>;
  surfaces: readonly PlacementSurface[];
  props: readonly PropInstance[];
  navigation?: {
    showExperienceNav?: boolean;
  };
};

/** @deprecated Use PropInstance ? kept name export for gradual migration. */
export type PlacedInstance = PropInstance;
