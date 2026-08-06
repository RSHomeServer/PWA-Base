# `@platform/site-registry`

Site registration **contract** for the platform.

## Entry points

| Import                             | Who uses it   | Exports                              |
| ---------------------------------- | ------------- | ------------------------------------ |
| `@platform/site-registry`          | Apps (types)  | `SiteDefinition` / `SiteRoute` types |
| `@platform/site-registry/contract` | Site packages | `defineSite()`, types                |

Solo apps mount their own `defineSite({…})` export via `SoloSiteApp`. The former `@platform/catalog` multi-app catalogue was removed in T0.4; `CatalogEntryMeta` remains as optional metadata for future hosts.

`SiteDefinition` may include AppManifest fields (`requiredPackIds`, `capabilities`) for packaging and Content Packs (ADR-004 / ADR-005).

## Adding a site

1. Export `defineSite({…})` from `@platform/site-registry/contract`.
2. Scaffold with `pnpm new-app <name>` (or mirror `packages/site-hello` + `apps/hello-web`).
3. Run the solo app with `pnpm --filter @platform/<name>-web dev`.

## See also

- [ADR-002](../../docs/adr/002-site-registration-catalog.md)
- [ADR-003](../../docs/adr/003-phase2-shared-packages.md)
- [ADR-004](../../docs/adr/004-packageable-applications.md)
- [ADR-005](../../docs/adr/005-content-packs.md)
- [Creating a new site](../../docs/guides/creating-a-new-site.md)
- [Content Packs](../../docs/guides/content-packs.md)
- [Solo packaging](../../docs/guides/solo-packaging.md)
