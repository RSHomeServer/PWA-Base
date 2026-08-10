import Matter from "matter-js";

export type CreateSongaraMatterEngineOptions = {
  /** Matter.Engine.create options (gravity, enableSleeping, …). */
  options?: Matter.IEngineDefinition;
};

/**
 * Creates a Matter.js engine with Songara defaults (gentle downward gravity).
 * Bodies/composites stay app-owned.
 */
export function createSongaraMatterEngine(
  options: CreateSongaraMatterEngineOptions = {},
): Matter.Engine {
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1, scale: 0.001 },
    ...options.options,
  });
  return engine;
}
