/**
 * Wardrobe geometry — ONLY: Body, Door L, Door R, Handle L, Handle R, Plinth.
 * Doors are cuboids on the FRONT face (+Z local), never a side face.
 */
import type { WardrobeParams } from "./params.js";
import {
  framePoint,
  type AssetGeometry,
  type GeomPrimitive,
  type LocalFrame,
} from "./primitives.js";

function axisFromLocalZ(frame: LocalFrame): {
  x: number;
  y: number;
  z: number;
} {
  const tip = framePoint(frame, { x: 0, y: 0, z: 1 });
  const origin = framePoint(frame, { x: 0, y: 0, z: 0 });
  return {
    x: tip.x - origin.x,
    y: tip.y - origin.y,
    z: tip.z - origin.z,
  };
}

export function buildWardrobeGeometry(
  frame: LocalFrame,
  params: WardrobeParams,
): AssetGeometry {
  const W = params.width;
  const D = params.depth;
  const H = params.height;
  const plinthH = params.plinthHeight;
  const bodyH = H - plinthH;
  const frontAxis = axisFromLocalZ(frame);

  // Local: origin = footprint centre on floor; +Z = FRONT (into room).
  const plinth: GeomPrimitive = {
    kind: "cuboid",
    id: "plinth",
    label: "Plinth",
    center: framePoint(frame, { x: 0, y: plinthH / 2, z: 0 }),
    size: {
      width: W - params.plinthInset * 2,
      depth: D - params.plinthInset * 2,
      height: plinthH,
    },
    yawDeg: frame.yawDeg,
  };

  const body: GeomPrimitive = {
    kind: "cuboid",
    id: "body",
    label: "Body",
    center: framePoint(frame, { x: 0, y: plinthH + bodyH / 2, z: 0 }),
    size: { width: W, depth: D, height: bodyH },
    yawDeg: frame.yawDeg,
  };

  // Front face at local z = +D/2. Door cuboids sit on that face.
  const doorW = (W - params.doorMarginX * 2 - params.doorGap) / 2;
  const doorH = bodyH - params.doorMarginY * 2;
  const doorY = plinthH + params.doorMarginY + doorH / 2;
  const doorZ = D / 2 - params.doorRecess - params.doorThickness / 2;

  const doorL: GeomPrimitive = {
    kind: "cuboid",
    id: "door-l",
    label: "Door L",
    center: framePoint(frame, {
      x: -params.doorGap / 2 - doorW / 2,
      y: doorY,
      z: doorZ,
    }),
    size: {
      width: doorW,
      depth: params.doorThickness,
      height: doorH,
    },
    yawDeg: frame.yawDeg,
  };

  const doorR: GeomPrimitive = {
    kind: "cuboid",
    id: "door-r",
    label: "Door R",
    center: framePoint(frame, {
      x: params.doorGap / 2 + doorW / 2,
      y: doorY,
      z: doorZ,
    }),
    size: {
      width: doorW,
      depth: params.doorThickness,
      height: doorH,
    },
    yawDeg: frame.yawDeg,
  };

  const handleY = doorY - doorH / 2 + doorH * params.handleY;
  const handleXL = -params.doorGap / 2 - params.handleInsetX;
  const handleXR = params.doorGap / 2 + params.handleInsetX;
  const handleZ = D / 2 - params.doorRecess;

  const handleL: GeomPrimitive = {
    kind: "cylinder",
    id: "handle-l",
    label: "Handle L",
    base: framePoint(frame, { x: handleXL, y: handleY, z: handleZ }),
    axis: frontAxis,
    radius: params.handleRadius,
    height: params.handleLength,
    sides: 10,
  };

  const handleR: GeomPrimitive = {
    kind: "cylinder",
    id: "handle-r",
    label: "Handle R",
    base: framePoint(frame, { x: handleXR, y: handleY, z: handleZ }),
    axis: frontAxis,
    radius: params.handleRadius,
    height: params.handleLength,
    sides: 10,
  };

  return {
    assetId: "prop.wardrobe",
    displayName: "Wardrobe",
    primitives: [plinth, body, doorL, doorR, handleL, handleR],
  };
}
