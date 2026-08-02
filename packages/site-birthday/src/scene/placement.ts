/**
 * Single placement engine.
 *
 * Every world position (artwork, overlay, bounds, future DnD) MUST come from here.
 * There is no second path.
 */
import { footprintCorners as isoFootprintCorners } from "./iso.js";
import type {
  OccupiedCells,
  PlacementSurface,
  PropInstance,
  SceneBlueprint,
  SurfacePlane,
  Vec3,
} from "./types.js";

export type ResolvedSurface = {
  id: string;
  surface: PlacementSurface;
  /** World position of cell (0,0) corner. */
  worldOrigin: Vec3;
  yawDeg: number;
  plane: SurfacePlane;
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
};

export type ResolvedProp = {
  prop: PropInstance;
  surface: ResolvedSurface;
  /** Centre of occupied cells on the surface — artwork origin. */
  worldOrigin: Vec3;
  yawDeg: number;
  footprintWidth: number;
  footprintDepth: number;
  occupiedCells: OccupiedCells;
  /** World-space corners of the full occupied footprint (4). */
  footprintCorners: Vec3[];
  /** World-space corners per occupied cell. */
  cellQuads: Vec3[][];
};

export type ResolvedAnchor = {
  id: string;
  surfaceId: string;
  worldOrigin: Vec3;
  cells: OccupiedCells;
};

export type ScenePlacement = {
  surfaces: readonly ResolvedSurface[];
  surfaceById: ReadonlyMap<string, ResolvedSurface>;
  props: readonly ResolvedProp[];
  anchors: readonly ResolvedAnchor[];
};

function rotateYaw(yawDeg: number, local: Vec3): Vec3 {
  const rad = (yawDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: local.x * cos - local.z * sin,
    y: local.y,
    z: local.x * sin + local.z * cos,
  };
}

/** Map surface-local (u,v) on the surface plane into a parent-local offset. */
export function localUvToOffset(
  plane: SurfacePlane,
  u: number,
  v: number,
  yawDeg: number,
): Vec3 {
  if (plane === "xz") {
    return rotateYaw(yawDeg, { x: u, y: 0, z: v });
  }
  if (plane === "zy") {
    // Wall facing +X: u along +Z, v along +Y (yaw ignored — plane-fixed).
    return { x: 0, y: v, z: u };
  }
  // xy — wall facing +Z: u along +X, v along +Y
  return { x: u, y: v, z: 0 };
}

export function addVec(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function surfaceGridSize(surface: PlacementSurface): {
  cols: number;
  rows: number;
} {
  return {
    cols: Math.max(1, Math.floor(surface.dimensions.width / surface.cellWidth)),
    rows: Math.max(1, Math.floor(surface.dimensions.depth / surface.cellHeight)),
  };
}

/** Local UV bounds of an occupied cell rect (min corner + size). */
export function occupiedLocalBounds(
  surface: PlacementSurface,
  cells: OccupiedCells,
): {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
  centerU: number;
  centerV: number;
  width: number;
  depth: number;
} {
  const u0 = cells.col * surface.cellWidth;
  const v0 = cells.row * surface.cellHeight;
  const width = cells.width * surface.cellWidth;
  const depth = cells.height * surface.cellHeight;
  const u1 = u0 + width;
  const v1 = v0 + depth;
  return {
    u0,
    v0,
    u1,
    v1,
    centerU: (u0 + u1) / 2,
    centerV: (v0 + v1) / 2,
    width,
    depth,
  };
}

/** World point for a surface-local (u,v). */
export function surfaceUvToWorld(
  resolved: ResolvedSurface,
  u: number,
  v: number,
): Vec3 {
  const offset = localUvToOffset(
    resolved.plane,
    u,
    v,
    resolved.yawDeg,
  );
  return addVec(resolved.worldOrigin, offset);
}

/** Four corners of a UV rectangle on a resolved surface. */
export function surfaceRectCorners(
  resolved: ResolvedSurface,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
): Vec3[] {
  return [
    surfaceUvToWorld(resolved, u0, v0),
    surfaceUvToWorld(resolved, u1, v0),
    surfaceUvToWorld(resolved, u1, v1),
    surfaceUvToWorld(resolved, u0, v1),
  ];
}

export function surfaceBoundsCorners(resolved: ResolvedSurface): Vec3[] {
  return surfaceRectCorners(
    resolved,
    0,
    0,
    resolved.surface.dimensions.width,
    resolved.surface.dimensions.depth,
  );
}

function resolveRootSurface(surface: PlacementSurface): ResolvedSurface {
  const { cols, rows } = surfaceGridSize(surface);
  return {
    id: surface.id,
    surface,
    worldOrigin: { ...surface.transform.origin },
    yawDeg: surface.transform.yawDeg,
    plane: surface.plane,
    cols,
    rows,
    cellWidth: surface.cellWidth,
    cellHeight: surface.cellHeight,
  };
}

function resolveAttachedSurface(
  surface: PlacementSurface,
  hostProp: ResolvedProp,
): ResolvedSurface {
  const { cols, rows } = surfaceGridSize(surface);
  // Offset is expressed in the host prop's local frame.
  const local = rotateYaw(hostProp.yawDeg, surface.transform.origin);
  const origin = addVec(hostProp.worldOrigin, local);
  return {
    id: surface.id,
    surface,
    worldOrigin: origin,
    yawDeg: hostProp.yawDeg + surface.transform.yawDeg,
    plane: surface.plane,
    cols,
    rows,
    cellWidth: surface.cellWidth,
    cellHeight: surface.cellHeight,
  };
}

export function resolvePropOnSurface(
  prop: PropInstance,
  surface: ResolvedSurface,
): ResolvedProp {
  const bounds = occupiedLocalBounds(surface.surface, prop.occupiedCells);
  const worldOrigin = surfaceUvToWorld(
    surface,
    bounds.centerU,
    bounds.centerV,
  );
  const yawDeg = surface.yawDeg + prop.orientation;
  const footprintCorners = surfaceRectCorners(
    surface,
    bounds.u0,
    bounds.v0,
    bounds.u1,
    bounds.v1,
  );

  const cellQuads: Vec3[][] = [];
  for (let r = 0; r < prop.occupiedCells.height; r += 1) {
    for (let c = 0; c < prop.occupiedCells.width; c += 1) {
      const col = prop.occupiedCells.col + c;
      const row = prop.occupiedCells.row + r;
      const u0 = col * surface.cellWidth;
      const v0 = row * surface.cellHeight;
      cellQuads.push(
        surfaceRectCorners(
          surface,
          u0,
          v0,
          u0 + surface.cellWidth,
          v0 + surface.cellHeight,
        ),
      );
    }
  }

  return {
    prop,
    surface,
    worldOrigin,
    yawDeg,
    footprintWidth: bounds.width * prop.scale,
    footprintDepth: bounds.depth * prop.scale,
    occupiedCells: prop.occupiedCells,
    footprintCorners,
    cellQuads,
  };
}

/**
 * Resolve the entire scene into world placements.
 * This is the only function renderer and overlay may use for positions.
 */
export function resolveScenePlacement(scene: SceneBlueprint): ScenePlacement {
  const byId = new Map(scene.surfaces.map((s) => [s.id, s]));
  const resolvedSurfaces = new Map<string, ResolvedSurface>();
  const resolvedProps: ResolvedProp[] = [];
  const resolvedPropById = new Map<string, ResolvedProp>();

  // Pass 1: root surfaces (not attached to props)
  for (const surface of scene.surfaces) {
    if (surface.transform.attachToPropId) continue;
    resolvedSurfaces.set(surface.id, resolveRootSurface(surface));
  }

  // Pass 2: props on currently resolved surfaces, then unlock hosted surfaces
  const pending = [...scene.props];
  let guard = 0;
  while (pending.length > 0 && guard < scene.props.length + 4) {
    guard += 1;
    let progressed = false;
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const prop = pending[i]!;
      const surface = resolvedSurfaces.get(prop.parentSurface);
      if (!surface) continue;
      const resolved = resolvePropOnSurface(prop, surface);
      resolvedProps.push(resolved);
      resolvedPropById.set(prop.id, resolved);
      pending.splice(i, 1);
      progressed = true;

      if (prop.hostedSurfaceId) {
        const hosted = byId.get(prop.hostedSurfaceId);
        if (hosted?.transform.attachToPropId === prop.id) {
          resolvedSurfaces.set(
            hosted.id,
            resolveAttachedSurface(hosted, resolved),
          );
        }
      }
    }
    if (!progressed) break;
  }

  if (pending.length > 0) {
    const ids = pending.map((p) => p.id).join(", ");
    throw new Error(
      `Placement unresolved for props (missing parent surface): ${ids}`,
    );
  }

  // Any attachToProp surfaces not yet resolved (hostedSurfaceId omitted)
  for (const surface of scene.surfaces) {
    if (!surface.transform.attachToPropId) continue;
    if (resolvedSurfaces.has(surface.id)) continue;
    const host = resolvedPropById.get(surface.transform.attachToPropId);
    if (!host) {
      throw new Error(
        `Surface "${surface.id}" attachToProp "${surface.transform.attachToPropId}" not found`,
      );
    }
    resolvedSurfaces.set(surface.id, resolveAttachedSurface(surface, host));
  }

  // Props that were waiting on late surfaces (should be empty after loop)
  for (const prop of scene.props) {
    if (resolvedPropById.has(prop.id)) continue;
    const surface = resolvedSurfaces.get(prop.parentSurface);
    if (!surface) {
      throw new Error(`Prop "${prop.id}" parent surface missing`);
    }
    const resolved = resolvePropOnSurface(prop, surface);
    resolvedProps.push(resolved);
    resolvedPropById.set(prop.id, resolved);
  }

  const anchors: ResolvedAnchor[] = (
    Object.entries(scene.anchors) as Array<
      [string, { surfaceId: string; cells: OccupiedCells }]
    >
  ).map(([id, def]) => {
    const surface = resolvedSurfaces.get(def.surfaceId);
    if (!surface) {
      throw new Error(`Anchor "${id}" surface "${def.surfaceId}" missing`);
    }
    const bounds = occupiedLocalBounds(surface.surface, def.cells);
    return {
      id,
      surfaceId: def.surfaceId,
      worldOrigin: surfaceUvToWorld(surface, bounds.centerU, bounds.centerV),
      cells: def.cells,
    };
  });

  // Stable paint order: depth key
  resolvedProps.sort((a, b) => {
    const da = a.worldOrigin.x + a.worldOrigin.z * 10 + a.worldOrigin.y;
    const db = b.worldOrigin.x + b.worldOrigin.z * 10 + b.worldOrigin.y;
    return da - db;
  });

  return {
    surfaces: [...resolvedSurfaces.values()],
    surfaceById: resolvedSurfaces,
    props: resolvedProps,
    anchors,
  };
}

/** Iso footprint helper using the same corners the overlay draws. */
export function resolvedFootprintIsoCorners(prop: ResolvedProp): Vec3[] {
  if (prop.footprintCorners.length === 4) return prop.footprintCorners;
  return isoFootprintCorners(
    prop.worldOrigin,
    { width: prop.footprintWidth, depth: prop.footprintDepth },
    prop.yawDeg,
  );
}
