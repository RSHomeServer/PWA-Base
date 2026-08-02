import type {
  ConstellationDefinition,
  ConstellationInstance,
  ConstellationTransform,
  StarSpecialEffect,
} from "../constellation/types.js";
import {
  cloneConstellation,
  createInstance,
} from "../constellations/index.js";

export type AlignmentDisplayOptions = {
  showArtwork: boolean;
  showVertices: boolean;
  showStarNames: boolean;
  showVertexUids: boolean;
  showGraphEdges: boolean;
  showDrawOrder: boolean;
  showArtworkCentre: boolean;
  showConstellationCentre: boolean;
  showBoundingBoxes: boolean;
};

export const DEFAULT_DISPLAY_OPTIONS: AlignmentDisplayOptions = {
  showArtwork: true,
  showVertices: true,
  showStarNames: false,
  showVertexUids: true,
  showGraphEdges: true,
  showDrawOrder: false,
  showArtworkCentre: true,
  showConstellationCentre: true,
  showBoundingBoxes: true,
};

/**
 * Editor row: one placed instance + an editable definition draft.
 * Multiple rows may share the same definition id with independent transforms.
 */
export type AlignmentInstance = {
  /** Stable editor instance id (not constellation definition id). */
  instanceId: string;
  collapsed: boolean;
  instance: ConstellationInstance;
  /** Editable definition draft for this row (geometry / artwork / colours). */
  definition: ConstellationDefinition;
};

export type ArtworkOption = {
  id: string;
  label: string;
  image: string;
};

/** Known artwork assets per constellation (extend as assets are added). */
export const ARTWORK_CATALOG: Record<string, ArtworkOption[]> = {
  leo: [
    {
      id: "leo-atlas",
      label: "Leo atlas",
      image: "/moments/find-us/leo-atlas.png",
    },
  ],
};

export function artworkOptionsFor(constellationId: string): ArtworkOption[] {
  const specific = ARTWORK_CATALOG[constellationId] ?? [];
  const all = Object.values(ARTWORK_CATALOG).flat();
  const seen = new Set<string>();
  const merged: ArtworkOption[] = [];
  for (const opt of [...specific, ...all]) {
    if (seen.has(opt.image)) continue;
    seen.add(opt.image);
    merged.push(opt);
  }
  return merged;
}

export function newInstanceId(): string {
  return `inst-${Math.random().toString(36).slice(2, 9)}`;
}

/** Spawn a new editor instance from a catalog definition. */
export function createAlignmentInstance(
  definitionId: string,
): AlignmentInstance {
  return {
    instanceId: newInstanceId(),
    collapsed: false,
    instance: createInstance(definitionId),
    definition: cloneConstellation(definitionId),
  };
}

/** Unique undirected edges from consecutive drawOrder pairs. */
export function deriveGraphEdgesFromDrawOrder(
  drawOrder: string[],
): [string, string][] {
  const keys = new Set<string>();
  const edges: [string, string][] = [];
  for (let i = 0; i < drawOrder.length - 1; i++) {
    const a = drawOrder[i]!;
    const b = drawOrder[i + 1]!;
    if (a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (keys.has(key)) continue;
    keys.add(key);
    edges.push([a, b]);
  }
  return edges;
}

/** Pasteable export: definition geometry + instance placement. */
export type AlignmentExportPayload = {
  definition: ConstellationDefinition;
  instance: ConstellationInstance;
};

export function exportAlignmentConfig(
  definition: ConstellationDefinition,
  instance: ConstellationInstance,
): AlignmentExportPayload {
  return {
    definition: structuredClone(definition),
    instance: structuredClone(instance),
  };
}

export function patchInstanceTransform(
  instance: ConstellationInstance,
  partial: {
    centre?: Partial<ConstellationTransform["centre"]>;
    rotationDeg?: number;
    scale?: number;
  },
): ConstellationInstance {
  return {
    ...instance,
    transform: {
      centre: {
        x: partial.centre?.x ?? instance.transform.centre.x,
        y: partial.centre?.y ?? instance.transform.centre.y,
      },
      rotationDeg: partial.rotationDeg ?? instance.transform.rotationDeg,
      scale: partial.scale ?? instance.transform.scale,
    },
  };
}

export function formatEffects(effects: StarSpecialEffect[]): string {
  return effects.join(", ");
}

export function parseEffects(raw: string): StarSpecialEffect[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as StarSpecialEffect[];
}
