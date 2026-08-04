/**
 * `@songara/pwa-base` public API.
 *
 * Applications should import from this package root (or documented subpaths)
 * rather than deep `@platform/*` paths. Internal monorepo packages remain
 * available for backwards compatibility inside this workspace.
 */

export * from "../packages/runtime/src/index.js";

export {
  defineSite,
  hasSiteCapability,
  SITE_CAPABILITY,
} from "../packages/site-registry/src/contract.js";
export type {
  AppManifestFields,
  CatalogEntry,
  CatalogEntryMeta,
  KnownSiteCapability,
  SiteDefinition,
  SiteRoute,
} from "../packages/site-registry/src/contract.js";

export * from "../packages/ui/src/index.js";
