import RAPIER from "@dimforge/rapier2d-compat";

export type SongaraRapierGravity = { x: number; y: number };

export type CreateSongaraRapierWorldOptions = {
  /** World gravity (Rapier units). Default Earth-like downward. */
  gravity?: SongaraRapierGravity;
};

let initPromise: Promise<void> | null = null;

/**
 * Ensures the Rapier WASM module is initialised (idempotent).
 * Call once before creating worlds; safe to await from multiple callers.
 */
export async function initSongaraRapier(): Promise<typeof RAPIER> {
  if (!initPromise) {
    initPromise = RAPIER.init();
  }
  await initPromise;
  return RAPIER;
}

/**
 * Creates a Rapier2D world after WASM init. Scenes/bodies stay app-owned.
 * Keep `@platform/physics` separate — this Preview is engine bootstrap only.
 */
export async function createSongaraRapierWorld(
  options: CreateSongaraRapierWorldOptions = {},
): Promise<{ RAPIER: typeof RAPIER; world: RAPIER.World }> {
  const api = await initSongaraRapier();
  const gravity = options.gravity ?? { x: 0, y: -9.81 };
  const world = new api.World(gravity);
  return { RAPIER: api, world };
}
