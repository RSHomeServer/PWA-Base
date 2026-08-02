/**
 * Host-facing type re-exports.
 *
 * Site packages use `@platform/site-registry/contract`.
 * The host reads registered sites from `@platform/catalog` (`getSites` / `resolveSites`).
 */
export type {
  AppManifestFields,
  CatalogEntry,
  CatalogEntryMeta,
  SiteDefinition,
  SiteRoute,
} from "./types.js";
