import Dexie from "dexie";
import {
  applySchemaVersions,
  type SongaraSchemaVersion,
} from "./schemaVersions.js";

export type CreateSongaraDbOptions = {
  /** IndexedDB name — prefer `songaraDbName(appId, dbKey)`. */
  name: string;
  /** Ordered or unordered schema versions; factory sorts and validates. */
  versions: readonly SongaraSchemaVersion[];
};

/**
 * Creates a Dexie database with Songara schema/version conventions applied.
 * Does not open the DB; callers open when ready. Schemas remain app-owned.
 */
export function createSongaraDb(options: CreateSongaraDbOptions): Dexie {
  if (!options.name.trim()) {
    throw new Error("createSongaraDb: name is required");
  }
  const db = new Dexie(options.name);
  applySchemaVersions(db, options.versions);
  return db;
}
