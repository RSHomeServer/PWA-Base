import type { SiteDefinition } from "./types.js";

/**
 * Marks and returns a site definition for export from a site package.
 * Keeps the registration boundary explicit and typed.
 */
export function defineSite(site: SiteDefinition): SiteDefinition {
  return site;
}
