/**
 * Stable registration contract for site packages.
 *
 * Sites must import from `@platform/site-registry/contract` only.
 * That entry does not load the catalog, so catalog → site → contract
 * cannot form a cycle.
 */
export type {
  AppManifestFields,
  CatalogEntry,
  CatalogEntryMeta,
  SiteDefinition,
  SiteRoute,
} from "./types.js";
export { defineSite } from "./define-site.js";
