import type { Size3, Vec3 } from "./types.js";

/** World units → screen pixels at camera zoom = 1 (before fit-scale). */
export const ISO_UNIT = 28;

/** Classic 30° isometric projection (no perspective). */
export function projectIso(x: number, y: number, z: number, unit = ISO_UNIT) {
  const isoX = (x - z) * unit * Math.cos(Math.PI / 6);
  const isoY = (x + z) * unit * Math.sin(Math.PI / 6) - y * unit;
  return { x: isoX, y: isoY };
}

export type Point2 = { x: number; y: number };

/** Axis-aligned or yawed rectangle corners on a horizontal plane. */
export function footprintCorners(
  center: Vec3,
  size: Pick<Size3, "width" | "depth">,
  yawDeg: number,
): Vec3[] {
  const hw = size.width / 2;
  const hd = size.depth / 2;
  const rad = (yawDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const locals: Array<[number, number]> = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  return locals.map(([lx, lz]) => ({
    x: center.x + lx * cos - lz * sin,
    y: center.y,
    z: center.z + lx * sin + lz * cos,
  }));
}

export function projectPoly(
  corners: readonly Vec3[],
  unit = ISO_UNIT,
): Point2[] {
  return corners.map((c) => projectIso(c.x, c.y, c.z, unit));
}

export function polyPoints(
  points: readonly Point2[],
  offset: Point2,
): string {
  return points.map((p) => `${p.x - offset.x},${p.y - offset.y}`).join(" ");
}

/** Bounding box of projected room shell (walls + floor). */
export function roomProjectedBounds(
  width: number,
  depth: number,
  wallHeight: number,
  unit = ISO_UNIT,
  pad = 48,
) {
  const pts = [
    projectIso(0, 0, 0, unit),
    projectIso(width, 0, 0, unit),
    projectIso(width, 0, depth, unit),
    projectIso(0, 0, depth, unit),
    projectIso(0, wallHeight, 0, unit),
    projectIso(width, wallHeight, 0, unit),
    projectIso(0, wallHeight, depth, unit),
  ];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  return {
    minX,
    maxX,
    minY,
    maxY,
    w: maxX - minX,
    h: maxY - minY,
  };
}
