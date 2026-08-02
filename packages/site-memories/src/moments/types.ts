import type findUsConfig from "./find-us.config.json";
import type {
  ConstellationDefinition,
  ConstellationInstance,
  ConstellationObject,
} from "./constellation/types.js";

export type MomentConfig = typeof findUsConfig;

export { default as findUsConfig } from "./find-us.config.json";
export type { ConstellationDefinition, ConstellationInstance, ConstellationObject };
export {
  resolveConstellation,
  resolveInstance,
  type ResolvedConstellation,
} from "./constellation/index.js";
