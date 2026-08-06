# Testing strategy

Foundation tests validate shared packages and the Hello reference PWA. Keep them small
and fast.

See also: [local development](./local-development.md), [architecture overview](../architecture.md),
[creating a new site](./creating-a-new-site.md).

## Unit tests (Vitest)

Run with `pnpm test:unit`.

Root `package.json` filters cover foundation packages (math, physics, export, controls,
markdown, animation, audio, browser, render, ui, runtime, completion-report). Unit tests
live next to source as `*.test.ts` files. Vitest runs in Node; no browser required.

## End-to-end smoke (Playwright)

Run with `pnpm test:e2e`.

Playwright builds and serves the Hello reference app production preview, then checks that
`/` renders Hello World content. This confirms Vite packaging, `SoloSiteApp`, and the
site contract wire together.

Configuration: `playwright.config.ts` at the repo root; specs under `e2e/`
(e.g. `hello.spec.ts`).

## Full suite

`pnpm test` runs unit tests, then e2e smoke tests.

Install Playwright browsers once per machine:

```bash
pnpm exec playwright install chromium
```

## What we do not test here

- Sibling product application repos (own CI)
- Proxmox / production Website Hosting (human deploy after Ubuntu validation)
- Visual or accessibility regression at scale (see [design-system docs](../design-system/)
  when changing shared UI)
