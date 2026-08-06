# Creating a new site / app

**Preferred path:** create a **sibling repository** next to `PWA-Base` and depend on
`@songara/pwa-base` — see [consuming-pwa-base.md](./consuming-pwa-base.md).

This guide covers the **in-monorepo** pattern used by the Hello reference
(`packages/site-hello` + `apps/hello-web`), and the optional `pnpm new-app` scaffold for
experiments inside this workspace. Do not reintroduce a catalogue host or product
verticals here ([ADR-007](../adr/007-pwa-base-reusable-foundation.md)).

Architecture: [ADR-004](../adr/004-packageable-applications.md),
[solo-packaging.md](./solo-packaging.md), [architecture.md](../architecture.md),
[content-packs.md](./content-packs.md).

## Quick start — sibling app (recommended)

```bash
# ~/projects/<name>/package.json
# "@songara/pwa-base": "file:../PWA-Base"
```

Copy the Hello packaging shape: a Vite entry that mounts a `defineSite` export via
`SoloSiteApp`, imports `@songara/pwa-base/ui/tokens.css`, and configures PWA. In KanDev
worktrees, run the sibling linker before install (ADR-006).

## Quick start — in-monorepo scaffold

```bash
pnpm new-app <name>          # e.g. pnpm new-app recipe-box
pnpm --filter @platform/<name>-web dev
```

The scaffold typically creates:

| Path | Role |
| --- | --- |
| `packages/site-<name>/` | Site module + starter page (+ optional Content Pack) |
| `apps/<name>-web/` | Solo Vite PWA packaging |

Use this for foundation experiments. Prefer a sibling repo for real products.

---

## Manual overview (monorepo)

1. Create a site package under `packages/` (e.g. `packages/site-example`).
2. Export a `SiteDefinition` via `defineSite(...)` with `basePath: "/"`.
3. Add thin `apps/<id>-web` packaging (mirror `apps/hello-web`).
4. Validate with `pnpm typecheck`, `pnpm test`, and `pnpm --filter @platform/<id>-web dev`.

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

In source, import from `@platform/site-registry/contract` (not the package root).

**`packages/site-example/tsconfig.json`**:

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

### Contract reference

| Field                | Example            | Notes                                              |
| -------------------- | ------------------ | -------------------------------------------------- |
| `id`                 | `"example"`        | Stable unique key                                  |
| `basePath`           | `"/"`              | Application root on its own host                   |
| `title`              | `"Example"`        | Human-readable label                               |
| `routes[].path`      | `""` or `"/about"` | Relative to `basePath`                             |
| `routes[].component` | `HomePage`         | Typed `unknown` in registry                        |
| `requiredPackIds`    | `["example-base"]` | Optional Content Packs gate (ADR-005)              |
| `capabilities`       | `["offline", "full-bleed"]` | Optional tags — see `SITE_CAPABILITY` |

Well-known chrome tags (consumed by `SoloSiteApp`):

- `full-bleed` — full-bleed main content (no inset padding)
- `default-topbar-collapsed` — collapse the mega bar by default

Optional: depend on `@platform/ui` / `@platform/runtime` as needed. See
[design system](../design-system/README.md), [content-packs.md](./content-packs.md),
[solo-packaging.md](./solo-packaging.md).

## 3. Package as a solo Vite app

Copy `apps/hello-web`:

1. Depend on the site package and `@platform/runtime`.
2. Mount with `SoloSiteApp` / the same entry pattern as Hello.
3. Set Vite `base: "/"` and configure `vite-plugin-pwa` with `start_url: "/"`.

There is **no** in-repo catalogue registration step.

## 4. Validate

```bash
pnpm typecheck
pnpm --filter @platform/example-web build
pnpm --filter @platform/example-web dev
```

Open the printed local URL and confirm the home route renders.

## Checklist

- [ ] Site package depends on `@platform/site-registry` and imports from `/contract`
- [ ] `defineSite` with unique `id` and `basePath: "/"`
- [ ] Thin solo Vite entry (Hello pattern) — no catalogue host
- [ ] `pnpm lint`, `pnpm typecheck`, and relevant `pnpm test` pass
- [ ] Prefer promoting real products to a sibling repo + `@songara/pwa-base`
