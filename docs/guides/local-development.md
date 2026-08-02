# Local development

How to run and iterate on the platform monorepo on your machine.

## Setup

```bash
corepack enable
pnpm install
```

Node **22+** recommended (matches the Docker build image). pnpm **9.15.9** is pinned via `packageManager` in the root `package.json`.

## Dev server (fastest loop)

```bash
pnpm install
pnpm dev
```

Starts the default demo app (`@platform/hello-web`) **in the background** and prints:

```text
Development server started
PID: …
Port: 5182
URL: http://localhost:5182
```

Stop it with:

```bash
pnpm stop
```

Logs: `.tmp/dev-server.log`. PID file: `.tmp/dev-server.pid`.

### Catalogue host (foreground)

```bash
pnpm dev:host
```

Starts `@platform/host` via Vite at **http://127.0.0.1:5173** (see `apps/platform/vite.config.ts`). Hot reload applies to host and workspace-linked packages.

After adding a site, verify:

- `/` — landing page lists registered sites
- `/<basePath>` — site routes resolve

## Production preview (without Docker)

```bash
pnpm --filter @platform/host build
pnpm --filter @platform/host preview
```

Preview defaults to **http://127.0.0.1:4173** — same port Playwright uses for e2e tests.

## Docker Compose

Production-like static serving through nginx:

```bash
docker compose up --build
```

| Endpoint                     | Purpose             |
| ---------------------------- | ------------------- |
| http://localhost:8080        | Platform SPA        |
| http://localhost:8080/health | Health check (`ok`) |

The image runs a multi-stage build (`Dockerfile`): pnpm install → `@platform/host` build → nginx serves `apps/platform/dist`.

Traefik integration is **not implemented**; example labels are commented in `docker-compose.yml` for future use.

## Workspace commands

| Task                   | Command          |
| ---------------------- | ---------------- |
| Lint                   | `pnpm lint`      |
| Typecheck all packages | `pnpm typecheck` |
| Format                 | `pnpm format`    |
| Unit tests             | `pnpm test:unit` |
| E2e smoke              | `pnpm test:e2e`  |
| Full test suite        | `pnpm test`      |

Filter to one package:

```bash
pnpm --filter @platform/site-registry typecheck
pnpm --filter @platform/ui typecheck
```

## Playwright (first time)

```bash
pnpm exec playwright install chromium
```

Required before `pnpm test:e2e`. Details: [testing.md](./testing.md).

## Shared tooling

TypeScript, ESLint, and Prettier baselines come from `@platform/config`. Packages extend:

- `@platform/config/tsconfig.react.json` — React site packages and host app
- `@platform/config/tsconfig.base.json` — non-React packages (e.g. site-registry)

## Adding a site during development

Follow [creating-a-new-site.md](./creating-a-new-site.md). After editing `catalog.ts`, restart or save-trigger reload; no host changes needed.

## Related docs

- [Architecture overview](../architecture.md)
- [Contributing](../../CONTRIBUTING.md)
- [Testing strategy](./testing.md)
