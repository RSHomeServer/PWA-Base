import type Dexie from "dexie";
import type { Transaction } from "dexie";

/**
 * One Dexie schema version. Stores map is the Dexie `stores()` definition;
 * table schemas stay app-owned — this Preview never invents product tables.
 */
export type SongaraSchemaVersion = {
  version: number;
  stores: { [tableName: string]: string | null };
  upgrade?: (tx: Transaction) => Promise<void> | void;
};

/**
 * Returns versions sorted ascending by `version`. Throws on duplicate or
 * non-positive version numbers.
 */
export function sortSchemaVersions(
  versions: readonly SongaraSchemaVersion[],
): SongaraSchemaVersion[] {
  if (versions.length === 0) {
    throw new Error("sortSchemaVersions: at least one schema version is required");
  }

  const seen = new Set<number>();
  for (const entry of versions) {
    if (!Number.isInteger(entry.version) || entry.version < 1) {
      throw new Error(
        `sortSchemaVersions: version must be a positive integer (got ${entry.version})`,
      );
    }
    if (seen.has(entry.version)) {
      throw new Error(
        `sortSchemaVersions: duplicate schema version ${entry.version}`,
      );
    }
    seen.add(entry.version);
  }

  return [...versions].sort((a, b) => a.version - b.version);
}

/**
 * Registers Songara schema versions on an existing Dexie instance (subclass or
 * plain). Call before `open()`. Returns the same `db` for chaining.
 */
export function applySchemaVersions(
  db: Dexie,
  versions: readonly SongaraSchemaVersion[],
): Dexie {
  for (const entry of sortSchemaVersions(versions)) {
    const chain = db.version(entry.version).stores(entry.stores);
    if (entry.upgrade) {
      chain.upgrade(entry.upgrade);
    }
  }
  return db;
}
