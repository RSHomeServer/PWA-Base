# Testing strategy

Platform foundation tests validate the host shell and site registry before any site packages exist. Keep them small and fast.

See also: [local development](./local-development.md), [architecture overview](../architecture.md), [creating a new site](./creating-a-new-site.md).

## Unit tests (Vitest)

Run with `pnpm test:unit`.

| Package             | Scope                                                  |
| ------------------- | ------------------------------------------------------ |
| `@platform/catalog` | `getSites()` returns registered sites (`stats`, `viz`) |
| `@platform/host`    | Host utilities such as route path joining              |

Unit tests live next to source as `*.test.ts` files. Vitest runs in Node; no browser required.

## End-to-end smoke (Playwright)

Run with `pnpm test:e2e`.

Playwright builds the host, serves the production preview, and checks that `/` renders the landing page (heading and empty-catalog message). This confirms the Vite build, router wiring, and registry integration work together.

Configuration: `playwright.config.ts` at the repo root; specs under `e2e/`.

## Full suite

`pnpm test` runs unit tests, then e2e smoke tests.

Install Playwright browsers once per machine:

```bash
pnpm exec playwright install chromium
```

## What we do not test here

- Individual site packages (added later under `apps/` or `packages/`)
- Docker image/runtime (owned separately)
- Visual or accessibility regression (see [design-system docs](../design-system/) when sites exist)
