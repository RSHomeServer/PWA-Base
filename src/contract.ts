/**
 * Site registration contract only — no UI, chrome, or catalogue loaders.
 * Prefer this subpath when a package must stay React-light / cycle-free.
 *
 * @example
 * import { defineSite, SITE_CAPABILITY } from "@songara/pwa-base/contract";
 */
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
