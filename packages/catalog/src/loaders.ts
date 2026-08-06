import type { CatalogEntry, SiteDefinition } from "@platform/site-registry/contract";
import { catalogEntries } from "./entries.js";

/**
 * Lazy loaders for site definitions (tests / tooling). The catalogue host does
 * not import this module — independent apps mount their own site packages.
 */
const loaders: Record<string, () => Promise<SiteDefinition>> = {
  docs: () => import("@platform/site-docs").then((m) => m.docsSite),
  hello: () => import("@platform/site-hello").then((m) => m.helloSite),
  dashboard: () => import("@platform/site-dashboard").then((m) => m.dashboardSite),
};

export function getCatalogLoaders(): readonly CatalogEntry[] {
  return catalogEntries.map((entry) => {
    const load = loaders[entry.id];
    if (!load) {
      throw new Error(`No loader registered for catalog entry: ${entry.id}`);
    }
    return { ...entry, load };
  });
}

export async function resolveSites(): Promise<readonly SiteDefinition[]> {
  return Promise.all(getCatalogLoaders().map((entry) => entry.load()));
}

export async function getSites(): Promise<readonly SiteDefinition[]> {
  return resolveSites();
}
