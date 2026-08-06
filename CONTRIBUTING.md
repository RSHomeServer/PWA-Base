# Contributing

Thank you for contributing to `@songara/pwa-base`. This document covers workflow
expectations for the foundation repository (Ubuntu VM for day-to-day work; Proxmox for
production Website Hosting). Product apps live in sibling repositories
([ADR-007](./docs/adr/007-pwa-base-reusable-foundation.md)).

## Before you start

Read the architecture overview and ADRs so changes align with accepted decisions:

- [docs/milestones/VISION.md](./docs/milestones/VISION.md) — living foundation intent
- [docs/architecture.md](./docs/architecture.md)
- [docs/adr/](./docs/adr/) — start with [ADR-007](./docs/adr/007-pwa-base-reusable-foundation.md)
- [`.kandev/`](./.kandev/) — role prompts and wrap-up rules (local `main`, human push)

Key rule from [ADR-003](./docs/adr/003-phase2-shared-packages.md): promote shared code only
when a **second** consumer needs the same API. Sibling apps import `@songara/pwa-base`
public entry points only.

## Branch workflow

- Branch from `main`.
- Use descriptive branch names: `feat/…`, `fix/…`, `docs/…`.
- Keep changes focused; prefer separate PRs for unrelated packages or concerns.
- **Do not auto-merge.** Every change requires human review and approval.
- Agents **sync to `origin/main` first** on every ticket, then branch; merge to **local
  `main` only** at the end; the human runs `git push origin main`.
- Commits must not include editor/AI co-author trailers or tooling branding.

## Ownership

Respect package and doc boundaries. When multiple contributors work in parallel:

- **Reference app** — `apps/hello-web`, `packages/site-hello`
- **Site registry** — `packages/site-registry`
- **Runtime / Content Packs** — `packages/runtime`
- **Design system** — `packages/ui` and `docs/design-system/`
- **Domain kits** — `packages/controls`, `export`, `math`, `physics`, `markdown`,
  `animation`, `audio`, `browser`, `render`
- **Completion report** — `packages/completion-report`
- **Shared config** — `packages/config`
- **ADRs** — `docs/adr/` (architecture decisions; link from other docs, do not rewrite in place)
- **Process** — `.kandev/`
- **Product / contributor docs** — root `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`,
  `docs/guides/*`, living [VISION.md](./docs/milestones/VISION.md)

If your change crosses boundaries, call it out in the PR description and tag relevant reviewers.

## Adding an application

Product apps belong in **sibling repositories**, not in this monorepo. Scaffolding helpers
and packaging notes:

- [docs/guides/consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md)
- [docs/guides/solo-packaging.md](./docs/guides/solo-packaging.md)
- [docs/guides/creating-a-new-site.md](./docs/guides/creating-a-new-site.md)

In-tree changes for a new shared capability require a second consumer (ADR-003) or an
explicit foundation ADR.

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

## Code style

- TypeScript strict mode; extend baselines from `@platform/config`.
- ESLint and Prettier configs live in `packages/config`; root scripts run repo-wide.
- Prefer existing patterns in the package you touch; avoid speculative abstractions.

## Design system

Apps should consume shared UI via `@platform/ui` / `@songara/pwa-base/ui` when appropriate.
See [docs/design-system/](./docs/design-system/) for tokens, primitives, and accessibility
baseline. Follow [theme strategy](./docs/design-system/theme-strategy.md) when wiring themes.

## Documentation changes

- Link to ADRs and source rather than duplicating architecture decisions.
- Verify internal links resolve to existing files.
- Do not document APIs that are not implemented — check exports in source or package READMEs.
- Do not revive catalogue-host / Telemetry docs as living guidance.

## Questions

If scope or ownership is unclear, open a draft PR or issue describing the proposed change before large refactors.
