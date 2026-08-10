/**
 * Preview: thin Howler.js SFX façade.
 * Public import: `@songara/pwa-base/preview/howler`
 *
 * Does **not** replace Stable `@songara/pwa-base/audio` (`AudioEngineProvider`).
 * Intended Stable home: optional SFX helper beside `/audio`, or remain Preview.
 */

export { Howl, Howler } from "howler";
export type { HowlOptions } from "howler";

export { createSongaraSfx } from "./createSongaraSfx.js";
export type { CreateSongaraSfxOptions } from "./createSongaraSfx.js";
