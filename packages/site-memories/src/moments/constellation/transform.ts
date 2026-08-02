import type {
  ConstellationArtwork,
  ConstellationDefinition,
  ConstellationInstance,
  ConstellationTransform,
  ConstellationVertex,
  ResolvedArtwork,
  ResolvedConstellation,
  ResolvedVertex,
  Vec2,
} from "./types.js";

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Default instance transform: place definition origin at itself (identity). */
export function defaultInstanceTransform(
  origin: Vec2,
): ConstellationTransform {
  return {
    centre: { x: origin.x, y: origin.y },
    rotationDeg: 0,
    scale: 1,
  };
}

/**
 * Place a definition-local point into stage space.
 * Relative to `origin`, then scale/rotate, then translate to `transform.centre`.
 * Identity (centre === origin, scale 1, rotation 0) leaves local positions unchanged.
 */
export function applyTransform(
  point: Vec2,
  origin: Vec2,
  transform: ConstellationTransform,
): Vec2 {
  const dx = (point.x - origin.x) * transform.scale;
  const dy = (point.y - origin.y) * transform.scale;
  if (transform.rotationDeg === 0) {
    return { x: transform.centre.x + dx, y: transform.centre.y + dy };
  }
  const θ = degToRad(transform.rotationDeg);
  const cos = Math.cos(θ);
  const sin = Math.sin(θ);
  return {
    x: transform.centre.x + dx * cos - dy * sin,
    y: transform.centre.y + dx * sin + dy * cos,
  };
}

export function resolveVertex(
  vertex: ConstellationVertex,
  origin: Vec2,
  transform: ConstellationTransform,
): ResolvedVertex {
  const world = applyTransform(
    { x: vertex.xPosition, y: vertex.yPosition },
    origin,
    transform,
  );
  return { ...vertex, x: world.x, y: world.y };
}

export function resolveArtwork(
  artwork: ConstellationArtwork,
  origin: Vec2,
  transform: ConstellationTransform,
): ResolvedArtwork {
  const width = artwork.baseWidth * artwork.scale * transform.scale;
  const height = artwork.baseHeight * artwork.scale * transform.scale;
  const worldCentre = applyTransform(artwork.centre, origin, transform);
  return {
    image: artwork.image,
    x: worldCentre.x - width / 2,
    y: worldCentre.y - height / 2,
    width,
    height,
    rotationDeg: artwork.rotationDeg + transform.rotationDeg,
    opacity: artwork.opacity,
    fit: artwork.fit,
    attribution: artwork.attribution,
  };
}

export function activationOrderFromDrawOrder(drawOrder: string[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const uid of drawOrder) {
    if (seen.has(uid)) continue;
    seen.add(uid);
    order.push(uid);
  }
  return order;
}

export function drawSegmentsFromOrder(drawOrder: string[]): [string, string][] {
  const segments: [string, string][] = [];
  for (let i = 0; i < drawOrder.length - 1; i++) {
    const a = drawOrder[i]!;
    const b = drawOrder[i + 1]!;
    if (a === b) continue;
    segments.push([a, b]);
  }
  return segments;
}

/**
 * Resolve a definition with an instance placement transform.
 * Omitting transform uses identity placement (centre = origin).
 */
export function resolveConstellation(
  definition: ConstellationDefinition,
  instanceTransform?: ConstellationTransform,
): ResolvedConstellation {
  const { origin } = definition;
  const transform =
    instanceTransform ?? defaultInstanceTransform(origin);
  return {
    id: definition.id,
    displayName: definition.displayName,
    palette: definition.palette,
    vertices: definition.vertices.map((v) =>
      resolveVertex(v, origin, transform),
    ),
    graphEdges: definition.graphEdges,
    drawSegments: drawSegmentsFromOrder(definition.drawOrder),
    activationOrder: activationOrderFromDrawOrder(definition.drawOrder),
    artwork: definition.artwork
      ? resolveArtwork(definition.artwork, origin, transform)
      : null,
    fragments: definition.fragments,
    instanceCentre: { x: transform.centre.x, y: transform.centre.y },
  };
}

/** Resolve a placed instance against its definition. */
export function resolveInstance(
  instance: ConstellationInstance,
  definition: ConstellationDefinition,
): ResolvedConstellation {
  if (instance.definitionId !== definition.id) {
    throw new Error(
      `Instance definitionId "${instance.definitionId}" does not match definition "${definition.id}"`,
    );
  }
  return resolveConstellation(definition, instance.transform);
}

export function vertexIndexByUid(
  constellation: ResolvedConstellation,
  uid: string,
): number {
  return constellation.vertices.findIndex((v) => v.uid === uid);
}

export function undirectedEdgeKey(a: string, b: string): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}
