# ADR-002: Path-based site registration and catalog

## Status

**Superseded in part by [ADR-007](./007-pwa-base-reusable-foundation.md).**

The `defineSite` / `SiteDefinition` contract in `@platform/site-registry` remains the
registration shape for packageable apps. The in-repo `@platform/catalog` host catalog and
path-mounting into `apps/platform` were removed in Milestone 0; product apps now live in
sibling repositories.

## Context

The modular monolith host (ADR-001) must mount multiple sites without importing site-specific modules. We need a registration pattern that:

- Maps each site to a URL path prefix.
- Lets the host discover sites through a single, stable API.
- Makes “add a site” a small, repeatable change.
- Leaves room for the catalog to grow (metadata, feature flags, lazy loading) without rewriting the host.

Alternatives considered:

1. **Filesystem convention scanning** — auto-discover `sites/*/index.ts`. Convenient, but couples the host/build to directory layout and is harder to make explicit in review.
2. **Runtime remote config** — fetch a manifest from an API. Useful later; premature for a greenfield host.
3. **Explicit catalog module** — sites call `defineSite()`, and a single catalog file registers each site. Host calls `getSites()` only.

## Decision

Use **path-based site registration** via `@platform/site-registry`:

### Contract

Each site exports a `SiteDefinition`:

| Field      | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| `id`       | Stable unique identifier                              |
| `basePath` | URL path prefix (e.g. `/docs`)                        |
| `title`    | Human-readable label for chrome / a11y                |
| `routes`   | Array of `{ path, component }` relative to `basePath` |

Helpers / entry points **still in force**:

- `@platform/site-registry/contract` — `defineSite(definition)` (typed identity helper) and types for **site packages**.
- `@platform/site-registry` — type re-exports; no site dependencies.

*(Historical — removed in Milestone 0.)* `@platform/catalog` previously owned `getSites()`
for an in-repo multi-app host and was the only package allowed to import concrete sites.
That package and host mounting path are gone. Solo apps mount their own `defineSite`
export via `SoloSiteApp` ([ADR-004](./004-packageable-applications.md),
[ADR-007](./007-pwa-base-reusable-foundation.md)).

### Adding a site (current)

1. Create a site package that imports `defineSite` from `@platform/site-registry/contract` and exports a definition.
2. Mount it from a thin Vite entry (`apps/hello-web` pattern, or a sibling app using `@songara/pwa-base`).

There is no in-repo catalogue registration step.

## Consequences

### Positive

- Explicit `defineSite` contract keeps packaging entries free of site domain knowledge.
- Adding an app is a greppable site package + Vite entry (Hello / sibling pattern).
- Contract is small enough to document and typecheck in isolation.

### Extractability notes

Solo packaging is the default: a site depends on the registration contract (and shared
libs), not on host internals. Route components and site logic live in the site package or
sibling app. Mount the same `SiteDefinition` at `/` from a dedicated Vite entry.

### Negative / trade-offs

- Component types on routes are deliberately loose (`unknown` / generic) so the registry
  stays React-optional; the packaging entry is responsible for casting/rendering.
