/**
 * A single route mounted under a site's `basePath`.
 *
 * `component` is intentionally React-agnostic (`unknown`) so this package
 * does not depend on React. The Vite/React host casts or wraps it when
 * building the router.
 */
export interface SiteRoute {
  /** Path relative to the site `basePath` (e.g. `""` or `"/about"`). */
  path: string;
  /** Route UI unit; host interprets as a React component. */
  component: unknown;
}

/**
 * Packaging / offline surface for an application (evolving AppManifest).
 * Kept on {@link SiteDefinition} so we avoid a forced rename of site packages.
 */
export interface AppManifestFields {
  /**
   * Content Pack ids that must be installed before the app reports Ready
   * (ADR-005). Empty/omitted means no pack gate.
   */
  requiredPackIds?: readonly string[];
  /**
   * Optional capability tags for host chrome / future feature flags
   * (e.g. `"offline"`, `"media"`).
   */
  capabilities?: readonly string[];
}

/**
 * Contract for a registrable, packageable application in the platform catalog.
 *
 * Application identity is architectural (ADR-004). `basePath` is the default
 * path under a multi-app host; solo packaging may mount the same package at `/`.
 */
export interface SiteDefinition extends AppManifestFields {
  /** Stable unique identifier (e.g. `"docs"`). */
  id: string;
  /**
   * Application URL path prefix. Independently hosted apps use `"/"`.
   * Historical multi-app path mounts used values like `"/docs"`.
   */
  basePath: string;
  /** Human-readable title for navigation / document title. */
  title: string;
  /** Routes served under `basePath`. */
  routes: readonly SiteRoute[];
}

/**
 * Catalog metadata available before the site module is dynamically imported.
 * Mirrors identity fields so nav/landing can render while chunks load.
 */
export interface CatalogEntryMeta extends AppManifestFields {
  id: string;
  basePath: string;
  title: string;
  /**
   * Public hostname for independent hosting (e.g. `birthday.songara.uk`).
   * Catalogue links use `https://${host}/`.
   */
  host: string;
}

/**
 * Lazy catalog entry: metadata + dynamic import of the full {@link SiteDefinition}.
 */
export interface CatalogEntry extends CatalogEntryMeta {
  load: () => Promise<SiteDefinition>;
}
