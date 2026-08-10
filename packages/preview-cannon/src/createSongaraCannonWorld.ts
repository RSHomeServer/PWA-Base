import { World, Vec3 } from "cannon-es";

export type SongaraCannonGravity = { x: number; y: number; z: number };

export type CreateSongaraCannonWorldOptions = {
  gravity?: SongaraCannonGravity;
};

/**
 * Creates a cannon-es World with Songara gravity default (Y-up, Earth-like).
 * Bodies/shapes stay app-owned.
 */
export function createSongaraCannonWorld(
  options: CreateSongaraCannonWorldOptions = {},
): World {
  const g = options.gravity ?? { x: 0, y: -9.82, z: 0 };
  const world = new World();
  world.gravity.set(g.x, g.y, g.z);
  return world;
}

export { Vec3 };
