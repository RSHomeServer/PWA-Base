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
  KnownSiteCapability,
  SiteDefinition,
  SiteRoute,
} from "./types.js";
export { hasSiteCapability, SITE_CAPABILITY } from "./types.js";
