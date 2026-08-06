# PWA installation

Each application is packaged as its own Progressive Web App with a dedicated origin,
manifest, and service worker. The foundation reference is **Hello**
(`apps/hello-web` / local `pnpm dev`).

Sibling product apps follow the same pattern in their own repositories.

## What you get

- **Standalone window** — opens without browser chrome, scoped to the app origin
- **Offline app shell** — cached UI assets via the service worker; network APIs remain
  network-first unless the app opts into Content Packs / offline strategies
- **Update prompt** — when a new build is deployed, runtime helpers can offer reload or
  defer ([`@platform/runtime`](../../packages/runtime/) / `@songara/pwa-base`)

Push notifications are **not** part of this foundation.

## Install (desktop / Android)

1. Open the app (Hello: `http://127.0.0.1:5182/` via `pnpm dev`)
2. Use the browser’s **Install app** affordance when it appears
3. Launch the app from the applications menu

## Install (iOS Safari)

iOS does not fire `beforeinstallprompt`. Use **Share → Add to Home Screen**.

## Developer notes

| Item | Location |
| ---- | -------- |
| Reference Vite + PWA plugin | `apps/hello-web/vite.config.ts` |
| Manifest / icons | `apps/hello-web/public/` |
| Shared install / update UX | `@platform/runtime` (consumed as `@songara/pwa-base`) |

See [solo-packaging.md](./solo-packaging.md) and
[consuming-pwa-base.md](./consuming-pwa-base.md).
