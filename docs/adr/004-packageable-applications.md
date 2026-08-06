# ADR-004: Packageable applications with unified operations

## Status

Accepted (default packaging mode updated by [ADR-007](./007-pwa-base-reusable-foundation.md))

## Context

ADR-001 originally chose a modular monolith: one Vite host, one deploy, sites as packages.
That delivered velocity for the Website Hosting era. The long-term need is applications that
can become:

- their own SPA / PWA / service-worker scope
- their own versioned release
- their own deployment and domain

…without rewriting application feature code.

Post–Milestone 0, product apps live in **sibling repositories**. This monorepo keeps a
single reference packaging entry (`apps/hello-web`). An in-repo multi-app catalogue host is
**not** the default packaging mode anymore (ADR-007).

## Decision

1. **Application identity is architectural; deploy topology is packaging.**  
   Each site/app package is a packageable application unit. Moving an app between hosts or
   domains must be achievable via packaging/config (Vite entry, `base`, reverse-proxy Host,
   nginx root), not app rewrites.

2. **Default packaging is a solo PWA** — a thin Vite entry mounting one `SiteDefinition`
   via `@platform/runtime` (`SoloSiteApp`). In this repo that is `apps/hello-web`. Product
   apps use the same pattern in sibling repos consuming `@songara/pwa-base`.

3. **Unified operations for the foundation:** one monorepo for shared kits, shared tooling,
   and shared CI for `@songara/pwa-base`. Product deploy pipelines live with each sibling
   app (or Website Hosting on Proxmox), not as an in-tree multi-app host.

4. **Composition vs definition:** A catalogue of many path-mounted sites is an optional
   *product* concern outside this foundation. It does not define what an application *is*.
   Solo packaging mounts one app without depending on a multi-app catalog graph for runtime
   identity.

5. **Shared runtime:** Cross-cutting client concerns (PWA registration helpers, update
   deferral, connectivity, Content Packs, storage facades) live in `@platform/runtime`
   (and related SW modules). Applications consume these services; they do not reimplement
   them.

### Contract additions

`SiteDefinition` gains optional packaging/offline fields (see registry types), treated as
the evolving **AppManifest** surface without a forced mass rename of `site-*` packages.

### Dependency rules (summary)

| From | May depend on | Must not |
| --- | --- | --- |
| App / site packages | `@platform/runtime`, UI/domain libs, `@platform/site-registry/contract` | Other apps; host internals |
| `@platform/runtime` | Browser APIs; minimal deps | App packages; prefer no `@platform/ui` |
| Solo Vite entries | One site package; runtime; UI | Deep coupling to unrelated sites |
| Sibling product apps | Documented `@songara/pwa-base` entry points | Deep `@platform/*` workspace paths |

## Consequences

### Positive

- Domain/host moves become packaging work.
- Hello reference and sibling PWAs share one runtime contract.
- Foundation stays free of product catalogue surface area.

### Negative / trade-offs

- Each product app owns its deploy wiring.
- Historical multi-app host packaging (ADR-001/002 era) is retained only as superseded
  context.

### Follow-ups

- Content Packs (ADR-005) for offline-complete installs.
- Keep Hello as the living packaging smoke test.
- Public consumer API matrix: Milestone 3 (`consuming-pwa-base.md`).
