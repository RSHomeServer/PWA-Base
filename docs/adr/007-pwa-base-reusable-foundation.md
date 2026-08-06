# ADR-007: PWA-Base as a reusable foundation

## Status

Accepted

## Context

Milestone 0 removed in-repo product applications, the catalogue host (`apps/platform` /
`@platform/catalog`), Document Explorer / docs-api, and the Telemetry vertical. What
remains is the publishable surface `@songara/pwa-base`, shared `@platform/*` packages, and
one reference app (`hello-web` / `site-hello`).

Earlier ADRs described a different identity:

- [ADR-001](./001-modular-monolith-host.md) — one modular-monolith host (`apps/platform`)
  mounting many sites from a catalog.
- [ADR-002](./002-site-registration-catalog.md) — path-based registration into that host
  via `@platform/catalog`.

Those decisions were correct for the Website Hosting monorepo era. They no longer describe
where product code lives or how this repository is developed and deployed.

Environment today:

| Layer | Where | Role |
| --- | --- | --- |
| Dev / validation | Ubuntu VM | Day-to-day work on this foundation and sibling apps |
| Production | Proxmox | Website Hosting (and any legacy Telemetry retained there) |
| Telemetry | **Not in this repo** | Removed; KanDev + `packages/completion-report` own engineering workflow reporting |

## Decision

1. **PWA-Base is a reusable foundation**, not a multi-app hosting monorepo. Product
   applications live in **sibling repositories** and depend on
   `"@songara/pwa-base": "file:../PWA-Base"` (see [ADR-006](./006-kandev-sibling-file-deps.md)
   and [consuming-pwa-base.md](../guides/consuming-pwa-base.md)).
2. **In-tree apps are reference-only.** Keep `apps/hello-web` + `packages/site-hello` as
   the smoke / packaging reference. Do not reintroduce a catalogue host, Telemetry,
   docs-api, or product verticals into this repository.
3. **Inside the monorepo**, workspace packages retain `@platform/*` names. Sibling apps
   import only documented `@songara/pwa-base` entry points.
4. **Shared extraction** still follows the [ADR-003](./003-phase2-shared-packages.md)
   two-consumer rule (second consumer may be a sibling app).
5. **Contracts that remain useful** from the host/catalog era — especially
   `defineSite` / `SiteDefinition` in `@platform/site-registry` and packaging helpers in
   `@platform/runtime` — stay as foundation APIs for solo PWAs. Catalog-host mounting is
   not a living packaging mode in this repo.
6. **Ops split:** agents validate on the Ubuntu VM; humans deploy Website Hosting to
   Proxmox when ready. Do not assume Traefik product hosts or Telemetry run in the
   foundation checkout.

### Relationship to earlier ADRs

| ADR | Status relative to this decision |
| --- | --- |
| ADR-001 | **Superseded in part** — modular Vite/React/TS app shape remains; in-repo multi-site host is not the repository identity |
| ADR-002 | **Superseded in part** — `defineSite` / site-registry contract remains; `@platform/catalog` host registration is gone |
| ADR-003 | Still **Accepted** — two-consumer rule for shared packages |
| ADR-004 | Still **Accepted** in spirit — apps are packageable units; default packaging is sibling solo PWAs, not an in-repo multi-app host |
| ADR-005 | Still **Accepted** — Content Packs |
| ADR-006 | Still **Accepted** — KanDev sibling `file:` linking |

## Consequences

### Positive

- Agents and humans share one clear identity: foundation + hello reference.
- Sibling PWAs can grow without bloating this monorepo.
- Historical ADRs stay readable as history without pretending the catalogue host still exists.

### Negative / trade-offs

- Guides and strategy docs written for Website Hosting need cleanup (Milestone 2+).
- ADR-004 prose still mentions `@platform/host` / catalog packaging; treat that as
  historical packaging context until a later hygiene pass rewrites it.

### Follow-ups

- Living strategy: [VISION.md](../milestones/VISION.md).
- Package map: [architecture.md](../architecture.md).
- Consumer API surface refresh: Milestone 3 (`consuming-pwa-base.md`).
