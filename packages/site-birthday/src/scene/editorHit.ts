/**
 * Screen hit-testing for the placement editor.
 * Uses projected cell centres / footprints from resolveScenePlacement only.
 */
import { projectIso, projectPoly, type Point2 } from "./iso.js";
import {
  surfaceUvToWorld,
  type ResolvedProp,
  type ResolvedSurface,
  type ScenePlacement,
} from "./placement.js";
import { cellCenterWorld } from "./placementValidation.js";

export function pointInPolygon(point: Point2, polygon: readonly Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    const intersect =
      pi.y > point.y !== pj.y > point.y &&
      point.x <
        ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y + Number.EPSILON) +
          pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pickPropAtScreen(
  placement: ScenePlacement,
  screen: Point2,
  offset: Point2,
): ResolvedProp | null {
  // Front-most first (paint order is back→front).
  for (let i = placement.props.length - 1; i >= 0; i -= 1) {
    const resolved = placement.props[i]!;
    const poly = projectPoly(resolved.footprintCorners).map((p) => ({
      x: p.x - offset.x,
      y: p.y - offset.y,
    }));
    if (pointInPolygon(screen, poly)) return resolved;
  }
  return null;
}

export function nearestCellOnSurface(
  surface: ResolvedSurface,
  screen: Point2,
  offset: Point2,
): { col: number; row: number; dist: number } | null {
  let best: { col: number; row: number; dist: number } | null = null;
  for (let row = 0; row < surface.rows; row += 1) {
    for (let col = 0; col < surface.cols; col += 1) {
      const { u, v } = cellCenterWorld(surface, col, row);
      const world = surfaceUvToWorld(surface, u, v);
      const p = projectIso(world.x, world.y, world.z);
      const dx = p.x - offset.x - screen.x;
      const dy = p.y - offset.y - screen.y;
      const dist = dx * dx + dy * dy;
      if (!best || dist < best.dist) best = { col, row, dist };
    }
  }
  return best;
}

export function pickSurfaceAtScreen(
  surfaces: readonly ResolvedSurface[],
  screen: Point2,
  offset: Point2,
): ResolvedSurface | null {
  let best: { surface: ResolvedSurface; dist: number } | null = null;
  for (const surface of surfaces) {
    const hit = nearestCellOnSurface(surface, screen, offset);
    if (!hit) continue;
    // Prefer surfaces whose nearest cell is reasonably close in screen space.
    if (!best || hit.dist < best.dist) {
      best = { surface, dist: hit.dist };
    }
  }
  return best?.surface ?? null;
}
