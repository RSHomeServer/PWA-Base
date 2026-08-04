# `@songara/pwa-base`

Shared foundation for Songara PWAs, developed as a **modular monorepo**. The
publishable surface is `@songara/pwa-base` (see
[consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md)). Inside the repo,
workspace packages keep the `@platform/*` names for backwards compatibility.

`apps.songara.uk` is the application **catalogue**. Each application is packaged
as its own SPA/PWA on a subdomain (for example `viz.songara.uk`, `dashboard.songara.uk`).

## Quick start

### Prerequisites

- Node.js 22+
- [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`)
- pnpm 9.15.9 (installed via Corepack from `packageManager` in `package.json`)

### Local development (pnpm)

```bash
corepack enable
pnpm install
pnpm dev          # Hello demo PWA (background) → http://localhost:5182
pnpm stop         # stop the background demo server
```

`pnpm dev` starts `@platform/hello-web` in the background and prints PID / port / URL.
Use `pnpm stop` to shut it down cleanly.

Other apps:

```bash
pnpm dev:host                              # Catalogue at http://127.0.0.1:5173
pnpm --filter @platform/dashboard-web dev  # Dashboard on :5180
pnpm telemetry:up                          # Docker telemetry on :4310
pnpm docs-api:up                           # Document Explorer API
```

See [solo-packaging.md](./docs/guides/solo-packaging.md) for per-app ports.

Telemetry must not be started with `pnpm --filter @platform/telemetry start` during
normal dashboard work — that creates a second database. See
`docs/guides/ai-dev-dashboard-setup.md`.

### Docker (production-like)

```bash
docker compose up --build
```

Traefik routes each service by Host (`apps.songara.uk`, `birthday.songara.uk`, …). Ensure DNS/TLS for every subdomain.

### Validate changes

```bash
pnpm lint
pnpm typecheck
pnpm test         # unit + e2e; see Testing below
```

First-time Playwright setup:

```bash
pnpm exec playwright install chromium
```

## Repository layout

| Path                     | Package                   | Role                                      |
| ------------------------ | ------------------------- | ----------------------------------------- |
| `apps/platform`          | `@platform/host`          | Application catalogue (apps.songara.uk)   |
| `apps/*-web`             | `@platform/*-web`         | Independent app packaging / PWA entries   |
| `packages/catalog`       | `@platform/catalog`       | Catalogue metadata (`host`) + loaders     |
| `packages/runtime`       | `@platform/runtime`       | PWA helpers, Content Packs, SoloSiteApp   |
| `packages/site-registry` | `@platform/site-registry` | Site contract (`defineSite` / types)      |
| `packages/ui`            | `@platform/ui`            | Design tokens + shared primitives         |
| `packages/controls`      | `@platform/controls`      | Parameter panels for interactive sites    |
| `packages/export`        | `@platform/export`        | Browser download helpers                  |
| `packages/math`          | `@platform/math`          | Shared numeric / sample-stat helpers      |
| `packages/site-*`        | `@platform/site-*`        | Application feature modules               |
| `packages/config`        | `@platform/config`        | Shared TS / ESLint / Prettier baselines   |
| `docs/`                  | —                         | Architecture, guides, ADRs, design system |

## Using this repo from a sibling PWA

```json
{
  "dependencies": {
    "@songara/pwa-base": "file:../PWA-Base"
  }
}
```

Import from `@songara/pwa-base` (or `@songara/pwa-base/contract`). Details:
[docs/guides/consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md).

## Documentation

| Topic                         | Location                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Architecture overview         | [docs/architecture.md](./docs/architecture.md)                                     |
| Platform strategy (living)    | [docs/milestones/](./docs/milestones/) — [VISION](./docs/milestones/VISION.md) · [PLATFORM](./docs/milestones/PLATFORM.md) · [ROADMAP](./docs/milestones/ROADMAP.md) · [IDEAS](./docs/milestones/IDEAS.md) |
| Document Explorer             | [docs/guides/document-explorer.md](./docs/guides/document-explorer.md) (`docs.songara.uk`) |
| Create a new site             | [docs/guides/creating-a-new-site.md](./docs/guides/creating-a-new-site.md)         |
| Consume as `@songara/pwa-base` | [docs/guides/consuming-pwa-base.md](./docs/guides/consuming-pwa-base.md)           |
| Independent packaging         | [docs/guides/solo-packaging.md](./docs/guides/solo-packaging.md)                   |
| Content Packs (ADR-005)       | [docs/guides/content-packs.md](./docs/guides/content-packs.md)                     |
| Local development             | [docs/guides/local-development.md](./docs/guides/local-development.md)             |
| Testing                       | [docs/guides/testing.md](./docs/guides/testing.md)                                 |
| Architecture decisions (ADRs) | [docs/adr/](./docs/adr/)                                                           |
| Design system                 | [docs/design-system/](./docs/design-system/)                                       |
| Architectural review package  | [docs/reviews/](./docs/reviews/)                                                   |
| ChatGPT review summary        | [docs/reviews/chatgpt-review-summary.md](./docs/reviews/chatgpt-review-summary.md) |
| Contributing                  | [CONTRIBUTING.md](./CONTRIBUTING.md)                                               |

## Scripts

| Script                         | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `pnpm dev`                     | Start Hello demo PWA in the background |
| `pnpm stop`                    | Stop the background demo server        |
| `pnpm dev:host`                | Start catalogue host (foreground)      |
| `pnpm new-app <name>`          | Scaffold a solo PWA + Content Pack     |
| `pnpm content-pack:sync`       | Hash/mirror a Content Pack             |
| `pnpm build`                   | Build all packages that define `build` |
| `pnpm lint`                    | ESLint across the repo                 |
| `pnpm typecheck`               | TypeScript check in all packages       |
| `pnpm format` / `format:check` | Prettier write / check                 |
| `pnpm test`                    | Unit tests, then Playwright e2e smoke  |
| `pnpm test:unit`               | Vitest in catalog, host, and math      |
| `pnpm test:e2e`                | Playwright against built host preview  |

## Status

Phase 2: catalog registers **Statistical Analysis** (`/stats`) and **Illusions & Visualisations** (`/viz`). Traefik remains comments-only in Compose.
