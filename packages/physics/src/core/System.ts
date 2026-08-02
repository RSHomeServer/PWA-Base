import type { World } from "./World.js";

/**
 * A `System` encapsulates one slice of simulation behavior (integration, forces,
 * constraints, rendering-adjacent bookkeeping, etc). Systems are the sole extension
 * point of the engine: new simulations (slime mould, cloth, fluid, ...) are built by
 * composing systems, never by modifying `World` itself.
 */
export interface System {
  /** Stable, unique identifier used for lookups, profiling, and error messages. */
  readonly id: string;
  /** Lower runs first. Systems with equal priority run in insertion order. Defaults to 0. */
  priority?: number;
  /** Called once when the system is added to a world, before any `step`. */
  init?(world: World): void;
  /** Called when `world.reset()` runs. Should restore the system to its initial state. */
  reset?(world: World): void;
  /** Called once per fixed timestep with the (already scaled) delta time in seconds. */
  step(world: World, dt: number): void;
}
