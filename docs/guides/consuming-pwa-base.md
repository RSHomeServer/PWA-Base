# Consuming `@songara/pwa-base`

This repository is the shared foundation for Songara PWAs. Inside the monorepo,
apps still use `@platform/*` workspace packages. Sibling repositories should
depend on the public package name **`@songara/pwa-base`** and import only from
its documented entry points below.

The table matches the root `package.json` `exports` map. Prefer the narrowest
subpath that fits (e.g. `/contract` for site packages, `/ui` for primitives
only).

## Public API — entry points

| Import | Contents |
| --- | --- |
| `@songara/pwa-base` | Runtime (SoloSiteApp, PackReadyGate, PWA helpers, injectable chrome, packs, preferences) + site contract (`defineSite`, `SITE_CAPABILITY`, types) + UI primitives / theme / charts |
| `@songara/pwa-base/contract` | Site registration contract only (no UI) — preferred for site packages |
| `@songara/pwa-base/ui` | UI primitives, theme controls, chart helpers |
| `@songara/pwa-base/ui/theme` | Theme helpers only |
| `@songara/pwa-base/ui/tokens.css` | Design tokens stylesheet (import once in the app entry) |
| `@songara/pwa-base/config/vite-app-version` | Vite plugin for embedded build identity |
| `@songara/pwa-base/config/tsconfig.base.json` | Shared TypeScript baseline |
| `@songara/pwa-base/config/tsconfig.react.json` | React TypeScript baseline |
| `@songara/pwa-base/config/tsconfig.node.json` | Node TypeScript baseline |
| `@songara/pwa-base/completion-report` | `RunCompletionSummary` types, normalisation, markdown format, section contract |
| `@songara/pwa-base/controls` | Parameter panels for interactive UIs |
| `@songara/pwa-base/math` | Numeric / stats helpers |
| `@songara/pwa-base/physics` | Shared simulation / physics helpers |
| `@songara/pwa-base/export` | Browser download helpers (`downloadText`, `downloadBlob`, `downloadCanvasPng`) |
| `@songara/pwa-base/markdown` | Markdown rendering component |
| `@songara/pwa-base/markdown/styles.css` | Markdown stylesheet |
| `@songara/pwa-base/animation` | Motion hooks (`useReducedMotion`, `useInView`, …) and `ParticleField` |
| `@songara/pwa-base/audio` | Web Audio master graph, `AudioEngineProvider`, analysis helpers |
| `@songara/pwa-base/browser` | Browser capability probes, storage / network / display hooks, benchmarks |
| `@songara/pwa-base/render` | Canvas setup, render/lab shells, animation-frame and pointer helpers |
| `@songara/pwa-base/preview/<name>` | **Preview** curated OSS integrations ([ADR-008](../adr/008-preview-stable-capability-lifecycle.md)) — unstable; see below |

### Preview entry points

Preview exports are **opt-in and unstable**. They never appear on the root
`@songara/pwa-base` barrel. Install declared peer dependencies in the consumer.
Lifecycle and Wave 1 plan: [preview-packages.md](./preview-packages.md),
[capability-lifecycle.md](./capability-lifecycle.md).

| Import | Status | Contents |
| --- | --- | --- |
| `@songara/pwa-base/preview/motion` | **Live** | Thin Motion integration + reduced-motion-aware helpers (`packages/preview-motion`) |
| `@songara/pwa-base/preview/dexie` | **Live** | Dexie core factory / migration helpers (no Cloud; `packages/preview-dexie`) |
| `@songara/pwa-base/preview/lottie` | **Live** | Narrow `lottie-react` player + reduced-motion freeze (`packages/preview-lottie`) |
| `@songara/pwa-base/preview/rive` | **Live** | Thin `@rive-app/react-canvas` + reduced-motion pause (`packages/preview-rive`) |
| `@songara/pwa-base/preview/gsap` | **Live** | Thin GSAP + reduced-motion timeline helpers (`packages/preview-gsap`) |
| `@songara/pwa-base/preview/tsparticles` | **Live** | Thin tsparticles slim/React + reduced-motion freeze (`packages/preview-tsparticles`) |
| `@songara/pwa-base/preview/rapier2d` | **Live** | Rapier2D WASM/compat world bootstrap (`packages/preview-rapier2d`) |
| `@songara/pwa-base/preview/matter` | **Live** | Thin Matter.js engine helpers (`packages/preview-matter`) |
| `@songara/pwa-base/preview/planck` | **Live** | Thin Planck.js world bootstrap (`packages/preview-planck`) |
| `@songara/pwa-base/preview/cannon` | **Live** | Thin cannon-es world bootstrap (`packages/preview-cannon`) |
| `@songara/pwa-base/preview/react-webcam` | **Live** | Thin react-webcam constraints helpers (`packages/preview-react-webcam`) |
| `@songara/pwa-base/preview/tone` | **Live** | Thin Tone.js transport helpers — does not replace `/audio` (`packages/preview-tone`) |
| `@songara/pwa-base/preview/howler` | **Live** | Thin Howler SFX façade — does not replace `AudioEngineProvider` (`packages/preview-howler`) |
| `@songara/pwa-base/preview/idb` | **Live** | Thin idb helpers + Songara naming (`packages/preview-idb`) |
| `@songara/pwa-base/preview/localforage` | **Live** | Thin localForage instance helpers + Songara naming (`packages/preview-localforage`) |

Rows above are live when `packages/preview-*` exists and root `exports` wires the path.
Install declared peers in the consumer; do not invent parallel wrapper APIs.

### Root / contract / UI

- **Site contract** — `defineSite`, `SITE_CAPABILITY`, `hasSiteCapability`, `SiteDefinition`, related types (`/contract` or root)
- **Runtime** (root) — Content Pack client, `PackReadyGate` / `useAppReady`, connectivity, service-worker update UX, platform preferences, `SoloSiteApp` / `PlatformChrome`, injectable nav types and helpers
- **UI** — primitives (`Button`, `Stack`, …), `ThemeProvider` / theme controls, charts, tokens CSS
- **Config helpers** — Vite app-version plugin and shared tsconfig JSON

### Kits (dedicated subpaths)

Import kits from their subpath, not from deep `@platform/*` paths in sibling apps:

```ts
import { useReducedMotion } from "@songara/pwa-base/animation";
import { AudioEngineProvider } from "@songara/pwa-base/audio";
import { detectBrowserIdentity } from "@songara/pwa-base/browser";
import { prepareCanvas, RenderShell } from "@songara/pwa-base/render";
import { ParameterPanel } from "@songara/pwa-base/controls";
import { clamp, lerp } from "@songara/pwa-base/math";
import { downloadText } from "@songara/pwa-base/export";
import { Markdown } from "@songara/pwa-base/markdown";
import "@songara/pwa-base/markdown/styles.css";
import {
  formatCompletionSummaryMarkdown,
  type RunCompletionSummary,
} from "@songara/pwa-base/completion-report";
```

Kit APIs are the package `src/index.ts` barrels re-exported via `exports`. See each
`packages/<kit>/src/index.ts` for the full symbol list.

### Preview (opt-in)

```ts
import {
  motion,
  useSongaraMotion,
  useMotionTransition,
} from "@songara/pwa-base/preview/motion";
// Peer: pnpm add motion

import {
  Dexie,
  createSongaraDb,
  songaraDbName,
} from "@songara/pwa-base/preview/dexie";
// Peer: pnpm add dexie

import {
  SongaraLottie,
  useSongaraLottiePlayback,
} from "@songara/pwa-base/preview/lottie";
// Peer: pnpm add lottie-react

import {
  useRive,
  useSongaraRivePlayback,
} from "@songara/pwa-base/preview/rive";
// Peer: pnpm add @rive-app/react-canvas

import { gsap, useSongaraGsapPlayback } from "@songara/pwa-base/preview/gsap";
// Peer: pnpm add gsap

import {
  Particles,
  ParticlesProvider,
  loadSlim,
  useSongaraParticlesMotion,
} from "@songara/pwa-base/preview/tsparticles";
// Peers: pnpm add @tsparticles/react @tsparticles/slim

import {
  createSongaraRapierWorld,
  songaraFixedStepSeconds,
} from "@songara/pwa-base/preview/rapier2d";
// Peer: pnpm add @dimforge/rapier2d-compat

import { Matter, createSongaraMatterEngine } from "@songara/pwa-base/preview/matter";
// Peer: pnpm add matter-js

import { createSongaraPlanckWorld } from "@songara/pwa-base/preview/planck";
// Peer: pnpm add planck

import { createSongaraCannonWorld } from "@songara/pwa-base/preview/cannon";
// Peer: pnpm add cannon-es

import {
  Webcam,
  songaraWebcamConstraints,
} from "@songara/pwa-base/preview/react-webcam";
// Peer: pnpm add react-webcam

import { Transport, resolveToneTransport } from "@songara/pwa-base/preview/tone";
// Peer: pnpm add tone — does not replace @songara/pwa-base/audio

import { createSongaraSfx } from "@songara/pwa-base/preview/howler";
// Peer: pnpm add howler — does not replace AudioEngineProvider

import { openSongaraDb } from "@songara/pwa-base/preview/idb";
// Peer: pnpm add idb

import { createSongaraLocalforage } from "@songara/pwa-base/preview/localforage";
// Peer: pnpm add localforage
```

Preview surfaces never appear on the root `@songara/pwa-base` barrel.

### Injectable chrome

Solo apps default to **no mega-bar**. Pass an explicit `PlatformNavConfig` when a
host needs catalogue-style navigation — there are no hardcoded product hosts in
the foundation.

```tsx
import {
  SoloSiteApp,
  ThemeProvider,
  type PlatformNavConfig,
} from "@songara/pwa-base";
import "@songara/pwa-base/ui/tokens.css";
import { BrowserRouter } from "react-router-dom";
import { mySite } from "./site";

const nav: PlatformNavConfig = {
  home: {
    id: "home",
    label: "Home",
    href: "https://apps.example.com/",
    external: false,
    description: "App catalogue",
  },
  groups: [
    {
      id: "tools",
      label: "Tools",
      blurb: "Shared utilities",
      links: [
        {
          id: "my-app",
          label: "My App",
          href: "https://apps.example.com/my-app/",
          external: false,
          description: "This app",
        },
      ],
    },
  ],
};

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={mySite} nav={nav} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
```

Omit `nav` (or pass `null`) for a chrome shell without the mega-bar. You can also
mount `PlatformChrome` / `PlatformNavProvider` directly when not using
`SoloSiteApp`. Helpers: `hasPlatformNav`, `platformNavLogoUrl`,
`platformNavLinkProps`, `NavLogoChip`.

### Content Packs and preferences

- **Packs** — `installContentPack`, `ensureRequiredPacks`, `PackReadyGate`,
  `getPackEntryText`, … (root). Guide: [content-packs.md](./content-packs.md).
- **Preferences** — `usePlatformPreferences`, `loadPlatformPreferences`,
  `patchPlatformPreferences`, … (root). Guide:
  [platform-preferences.md](./platform-preferences.md). Prefer
  `@songara/pwa-base` imports from sibling apps.

### Internal (do not import from consumers)

- `packages/site-*` (including the Hello reference module — copy the pattern, do not import it)
- `apps/*` packaging entries (including `hello-web`)
- Workspace package names (`@platform/*`) from **sibling** apps — use `@songara/pwa-base` subpaths instead
- Scripts and Docker Compose for this monorepo

Existing `@platform/*` imports continue to work **inside this monorepo** for
backwards compatibility. New sibling apps should use `@songara/pwa-base` only.

## Expected sibling folder layout

```text
songara/                    # or ~/projects/
  PWA-Base/                 # this repo → package @songara/pwa-base
  my-new-pwa/               # sibling application repo
    package.json
    src/
    …
```

Relative `file:` path assumes the two repos sit next to each other. Adjust the
path if your layout differs.

### KanDev / isolated worktrees

KanDev materialises app worktrees under `~/.kandev/tasks/<task>/<App>/`, so
`../PWA-Base` is missing unless the task directory mirrors the primary layout.

**Do not change application `package.json` to work around this.** Keep
`file:../PWA-Base` so primary checkouts and future Songara PWAs stay identical.

Supported workflow (automatic once agents/scripts follow it):

1. **Prefer multi-repo tasks** — attach `PWA-Base` beside the app (KanDev
   `add_branch_to_task` / workspace sources). KanDev may name a branch worktree
   `PWA-Base-main`; that is fine.
2. **Run the generic linker** from the consumer app root before `npm install`:

   ```bash
   node "${SONGARA_PROJECTS_ROOT:-$HOME/projects}/PWA-Base/scripts/ensure-sibling-file-deps.mjs"
   ```

   The script reads `file:../…` dependencies and creates the missing sibling
   symlinks (task-local worktree or `$SONGARA_PROJECTS_ROOT`, default
   `~/projects`). It is safe/no-op when siblings already exist and applies to
   every future Songara PWA without per-app changes.

3. **Overrides** — `SONGARA_PROJECTS_ROOT`, or `SONGARA_SIBLING_PWA_BASE=/abs/path`
   when a specific checkout should be consumed.

Primary `~/projects/<App>` development is unchanged: `../PWA-Base` already
exists as a real directory, so the linker is a no-op.

Details: [ADR-006](../adr/006-kandev-sibling-file-deps.md).

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

## Monorepo apps (Hello reference)

No import migration is required for in-repo packages. Keep using:

```ts
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { defineSite } from "@platform/site-registry/contract";
```

Those packages remain the internal implementation behind `@songara/pwa-base`.

For **new sites inside this monorepo**, prefer `pnpm new-app <name>` — see
[creating-a-new-site.md](./creating-a-new-site.md). The only reference product in
this repo is Hello (`apps/hello-web` / `packages/site-hello`).

## Remaining work before publishing (GitHub Packages / npm)

Not in scope for day-to-day foundation work; tracked here so consumers know the
gaps:

1. Flip `"private": false` (or publish with an explicit override) and choose a
   semver policy aligned with `VERSION` / `pnpm version:bump`.
2. Decide registry: GitHub Packages (`@songara` scope) vs public npm; configure
   `.npmrc` / `publishConfig.registry` and CI auth.
3. Add a build step that emits stable `dist/` JS (and `.d.ts`) so consumers are
   not forced to transpile raw TypeScript / CSS modules from source — then point
   `exports` at `dist`.
4. Trim or dual-publish config subpaths; decide which kit packages ship in the
   published tarball vs stay `file:`-only.
5. Add a CI job that installs a fixture app via `file:` (and later the published
   tarball) and typechecks / smoke-builds it against every documented entry point.
6. Document Content Pack hosting for apps that live outside this monorepo
   (`content-pack:sync` currently assumes in-repo site packages).

Until those land, **`file:../PWA-Base` is the supported consumption path**.
Isolated worktrees use the KanDev sibling layout +
`scripts/ensure-sibling-file-deps.mjs` (see above), not published packages.
