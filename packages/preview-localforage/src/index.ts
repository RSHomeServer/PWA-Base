/**
 * Preview: thin localForage integration.
 * Public import: `@songara/pwa-base/preview/localforage`
 *
 * Intended Stable home: `@songara/pwa-base/storage` alongside Dexie/idb Previews.
 * Do not fold into Content Pack `packStore`.
 */

export { default as localforage } from "localforage";

export { songaraDbName } from "./songaraDbName.js";
export { createSongaraLocalforage } from "./createSongaraLocalforage.js";
export type { CreateSongaraLocalforageOptions } from "./createSongaraLocalforage.js";
