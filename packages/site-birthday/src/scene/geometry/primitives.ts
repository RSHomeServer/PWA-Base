/**
 * Named constructive primitives for authorable furniture / keepsakes.
 * Geometry debug + scene renderers consume the same lists.
 */
import type { Vec3 } from "../types.js";

export type CuboidPrimitive = {
  kind: "cuboid";
  id: string;
  label: string;
  /** World-space centre of the cuboid. */
  center: Vec3;
  /** Full extents. */
  size: { width: number; depth: number; height: number };
  /** Yaw around Y (degrees). */
  yawDeg: number;
};

export type CylinderPrimitive = {
  kind: "cylinder";
  id: string;
  label: string;
  /** Axis start (world). */
  base: Vec3;
  /** Axis direction unit-ish; length = height. */
  axis: Vec3;
  radius: number;
  height: number;
  sides: number;
};

export type RingPrimitive = {
  kind: "ring";
  id: string;
  label: string;
  center: Vec3;
  radius: number;
  yawDeg: number;
  tiltDeg: number;
  stroke: number;
  segments: number;
};

export type SpherePrimitive = {
  kind: "sphere";
  id: string;
  label: string;
  center: Vec3;
  radius: number;
  role: "glow" | "core" | "star";
};

export type DiskPrimitive = {
  kind: "disk";
  id: string;
  label: string;
  center: Vec3;
  radius: number;
  height: number;
  yawDeg: number;
  sides: number;
};

export type GeomPrimitive =
  | CuboidPrimitive
  | CylinderPrimitive
  | RingPrimitive
  | SpherePrimitive
  | DiskPrimitive;

export type AssetGeometry = {
  assetId: string;
  displayName: string;
  primitives: GeomPrimitive[];
};

/** Local +X right, +Y up, +Z forward (front face). */
export type LocalFrame = {
  origin: Vec3;
  yawDeg: number;
  scale: number;
};

export function yawRotate(local: Vec3, yawDeg: number): Vec3 {
  const r = (yawDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return {
    x: local.x * c - local.z * s,
    y: local.y,
    z: local.x * s + local.z * c,
  };
}

export function framePoint(frame: LocalFrame, local: Vec3): Vec3 {
  const scaled = {
    x: local.x * frame.scale,
    y: local.y * frame.scale,
    z: local.z * frame.scale,
  };
  const rotated = yawRotate(scaled, frame.yawDeg);
  return {
    x: frame.origin.x + rotated.x,
    y: frame.origin.y + rotated.y,
    z: frame.origin.z + rotated.z,
  };
}
