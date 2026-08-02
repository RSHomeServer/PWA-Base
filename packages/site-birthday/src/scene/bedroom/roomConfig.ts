/**
 * Bedroom room proportions — mirrors geometry/params ROOM defaults.
 */
import { ROOM } from "../geometry/params.js";

export const BEDROOM_ROOM = {
  /** Floor X span (back-wall run) = authoring length. */
  roomLength: ROOM.length,
  /** Floor Z span = authoring width. */
  depth: ROOM.width,
  wallHeight: ROOM.wallHeight,
} as const;
