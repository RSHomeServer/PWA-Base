# Contributing

Thank you for contributing to Website Hosting. This document covers workflow expectations for the platform monorepo.

## Before you start

Read the architecture overview and ADRs so changes align with accepted decisions:

- [docs/architecture.md](./docs/architecture.md)
- [docs/adr/](./docs/adr/)

Key rule from [ADR-002](./docs/adr/002-site-registration-catalog.md): the host consumes `@platform/site-registry` only — **never import individual site packages in `apps/platform`**.

## Branch workflow

- Branch from the current integration branch (e.g. `feat/platform-foundation` during foundation work, then `main` once established).
- Use descriptive branch names: `feat/site-docs`, `fix/host-routing`, `docs/testing-guide`.
- Keep PRs focused; prefer separate PRs for unrelated packages or concerns.
- **Do not auto-merge.** Every change requires human review and approval.

## Ownership

Respect package and doc boundaries. When multiple agents or contributors work in parallel:

- **Host** — `apps/platform`
- **Site registry** — `packages/site-registry`
- **Design system** — `packages/ui` and `docs/design-system/`
- **Shared config** — `packages/config`
- **Site packages** — `packages/site-*` (each site owns its package)
- **ADRs** — `docs/adr/` (architecture decisions; link from other docs, do not rewrite in place)
- **Product / contributor docs** — root `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/guides/*`

If your change crosses boundaries, call it out in the PR description and tag relevant reviewers.

## Adding a site

Follow [docs/guides/creating-a-new-site.md](./docs/guides/creating-a-new-site.md). Summary:

1. Create a site package that imports `defineSite` from `@platform/site-registry/contract`.
2. Add the site as a registry workspace dependency of `@platform/catalog` and **one catalog line** in `packages/catalog/src/catalog.ts`.
3. Do **not** edit host imports for the new site.

## Local validation

Run these before opening a PR:

```bash
pnpm install          # after dependency or workspace changes
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
```

For e2e tests, install Chromium once:

```bash
pnpm exec playwright install chromium
```

See [docs/guides/testing.md](./docs/guides/testing.md) for what each layer covers.

Optional Docker smoke test:

```bash
docker compose up --build
curl -f http://localhost:8080/health
```

## Code style

- TypeScript strict mode; extend baselines from `@platform/config`.
- ESLint and Prettier configs live in `packages/config`; root scripts run repo-wide.
- Prefer existing patterns in the package you touch; avoid speculative abstractions.

## Design system

Sites and the host should consume shared UI via `@platform/ui` when appropriate. See [docs/design-system/](./docs/design-system/) for tokens, primitives, and accessibility baseline. The host may not import `@platform/ui` yet; follow [theme strategy](./docs/design-system/theme-strategy.md) when wiring it.

## Documentation changes

- Link to ADRs and source rather than duplicating architecture decisions.
- Verify internal links resolve to existing files.
- Do not document APIs that are not implemented — check exports in source or package READMEs.

## Questions

If scope or ownership is unclear, open a draft PR or issue describing the proposed change before large refactors.
