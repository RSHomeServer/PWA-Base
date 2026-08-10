# Preview packages

Architectural reference for curated OSS integrations under `@songara/pwa-base/preview/*`.

| | |
| --- | --- |
| **Status** | Living |
| **Authority** | [ADR-008](../adr/008-preview-stable-capability-lifecycle.md) |
| **Lifecycle** | [capability-lifecycle.md](./capability-lifecycle.md) |
| **Consumer API** | [consuming-pwa-base.md](./consuming-pwa-base.md) |

Executors implement packages. This document defines layout, API philosophy, Wave 1
sequencing, and how the Orchestrator should shape tickets.

---

## 1. Updated Preview architecture

Songara is a **curated platform** on battle-tested OSS. PWA-Base does not reimplement
Motion, Dexie, Lottie, etc. It owns **thin integrations** Songara is willing to
recommend to future PWAs.

```text
packages/
  animation/ audio/ browser/ …   # existing = implicit Stable
  preview-motion/
  preview-dexie/
  preview-lottie/
  preview-rive/ preview-gsap/ preview-tsparticles/
  preview-rapier2d/ preview-matter/ preview-planck/ preview-cannon/
  preview-react-webcam/
  preview-tone/ preview-howler/   # thin; do not replace Stable /audio
  preview-idb/ preview-localforage/
```

| Rule | Detail |
| --- | --- |
| Workspace name | `@platform/preview-<name>` |
| Directory | `packages/preview-<name>/` |
| Public import | `@songara/pwa-base/preview/<name>` only |
| Root barrel | **Never** re-export Preview from `@songara/pwa-base` |
| Heavy OSS | `peerDependencies` (consumers install Motion, Dexie, …) |
| Catalogue | Test-PWA must import the Preview path — no parallel local copy of the wrapper |

Do **not** move existing kits under `packages/stable/`. That rename adds churn without
clarifying boundaries.

---

## 2. Recommended package structure

Each Preview package is a normal workspace package:

```text
packages/preview-<name>/
  package.json          # name @platform/preview-<name>; peers for OSS
  src/index.ts          # public surface (thin)
  src/*.ts(x)
  README.md             # Preview caveat + Stable graduation target
```

Root `package.json` `exports` gains:

```json
"./preview/<name>": {
  "types": "./packages/preview-<name>/src/index.ts",
  "import": "./packages/preview-<name>/src/index.ts",
  "default": "./packages/preview-<name>/src/index.ts"
}
```

Update [consuming-pwa-base.md](./consuming-pwa-base.md) and the dependency-rules table in
[architecture.md](../architecture.md) in the same Executor PR that adds the package.

### Dependency rules (Preview)

| Consumer | May depend on | Must not |
| --- | --- | --- |
| Sibling product / Test-PWA | `@songara/pwa-base/preview/<name>` | Deep `@platform/preview-*` from outside monorepo; Test-PWA as a library |
| `@platform/preview-*` | Declared peers; Stable kits when justified (e.g. `useReducedMotion`) | Site packages; product repos |
| Stable kits | Browser APIs; other Stable kits when justified | Preview packages (Stable must not depend on Preview) |

---

## 3. Public API philosophy

1. **Narrow subpath** — one capability per `/preview/<name>`.
2. **OSS-shaped** — prefer the library’s types and primitives; do not invent a parallel
   domain language unless Songara policy requires it.
3. **Songara defaults, not Songara forks** — reduced-motion, token-aware defaults,
   Content Pack URL helpers, Vite/WASM bootstrap, schema/version conventions.
4. **App owns product shape** — Dexie schemas, Lottie assets, Rapier scenes, SFX banks
   stay in the app or Content Packs.
5. **Honest instability** — Preview may break; README and catalogue status must say so.
6. **Graduation** — Stable home is either an existing kit subpath (preferred when it
   fits) or a new non-preview subpath; then deprecate `/preview/<name>`.

---

## 4. Implementation / wrapper philosophy

| Do | Don’t |
| --- | --- |
| Re-export + small helpers | Hide the OSS behind an opaque “Songara Motion Engine” |
| Compose with Stable a11y hooks | Duplicate `useReducedMotion` |
| Peer-dep the heavy library | Bundle WASM/engines into every consumer |
| Unit-test Songara helpers | Re-test the entire upstream library |
| Document SPDX + peer install | Pull commercial sync plugins (Dexie Cloud, etc.) into Preview |

---

## 5. Versioning strategy

| Surface | Policy |
| --- | --- |
| Stable (`@songara/pwa-base`, `/ui`, `/animation`, …) | Strict semver; renames/removals are breaking ([versioning.md](./versioning.md)) |
| Preview (`/preview/*`) | May break within a foundation minor; call out in package README + catalogue notes |
| Graduation | Maintainer deprecates Preview export, updates consumers, removes after agreed window |

Root `VERSION` continues to describe the foundation release. Preview breakage does not
require a major bump by itself, but Stable graduation that renames exports does.

---

## 6. Wave 1 implementation plan

Recommended **Executor order** (docs/ADR already done):

| Order | Capability | Preview? | Public API intent | Thin vs Songara-specific |
| ---: | --- | --- | --- | --- |
| 1 | **Motion** | Yes | Peer `motion`; helpers that honour `@songara/pwa-base/animation` reduced-motion | Re-export Motion primitives + reduced-motion-aware wrappers; do **not** move `ParticleField` / viewport hooks into Preview |
| 2 | **Dexie** | Yes | Peer `dexie` (core only) | DB factory + migration helpers; schemas app-owned; no Dexie Cloud; do not duplicate Content Pack `packStore` |
| 3 | **Lottie** | Yes (narrow) | Peer player (`lottie-react` or chosen dotLottie binding) | Player component + reduced-motion freeze; assets via URL / Content Packs |
| 4+ | **Rive / GSAP / tsparticles** | Yes | Peers per package; reduced-motion helpers | Re-export + policy helpers only; assets/timelines app-owned |
| 4+ | **Rapier2D / Matter / Planck / cannon-es** | Yes | World/engine bootstrap + `songaraFixedStepSeconds` | Keep `@platform/physics` SoA engine separate; peer heavy WASM/engines |
| 4+ | **react-webcam** | Yes | Peer `react-webcam`; constraint helpers | Permission UX app-owned; graduate toward `/browser` |
| 4+ | **Tone / Howler** | Yes (thin) | Peers `tone` / `howler` | Must **not** replace Stable `AudioEngineProvider`; SFX/Transport labs only |
| 4+ | **idb / localForage** | Yes | Peers + `songaraDbName` / instance helpers | Prefer Dexie Preview for schema versions; not Content Pack `packStore` |

### Per-capability notes

**Motion** — Belongs in Preview: clear UI standardisation candidate; catalogue P0.
Missing foundation before code: none beyond this contract; compose with existing
animation kit. Implementation order: first.

**Dexie** — Belongs in Preview: offline-first Songara PWAs. Missing: keep sync/CRDT
(RxDB/Yjs/Electric) out of Preview until a separate evaluation. Order: second.

**Lottie** — Belongs as a **narrow** Preview after Motion policy exists. Missing:
reduced-motion behaviour must be defined consistently with Motion Preview. Order: third.

**Howler / Tone** — Thin Preview only. Prefer Stable audio kit for shared graphs;
catalogue may explore Howler/Tone via `/preview/howler` and `/preview/tone` without
replacing `AudioEngineProvider`.

**Rapier2D (+ Matter / Planck / cannon-es)** — Preview world/engine bootstrap is Live
for catalogue validation. Keep `@platform/physics` separate. Product commitment still
gates Stable graduation.

### Missing foundational capability (docs, not a new kit)

Before Wave 1 Executors land code: Preview export contract, peer-dep rule, and
reduced-motion policy for motion-related Previews (this guide + ADR-008). No new
runtime package is required solely to unblock Motion/Dexie/Lottie.

---

## 7. Guidance for the Orchestrator (Executor tickets)

Do **not** open child tickets from the Platform Architect task that authored this
reference. When planning a wave, use this shape **per capability**:

```text
1. Discovery (optional) — confirm OSS + SPDX if catalogue is not already Ready
2. Architect — API boundary, peers, export path, thin vs Songara-specific list
3. Executor PWA-Base — packages/preview-<name>, exports map, unit tests, consuming-pwa-base row
4. Executor Test-PWA — catalogue route consumes @songara/pwa-base/preview/<name>
5. Product adopt (separate ticket/repo) — required before Stable
6. Maintainer — Stable graduation + deprecate Preview path
```

### Ticket brief checklist (PWA-Base Executor)

- [ ] Target: `packages/preview-<name>` + `@songara/pwa-base/preview/<name>`
- [ ] Peers listed; no Stable→Preview dependency
- [ ] README states Preview instability + intended Stable home
- [ ] Updates: `architecture.md` dependency rules, `consuming-pwa-base.md` table
- [ ] Validation: unit tests for Songara helpers; typecheck; no root-barrel export
- [ ] Out of scope: Stable graduation, catalogue demos (unless dual-repo task), product UX

### Ticket brief checklist (Test-PWA Executor)

- [ ] Import Preview from `@songara/pwa-base/preview/<name>` — no duplicate wrapper
- [ ] Artefact contract filled; registry status honest
- [ ] Out of scope: implementing the Preview package in Test-PWA

### Hard rules for Orchestrator

- Parallelise PWA-Base and Test-PWA Executors only after the export path is named.
- Never open a **Stable** promote from catalogue-only evidence.
- Prefer extending an existing Stable kit at graduation when the API fits; otherwise
  add a new non-preview subpath.
- Products never depend on Test-PWA.

---

## 8. Relationship summary

| Relationship | Rule |
| --- | --- |
| Preview ↔ Stable | Preview is opt-in unstable; Stable is semver-frozen; graduation deprecates Preview |
| PWA-Base ↔ Test-PWA | Catalogue validates Preview; does not own wrappers; not a Stable consumer |
| PWA-Base ↔ products | Products consume documented `@songara/pwa-base` entry points only |
| ADR-003 ↔ ADR-008 | ADR-003 = Stable confidence; ADR-008 = Preview entry + lifecycle |
