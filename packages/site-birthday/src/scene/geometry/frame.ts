import { footprintCorners } from "../iso.js";
import type { ResolvedProp } from "../placement.js";
import type { LocalFrame } from "./primitives.js";

/** Local frame centred on the occupied footprint (floor contact). */
export function frameFromResolved(resolved: ResolvedProp): LocalFrame {
  const corners = footprintCorners(
    resolved.worldOrigin,
    {
      width: resolved.footprintWidth,
      depth: resolved.footprintDepth,
    },
    resolved.yawDeg,
  );
  const cx =
    (corners[0]!.x + corners[1]!.x + corners[2]!.x + corners[3]!.x) / 4;
  const cz =
    (corners[0]!.z + corners[1]!.z + corners[2]!.z + corners[3]!.z) / 4;
  return {
    origin: { x: cx, y: resolved.worldOrigin.y, z: cz },
    yawDeg: resolved.yawDeg,
    scale: resolved.prop.scale,
  };
}
