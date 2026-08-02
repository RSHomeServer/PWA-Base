/**
 * Armillary — wood base disk, vertical post, 4 brass rings, central star.
 * Readability comes from params.scale / ARMILLARY sizes — not extra detail.
 */
import type { ArmillaryParams } from "./params.js";
import {
  framePoint,
  type AssetGeometry,
  type GeomPrimitive,
  type LocalFrame,
} from "./primitives.js";

const RING_TILTS: ReadonlyArray<{ yaw: number; tilt: number }> = [
  { yaw: 0, tilt: 8 },
  { yaw: 0, tilt: 90 },
  { yaw: 55, tilt: 48 },
  { yaw: -40, tilt: 62 },
];

export function buildArmillaryGeometry(
  frame: LocalFrame,
  params: ArmillaryParams,
): AssetGeometry {
  const baseH = params.baseHeight;
  const postH = params.postHeight;
  const ringR = params.ringRadius;
  const ringCenterLocal = {
    x: 0,
    y: baseH + postH + ringR * params.ringLift,
    z: 0,
  };
  const ringCenter = framePoint(frame, ringCenterLocal);

  const base: GeomPrimitive = {
    kind: "disk",
    id: "base",
    label: "Wood base",
    center: framePoint(frame, { x: 0, y: 0, z: 0 }),
    radius: params.baseRadius,
    height: baseH,
    yawDeg: frame.yawDeg,
    sides: params.baseSides,
  };

  const post: GeomPrimitive = {
    kind: "disk",
    id: "post",
    label: "Vertical support",
    center: framePoint(frame, { x: 0, y: baseH, z: 0 }),
    radius: params.postRadius,
    height: postH,
    yawDeg: frame.yawDeg,
    sides: params.postSides,
  };

  const rings: GeomPrimitive[] = RING_TILTS.slice(0, params.ringCount).map(
    (spec, i) => ({
      kind: "ring" as const,
      id: `ring-${i + 1}`,
      label: `Brass ring ${i + 1}`,
      center: ringCenter,
      radius: ringR * (1 - i * 0.03),
      yawDeg: frame.yawDeg + spec.yaw,
      tiltDeg: spec.tilt,
      stroke: params.ringStroke,
      segments: 36,
    }),
  );

  const glow: GeomPrimitive = {
    kind: "sphere",
    id: "star-glow",
    label: "Star glow",
    center: ringCenter,
    radius: params.starGlowRadius,
    role: "glow",
  };
  const core: GeomPrimitive = {
    kind: "sphere",
    id: "star-core",
    label: "Star core",
    center: ringCenter,
    radius: params.starOuterRadius,
    role: "core",
  };
  const star: GeomPrimitive = {
    kind: "sphere",
    id: "star",
    label: "Glowing star",
    center: ringCenter,
    radius: params.starCoreRadius,
    role: "star",
  };

  return {
    assetId: "keepsake.armillary-sphere",
    displayName: "Armillary Sphere",
    primitives: [base, post, ...rings, glow, core, star],
  };
}
