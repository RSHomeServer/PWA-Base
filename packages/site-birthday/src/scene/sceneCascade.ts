/**
 * Cascade delete — remove a prop, hosted surfaces, and nested children.
 * Leaves no dangling attachToProp references.
 */
import type { PlacementSurface, PropInstance } from "./types.js";

export type CascadeDeleteResult = {
  props: PropInstance[];
  surfaces: PlacementSurface[];
  removedPropIds: string[];
  removedSurfaceIds: string[];
};

/**
 * Delete `rootPropId` and everything hosted under it (recursive).
 */
export function cascadeDeleteProp(
  props: readonly PropInstance[],
  surfaces: readonly PlacementSurface[],
  rootPropId: string,
): CascadeDeleteResult {
  const doomedProps = new Set<string>();
  const doomedSurfaces = new Set<string>();

  const doomProp = (id: string) => {
    if (doomedProps.has(id)) return;
    doomedProps.add(id);
    const prop = props.find((p) => p.id === id);

    for (const surface of surfaces) {
      const attached =
        surface.transform.attachToPropId === id ||
        (prop?.hostedSurfaceId != null && surface.id === prop.hostedSurfaceId);
      if (!attached) continue;
      doomedSurfaces.add(surface.id);
      for (const child of props) {
        if (child.parentSurface === surface.id) doomProp(child.id);
      }
    }
  };

  doomProp(rootPropId);

  // Surfaces whose host prop is gone (defensive sweep).
  for (const surface of surfaces) {
    const hostId = surface.transform.attachToPropId;
    if (!hostId) continue;
    if (doomedProps.has(hostId) || !props.some((p) => p.id === hostId)) {
      doomedSurfaces.add(surface.id);
      for (const child of props) {
        if (child.parentSurface === surface.id) doomProp(child.id);
      }
    }
  }

  return {
    props: props.filter((p) => !doomedProps.has(p.id)),
    surfaces: surfaces.filter((s) => !doomedSurfaces.has(s.id)),
    removedPropIds: [...doomedProps],
    removedSurfaceIds: [...doomedSurfaces],
  };
}
