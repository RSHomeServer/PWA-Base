/**
 * Bedroom Scene — surface + cell placement only.
 * Cosy cutaway: floor + left wall + back wall. Length is configurable.
 */
import type {
  PlacementSurface,
  PropInstance,
  SceneBlueprint,
} from "../types.js";
import { BEDROOM_ROOM } from "./roomConfig.js";

export { BEDROOM_ROOM } from "./roomConfig.js";

/** @deprecated Prefer BEDROOM_ROOM.roomLength */
export const BEDROOM_ROOM_WIDTH = BEDROOM_ROOM.roomLength;

const L = BEDROOM_ROOM.roomLength;
const D = BEDROOM_ROOM.depth;
const H = BEDROOM_ROOM.wallHeight;
const CELL = 0.5;

const FLOOR: PlacementSurface = {
  id: "floor",
  plane: "xz",
  dimensions: { width: L, depth: D },
  cellWidth: CELL,
  cellHeight: CELL,
  supportedPropTypes: ["prop", "surface", "decoration"],
  transform: {
    parentSurfaceId: null,
    origin: { x: 0, y: 0, z: 0 },
    yawDeg: 0,
  },
  structureAssetId: "structure.floor",
};

const WALL_LEFT: PlacementSurface = {
  id: "wall-left",
  plane: "zy",
  dimensions: { width: D, depth: H },
  cellWidth: CELL,
  cellHeight: 0.25,
  supportedPropTypes: ["prop", "surface", "decoration"],
  transform: {
    parentSurfaceId: null,
    origin: { x: 0.12, y: 0, z: 0 },
    yawDeg: 0,
  },
  structureAssetId: "structure.wall-left",
};

const WALL_BACK: PlacementSurface = {
  id: "wall-back",
  plane: "xy",
  dimensions: { width: L, depth: H },
  cellWidth: 0.4,
  cellHeight: 0.25,
  supportedPropTypes: ["prop", "surface", "decoration"],
  transform: {
    parentSurfaceId: null,
    origin: { x: 0, y: 0, z: 0.12 },
    yawDeg: 0,
  },
  structureAssetId: "structure.wall-back",
};

/** Horizontal plank top — attached to the shelf prop. */
const SHELF_TOP: PlacementSurface = {
  id: "shelf-top",
  plane: "xz",
  dimensions: { width: 5.2, depth: 0.55 },
  cellWidth: 5.2 / 12,
  cellHeight: 0.55,
  supportedPropTypes: ["keepsake-slot", "prop", "decoration"],
  placementConstraints: { marginCells: 0 },
  transform: {
    parentSurfaceId: null,
    attachToPropId: "shelf",
    origin: { x: 0.28, y: 0.08, z: -2.6 },
    yawDeg: 90,
  },
};

const DESK_TOP: PlacementSurface = {
  id: "desk-top",
  plane: "xz",
  dimensions: { width: 4.5, depth: 2 },
  cellWidth: 4.5 / 8,
  cellHeight: 2,
  supportedPropTypes: ["prop", "decoration", "keepsake-slot"],
  transform: {
    parentSurfaceId: null,
    attachToPropId: "desk",
    origin: { x: -2.25, y: 0.75, z: -1 },
    yawDeg: 0,
  },
};

const NIGHTSTAND_A_TOP: PlacementSurface = {
  id: "nightstand-a-top",
  plane: "xz",
  dimensions: { width: 0.7, depth: 0.7 },
  cellWidth: 0.35,
  cellHeight: 0.35,
  supportedPropTypes: ["prop", "decoration", "keepsake-slot"],
  transform: {
    parentSurfaceId: null,
    attachToPropId: "nightstand-a",
    origin: { x: -0.35, y: 0.55, z: -0.35 },
    yawDeg: 0,
  },
};

const NIGHTSTAND_B_TOP: PlacementSurface = {
  id: "nightstand-b-top",
  plane: "xz",
  dimensions: { width: 0.7, depth: 0.7 },
  cellWidth: 0.35,
  cellHeight: 0.35,
  supportedPropTypes: ["prop", "decoration", "keepsake-slot"],
  transform: {
    parentSurfaceId: null,
    attachToPropId: "nightstand-b",
    origin: { x: -0.35, y: 0.55, z: -0.35 },
    yawDeg: 0,
  },
};

/** Dollhouse cutaway — no front / right wall surfaces. */
export const bedroomSurfaces: readonly PlacementSurface[] = [
  FLOOR,
  WALL_LEFT,
  WALL_BACK,
  SHELF_TOP,
  DESK_TOP,
  NIGHTSTAND_A_TOP,
  NIGHTSTAND_B_TOP,
];

/**
 * Cosy layout: wardrobe corner → desk under shelf → bed opposite.
 * Floor grid = roomLength/0.5 × depth/0.5 (28 × 22 at defaults).
 */
export const bedroomProps: readonly PropInstance[] = [
  {
    id: "wardrobe",
    assetId: "prop.wardrobe",
    parentSurface: "floor",
    // Between shelf (left wall) and window (back wall).
    occupiedCells: { col: 0, row: 1, width: 5, height: 2 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    anchor: "Floor.Left",
  },
  {
    id: "desk",
    assetId: "surface.desk",
    parentSurface: "floor",
    occupiedCells: { col: 5, row: 5, width: 8, height: 4 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    anchor: "Floor.Left",
    hostedSurfaceId: "desk-top",
  },
  {
    id: "chair",
    assetId: "prop.chair",
    parentSurface: "floor",
    occupiedCells: { col: 7, row: 9, width: 2, height: 2 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
  },
  {
    id: "bed",
    assetId: "surface.bed",
    parentSurface: "floor",
    occupiedCells: { col: 18, row: 1, width: 5, height: 8 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    anchor: "Floor.Right",
  },
  {
    id: "nightstand-a",
    assetId: "prop.nightstand",
    parentSurface: "floor",
    occupiedCells: { col: 15, row: 1, width: 2, height: 2 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    hostedSurfaceId: "nightstand-a-top",
  },
  {
    id: "nightstand-b",
    assetId: "prop.nightstand",
    parentSurface: "floor",
    occupiedCells: { col: 24, row: 1, width: 2, height: 2 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    hostedSurfaceId: "nightstand-b-top",
  },
  {
    id: "rug",
    assetId: "decoration.rug",
    parentSurface: "floor",
    occupiedCells: { col: 17, row: 6, width: 6, height: 5 },
    orientation: 0,
    scale: 1,
    zone: "decoration",
    anchor: "Floor.Centre",
  },
  {
    id: "shelf",
    assetId: "surface.shelf",
    parentSurface: "wall-left",
    // Above the desk along the left wall.
    occupiedCells: { col: 4, row: 12, width: 11, height: 1 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    anchor: "Wall.Left",
    hostedSurfaceId: "shelf-top",
  },
  {
    id: "window",
    assetId: "prop.window",
    parentSurface: "wall-back",
    occupiedCells: { col: 12, row: 6, width: 10, height: 11 },
    orientation: 0,
    scale: 1,
    zone: "wall",
    anchor: "Wall.Centre",
  },
  {
    id: "keepsake-armillary",
    assetId: "keepsake.armillary-sphere",
    parentSurface: "shelf-top",
    occupiedCells: { col: 2, row: 0, width: 1, height: 1 },
    orientation: 0,
    scale: 1,
    zone: "keepsake",
    launchRoute: "/constellation",
    metadata: { label: "Armillary Sphere" },
  },
  {
    id: "keepsake-lantern",
    assetId: "keepsake.paper-lantern",
    parentSurface: "shelf-top",
    occupiedCells: { col: 5, row: 0, width: 1, height: 1 },
    orientation: 0,
    scale: 1,
    zone: "keepsake",
    launchRoute: "/lanterns",
    metadata: { label: "Paper Lantern" },
  },
  {
    id: "keepsake-record",
    assetId: "keepsake.record-player",
    parentSurface: "desk-top",
    occupiedCells: { col: 0, row: 0, width: 2, height: 1 },
    orientation: 0,
    scale: 1.15,
    zone: "keepsake",
    launchRoute: "/voice",
    metadata: { label: "Record Player" },
  },
  {
    id: "keepsake-album",
    assetId: "keepsake.photo-album",
    parentSurface: "desk-top",
    occupiedCells: { col: 2, row: 0, width: 2, height: 1 },
    orientation: 0,
    scale: 1.1,
    zone: "keepsake",
    launchRoute: "/photos",
    metadata: { label: "Photo Album" },
  },
  {
    id: "keepsake-reel",
    assetId: "keepsake.film-reel",
    parentSurface: "desk-top",
    occupiedCells: { col: 4, row: 0, width: 2, height: 1 },
    orientation: 0,
    scale: 1.2,
    zone: "keepsake",
    launchRoute: "/videos",
    metadata: { label: "Film Reel" },
  },
  {
    id: "laptop",
    assetId: "prop.laptop",
    parentSurface: "desk-top",
    occupiedCells: { col: 6, row: 0, width: 2, height: 1 },
    orientation: 0,
    scale: 1,
    zone: "furniture",
    launchRoute: "/settings",
    metadata: { label: "Laptop" },
  },
];

export const bedroomScene: SceneBlueprint = {
  id: "bedroom",
  title: "When You Miss Me",
  eyebrow: "Birthday · Home",
  camera: {
    pitchDeg: 30,
    yawDeg: 45,
    aspectRatio: "16 / 10",
    allowZoom: true,
    allowPan: true,
    minZoom: 0.45,
    maxZoom: 2.4,
    defaultZoom: 1,
  },
  room: {
    width: BEDROOM_ROOM.roomLength,
    depth: BEDROOM_ROOM.depth,
    wallHeight: BEDROOM_ROOM.wallHeight,
  },
  anchors: {
    "Wall.Left": {
      surfaceId: "wall-left",
      cells: { col: 8, row: 10, width: 2, height: 2 },
    },
    "Wall.Centre": {
      surfaceId: "wall-back",
      cells: { col: 15, row: 10, width: 4, height: 4 },
    },
    "Wall.Right": {
      surfaceId: "wall-back",
      cells: { col: 28, row: 10, width: 2, height: 2 },
    },
    "Floor.Left": {
      surfaceId: "floor",
      cells: { col: 6, row: 11, width: 2, height: 2 },
    },
    "Floor.Centre": {
      surfaceId: "floor",
      cells: { col: 14, row: 9, width: 2, height: 2 },
    },
    "Floor.Right": {
      surfaceId: "floor",
      cells: { col: 20, row: 4, width: 2, height: 2 },
    },
  },
  surfaces: bedroomSurfaces,
  props: bedroomProps,
  navigation: {
    showExperienceNav: true,
  },
};

/** @deprecated Use bedroomProps */
export const bedroomInstances = bedroomProps;
/** @deprecated Use bedroom anchors via scene.anchors */
export const bedroomAnchors = bedroomScene.anchors;
