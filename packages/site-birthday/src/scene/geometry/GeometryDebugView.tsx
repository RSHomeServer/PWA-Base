/**
 * Geometry debugger — every asset as labeled primitives (exploded, not composed).
 */
import type { Point2 } from "../iso.js";
import type { ResolvedProp } from "../placement.js";
import type { SceneAuthoringParams } from "./params.js";
import { RenderPrimitive } from "./renderPrimitives.js";
import {
  explodeGeometry,
  geometryForResolved,
  wardrobeExplodedDiagram,
} from "./geometryDebug.js";

export function GeometryDebugLayer({
  props,
  authoring,
  offset,
  focusAssetId,
}: {
  props: readonly ResolvedProp[];
  authoring: SceneAuthoringParams;
  offset: Point2;
  focusAssetId: string | null;
}) {
  const targets = focusAssetId
    ? props.filter(
        (p) =>
          p.prop.assetId === focusAssetId || p.prop.id === focusAssetId,
      )
    : props;

  const extra = [];
  if (focusAssetId === "prop.wardrobe" && targets.length === 0) {
    extra.push(wardrobeExplodedDiagram(authoring));
  }

  const geoms = [
    ...targets.map((r) => geometryForResolved(r, authoring)),
    ...extra,
  ];

  return (
    <g data-layer="geometry-debug">
      {geoms.map((geom, gi) => {
        const exploded = explodeGeometry(geom, 1.5);
        return (
          <g
            key={`${geom.assetId}-${gi}`}
            data-geometry-asset={geom.assetId}
          >
            {exploded.map((primitive) => (
              <RenderPrimitive
                key={`${geom.assetId}-${primitive.id}`}
                primitive={primitive}
                offset={offset}
                label
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
