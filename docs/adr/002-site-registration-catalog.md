# ADR-002: Path-based site registration and catalog

## Status

Accepted

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

Helpers / entry points:

- `@platform/site-registry/contract` — `defineSite(definition)` (typed identity helper) and types for **site packages**.
- `@platform/catalog` — `getSites()` for the **host**. This package may depend on concrete site packages.
- `@platform/site-registry` — type re-exports for the host; no site dependencies.

This split prevents a `site → registry → catalog → site` cycle.

### Host dependency rule

The host **reads the catalog API only** (`getSites()` from `@platform/catalog`). It must not import concrete site packages (e.g. `@platform/site-docs`).

### Catalog dependency rule

`@platform/catalog` may depend on site packages **only** so `catalog.ts` can import their `defineSite` exports. That is the intentional coupling point; the host and contract package stay clean.

### Adding a site

1. Create a site package that imports `defineSite` from `@platform/site-registry/contract` and exports a definition.
2. Add the site as a workspace dependency of `@platform/catalog` and register it in the catalog with **one registration line** (import + list entry).

No host source changes beyond whatever is already driven by the catalog.

### Catalog evolution

The catalog starts as an in-package empty list. It may later gain metadata, lazy `import()` factories, or env-gated entries **without** changing the host’s consumption surface beyond optional additive fields on `SiteDefinition`.

## Consequences

### Positive

- Host stays site-agnostic; reviews of host PRs do not need site domain knowledge.
- Adding a site is explicit and greppable (one catalog line).
- Contract is small enough to document and typecheck in isolation.

### Extractability notes

A site remains extractable to its own app when:

- It depends on the registration contract (and shared libs), not on host internals.
- Route components and site logic live inside the site package.
- The catalog entry is the only coupling point to the monolith.

To extract: stand up a dedicated Vite app, mount the same `SiteDefinition` routes at `/` (or keep `basePath`), and remove the catalog registration line from the monolith.

### Negative / trade-offs

- Catalog registration is manual (intentional, for reviewability).
- Component types on routes are deliberately loose (`unknown` / generic) so the registry stays React-optional; the host is responsible for casting/rendering.
