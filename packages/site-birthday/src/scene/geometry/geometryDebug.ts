/**
 * Geometry debugger helpers — exploded primitives for every asset.
 */
import { footprintCorners } from "../iso.js";
import type { ResolvedProp } from "../placement.js";
import type { SceneAuthoringParams } from "./params.js";
import { buildArmillaryGeometry } from "./buildArmillary.js";
import { buildWardrobeGeometry } from "./buildWardrobe.js";
import type { AssetGeometry, GeomPrimitive, LocalFrame } from "./primitives.js";
import { frameFromResolved } from "./frame.js";
import { getAsset } from "../assets/catalog.js";

function shiftPrimitive(
  primitive: GeomPrimitive,
  dx: number,
  dy: number,
  dz: number,
): GeomPrimitive {
  const move = (c: { x: number; y: number; z: number }) => ({
    x: c.x + dx,
    y: c.y + dy,
    z: c.z + dz,
  });
  switch (primitive.kind) {
    case "cuboid":
      return { ...primitive, center: move(primitive.center) };
    case "disk":
      return { ...primitive, center: move(primitive.center) };
    case "ring":
      return { ...primitive, center: move(primitive.center) };
    case "sphere":
      return { ...primitive, center: move(primitive.center) };
    case "cylinder":
      return { ...primitive, base: move(primitive.base) };
  }
}

/** Explode primitives along local +X so each part is visible alone. */
export function explodeGeometry(
  geometry: AssetGeometry,
  gap = 1.35,
): GeomPrimitive[] {
  return geometry.primitives.map((primitive, index) =>
    shiftPrimitive(primitive, index * gap, 0, 0),
  );
}

function stubCuboidGeometry(
  assetId: string,
  displayName: string,
  frame: LocalFrame,
  size: { width: number; depth: number; height: number },
): AssetGeometry {
  return {
    assetId,
    displayName,
    primitives: [
      {
        kind: "cuboid",
        id: "body",
        label: "Body",
        center: {
          x: frame.origin.x,
          y: frame.origin.y + (size.height * frame.scale) / 2,
          z: frame.origin.z,
        },
        size: {
          width: size.width * frame.scale,
          depth: size.depth * frame.scale,
          height: size.height * frame.scale,
        },
        yawDeg: frame.yawDeg,
      },
    ],
  };
}

export function geometryForResolved(
  resolved: ResolvedProp,
  authoring: SceneAuthoringParams,
): AssetGeometry {
  const frame = frameFromResolved(resolved);
  const id = resolved.prop.assetId;
  if (id === "prop.wardrobe") {
    return buildWardrobeGeometry(frame, authoring.wardrobe);
  }
  if (id === "keepsake.armillary-sphere") {
    return buildArmillaryGeometry(frame, authoring.armillary);
  }
  const asset = getAsset(id);
  const size = asset
    ? {
        width: asset.preferredWidth,
        depth: asset.preferredDepth,
        height: asset.preferredHeight,
      }
    : {
        width: resolved.footprintWidth,
        depth: resolved.footprintDepth,
        height: 0.4,
      };
  return stubCuboidGeometry(id, asset?.displayName ?? id, frame, size);
}

/** Standalone wardrobe exploded at origin — for validation diagram. */
export function wardrobeExplodedDiagram(
  authoring: SceneAuthoringParams,
): AssetGeometry {
  const frame: LocalFrame = {
    origin: { x: 0, y: 0, z: 0 },
    yawDeg: 0,
    scale: 1,
  };
  return {
    ...buildWardrobeGeometry(frame, authoring.wardrobe),
    displayName: "Wardrobe (exploded)",
  };
}

export function debugFootprint(resolved: ResolvedProp) {
  return footprintCorners(
    resolved.worldOrigin,
    {
      width: resolved.footprintWidth,
      depth: resolved.footprintDepth,
    },
    resolved.yawDeg,
  );
}
