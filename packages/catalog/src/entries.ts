import type { CatalogEntryMeta } from "@platform/site-registry/contract";

/**
 * Application catalogue metadata — no site module imports.
 * Used by apps.songara.uk (catalogue-only) and for packaging hostnames.
 */
export const catalogEntries: readonly CatalogEntryMeta[] = [
  {
    id: "components",
    basePath: "/",
    host: "components.songara.uk",
    title: "Components",
  },
  {
    id: "docs",
    basePath: "/",
    host: "docs.songara.uk",
    title: "Documents",
  },
  {
    id: "stats",
    basePath: "/",
    host: "stats.songara.uk",
    title: "Statistical Analysis",
  },
  {
    id: "viz",
    basePath: "/",
    host: "viz.songara.uk",
    title: "Visual Computing",
  },
  {
    id: "birthday",
    basePath: "/",
    host: "birthday.songara.uk",
    title: "Birthday",
    requiredPackIds: ["birthday-base"],
    capabilities: ["offline", "media"],
  },
  {
    id: "memories",
    basePath: "/",
    host: "memories.songara.uk",
    title: "Memories",
  },
  {
    id: "browser-lab",
    basePath: "/",
    host: "browser-lab.songara.uk",
    title: "Browser Lab",
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
