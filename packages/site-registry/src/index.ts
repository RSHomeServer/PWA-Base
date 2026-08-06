/**
 * Host-facing type re-exports.
 *
 * Site packages use `@platform/site-registry/contract`.
 * Concrete apps register via `defineSite` and mount with SoloSiteApp.
 * Multi-app catalogue hosting was removed from PWA-Base in T0.4.
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
