export type {
  AnchorId,
  AssetDefinition,
  AssetKind,
  AssetLibraryCategory,
  AssetRenderLayer,
  ArtworkBoundingBox,
  ArtworkOrigin,
  OccupiedCells,
  PlacementConstraints,
  PlacementSurface,
  PlacedInstance,
  PropInstance,
  RoomBounds,
  SceneBlueprint,
  SceneCameraConfig,
  SceneZoneId,
  Size3,
  SurfacePlane,
  Vec3,
} from "./types.js";
export { SCENE_ZONE_ORDER, ASSET_RENDER_LAYER_ORDER } from "./types.js";
export {
  ASSET_CATALOG,
  getAsset,
  listAssets,
  listLibraryAssets,
  libraryCategoryLabel,
} from "./assets/catalog.js";
export {
  bedroomScene,
  bedroomAnchors,
  bedroomInstances,
  bedroomProps,
  bedroomSurfaces,
  BEDROOM_ROOM,
} from "./bedroom/bedroomScene.js";
export { SceneRenderer } from "./SceneRenderer.js";
export type { SceneInteractionMode } from "./SceneRenderer.js";
export {
  projectIso,
  footprintCorners,
  roomProjectedBounds,
} from "./iso.js";
export {
  resolveScenePlacement,
  resolvePropOnSurface,
  surfaceUvToWorld,
  surfaceBoundsCorners,
  occupiedLocalBounds,
  surfaceGridSize,
} from "./placement.js";
export type {
  ResolvedProp,
  ResolvedSurface,
  ResolvedAnchor,
  ScenePlacement,
} from "./placement.js";
export {
  cellsOverlap,
  cellsInBounds,
  clampCellsToSurface,
  snapOccupiedCells,
  canPlaceProp,
  canPlaceAsset,
  defaultOccupiedFootprint,
  eligibleSurfacesForProp,
  eligibleSurfacesForAsset,
} from "./placementValidation.js";
export type { PlacementVerdict } from "./placementValidation.js";
export { cascadeDeleteProp } from "./sceneCascade.js";
export type { CascadeDeleteResult } from "./sceneCascade.js";
export { PropIllustration, PROP_STYLE } from "./PropIllustration.js";
export { fitArtworkToPlacement } from "./fitting.js";
export type { FittedArtwork } from "./fitting.js";
export { artworkHitRect, usesImportedArtwork } from "./artworkHit.js";
export type { ArtworkHitRect } from "./artworkHit.js";
export { assetThumbnail, proceduralThumbnail } from "./assetThumbnail.js";
export {
  artworkBaseCorners,
  artworkHeight,
  shouldStretchToCells,
} from "./assetSizing.js";
export {
  AuthoringPanel,
  GeometryDebugLayer,
  WARDROBE,
  ARMILLARY,
  ROOM,
  defaultAuthoringParams,
  buildWardrobeGeometry,
  buildArmillaryGeometry,
  explodeGeometry,
} from "./geometry/index.js";
export type {
  SceneAuthoringParams,
  GeomPrimitive,
  AssetGeometry,
} from "./geometry/index.js";
