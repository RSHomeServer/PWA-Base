# Milestone 0 dangling links (for Milestone 1)

Product verticals were deleted without rewriting foundation docs. T0.5 fixed
structural/script dangling refs; the items below still need **prose** rewrites in Milestone 1.

## Root / contributor docs
- `README.md` — multi-app catalogue, docs-api, telemetry, product apps table
- `CONTRIBUTING.md` — `apps/platform`, `@platform/catalog` registration steps
- `CURSOR.md` / `docs/guides/run-report-standard.md` — still describe telemetry PUT / capture pipeline (SoT is `@songara/pwa-base/completion-report`; `.cursor/rules/run-report-standard.mdc` and `.kandev/` SoT links were retargeted in T0.5)

## Guides / ADRs / milestones
- `docs/guides/solo-packaging.md`, `content-packs.md`, `consuming-pwa-base.md`, `creating-a-new-site.md` — product app examples
- `docs/adr/004-packageable-applications.md` and related ADRs — catalogue host assumptions
- `docs/milestones/PLATFORM.md`, `IDEAS.md`, `docs/architecture.md`
- `packages/site-registry/README.md` — still describes catalog registration flow

## Removed in T0.5 (no longer dangling)
- `scripts/new-app.mjs` — solo-only scaffold (no `*.songara.uk` / catalogue patches)
- `scripts/capture-artifacts.mjs` — guidance stub exits 0
- `docs/guides/ai-dev-dashboard-setup.md` — deleted (subject gone)
- Docker Traefik / `hello.songara.uk` Compose labels — replaced with local port map
- M0 artifacts relocated to `docs/milestones/m0-rationalisation/`

## Intentionally retained types
- `CatalogEntryMeta.host` remains optional catalogue metadata for future hosts (D4)
