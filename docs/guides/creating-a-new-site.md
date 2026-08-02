# Creating a new site

This guide walks through adding an independently hosted application. Feature code lives in `packages/site-*`; packaging is a thin `apps/*-web` entry. `apps.songara.uk` (`@platform/host`) remains a **catalogue only** — it never imports site packages.

Architecture background: [ADR-004](../adr/004-packageable-applications.md), [solo-packaging.md](./solo-packaging.md), [architecture.md](../architecture.md).

## Overview

1. Create a site package under `packages/` (e.g. `packages/site-example`).
2. Export a `SiteDefinition` via `defineSite(...)` with `basePath: "/"`.
3. Register catalogue metadata (`host`) in `packages/catalog/src/entries.ts` and a loader in `loaders.ts`.
4. Add `apps/<id>-web` packaging (Vite PWA + nginx + Compose Traefik host).
5. Validate with `pnpm typecheck`, `pnpm test`, and local/dev Compose.

## 1. Create the site package

Add a workspace package (name pattern: `@platform/site-<id>`).

**`packages/site-example/package.json`** (adjust names and paths):

```json
{
  "name": "@platform/site-example",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    }
  },
  "dependencies": {
    "@platform/site-registry": "workspace:*",
    "react": "catalog:"
  },
  "devDependencies": {
    "@platform/config": "workspace:*",
    "@types/react": "catalog:",
    "typescript": "catalog:"
  },
  "scripts": {
    "typecheck": "tsc --noEmit -p tsconfig.json"
  }
}
```

Depend on the package for resolution; in source, import from `@platform/site-registry/contract` (not the package root).

**`packages/site-example/tsconfig.json`** — extend the React baseline:

```json
{
  "extends": "@platform/config/tsconfig.react.json",
  "compilerOptions": {
    "rootDir": "src"
  },
  "include": ["src"]
}
```

Run `pnpm install` from the repo root so the workspace picks up the new package.

## 2. Define routes and export the site

**`packages/site-example/src/pages/HomePage.tsx`**:

```tsx
export function HomePage() {
  return (
    <main>
      <h1>Example</h1>
      <p>Application home.</p>
    </main>
  );
}
```

**`packages/site-example/src/index.ts`**:

```ts
import { defineSite } from "@platform/site-registry/contract";
import { HomePage } from "./pages/HomePage.js";

export const exampleSite = defineSite({
  id: "example",
  basePath: "/",
  title: "Example",
  routes: [{ path: "", component: HomePage }],
});
```

Import from `/contract`, not `@platform/site-registry` root (types-only) or `@platform/catalog`.

### Contract reference

| Field                | Example            | Notes                                              |
| -------------------- | ------------------ | -------------------------------------------------- |
| `id`                 | `"example"`        | Stable unique key                                  |
| `basePath`           | `"/"`              | Application root on its own host                   |
| `title`              | `"Example"`        | Shown on the catalogue                             |
| `routes[].path`      | `""` or `"/about"` | Relative to `basePath`                             |
| `routes[].component` | `HomePage`         | Typed `unknown` in registry                        |
| `requiredPackIds`    | `["example-base"]` | Optional Content Packs gate (ADR-005)              |
| `capabilities`       | `["offline", "full-bleed"]` | Optional tags — see `SITE_CAPABILITY` in the contract |

Well-known chrome tags (consumed by `SoloSiteApp`):

- `full-bleed` — full-bleed main content (no inset padding)
- `default-topbar-collapsed` — collapse the mega bar by default

Optional: depend on `@platform/ui` / `@platform/runtime` as needed. See [design system](../design-system/README.md), [content-packs.md](./content-packs.md), [solo-packaging.md](./solo-packaging.md).

## 3. Register in the catalog

Add the site package as a dependency of `@platform/catalog` so the dynamic import resolves for tests/tooling:

**`packages/catalog/package.json`**:

```json
"dependencies": {
  "@platform/site-example": "workspace:*"
}
```

**`packages/catalog/src/entries.ts`** — catalogue metadata (used by `apps.songara.uk`):

```ts
{
  id: "example",
  basePath: "/",
  host: "example.songara.uk",
  title: "Example",
},
```

**`packages/catalog/src/loaders.ts`** — lazy loader (tests / tooling only; catalogue host does not mount sites):

```ts
{
  id: "example",
  load: () => import("@platform/site-example").then((m) => m.exampleSite),
},
```

Do **not** add site imports to `apps/platform`.

## 4. Package and deploy

Copy an existing `apps/*-web` entry (for example `apps/components-web`):

1. Point Vite at the site package and set `base: "/"`.
2. Configure `vite-plugin-pwa` with its own scope / `start_url: "/"`.
3. Add Compose service + Traefik `Host(\`example.songara.uk\`)`.
4. Ensure DNS/TLS for the subdomain at the edge.

See [solo-packaging.md](./solo-packaging.md).

## 5. Validate

```bash
pnpm typecheck
pnpm --filter @platform/catalog test:unit
pnpm --filter @platform/example-web build
pnpm --filter @platform/host build
pnpm --filter @platform/example-web dev   # open http://127.0.0.1:<port>/
```

The catalogue at `apps.songara.uk` / local `:5173` should list “Example” linking to `https://example.songara.uk/`.

## Checklist

- [ ] Site package depends on `@platform/site-registry` and imports from `/contract`
- [ ] `defineSite` with unique `id` and `basePath: "/"`
- [ ] Catalogue `host` in `entries.ts` + loader in `loaders.ts`
- [ ] `apps/<id>-web` packaging entry + Compose Traefik host
- [ ] No site imports in `apps/platform`
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
