/**
 * Preview: thin idb integration.
 * Public import: `@songara/pwa-base/preview/idb`
 *
 * Intended Stable home: `@songara/pwa-base/storage` (with Dexie Preview graduation).
 * Do not fold into Content Pack `packStore`.
 */

export {
  openDB,
  deleteDB,
  unwrap,
  wrap,
} from "idb";
export type { DBSchema, IDBPDatabase, IDBPTransaction, OpenDBCallbacks } from "idb";

export { songaraDbName } from "./songaraDbName.js";
export { openSongaraDb } from "./openSongaraDb.js";
export type { OpenSongaraDbOptions } from "./openSongaraDb.js";
