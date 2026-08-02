export {
  STAR_LOOK,
  starBodyColor,
  starInkColor,
  type StarLook,
} from "./starLooks.js";

export type {
  ConstellationArtwork,
  ConstellationDefinition,
  ConstellationInstance,
  ConstellationObject,
  ConstellationPalette,
  ConstellationTransform,
  ConstellationVertex,
  ResolvedArtwork,
  ResolvedConstellation,
  ResolvedVertex,
  StarSpecialEffect,
  Vec2,
} from "./types.js";

export {
  activationOrderFromDrawOrder,
  applyTransform,
  defaultInstanceTransform,
  drawSegmentsFromOrder,
  resolveArtwork,
  resolveConstellation,
  resolveInstance,
  resolveVertex,
  undirectedEdgeKey,
  vertexIndexByUid,
} from "./transform.js";

export {
  ConstellationRenderer,
  type DrawnEdge,
  type StarPressPayload,
} from "./ConstellationRenderer.js";
