# Milestone 0 — Rationalisation Plan (T0.2)

**Repo:** PWA-Base (`@songara/pwa-base`)  
**Branch:** `feature/discovery-repository-uv2`  
**Date:** 2026-08-06  
**Input:** `docs/artifacts/milestone-0-rationalisation/inventory.md` (T0.1, `bc82aa5`)  
**Status:** Awaiting **user approval** before T0.3 starts.

**Vision target:** reusable foundation — runtime, UI, rendering, animation, physics, audio, storage, networking, controls, utilities, PWA platform services, shared documentation, `.kandev`, plus **exactly one** minimal reference application. Product apps are deleted (clone exists elsewhere); documentation rewrites are Milestone 1.

**Disposition legend**

| Tag | Meaning |
| --- | --- |
| **Keep** | Remains in the foundation (may need decoupling in T0.3). |
| **Extract then delete** | Product vertical; extract listed components in T0.3, then delete in T0.4. |
| **Delete immediately** | No worthwhile reusable core beyond what T0.3 already extracted elsewhere; remove in T0.4 with no further extraction. |

Inventory recommendations that conflict with this plan are overridden here and called out under §4.

---

## 1. Disposition table

### 1.1 Published surface

| Item | Disposition | Notes |
| --- | --- | --- |
| `src/index.ts` | **Keep** | Stop re-exporting Songara `PLATFORM_NAV_*` after X1. Add subpath re-exports for newly published packages (§2). |
| `src/contract.ts` | **Keep** | Site registration contract unchanged in role. |
| `package.json` `exports` / `files` | **Keep** | Expand allowlist after extractions (see §2 public API). |

### 1.2 Apps

| Item | Disposition | Notes |
| --- | --- | --- |
| `apps/hello-web` | **Keep** | Sole reference app (`pnpm dev` target). |
| `apps/birthday-web` | **Extract then delete** | Thin shell; extraction is in `site-birthday`. |
| `apps/memories-web` | **Extract then delete** | Thin shell; extraction is in `site-memories` / experiences decision. |
| `apps/viz-web` | **Extract then delete** | Thin shell; extraction is in `site-viz`. |
| `apps/browser-lab-web` | **Extract then delete** | Thin shell; extraction is in `site-browser-lab`. |
| `apps/stats-web` | **Extract then delete** | Thin shell; extraction is in `site-stats`. |
| `apps/components-web` | **Delete immediately** | Second showcase app; design-system docs → Milestone 1. No extraction. |
| `apps/docs-web` | **Delete immediately** | Songara docs browser UI; not foundation. |
| `apps/dashboard-web` | **Extract then delete** | Moves with telemetry; extract only if tied to X10. |
| `apps/platform` (`@platform/host`) | **Extract then delete** | Catalogue host; extract motion hooks (X7), then delete. |
| `apps/telemetry` | **Extract then delete** | Product AI-dev service — extract completion-report contract + capture entry (X10), then delete. |
| `apps/docs-api` | **Delete immediately** | Node docs explorer API; path sandbox not required for PWA foundation (clone retains it). |

### 1.3 Packages — infrastructure

| Item | Disposition | Notes |
| --- | --- | --- |
| `packages/runtime` | **Keep** | Decouple chrome (X1). Content packs already foundation (inventory E2). |
| `packages/site-registry` | **Keep** | Contract/registration survives without catalogue. Soften `CatalogEntryMeta.host` semantics in types comments only if needed for typecheck; no catalogue package required. |
| `packages/ui` | **Keep** | Receive Sparkline/Gauge/AnalysisChart (X8). |
| `packages/config` | **Keep** | |
| `packages/controls` | **Keep** | Publish (X11). |
| `packages/math` | **Keep** | Publish (X11). |
| `packages/physics` | **Keep** | Named vision capability; package tests are enough without viz. Publish (X11). |
| `packages/export` | **Keep** | Publish (X11). |
| `packages/markdown` | **Keep** | Publish (X11). |
| `packages/experiences` | **Delete immediately** | Product Memory Experience stages (SnowGlobe/MusicBox/FridgeDoor). Not a named vision package; clone retains it. |
| `packages/catalog` | **Delete immediately** | Songara product catalogue metadata + loaders. |

### 1.4 Packages — product sites

| Item | Disposition | Notes |
| --- | --- | --- |
| `packages/site-hello` | **Keep** | Reference site + hello-base pack. |
| `packages/site-birthday` | **Extract then delete** | X2 LanternField, X3 motion hooks; **do not** extract opening ritual, bedroom scene, or FindUsMoment. |
| `packages/site-memories` | **Delete immediately** | After birthday is gone, FindUsMoment has no foundation consumer. Do not extract constellation. |
| `packages/site-viz` | **Extract then delete** | X4 render shell/RAF/canvas, X5 audio engine core; **do not** extract cymatics demos or illusion exhibits. |
| `packages/site-browser-lab` | **Extract then delete** | X6 probes, X8 Sparkline/Gauge (via ui), X3 `useReducedMotion` dedupe. |
| `packages/site-stats` | **Extract then delete** | X8 AnalysisChart only. |
| `packages/site-components` | **Delete immediately** | With `components-web`. |
| `packages/site-docs` | **Delete immediately** | With `docs-web` / `docs-api`. |
| `packages/site-dashboard` | **Delete immediately** | With telemetry (after X10). No separate UI extraction. |

### 1.5 Repo-level infrastructure

| Item | Disposition | Notes |
| --- | --- | --- |
| `scripts/dev-server.mjs` | **Keep** | Remains hello-web only. |
| `scripts/ensure-sibling-file-deps.mjs` | **Keep** | ADR-006; load-bearing for consumers. |
| `scripts/sync-content-pack.mjs` | **Keep** | |
| `scripts/bump-version.mjs` | **Keep** | |
| `scripts/new-app.mjs` | **Keep** | T0.5: strip catalogue/`nav.ts`/`logoAccent`/`*.songara.uk` patches; scaffold hello-style solo app only. |
| `scripts/sync-birthday-pack.mjs` | **Delete immediately** | With birthday. |
| `scripts/capture-birthday-previews.mjs` | **Delete immediately** | With birthday. |
| `scripts/generate-catalogue-logo-placeholders.mjs` | **Delete immediately** | With catalogue. |
| `scripts/telemetry-hook.sh` | **Delete immediately** | Moves conceptually with telemetry product; remove from this repo after X10. Milestone 1 updates hook docs. |
| `e2e/host.spec.ts` | **Delete immediately** | With host. |
| `e2e/dashboard-report.spec.ts` | **Delete immediately** | With dashboard/telemetry. |
| `e2e/birthday-launcher-smoke.spec.ts` | **Delete immediately** | With birthday. |
| `playwright.config.ts` | **Keep** | T0.5: slim to hello smoke only. |
| `playwright.birthday-smoke.config.ts` | **Delete immediately** | With birthday. |
| `docker-compose.yml` | **Keep** | T0.4 strips product services; T0.5 decides whether any Compose remains (likely hello-only or remove). |
| Root `Dockerfile` | **Keep** structure | T0.4/T0.5: stop building catalogue host; replace with hello image or remove. |
| `docker/nginx-spa.conf` | **Keep** | Generic SPA template. |
| `docker/nginx-catalogue.conf` | **Delete immediately** | With host. |
| `docker/nginx-dashboard.conf` | **Delete immediately** | With dashboard. |
| `docker/nginx-docs.conf` | **Delete immediately** | With docs. |
| `docker/nginx.conf` | **Keep** or slim | Retain only if still referenced by retained image. |
| `config/docs-explorer.roots.json` | **Delete immediately** | With docs-api. |
| Root `package.json` scripts | **Keep** file | T0.4/T0.5 remove product scripts (`birthday:*`, `telemetry:*`, `docs-api:*`, `dev:host`, `capture:birthday-previews`); retarget `test:unit` filters; replace `capture:artifacts` with X10 script path. |
| `pnpm-workspace.yaml` | **Keep** | Globs stay; empty dirs gone after deletes. |
| `docs/artifacts/milestone-0-rationalisation/` | **Keep through M0** | T0.5 relocates or removes after close-out. |
| `.kandev/` | **Keep / create** | T0.5 establishes minimal first-class directory (§4). |

**Inventory overrides (explicit):**

| Inventory lean | Plan decision | Why |
| --- | --- | --- |
| docs-api “maybe keep” / extract `fs-access` | **Delete immediately** | Not a PWA foundation capability; clone preserves tooling. |
| site-components “optional keep” | **Delete immediately** | Violates “exactly one” reference app; Milestone 1 owns design-system docs. |
| experiences “keep as library?” | **Delete immediately** | Product-coupled R3F stages; vision does not require this package in-repo. |
| FindUsMoment / opening / bedroom / cymatics as extraction candidates | **Do not extract** | Prefer delete; high product coupling; clone is safety net. |
| E16 docs-api sandbox | **Do not extract** | Same as docs-api delete. |

---

## 2. Extraction specification (T0.3)

Extract **only** the items below, one capability per commit, full validation green between commits. Strip product naming, copy, theming, assets, and product-only branches. Product apps keep compiling by importing the new homes until T0.4 deletes them.

### X1 — Injectable platform chrome (inventory E1)

| Field | Spec |
| --- | --- |
| **Source** | `packages/runtime/src/chrome/{nav.ts,logoAccent.ts,MegaBar.tsx,PlatformChrome.tsx,NavLogoChip.tsx}` + `SoloSiteApp.tsx` |
| **Destination** | `packages/runtime` (extend; do not create a new package) |
| **Why in PWA-Base** | Shared PWA chrome shell with optional navigation — foundation, not a Songara catalogue. |
| **Refactoring** | Remove hardcoded `PLATFORM_NAV_*` Songara hosts from default runtime. Introduce `PlatformNavConfig` (groups/links/logos/accents) passed into `PlatformChrome` / provided via React context. `SoloSiteApp` defaults to **no mega-bar** (or empty nav) unless the site opts in with an explicit nav config prop/capability. Rename preference keys away from `songara-platform-prefs:*` / `songara-topbar-collapsed` to product-neutral keys (e.g. `pwa-base-platform-prefs:v1`). Stop exporting Songara catalogue constants from `packages/runtime/src/index.ts` and `src/index.ts`. Host app may pass its own config until deleted. |
| **Public API** | Export `PlatformChrome`, `PlatformNavConfig` types, and helpers that do **not** embed Songara URLs. Remove `PLATFORM_NAV_GROUPS` et al. from `@songara/pwa-base`. |
| **Tests** | Unit: chrome renders children without nav; with injected config, links render; no `*.songara.uk` in runtime package source. Update/remove `nav.test.ts` assertions on Songara hosts. |

### X2 — Generic particle / wish field (inventory E3)

| Field | Spec |
| --- | --- |
| **Source** | `packages/site-birthday/src/components/LanternField.tsx` (+ CSS) |
| **Destination** | **New** `packages/animation` — vision names **animation**. |
| **Why in PWA-Base** | Reusable animated particle/field primitive for PWAs. |
| **Refactoring** | Rename away from lantern/wish/birthday; parameterise particle glyph, palette, pool source, reduced-motion behaviour. No birthday copy or keepsake tokens. |
| **Public API** | Package export + `@songara/pwa-base/animation` subpath (and `files` allowlist). |
| **Tests** | Component/unit tests with fake timers or reduced-motion path; no dependency on `site-birthday`. Birthday temporarily imports from `@platform/animation`. |

### X3 — Motion / viewport hooks (inventory E5, partial E20)

| Field | Spec |
| --- | --- |
| **Source** | Birthday `useReducedMotion`, `useInView`, `useParallax`; browser-lab duplicate `useReducedMotion`; host `useSectionReveal` (and optionally `useHeroParticles` / `useAtmosphereBreath` if they generalise cleanly — otherwise skip host particle hooks and delete with host). |
| **Destination** | `packages/animation` (hooks) — same new package as X2. |
| **Why in PWA-Base** | Cross-app UI motion utilities. |
| **Refactoring** | Single `useReducedMotion`; neutral names; no Songara/host copy. **Skip** hooks that only exist to drive catalogue hero atmosphere if they cannot be made product-neutral in &lt; ~100 LOC each. |
| **Public API** | `@songara/pwa-base/animation` hooks exports. |
| **Tests** | Hook tests with mocked `matchMedia` / `IntersectionObserver`. |

### X4 — Canvas / lab render shell (inventory E9, E10)

| Field | Spec |
| --- | --- |
| **Source** | `packages/site-viz/src/lab/*` (shell/toolbar/transport/types), `flagship/shared/{useAnimationFrame,FlagshipShell,rng,pointer,storage,canvasStyles}` , `canvas/setup.ts` as applicable |
| **Destination** | **New** `packages/render` — vision names **rendering**. |
| **Why in PWA-Base** | Shared canvas/WebGL lab chrome and RAF loop for interactive demos. |
| **Refactoring** | Strip viz-specific copy, illusion titles, and exhibit registries. Keep shell, RAF, pointer/rng/storage helpers, canvas setup. Rename Flagship/Lab branding to neutral `RenderShell` / `LabShell`. |
| **Public API** | `@songara/pwa-base/render` (+ `files`). |
| **Tests** | Unit tests for RAF helper, rng, shell render with stub children; no `site-viz` import. |

### X5 — Web Audio engine core (inventory E11)

| Field | Spec |
| --- | --- |
| **Source** | `packages/site-viz/.../audio-lab/engine/*` (graph, synth core, shared utilities). **Exclude** demo-only stems/drums/song arrangements that are exhibit content. |
| **Destination** | **New** `packages/audio` — vision names **audio**. |
| **Why in PWA-Base** | Reusable Web Audio graph/synth building blocks (may use `@platform/physics` oscillators). |
| **Refactoring** | Product-neutral module names; no viz lab routes or stem asset packs. Depend on `physics`/`math` only where already used for oscillators. |
| **Public API** | `@songara/pwa-base/audio` (+ `files`). |
| **Tests** | Node/jsdom tests with mocked `AudioContext` where feasible; prove engine constructs and tears down without viz. |

### X6 — Browser capability probes (inventory E13)

| Field | Spec |
| --- | --- |
| **Source** | `packages/site-browser-lab/src/sections/**` probe logic + related hooks (not lab chrome/Flourish/TelemetryParticles theming). |
| **Destination** | **New** `packages/browser` — vision names **browser services**. |
| **Why in PWA-Base** | Detect/report browser capabilities (display, network, storage, audio, graphics, input, performance). |
| **Refactoring** | Export probe functions/hooks and result types; strip Browser Lab layout, theming, and marketing chrome. |
| **Public API** | `@songara/pwa-base/browser` (+ `files`). |
| **Tests** | Unit tests with mocked `navigator` / APIs per section. |

### X7 — Host motion hooks (inventory E20) — conditional

| Field | Spec |
| --- | --- |
| **Source** | `apps/platform/src/hooks/{useHeroParticles,useAtmosphereBreath,useSectionReveal}.ts` |
| **Destination** | `packages/animation` if generalisable; else **skip** (delete with host). |
| **Why in PWA-Base** | Atmosphere/scroll reveal utilities for marketing shells. |
| **Refactoring** | Only extract if product-neutral API is clear; `useSectionReveal` likely merges into X3. Do **not** preserve catalogue landing choreography. |
| **Public API** | Same as X3 if extracted. |
| **Tests** | Same as X3. |
| **Gate** | If extraction would take &gt; ~0.5 day of product stripping, **skip** and delete with host. Record skip in T0.3 report. |

### X8 — Chart primitives (inventory E14, E15)

| Field | Spec |
| --- | --- |
| **Source** | `site-browser-lab` `Sparkline`, `Gauge`; `site-stats` `AnalysisChart` |
| **Destination** | `packages/ui` (extend; charts under e.g. `src/charts/`) |
| **Why in PWA-Base** | Reusable UI visualisation primitives. |
| **Refactoring** | Neutral props; no lab/stats product colours baked as sole theme — use CSS variables / tokens. |
| **Public API** | Via `@songara/pwa-base/ui` (existing subpath). |
| **Tests** | Render smoke tests; scale helpers if extracted. |

### X9 — Publish existing shared packages (inventory E17, E21)

| Field | Spec |
| --- | --- |
| **Source** | Already in `packages/{controls,math,physics,export,markdown}` |
| **Destination** | Same packages; update root `package.json` `exports` + `files` |
| **Why in PWA-Base** | Named or established foundation libs currently unpublished. |
| **Refactoring** | None beyond export surface and brief package README (API docs only). |
| **Public API** | Subpaths: `./controls`, `./math`, `./physics`, `./export`, `./markdown` (mirror existing `./ui` pattern). |
| **Tests** | Existing package tests must remain green; add export smoke if missing. |

### X10 — Completion-report contract + capture entrypoint (inventory E18, E19)

| Field | Spec |
| --- | --- |
| **Source** | `apps/telemetry/src/types.ts`, `completion-report-contract.ts`, `completion-summary.ts` (+ their tests); capture CLI under `apps/telemetry/src/artifacts/*` **only** if it can run without the telemetry HTTP service |
| **Destination** | **New** `packages/completion-report` (engineering contract SoT). Capture: prefer `scripts/capture-artifacts.mjs` that imports the package, **or** a bin in the package — must not require `apps/telemetry` at runtime. |
| **Why in PWA-Base** | `CURSOR.md` / always-on Cursor rule / agent DoD depend on this contract; it must survive telemetry deletion. |
| **Refactoring** | Strip Cursor-task/ops/ntfy service types that are telemetry-server-only. Keep `RunCompletionSummary` shape + validation used by reporting. If artifact capture is inseparable from the SQLite/WS service, **move capture out of this repo with telemetry** and leave a stub script that prints “capture lives in the telemetry product repo” — but **always** keep the contract package. Flag Milestone 1 to retarget prose. |
| **Public API** | Workspace package `@platform/completion-report`; optionally `@songara/pwa-base/completion-report` if agents consume via the published name — **recommend publish** so rules can point at a stable import. Root script `capture:artifacts` retargeted. |
| **Tests** | Port `completion-report-contract.test.ts`, `types.test.ts`, `completion-summary.test.ts`. |

### Explicitly **not** extracted (delete with products)

| Inventory ID | Reason |
| --- | --- |
| E4 Opening / ritual motion | Keepsake-specific; high coupling. |
| E6 Bedroom scene | Product authoring (~5k+). |
| E7 FindUsMoment / constellation | Product moment; birthday deleted first removes consumer. |
| E8 `packages/experiences` | Product stages; delete whole package. |
| E12 Cymatics demo | Product exhibit; physics package remains. |
| E16 docs-api `fs-access` | Tooling not required in foundation. |
| Dashboard UI modules | Telemetry product surface. |
| Catalogue loaders / logos | Songara catalogue. |

### New packages summary (T0.3 creates)

| Package | Vision justification |
| --- | --- |
| `packages/animation` | animation |
| `packages/render` | rendering |
| `packages/audio` | audio |
| `packages/browser` | browser services |
| `packages/completion-report` | engineering contract required by agent workflow (foundation-adjacent; required for safe telemetry removal) |

Prefer extending `runtime` / `ui` where noted; do not create packages beyond this list.

---

## 3. Deletion list and build-green batches (T0.4)

**Precondition:** All of §2 extractionsions landed and validated; product trees temporarily import new packages.

**Rule:** One git commit per batch. After each batch: `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build` (+ `docker compose config` while Compose still exists).

**Catalogue strategy:** Every product batch removes that product’s catalog entry, loader, compose service, Traefik labels, nginx stage, root script filters, Playwright project refs, and `runtime` chrome registrations **if any remain**. Prefer finishing X1 first so chrome no longer lists Songara apps by default.

### Batch B1 — Birthday vertical

Delete:

- `packages/site-birthday/`
- `apps/birthday-web/`
- `scripts/sync-birthday-pack.mjs`, `scripts/capture-birthday-previews.mjs`
- `e2e/birthday-launcher-smoke.spec.ts`, `playwright.birthday-smoke.config.ts`
- Compose `birthday` service + related Docker/nginx pieces
- Catalog entry/loader for birthday
- Root scripts `birthday:*`, `capture:birthday-previews`
- Any birthday logos/public packs/screenshots owned solely by birthday

**Why green:** Memories still present but nothing else required birthday; `site-birthday → site-memories` edge disappears with birthday.

### Batch B2 — Memories + experiences

Delete:

- `packages/site-memories/`
- `apps/memories-web/`
- `packages/experiences/`
- Catalog/compose/nav/scripts references
- Root `test:unit` filter `@platform/experiences`

**Why green:** Birthday already gone; experiences had no other consumers.

### Batch B3 — Visual Computing

Delete:

- `packages/site-viz/`
- `apps/viz-web/`
- Catalog/compose/nav/scripts/e2e refs
- Root `test:unit` filter `@platform/site-viz`

**Why green:** Physics/math/controls/export/render/audio remain; only product consumer removed.

### Batch B4 — Browser Lab

Delete:

- `packages/site-browser-lab/`
- `apps/browser-lab-web/`
- Catalog/compose/nav refs

**Why green:** Probes/charts live in `browser` / `ui`.

### Batch B5 — Statistics

Delete:

- `packages/site-stats/`
- `apps/stats-web/`
- Catalog/compose/nav refs

**Why green:** AnalysisChart in `ui`; math/export/controls remain.

### Batch B6 — Components showcase

Delete:

- `packages/site-components/`
- `apps/components-web/`
- Catalog/compose/nav refs; any `generate:catalog` scripts owned only by this showcase

**Why green:** `ui` + `controls` remain; no extraction dependency.

### Batch B7 — Document Explorer

Delete:

- `packages/site-docs/`
- `apps/docs-web/`
- `apps/docs-api/`
- `config/docs-explorer.roots.json`
- `docker/nginx-docs.conf`
- Compose `docs-api` + docs-web services
- Root `docs-api:*` scripts
- Catalog/nav refs

**Why green:** `markdown` package remains published; no docs-api consumers left.

### Batch B8 — Dashboard + telemetry

Delete:

- `packages/site-dashboard/`
- `apps/dashboard-web/`
- `apps/telemetry/`
- `scripts/telemetry-hook.sh`
- `e2e/dashboard-report.spec.ts`
- `docker/nginx-dashboard.conf`
- Compose `telemetry` (+ dashboard) services
- Root `telemetry:*` scripts; retarget or remove old `capture:artifacts` path (must already use X10)
- Catalog/nav refs
- Root `test:unit` filter `@platform/telemetry`

**Why green:** `packages/completion-report` + capture script remain; CURSOR.md still points at relocated types (Milestone 1 may tidy prose paths).

### Batch B9 — Catalogue host + catalog package

Delete:

- `apps/platform/`
- `packages/catalog/`
- `e2e/host.spec.ts`
- `docker/nginx-catalogue.conf`
- Compose `platform` service
- Root `dev:host`, Dockerfile stages that only build catalogue
- Any remaining catalogue logo generators / mirrored pack wiring for host
- Root `test:unit` filters `@platform/catalog`, `@platform/host`

**Why green:** No remaining workspace package imports catalog; solo hello does not need host. X1 already removed Songara nav defaults.

### Batch B10 — Residual product references (if any remain)

Sweep:

- Dead exports in `src/index.ts`
- Orphan public assets / screenshots under `docs/screenshots` for deleted products
- Compose/Dockerfile leftovers
- Playwright projects pointing at deleted apps

**Why green:** Mechanical reference cleanup only.

T0.5 continues structural simplification (scripts, Compose policy, `.kandev`, artifact folder, hello smoke e2e, `new-app.mjs` rewrite).

---

## 4. Decisions requiring approval

### D1 — `apps/telemetry` → product service (remove after X10)

**Recommendation:** Treat telemetry as a **Songara AI-dev product**, not PWA foundation. Extract `packages/completion-report` (+ capture entry if separable), then delete telemetry + dashboard (B8).

**Must also cover:** `CURSOR.md` reporting contract dependency, `.cursor/rules/run-report-standard.mdc`, `scripts/telemetry-hook.sh`, Compose `:4310`, `capture:artifacts`. Prose rewrites → Milestone 1; code SoT must not dangle.

**Approve:** Yes / No (if No: keep telemetry+dashboard in-repo and mark Keep — rejects vision cleanliness).

### D2 — `apps/platform` + `packages/catalog` → delete after chrome inject

**Recommendation:** Delete catalogue host and catalog package (B9). Chrome becomes **injectable**; **solo apps default to no Songara mega-bar** (X1). Do not keep a multi-app catalogue in PWA-Base.

**Approve:** Yes / No.

### D3 — Reference application = Hello

**Recommendation:** Confirm `apps/hello-web` + `packages/site-hello` as the single reference app. After M0 it must demonstrate: ThemeProvider → SoloSiteApp (no catalogue nav) → defineSite → PackReadyGate → content pack read. T0.5 adds minimal Playwright smoke; optional Docker is T0.5’s call (prefer document local-only unless compose is retained for another reason).

**Approve:** Yes / No (alternative must be named).

### D4 — `packages/site-registry` without catalogue

**Recommendation:** **Keep** the contract (`defineSite`, `SITE_CAPABILITY`, types). `CatalogEntryMeta` may remain as optional metadata for future hosts; no runtime dependency on `packages/catalog`. Registration model does **not** require the Songara catalogue.

**Approve:** Yes / No.

### D5 — `.kandev/` in rationalised repo

**Recommendation (T0.5 creates):** Minimal first-class directory, e.g.:

```
.kandev/
  README.md          # one short paragraph: agent/task conventions live here; details in Milestone 1
```

No large prompt trees in M0. Milestone 1 owns conventions and prose.

**Approve:** Yes / No (if alternate layout preferred, specify).

### D6 — Delete experiences, components showcase, docs explorer (overrides)

**Recommendation:** Delete `packages/experiences`, `site-components`/`components-web`, and docs stack (`site-docs`/`docs-web`/`docs-api`) without extraction beyond what §2 already lists.

**Approve:** Yes / No.

### D7 — New foundation packages + publish allowlist

**Recommendation:** Create `animation`, `render`, `audio`, `browser`, `completion-report`. Publish those plus `controls`, `math`, `physics`, `export`, `markdown` on `@songara/pwa-base` subpaths. Do **not** extract FindUsMoment, opening ritual, bedroom, cymatics, or experiences.

**Approve:** Yes / No.

### D8 — Clone coverage assumption

**Recommendation:** Proceed on the initiative statement that a complete clone exists elsewhere covering catalogue host, product apps, and telemetry. No in-tree archive.

**Approve:** Confirm clone covers catalogue + telemetry + all product verticals before T0.4 starts.

---

## 5. Order of operations and risk

### Sequence

```text
T0.2 (this plan) ──► USER APPROVAL (D1–D8)
        │
        ▼
T0.3 Extract (serial; one commit each)
        X1 chrome inject
        X10 completion-report   ← early so telemetry blast radius is contained
        X9 publish existing pkgs (can parallelise only if no file conflicts; prefer serial)
        X3 hooks → packages/animation (create package)
        X2 LanternField → animation
        X8 charts → ui
        X4 render package
        X5 audio package
        X6 browser package
        X7 host hooks (or skip)
        ▼
T0.4 Delete batches B1→B10 (serial; dependency-ordered)
        ▼
T0.5 Simplify structure, .kandev, scripts, compose/Docker policy, hello smoke, new-app rewrite
        ▼
Milestone 1 — docs/identity (README, CURSOR.md, ADRs, architecture)
```

**Do not parallelise:** X1 before any batch that assumes SoloSiteApp no longer ships Songara nav; B1 before B2; B8 after X10; B9 after all product batches that still patched catalog (or catalog cleaned per-batch — either way B9 is last catalog consumer).

### Validation gate (every T0.3 extraction and T0.4 batch)

```bash
pnpm install    # after workspace/dependency changes
pnpm lint
pnpm typecheck
pnpm test       # unit + e2e; playwright chromium as needed
pnpm build
docker compose config   # while compose file retained
```

### Rollback

- Each extraction/batch is one commit → revert that commit.
- Do not continue to the next batch if the gate fails.
- If reusable code is discovered mid-delete that is not in §2: **stop and report** (T0.4 constraint) — do not ad hoc extract.

### Risks

| Risk | Mitigation |
| --- | --- |
| Audio engine hard to separate from viz stems | Extract only engine core; leave stems to die with viz (X5). |
| Capture CLI coupled to telemetry DB/WS | Keep contract anyway; drop or stub capture in-repo (X10). |
| Physics has no demo consumer after viz | Accept; package unit tests + publish README. |
| CURSOR.md paths stale after move | X10 updates importable SoT; Milestone 1 rewrites prose. |
| `new-app.mjs` still patches catalog/nav | T0.5 rewrite; until then do not run scaffolder against deleted catalog. |
| Docs still describe multi-app host | Out of scope for M0; Milestone 1. |

---

## 6. Coverage check (inventory completeness)

Every T0.1 inventory row appears exactly once above:

- Published surface §1.1  
- All 12 apps §1.2  
- All infrastructure + product packages §1.3–1.4  
- Repo-level scripts, e2e, playwright, docker, config, root scripts, workspace §1.5  
- Extraction candidates: extracted as X1–X10 or explicitly declined in §2 “not extracted”  
- Open questions §9 resolved via D1–D8 and disposition overrides  

---

## 7. Approval gate (blocking T0.3)

**T0.3 must not start until the user approves this plan**, especially:

1. **Telemetry removal** after relocating completion-report contract (D1)  
2. **Catalogue host + catalog deletion** with injectable / default-off chrome (D2)  
3. **Hello as sole reference** (D3)  
4. **Deletion of experiences, components showcase, and docs explorer** (D6)  
5. **New packages + publish set** and **non-extraction** of FindUsMoment/opening/bedroom/cymatics (D7)  
6. **Clone coverage confirmation** (D8)  

Reply with approval (or requested deltas). On approval, T0.3 executes §2 only as written.
