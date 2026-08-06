# Repository tour

This walkthrough assumes you have never opened the repository. Goal: understand how the platform is laid out and how a future app will plug in.

## Top-level map

| Path                                                             | Purpose                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/`                                                          | Deployable applications. Today: only the platform host.    |
| `packages/`                                                      | Shared libraries and (later) site packages.                |
| `docs/`                                                          | ADRs, architecture, guides, design system, review package. |
| `e2e/`                                                           | Playwright end-to-end smoke tests.                         |
| `docker/`                                                        | nginx config used by the runtime image.                    |
| `Dockerfile`                                                     | Multi-stage: pnpm build → nginx static serve.              |
| `docker-compose.yml`                                             | Local one-service Compose on port 8080.                    |
| `package.json`                                                   | Workspace root scripts (`dev`, `build`, `test`, …).        |
| `pnpm-workspace.yaml`                                            | Workspace globs + version **catalog**.                     |
| `pnpm-lock.yaml`                                                 | Locked dependency graph (Docker uses `--frozen-lockfile`). |
| `eslint.config.js` / `prettier.config.js` / `tsconfig.base.json` | Root re-exports of `@platform/config`.                     |
| `playwright.config.ts`                                           | Builds host, serves preview, runs `e2e/`.                  |
| `README.md` / `CONTRIBUTING.md`                                  | Onboarding and contribution norms.                         |
| `.dockerignore` / `.gitignore` / `.npmrc` / `.editorconfig`      | Tooling hygiene.                                           |

There is **no** `sites/` top-level folder. Future sites live as `packages/site-<id>/`.

## Packages and why they exist

### `apps/platform` → `@platform/host`

The only runnable app. Responsibilities:

- Vite entry (`index.html` → `src/main.tsx`)
- React Router routes from `getSites()` (`AppRoutes.tsx`)
- Landing page at `/` listing registered sites (or empty state)
- Production static assets under `dist/` after `pnpm build`

It must **not** import `@platform/site-*` packages.

### `packages/site-registry` → `@platform/site-registry`

The stable platform interface between host and sites.

| Entry                              | Consumers     | Exports               |
| ---------------------------------- | ------------- | --------------------- |
| `@platform/site-registry`          | Host          | `getSites()`, types   |
| `@platform/site-registry/contract` | Site packages | `defineSite()`, types |

`catalog.ts` holds the explicit list of sites (empty today). Splitting `/contract` prevents a circular import when the catalog imports a site that imports the registry.

### `packages/ui` → `@platform/ui`

Design-system foundation: CSS variables (`tokens.css`) and three primitives (`Button`, `Link`, `Stack`). Documented under `docs/design-system/`. The host does not consume it yet; sites should prefer it for shared look-and-feel.

### `packages/config` → `@platform/config`

Single source for TypeScript / ESLint / Prettier baselines so packages do not drift.

## How the platform starts

### Local Vite

1. `pnpm install` (workspace + catalog versions).
2. `pnpm dev` → runs `@platform/host` Vite on **5173**.
3. Browser loads `index.html` → React mounts `BrowserRouter` → `AppRoutes` calls `getSites()` at module load and builds `<Route>` elements.

### Docker

1. `docker compose up --build`.
2. Build stage: Node 22 + pnpm, `pnpm install --frozen-lockfile`, `pnpm --filter @platform/host build`.
3. Runtime stage: nginx serves `apps/platform/dist`, SPA `try_files`, **`/health` → `ok`**.
4. Published at **http://localhost:8080**.

## How a future application integrates

Follow [creating-a-new-site.md](../guides/creating-a-new-site.md). Condensed:

1. Create `packages/site-example` exporting `defineSite({…})` from `/contract`.
2. Add `"@platform/site-example": "workspace:*"` to `packages/site-registry/package.json`.
3. Append one line in `catalog.ts`: `import { exampleSite } from "@platform/site-example";` and include it in the array.
4. Run `pnpm install && pnpm dev` — host mounts routes under `basePath` with **no** host source edits.

Extractability: the site package should not import `apps/platform`. Later it can become its own Vite app by reusing the same components and removing the catalog line.

## How Docker fits the workflow

| Mode                                           | When to use                                                   |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                     | Day-to-day coding, HMR                                        |
| `pnpm build` + `pnpm preview` (via Playwright) | Fast production-ish SPA check                                 |
| `docker compose up --build`                    | Validate the container image, healthcheck, nginx SPA fallback |

Docker is **local-first**. Traefik-ready label examples are commented in `docker-compose.yml` but Traefik itself is not started.

## Where to read next

1. [Executive summary](./executive-summary.md)
2. [Architecture](../architecture.md) + [ADR-001](../adr/001-modular-monolith-host.md) / [ADR-002](../adr/002-site-registration-catalog.md)
3. [Architecture review notes](./architecture-review-notes.md)
4. [Review checklist](./review-checklist.md)
