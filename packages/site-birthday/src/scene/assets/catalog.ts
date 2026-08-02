import type { AssetDefinition, AssetLibraryCategory } from "../types.js";
import { BEDROOM_ROOM } from "../bedroom/roomConfig.js";
import { WARDROBE } from "../geometry/params.js";

/** Shelf / desk / nightstand tops — keepsakes may only land here. */
const KEEPSAKE_SURFACES = [
  "shelf-top",
  "desk-top",
  "nightstand-a-top",
  "nightstand-b-top",
] as const;

function withPreferred(
  size: { width: number; depth: number; height: number },
  opts: { preserveAspectRatio: boolean; allowNonUniformScale: boolean },
) {
  return {
    preferredWidth: size.width,
    preferredDepth: size.depth,
    preferredHeight: size.height,
    preserveAspectRatio: opts.preserveAspectRatio,
    allowNonUniformScale: opts.allowNonUniformScale,
  };
}

function structureAsset(
  partial: Omit<
    AssetDefinition,
    | "image"
    | "footprintWidth"
    | "footprintDepth"
    | "artworkBoundingBox"
    | "artworkOrigin"
    | "renderLayer"
    | "defaultScale"
    | "defaultRotation"
    | "preferredWidth"
    | "preferredDepth"
    | "preferredHeight"
    | "preserveAspectRatio"
    | "allowNonUniformScale"
  > & {
    renderLayer?: AssetDefinition["renderLayer"];
  },
): AssetDefinition {
  const size = partial.defaultSize;
  return {
    ...partial,
    image: null,
    footprintWidth: size.width,
    footprintDepth: size.depth,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: partial.renderLayer ?? "floor",
    defaultScale: 1,
    defaultRotation: partial.defaultOrientation,
    ...withPreferred(size, {
      preserveAspectRatio: false,
      allowNonUniformScale: true,
    }),
  };
}

function furnitureAsset(
  partial: Omit<
    AssetDefinition,
    | "preferredWidth"
    | "preferredDepth"
    | "preferredHeight"
    | "preserveAspectRatio"
    | "allowNonUniformScale"
  >,
): AssetDefinition {
  return {
    ...partial,
    ...withPreferred(
      {
        width: partial.footprintWidth,
        depth: partial.footprintDepth,
        height: partial.defaultSize.height,
      },
      { preserveAspectRatio: false, allowNonUniformScale: true },
    ),
  };
}

function keepsakeAsset(
  id: string,
  displayName: string,
  placeholderLabel: string,
  size: { width: number; depth: number; height: number },
): AssetDefinition {
  return {
    id,
    displayName,
    kind: "keepsake-slot",
    defaultSize: size,
    defaultOrientation: 0,
    boundingBox: size,
    supportedSurfaces: KEEPSAKE_SURFACES,
    childConstraints: null,
    placeholderLabel,
    libraryCategory: "keepsakes",
    thumbnail: null,
    image: null,
    footprintWidth: size.width,
    footprintDepth: size.depth,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "object",
    defaultScale: 1,
    defaultRotation: 0,
    ...withPreferred(size, {
      preserveAspectRatio: true,
      allowNonUniformScale: false,
    }),
  };
}

const L = BEDROOM_ROOM.roomLength;
const D = BEDROOM_ROOM.depth;
const H = BEDROOM_ROOM.wallHeight;

/**
 * Global Asset catalog — one coherent procedural visual language.
 * No imported rasters; library thumbnails use `assetThumbnail()`.
 */
export const ASSET_CATALOG: Record<string, AssetDefinition> = {
  "structure.floor": structureAsset({
    id: "structure.floor",
    displayName: "Floor Plane",
    kind: "structure",
    defaultSize: { width: L, depth: D, height: 0.08 },
    defaultOrientation: 0,
    boundingBox: { width: L, depth: D, height: 0.08 },
    supportedSurfaces: null,
    childConstraints: null,
    placeholderLabel: "FLOOR",
    renderLayer: "floor",
  }),
  "structure.wall-left": structureAsset({
    id: "structure.wall-left",
    displayName: "Left Wall",
    kind: "structure",
    defaultSize: { width: D, depth: 0.12, height: H },
    defaultOrientation: 0,
    boundingBox: { width: D, depth: 0.12, height: H },
    supportedSurfaces: null,
    childConstraints: null,
    placeholderLabel: "WALL.L",
    renderLayer: "wall",
  }),
  "structure.wall-back": structureAsset({
    id: "structure.wall-back",
    displayName: "Back Wall",
    kind: "structure",
    defaultSize: { width: L, depth: 0.12, height: H },
    defaultOrientation: 90,
    boundingBox: { width: L, depth: 0.12, height: H },
    supportedSurfaces: null,
    childConstraints: null,
    placeholderLabel: "WALL.B",
    renderLayer: "wall",
  }),
  /** Wall shelf — place on wall-left or wall-back. */
  "surface.shelf": furnitureAsset({
    id: "surface.shelf",
    displayName: "Wall Shelf",
    kind: "surface",
    defaultSize: { width: 5.6, depth: 0.75, height: 0.28 },
    defaultOrientation: 0,
    boundingBox: { width: 5.6, depth: 0.75, height: 0.28 },
    supportedSurfaces: ["wall-left", "wall-back"],
    childConstraints: {
      maxChildren: 12,
      allowedAssetKinds: ["keepsake-slot", "prop", "decoration"],
    },
    placeholderLabel: "SHELF",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: 5.6,
    footprintDepth: 0.75,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "surface",
    defaultScale: 1,
    defaultRotation: 0,
  }),
  "surface.desk": furnitureAsset({
    id: "surface.desk",
    displayName: "Desk",
    kind: "surface",
    defaultSize: { width: 4.2, depth: 1.35, height: 0.9 },
    defaultOrientation: 0,
    boundingBox: { width: 4.2, depth: 1.35, height: 0.9 },
    supportedSurfaces: ["floor"],
    childConstraints: {
      maxChildren: 8,
      allowedAssetKinds: ["prop", "decoration", "keepsake-slot"],
    },
    placeholderLabel: "DESK",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: 4.2,
    footprintDepth: 1.35,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "surface",
    defaultScale: 1,
    defaultRotation: 0,
  }),
  "surface.bed": furnitureAsset({
    id: "surface.bed",
    displayName: "Bed",
    kind: "surface",
    defaultSize: { width: 2.4, depth: 3.8, height: 0.7 },
    defaultOrientation: 0,
    boundingBox: { width: 2.4, depth: 3.8, height: 0.7 },
    supportedSurfaces: ["floor"],
    childConstraints: {
      maxChildren: 4,
      allowedAssetKinds: ["prop", "decoration"],
    },
    placeholderLabel: "BED",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: 2.4,
    footprintDepth: 3.8,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "surface",
    defaultScale: 1,
    defaultRotation: 0,
  }),
  /** Scandinavian wardrobe — dimensions from geometry/params WARDROBE. */
  "prop.wardrobe": furnitureAsset({
    id: "prop.wardrobe",
    displayName: "Wardrobe",
    kind: "prop",
    defaultSize: {
      width: WARDROBE.width,
      depth: WARDROBE.depth,
      height: WARDROBE.height,
    },
    defaultOrientation: 0,
    boundingBox: {
      width: WARDROBE.width,
      depth: WARDROBE.depth,
      height: WARDROBE.height,
    },
    supportedSurfaces: ["floor"],
    childConstraints: null,
    placeholderLabel: "WARDROBE",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: WARDROBE.width,
    footprintDepth: WARDROBE.depth,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "object",
    defaultScale: 1,
    defaultRotation: 0,
  }),
  "prop.window": furnitureAsset({
    id: "prop.window",
    displayName: "Window",
    kind: "prop",
    defaultSize: { width: 3.2, depth: 0.16, height: 2.4 },
    defaultOrientation: 90,
    boundingBox: { width: 3.2, depth: 0.16, height: 2.4 },
    supportedSurfaces: ["wall-back"],
    childConstraints: null,
    placeholderLabel: "WINDOW",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: 3.2,
    footprintDepth: 0.16,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "wall",
    defaultScale: 1,
    defaultRotation: 90,
  }),
  "prop.nightstand": furnitureAsset({
    id: "prop.nightstand",
    displayName: "Nightstand",
    kind: "prop",
    defaultSize: { width: 0.85, depth: 0.85, height: 0.7 },
    defaultOrientation: 0,
    boundingBox: { width: 0.85, depth: 0.85, height: 0.7 },
    supportedSurfaces: ["floor"],
    childConstraints: {
      maxChildren: 4,
      allowedAssetKinds: ["prop", "decoration", "keepsake-slot"],
    },
    placeholderLabel: "NIGHTSTAND",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: 0.85,
    footprintDepth: 0.85,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "object",
    defaultScale: 1,
    defaultRotation: 0,
  }),
  "prop.chair": furnitureAsset({
    id: "prop.chair",
    displayName: "Chair",
    kind: "prop",
    defaultSize: { width: 0.85, depth: 0.85, height: 1.15 },
    defaultOrientation: 180,
    boundingBox: { width: 0.85, depth: 0.85, height: 1.15 },
    supportedSurfaces: ["floor"],
    childConstraints: null,
    placeholderLabel: "CHAIR",
    libraryCategory: "furniture",
    image: null,
    footprintWidth: 0.85,
    footprintDepth: 0.85,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "object",
    defaultScale: 1,
    defaultRotation: 180,
  }),
  "prop.laptop": {
    ...furnitureAsset({
      id: "prop.laptop",
      displayName: "Laptop",
      kind: "prop",
      defaultSize: { width: 0.55, depth: 0.4, height: 0.08 },
      defaultOrientation: 0,
      boundingBox: { width: 0.55, depth: 0.4, height: 0.08 },
      supportedSurfaces: ["desk-top"],
      childConstraints: null,
      placeholderLabel: "LAPTOP",
      libraryCategory: "furniture",
      image: null,
      footprintWidth: 0.55,
      footprintDepth: 0.4,
      artworkBoundingBox: null,
      artworkOrigin: null,
      renderLayer: "object",
      defaultScale: 1,
      defaultRotation: 0,
    }),
    preserveAspectRatio: true,
    allowNonUniformScale: false,
  },
  "decoration.rug": furnitureAsset({
    id: "decoration.rug",
    displayName: "Rug",
    kind: "decoration",
    defaultSize: { width: 3.4, depth: 2.6, height: 0.04 },
    defaultOrientation: 0,
    boundingBox: { width: 3.4, depth: 2.6, height: 0.04 },
    supportedSurfaces: ["floor"],
    childConstraints: null,
    placeholderLabel: "RUG",
    libraryCategory: "decoration",
    image: null,
    footprintWidth: 3.4,
    footprintDepth: 2.6,
    artworkBoundingBox: null,
    artworkOrigin: null,
    renderLayer: "decoration",
    defaultScale: 1,
    defaultRotation: 0,
  }),
  "keepsake.armillary-sphere": keepsakeAsset(
    "keepsake.armillary-sphere",
    "Armillary Sphere",
    "ARMIL",
    { width: 0.62, depth: 0.62, height: 0.82 },
  ),
  "keepsake.paper-lantern": keepsakeAsset(
    "keepsake.paper-lantern",
    "Paper Lantern",
    "LANTERN",
    { width: 0.32, depth: 0.32, height: 0.48 },
  ),
  "keepsake.record-player": keepsakeAsset(
    "keepsake.record-player",
    "Record Player",
    "RECORD",
    { width: 0.95, depth: 0.8, height: 0.42 },
  ),
  "keepsake.photo-album": keepsakeAsset(
    "keepsake.photo-album",
    "Photo Album",
    "ALBUM",
    { width: 0.85, depth: 0.65, height: 0.22 },
  ),
  "keepsake.film-reel": keepsakeAsset(
    "keepsake.film-reel",
    "Film Reel",
    "REEL",
    { width: 0.78, depth: 0.78, height: 0.38 },
  ),
};

export function getAsset(id: string): AssetDefinition | undefined {
  return ASSET_CATALOG[id];
}

export function listAssets(): AssetDefinition[] {
  return Object.values(ASSET_CATALOG);
}

const LIBRARY_ORDER: readonly AssetLibraryCategory[] = [
  "furniture",
  "keepsakes",
  "decoration",
];

export function listLibraryAssets(): AssetDefinition[] {
  return listAssets()
    .filter((asset) => asset.libraryCategory)
    .sort((a, b) => {
      const ca = LIBRARY_ORDER.indexOf(a.libraryCategory!);
      const cb = LIBRARY_ORDER.indexOf(b.libraryCategory!);
      if (ca !== cb) return ca - cb;
      return a.displayName.localeCompare(b.displayName);
    });
}

export function libraryCategoryLabel(category: AssetLibraryCategory): string {
  switch (category) {
    case "furniture":
      return "Furniture";
    case "keepsakes":
      return "Keepsakes";
    case "decoration":
      return "Decoration";
  }
}
