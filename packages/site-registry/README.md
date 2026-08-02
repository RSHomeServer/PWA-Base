# `@platform/site-registry`

Site registration **contract** for the platform.

## Entry points

| Import                             | Who uses it   | Exports                              |
| ---------------------------------- | ------------- | ------------------------------------ |
| `@platform/site-registry`          | Host (types)  | `SiteDefinition` / `SiteRoute` types |
| `@platform/site-registry/contract` | Site packages | `defineSite()`, types                |

Registered sites are listed in **`@platform/catalog`** (`getCatalogEntries` / `resolveSites`). That package is the only place that depends on concrete `@platform/site-*` implementations — keeping this contract package free of site cycles.

`SiteDefinition` may include AppManifest fields (`requiredPackIds`, `capabilities`) for packaging and Content Packs (ADR-004 / ADR-005).

## Adding a site

1. Export `defineSite({…})` from `@platform/site-registry/contract`.
2. Add the site as a dependency of `@platform/catalog`.
3. Append one **lazy** entry in `packages/catalog/src/catalog.ts` (`load: () => import("…")`).

## See also

- [ADR-002](../../docs/adr/002-site-registration-catalog.md)
- [ADR-003](../../docs/adr/003-phase2-shared-packages.md)
- [ADR-004](../../docs/adr/004-packageable-applications.md)
- [ADR-005](../../docs/adr/005-content-packs.md)
- [Creating a new site](../../docs/guides/creating-a-new-site.md)
- [Content Packs](../../docs/guides/content-packs.md)
- [Solo packaging](../../docs/guides/solo-packaging.md)
