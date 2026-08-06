# `@songara/pwa-base`

Shared foundation for Songara PWAs. Inside the monorepo, workspace packages keep the
`@platform/*` names; sibling apps import documented `@songara/pwa-base` entry points (see
[consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md)).

**Identity:** reusable foundation + one reference app (`hello-web` / `site-hello`). Product
applications live in **sibling repositories**. Telemetry and the catalogue host are **not**
in this repo ([ADR-007](./docs/adr/007-pwa-base-reusable-foundation.md)).

| Layer | Where |
| --- | --- |
| Dev / validation | Ubuntu VM |
| Production Website Hosting | Proxmox (human deploy; out of band for day-to-day work here) |

## Quick start

### Prerequisites

- Node.js 22+
- [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`)
- pnpm 9.15.9 (installed via Corepack from `packageManager` in `package.json`)

### Local development

```bash
corepack enable
pnpm install
pnpm dev          # Hello reference PWA (background) → http://localhost:5182
pnpm stop         # stop the background demo server
```

`pnpm dev` starts `@platform/hello-web` in the background and prints PID / port / URL.
Use `pnpm stop` to shut it down cleanly.

### Validate changes

```bash
pnpm lint
pnpm typecheck
pnpm test         # unit + e2e; see Testing guide
```

First-time Playwright setup:

```bash
pnpm exec playwright install chromium
```

## Repository layout

| Path | Package | Role |
| --- | --- | --- |
| `apps/hello-web` | `@platform/hello-web` | Reference solo PWA entry |
| `packages/site-hello` | `@platform/site-hello` | Reference site feature module |
| `packages/site-registry` | `@platform/site-registry` | Site / app contract (`defineSite`) |
| `packages/runtime` | `@platform/runtime` | PWA helpers, Content Packs, SoloSiteApp |
| `packages/ui` | `@platform/ui` | Design tokens + shared primitives |
| `packages/controls` | `@platform/controls` | Parameter panels for interactive UIs |
| `packages/export` | `@platform/export` | Browser download helpers |
| `packages/math` / `physics` | `@platform/math`, `@platform/physics` | Shared numeric helpers |
| `packages/markdown` | `@platform/markdown` | Markdown rendering helpers |
| `packages/animation` / `audio` / `browser` / `render` | `@platform/*` | Domain kits extracted for reuse |
| `packages/completion-report` | `@platform/completion-report` | `RunCompletionSummary` contract |
| `packages/config` | `@platform/config` | Shared TS / ESLint / Prettier baselines |
| `docs/` | — | Architecture, guides, ADRs, design system |
| `.kandev/` | — | Role prompts and workflows for Songara PWAs |

## Using this repo from a sibling PWA

```json
{
  "dependencies": {
    "@songara/pwa-base": "file:../PWA-Base"
  }
}
```

Import from `@songara/pwa-base` or a documented subpath (`/contract`, `/ui`,
`/animation`, `/audio`, `/browser`, `/render`, `/completion-report`, …).
Full entry-point table:
[docs/guides/consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md).

KanDev worktrees do not see `../PWA-Base` unless the task mirrors the sibling layout.
Keep the `file:` dependency; before install in an isolated checkout run:

```bash
node "${SONGARA_PROJECTS_ROOT:-$HOME/projects}/PWA-Base/scripts/ensure-sibling-file-deps.mjs"
```

## Documentation

| Topic | Location |
| --- | --- |
| Living vision (foundation) | [docs/milestones/VISION.md](./docs/milestones/VISION.md) |
| Architecture overview | [docs/architecture.md](./docs/architecture.md) |
| Public API / consume as `@songara/pwa-base` | [docs/guides/consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md) |
| Independent packaging | [docs/guides/solo-packaging.md](./docs/guides/solo-packaging.md) |
| Content Packs (ADR-005) | [docs/guides/content-packs.md](./docs/guides/content-packs.md) |
| Local development | [docs/guides/local-development.md](./docs/guides/local-development.md) |
| Testing | [docs/guides/testing.md](./docs/guides/testing.md) |
| Architecture decisions (ADRs) | [docs/adr/](./docs/adr/) — start with [ADR-007](./docs/adr/007-pwa-base-reusable-foundation.md) |
| Design system | [docs/design-system/](./docs/design-system/) |
| KanDev operating system | [`.kandev/`](./.kandev/) |
| Contributing | [CONTRIBUTING.md](./CONTRIBUTING.md) |
| Engineering contract | [CURSOR.md](./CURSOR.md) |

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start Hello reference PWA in the background |
| `pnpm stop` | Stop the background demo server |
| `pnpm new-app <name>` | Scaffold a solo PWA + Content Pack |
| `node scripts/ensure-sibling-file-deps.mjs` | Link `file:../` siblings for KanDev/worktrees (run from consumer app) |
| `pnpm content-pack:sync` | Hash/mirror a Content Pack |
| `pnpm build` | Build all packages that define `build` |
| `pnpm lint` | ESLint across the repo |
| `pnpm typecheck` | TypeScript check in all packages |
| `pnpm format` / `format:check` | Prettier write / check |
| `pnpm test` | Unit tests, then Playwright e2e |
| `pnpm test:unit` | Vitest across foundation packages |
| `pnpm test:e2e` | Playwright smoke against the reference app |
| `pnpm capture:artifacts` | Capture visual validation artifacts (stub guidance post product removal) |

## Status

Post–Milestone 0: foundation packages + hello reference only. Strategy north star:
[VISION.md](./docs/milestones/VISION.md).
