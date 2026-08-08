const SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * Builds a stable IndexedDB name for Songara apps: `songara:<appId>:<dbKey>`.
 * Keeps product databases namespaced and predictable across PWAs.
 */
export function songaraDbName(appId: string, dbKey: string): string {
  if (!SEGMENT.test(appId)) {
    throw new Error(
      `songaraDbName: appId must be a non-empty alphanumeric segment (got ${JSON.stringify(appId)})`,
    );
  }
  if (!SEGMENT.test(dbKey)) {
    throw new Error(
      `songaraDbName: dbKey must be a non-empty alphanumeric segment (got ${JSON.stringify(dbKey)})`,
    );
  }
  return `songara:${appId}:${dbKey}`;
}
