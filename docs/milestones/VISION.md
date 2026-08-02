# Platform Vision

| | |
| --- | --- |
| **Status** | Living |
| **Version** | 0.1.0 |
| **Last reviewed** | 2026-07-21 |
| **Related** | [PLATFORM.md](./PLATFORM.md) · [ROADMAP.md](./ROADMAP.md) · [IDEAS.md](./IDEAS.md) |

---

## Purpose of this document

High-level intent for the Website Hosting platform: what we are building, why reuse matters, and how to decide where to invest engineering effort. Runtime architecture lives in [`docs/architecture.md`](../architecture.md). Agent execution behaviour lives in root [`CURSOR.md`](../../CURSOR.md)—this file is **strategy**, not a coding contract.

## How to update

Revise when the product vision changes (new classes of apps, hosting model shifts, or a deliberate change to the reuse rule). Bump the version, update **Last reviewed**, and sync any impacted sections in PLATFORM / ROADMAP / IDEAS.

---

## Vision statement

Build a **self-hosted ecosystem of reusable browser applications** on a Proxmox-backed Docker stack—not a collection of independent one-off projects.

Every meaningful infrastructure investment should unlock **multiple future applications**. Prefer extending shared capabilities over inventing a new stack per idea.

## Operating context

| Constraint | Implication |
| --- | --- |
| Self-hosted on Proxmox | Own the full stack; favour Docker-first deploy and operable services |
| Browser-based apps | One TypeScript-first front-end host; progressive enrichment of shared UI |
| Long-term growth | Optimise for maintainability and velocity over years, not for today’s hardware specs |
| Production quality | Prefer explicit contracts, tests, and ADRs over speculative abstraction |

## Investment rule

Align with [ADR-003](../adr/003-phase2-shared-packages.md) **two-consumer rule**:

> Extract or build a **platform capability** only when at least two concrete applications will use it unchanged—or when the roadmap shows that capability as a deliberate foundation for a class of apps (e.g. identity, data plane, object storage).

Do **not** rebuild foundations that already exist (modular host, catalog, design tokens, telemetry Task lifecycle, PWA shell, Traefik routing for the platform SPA). See [PLATFORM.md](./PLATFORM.md) for inventory.

## Capability vs framework vs application

Keep these distinct when planning:

| Term | Meaning | Example today |
| --- | --- | --- |
| **Capability** | Reusable behaviour or service with a clear contract | Site registration, ParameterPanel, telemetry ingest |
| **Framework** | Shared kit that many capabilities/apps compose | `@platform/ui` tokens + primitives; host + catalog |
| **Application** | User-facing independently hosted SPA | `stats.songara.uk`, `viz.songara.uk`, `dashboard.songara.uk` |

An application may contain local code that is **not** yet a capability. Promoting it to the platform requires a second consumer or an explicit foundational milestone.

## Success looks like

- A new app is primarily a **catalog entry** plus reuse of host, UI, and platform services—not a greenfield monorepo.
- Private, data-backed, and media-heavy apps become possible without reinventing auth, persistence, or storage each time.
- Documentation answers: what exists, what is missing, what to build next, and what each milestone unlocks ([ROADMAP.md](./ROADMAP.md)).
- Future ideas are mapped against capabilities before implementation ([IDEAS.md](./IDEAS.md)).

## Non-goals (for this vision)

- Optimising for a single “hero” app at the expense of shared foundations.
- Premature extraction of site-local charting, canvas, or stats engines without a second consumer.
- Replacing Cursor telemetry with a general observability product before an app data plane exists.
- Multi-cloud or multi-tenant SaaS design—this remains a personal / household self-hosted platform.

## North-star outcomes

1. **Reuse by default** — shared packages and services absorb cross-cutting needs.
2. **Clear growth path** — identity → data → storage → media → content apps, in that leverage order (see ROADMAP).
3. **Honest inventory** — strategy docs stay current with the codebase so planning is trustworthy.
