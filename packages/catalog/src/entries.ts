import type { CatalogEntryMeta } from "@platform/site-registry/contract";

/**
 * Application catalogue metadata — no site module imports.
 * Used by apps.songara.uk (catalogue-only) and for packaging hostnames.
 */
export const catalogEntries: readonly CatalogEntryMeta[] = [
  {
    id: "docs",
    basePath: "/",
    host: "docs.songara.uk",
    title: "Documents",
  },
  {
    id: "hello",
    basePath: "/",
    host: "hello.songara.uk",
    title: "Hello",
    requiredPackIds: ["hello-base"],
    capabilities: ["offline"],
  },
  {
    id: "dashboard",
    basePath: "/",
    host: "dashboard.songara.uk",
    title: "AI Development Dashboard",
  },
];

export function getCatalogEntries(): readonly CatalogEntryMeta[] {
  return catalogEntries;
}

/** Absolute HTTPS origin for an independently hosted application. */
export function catalogAppOrigin(entry: CatalogEntryMeta): string {
  return `https://${entry.host}`;
}
