# T0.4 dangling links (for Milestone 1)

Product verticals were deleted without rewriting foundation docs. These still mention removed apps/packages:

## Root / contributor docs
- `README.md` — multi-app catalogue, docs-api, telemetry, product apps table
- `CONTRIBUTING.md` — `apps/platform`, `@platform/catalog` registration steps
- `CURSOR.md` / `.cursor/rules/run-report-standard.mdc` — may still mention telemetry paths (completion-report SoT is `@songara/pwa-base/completion-report`)

## Guides / ADRs / milestones
- `docs/guides/solo-packaging.md`, `content-packs.md`, `consuming-pwa-base.md` — product app examples
- `docs/adr/004-packageable-applications.md` and related ADRs — catalogue host assumptions
- `docs/milestones/PLATFORM.md`, `IDEAS.md`
- `packages/site-registry/README.md` — still describes catalog registration flow

## Scripts
- `scripts/new-app.mjs` — scaffolds solo apps but still assumes `*.songara.uk` hostnames; full solo-only rewrite is T0.5
- `scripts/capture-artifacts.mjs` — stub exits 1; capture lives with telemetry product clone

## Intentionally retained types
- `CatalogEntryMeta.host` remains optional catalogue metadata for future hosts (D4)
