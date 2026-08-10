import * as planck from "planck";

export type SongaraPlanckVec2 = { x: number; y: number };

export type CreateSongaraPlanckWorldOptions = {
  gravity?: SongaraPlanckVec2;
};

/**
 * Creates a Planck.js World with Songara gravity default.
 * Fixtures/bodies stay app-owned.
 */
export function createSongaraPlanckWorld(
  options: CreateSongaraPlanckWorldOptions = {},
): planck.World {
  const g = options.gravity ?? { x: 0, y: -10 };
  return new planck.World(planck.Vec2(g.x, g.y));
}
