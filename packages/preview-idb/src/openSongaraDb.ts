import { openDB, type DBSchema, type IDBPDatabase, type OpenDBCallbacks } from "idb";
import { songaraDbName } from "./songaraDbName.js";

export type OpenSongaraDbOptions<DBTypes extends DBSchema | unknown = unknown> = {
  appId: string;
  dbKey: string;
  version?: number;
  callbacks?: OpenDBCallbacks<DBTypes>;
};

/**
 * Opens an idb database with Songara naming: `songara:<appId>:<dbKey>`.
 * Schema/upgrade callbacks stay app-owned. Prefer Dexie Preview when you want
 * schema-version helpers; use this for low-level idb access.
 */
export function openSongaraDb<DBTypes extends DBSchema | unknown = unknown>(
  options: OpenSongaraDbOptions<DBTypes>,
): Promise<IDBPDatabase<DBTypes>> {
  const name = songaraDbName(options.appId, options.dbKey);
  return openDB<DBTypes>(name, options.version ?? 1, options.callbacks);
}
