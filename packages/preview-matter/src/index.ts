/**
 * Preview: thin Matter.js integration.
 * Public import: `@songara/pwa-base/preview/matter`
 *
 * Intended Stable home: dedicated physics-engine kit; keep `/physics` SoA engine separate.
 */

export { default as Matter } from "matter-js";

export { createSongaraMatterEngine } from "./createSongaraMatterEngine.js";
export type { CreateSongaraMatterEngineOptions } from "./createSongaraMatterEngine.js";
export { resolveMatterRunner } from "./resolveMatterRunner.js";
export type { ResolvedMatterRunner } from "./resolveMatterRunner.js";
export { songaraFixedStepSeconds } from "./songaraFixedStepSeconds.js";
