import localforage from "localforage";
import { songaraDbName } from "./songaraDbName.js";

export type CreateSongaraLocalforageOptions = {
  appId: string;
  /** localForage storeName (object store / table key). */
  storeName: string;
  /** Optional dbKey segment; defaults to `localforage`. */
  dbKey?: string;
  driver?: string | string[];
};

/**
 * Creates a namespaced localForage instance: DB `songara:<appId>:<dbKey>`.
 * Keys/values stay app-owned.
 */
export function createSongaraLocalforage(
  options: CreateSongaraLocalforageOptions,
): LocalForage {
  if (!options.storeName.trim()) {
    throw new Error("createSongaraLocalforage: storeName is required");
  }
  const name = songaraDbName(options.appId, options.dbKey ?? "localforage");
  const instance = localforage.createInstance({
    name,
    storeName: options.storeName,
    ...(options.driver !== undefined ? { driver: options.driver } : {}),
  });
  return instance;
}
