/**
 * Preview: thin Dexie core integration.
 * Public import: `@songara/pwa-base/preview/dexie`
 *
 * API may evolve. Intended Stable home when graduated:
 * a dedicated `@songara/pwa-base/storage` (or offline) kit — not Content Pack
 * `packStore`, which stays a runtime Cache/IDB implementation detail.
 */

// Re-export Dexie core (OSS-shaped surface). No Cloud / commercial plugins.
export { default as Dexie } from "dexie";
export type {
  EntityTable,
  IndexableType,
  PromiseExtended,
  Table,
  Transaction,
} from "dexie";

// Songara helpers
export { createSongaraDb } from "./createSongaraDb.js";
export type { CreateSongaraDbOptions } from "./createSongaraDb.js";
export {
  applySchemaVersions,
  sortSchemaVersions,
} from "./schemaVersions.js";
export type { SongaraSchemaVersion } from "./schemaVersions.js";
export { songaraDbName } from "./songaraDbName.js";
