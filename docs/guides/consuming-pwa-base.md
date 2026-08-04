# Consuming `@songara/pwa-base`

This repository is the shared foundation for Songara PWAs. Inside the monorepo,
apps still use `@platform/*` workspace packages. Sibling repositories should
depend on the public package name **`@songara/pwa-base`** and import only from
its documented entry points.

## Public API

| Import | Contents |
| --- | --- |
| `@songara/pwa-base` | Runtime (SoloSiteApp, PackReadyGate, PWA helpers, chrome, packs, preferences) + site contract (`defineSite`, `SITE_CAPABILITY`, types) + UI primitives / theme |
| `@songara/pwa-base/contract` | Site registration contract only (no UI) — preferred for site packages |
| `@songara/pwa-base/ui` | UI primitives (same as root UI exports) |
| `@songara/pwa-base/ui/theme` | Theme helpers |
| `@songara/pwa-base/ui/tokens.css` | Design tokens stylesheet (import once in the app entry) |
| `@songara/pwa-base/config/vite-app-version` | Vite plugin for embedded build identity |
| `@songara/pwa-base/config/tsconfig.*.json` | Shared TypeScript baselines |

### Public (export)

- **Site contract** — `defineSite`, `SITE_CAPABILITY`, `hasSiteCapability`, `SiteDefinition`, related types
- **Runtime** — Content Pack client, readiness gates, connectivity, service-worker update UX, platform preferences, `SoloSiteApp` / `PlatformChrome`, nav helpers
- **UI** — primitives (`Button`, `Stack`, …), `ThemeProvider` / theme controls, tokens CSS
- **Config helpers** — Vite app-version plugin and shared tsconfig JSON

### Internal (do not import from consumers)

- `packages/site-*` (Birthday, Hello, and other product modules)
- `apps/*` packaging hosts
- `packages/catalog` (catalogue metadata + loaders for `apps.songara.uk`)
- Domain packages (`math`, `physics`, `experiences`, `controls`, …) unless later promoted
- Scripts, Docker Compose, telemetry/docs-api services

Existing `@platform/*` imports continue to work **inside this monorepo** for
backwards compatibility. New sibling apps should use `@songara/pwa-base` only.

## Expected sibling folder layout

```text
songara/
  PWA-Base/                 # this repo → package @songara/pwa-base
  my-new-pwa/               # sibling application repo
    package.json
    src/
    …
```

Relative `file:` path assumes the two repos sit next to each other. Adjust the
path if your layout differs.

## How a new PWA should consume this package

### 1. Declare the dependency

```json
{
  "name": "@songara/my-new-pwa",
  "private": true,
  "type": "module",
  "dependencies": {
    "@songara/pwa-base": "file:../PWA-Base",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.6.0"
  }
}
```

Then:

```bash
npm install
# or: pnpm install / yarn
```

No workspace protocol or extra path aliases are required for the public API.
Vite resolves TypeScript sources exported by this package. Cross-package
imports inside the foundation use relative paths so a plain
`file:../PWA-Base` install works with npm or pnpm without nested workspace
linking.

### 2. Define a site module

```ts
import { defineSite, SITE_CAPABILITY } from "@songara/pwa-base/contract";
import { HomePage } from "./pages/HomePage";

export const mySite = defineSite({
  id: "my-app",
  basePath: "/",
  title: "My App",
  capabilities: [SITE_CAPABILITY.offline],
  routes: [{ path: "", component: HomePage }],
});
```

### 3. Mount with shared chrome + theme

```tsx
import { SoloSiteApp, ThemeProvider } from "@songara/pwa-base";
import "@songara/pwa-base/ui/tokens.css";
import { BrowserRouter } from "react-router-dom";
import { mySite } from "./site";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={mySite} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

### 4. Optional Vite helper

```ts
import { appVersionPlugin } from "@songara/pwa-base/config/vite-app-version";
```

### Peer requirements

Consumers must provide React 19 and `react-router-dom` 7.6+ (declared as peer
dependencies). `workbox-window` is bundled as a dependency of `@songara/pwa-base`
for service-worker update helpers.

## Monorepo apps (Birthday, Hello, …)

No import migration is required yet. Keep using:

```ts
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { defineSite } from "@platform/site-registry/contract";
```

Those packages remain the internal implementation behind `@songara/pwa-base`.

For **new sites inside this monorepo**, prefer `pnpm new-app <name>` — see
[creating-a-new-site.md](./creating-a-new-site.md).

## Remaining work before publishing (GitHub Packages / npm)

1. Flip `"private": false` (or publish with an explicit override) and choose a
   semver policy aligned with `VERSION` / `pnpm version:bump`.
2. Decide registry: GitHub Packages (`@songara` scope) vs public npm; configure
   `.npmrc` / `publishConfig.registry` and CI auth.
3. Add a build step that emits stable `dist/` JS (and `.d.ts`) so consumers are
   not forced to transpile raw TypeScript / CSS modules from source — then point
   `exports` at `dist`.
4. Trim or dual-publish config subpaths; consider shipping only runtime + contract
   + UI in the published tarball.
5. Review chrome nav (`PLATFORM_NAV_*`) for multi-product reuse — today it
   reflects the Songara catalogue; sibling apps may later need injectable nav.
6. Add a CI job that installs a fixture app via `file:` (and later the published
   tarball) and typechecks / smoke-builds it.
7. Document Content Pack hosting for apps that live outside this monorepo
   (`content-pack:sync` currently assumes in-repo site packages).

Until those land, **`file:../PWA-Base` is the supported consumption path**.
