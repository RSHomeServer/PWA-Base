# ADR-004: Packageable applications with unified operations

## Status

Accepted

## Context

ADR-001 chose a modular monolith: one Vite host, one deploy, sites as packages. That delivered velocity and clear boundaries. The long-term vision needs applications that can become:

- their own SPA / PWA / service-worker scope
- their own versioned release
- their own Docker deployment and domain (`birthday.songara.uk`, or a wholly separate domain)

…without rewriting application feature code.

Prematurely splitting every app into its own operational pipeline would multiply CI, compose, and Traefik surface area before we need it. We need **architectural extractability** while keeping **unified ops** for the foreseeable future.

## Decision

1. **Application identity is architectural; deploy topology is packaging.**  
   Each site/app package is a packageable application unit. Moving from `apps.songara.uk/birthday` to `birthday.songara.uk` (or another domain) must be achievable via packaging/config (Vite entry, `base`, Traefik Host, nginx root), not app rewrites.

2. **Default packaging remains the multi-app host** (`@platform/host` on `apps.songara.uk`).  
   ADR-001 stays valid as the *default packaging mode*, not as a claim that one deploy is the only forever shape of an application.

3. **Unified operations stay the default:** one monorepo, shared packages, shared tooling, shared CI/CD, shared Compose network/stack where practical. Solo containers are optional proofs and escape hatches, not a requirement for every app on day one.

4. **Composition vs definition:** `@platform/catalog` lists which apps are included in a given package output. It does not define what an application *is*. Solo packaging mounts one app without depending on the multi-app catalog graph for runtime identity.

5. **Shared runtime:** Cross-cutting client concerns (PWA registration helpers, update deferral, connectivity, Content Packs, storage facades) live in `@platform/runtime` (and related SW modules). Applications consume these services; they do not reimplement them.

### Contract additions

`SiteDefinition` gains optional packaging/offline fields (see registry types), treated as the evolving **AppManifest** surface without a forced mass rename of `site-*` packages.

### Dependency rules (summary)

| From | May depend on | Must not |
| --- | --- | --- |
| App / site packages | `@platform/runtime`, UI/domain libs, `@platform/site-registry/contract` | Other apps; catalog; host internals |
| `@platform/runtime` | Browser APIs; minimal deps | App packages; prefer no `@platform/ui` |
| Host / solo entries | Catalog (multi) or one app (solo); runtime; UI | Direct imports of many apps outside composition |
| Catalog | App packages (composition only) | Host internals |

## Consequences

### Positive

- Domain/path moves become packaging work.
- Multi-app host and solo PWA can share one monorepo and one runtime.
- Existing sites keep working under ADR-001/002 while gaining manifest fields incrementally.

### Negative / trade-offs

- Dual packaging templates (multi vs solo) need maintenance; mitigated with thin Vite entries and a shared runtime.
- A path-hosted multi-app SW cannot give every product a fully isolated PWA identity; true per-app SW scope is a solo-packaging concern.
- Teams must resist putting app logic into `apps/platform`.

### Follow-ups

- Lazy catalog loaders so the multi-app bundle does not eagerly bind every app.
- Content Packs (ADR-005) for offline-complete installs.
- Prove at least one app (Birthday) as both path-hosted and solo-packaged.
