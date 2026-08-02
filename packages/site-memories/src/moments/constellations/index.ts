import type {
  ConstellationDefinition,
  ConstellationInstance,
} from "../constellation/types.js";
import {
  defaultInstanceTransform,
  resolveConstellation,
  type ResolvedConstellation,
} from "../constellation/index.js";
import leo from "./leo.json";

const catalog: Record<string, ConstellationDefinition> = {
  leo: leo as unknown as ConstellationDefinition,
};

export function getConstellation(id: string): ConstellationDefinition {
  const found = catalog[id];
  if (!found) {
    throw new Error(`Unknown constellation id: ${id}`);
  }
  return found;
}

/** Deep clone of a catalog definition (safe for editor drafts). */
export function cloneConstellation(id: string): ConstellationDefinition {
  return structuredClone(getConstellation(id));
}

export function listConstellationIds(): string[] {
  return Object.keys(catalog);
}

export function loadConstellations(ids: string[]): ConstellationDefinition[] {
  return ids.map((id) => getConstellation(id));
}

/** Create a placed instance with identity transform (centre = definition origin). */
export function createInstance(definitionId: string): ConstellationInstance {
  const definition = getConstellation(definitionId);
  return {
    definitionId,
    transform: defaultInstanceTransform(definition.origin),
  };
}

export function resolvePlacedInstances(
  instances: ConstellationInstance[],
): ResolvedConstellation[] {
  return instances.map((inst) =>
    resolveConstellation(getConstellation(inst.definitionId), inst.transform),
  );
}

export { leo };
