# Local development

How to run and iterate on the PWA-Base foundation monorepo on the Ubuntu VM.

## Setup

```bash
corepack enable
pnpm install
```

Node **22+** recommended. pnpm **9.15.9** is pinned via `packageManager` in the root
`package.json`.

## Dev server (fastest loop)

```bash
pnpm install
pnpm dev
```

Starts the reference app (`@platform/hello-web`) **in the background** and prints:

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

Foreground alternative:

```bash
pnpm --filter @platform/hello-web dev
```

## Production preview (without Docker)

```bash
pnpm --filter @platform/hello-web build
pnpm --filter @platform/hello-web preview
```

Playwright e2e uses the Hello production preview (see [testing.md](./testing.md)).

## Docker Compose (optional image smoke)

```bash
docker compose up --build
```

Serves the Hello nginx image for a production-like static check. Day-to-day work
should use `pnpm dev`. Published ports are defined in `docker-compose.yml`.

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

- `@platform/config/tsconfig.react.json` — React packages and app entries
- `@platform/config/tsconfig.base.json` — non-React packages

## New apps

- **Sibling product repo** (preferred): [consuming-pwa-base.md](./consuming-pwa-base.md)
- **In-monorepo reference / scaffold**: [creating-a-new-site.md](./creating-a-new-site.md)

## Related docs

- [Architecture overview](../architecture.md)
- [Contributing](../../CONTRIBUTING.md)
- [Testing strategy](./testing.md)
- [Solo packaging](./solo-packaging.md)
