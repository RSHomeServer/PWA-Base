# Foundation Vision

| | |
| --- | --- |
| **Status** | Living |
| **Version** | 1.1.0 |
| **Last reviewed** | 2026-08-08 |
| **Related** | [ADR-007](../adr/007-pwa-base-reusable-foundation.md) · [ADR-008](../adr/008-preview-stable-capability-lifecycle.md) · [architecture.md](../architecture.md) · [capability-lifecycle](../guides/capability-lifecycle.md) · [m0-rationalisation/](./m0-rationalisation/) |

> **Historical note:** Pre–Milestone 0 Website Hosting strategy lived in
> [PLATFORM.md](../archive/strategy/PLATFORM.md),
> [ROADMAP.md](../archive/strategy/ROADMAP.md), and
> [IDEAS.md](../archive/strategy/IDEAS.md). Those files are archived and **not** current
> product intent. Use this document and ADR-007 as the north star.

---

## Purpose of this document

High-level intent for **`@songara/pwa-base`**: what this repository is for, how sibling
PWAs consume it, and how to decide what belongs here versus in an application repo.
Runtime layout lives in [`docs/architecture.md`](../architecture.md). Agent execution
behaviour lives in root [`CURSOR.md`](../../CURSOR.md) — this file is **strategy**, not a
coding contract.

## How to update

Revise when foundation identity or investment rules change (new classes of shared kits,
consumption model shifts, or a deliberate change to the two-consumer rule). Bump the
version and **Last reviewed**.

---

## Vision statement

Ship a **reusable browser/PWA foundation** that sibling Songara applications depend on —
not a catalogue of in-monorepo products, and not an in-tree Telemetry stack.

Every meaningful extraction into `@songara/pwa-base` should unlock **multiple** present or
near-term applications. Prefer extending shared contracts and kits over inventing a new
stack per idea.

## Operating context

| Constraint | Implication |
| --- | --- |
| Ubuntu VM for day-to-day work | Develop and validate here; do not assume Proxmox services in the agent environment |
| Proxmox for production Website Hosting | Human deploys when happy; out of band for foundation DoD |
| Sibling product repos | Apps use `file:../PWA-Base`; see [ADR-006](../adr/006-kandev-sibling-file-deps.md) |
| One reference app in-tree | `hello-web` / `site-hello` only — smoke and packaging reference |
| Telemetry not in this repo | KanDev + `packages/completion-report` own engineering workflow reporting |

## Investment rule

Songara is a **curated platform** on carefully selected mature OSS
([ADR-008](../adr/008-preview-stable-capability-lifecycle.md)):

1. **Preview** — thin integrations of OSS Songara intends to standardise on, after
   catalogue evaluation. Entry criteria live in ADR-008 / [capability-lifecycle](../guides/capability-lifecycle.md).
   Catalogue eligibility alone is not enough.
2. **Stable** — prefer [ADR-003](../adr/003-phase2-shared-packages.md) **two-consumer**
   confidence (or Architect-signed graduation from Preview after real **product** usage).
   Contracts, packaging helpers, and design tokens may land as Stable when an explicit
   foundation milestone requires them.

Do not reintroduce a catalogue host, product verticals, or Telemetry into this monorepo.
Test-PWA validates Preview; it is not a product consumer for Stable graduation.

## Capability vs framework vs application

| Term | Meaning | Example today |
| --- | --- | --- |
| **Capability** | Reusable behaviour with a clear contract | `defineSite`, Content Packs, completion-report shape |
| **Stable kit** | Shared package many apps compose | `@platform/ui`, `@platform/runtime`, animation/audio/browser/render |
| **Preview kit** | Curated thin OSS integration (unstable) | `@songara/pwa-base/preview/<name>` ([preview-packages](../guides/preview-packages.md)) |
| **Application** | User-facing PWA in a **sibling** repo | Consumes `@songara/pwa-base` entry points |
| **Catalogue** | Engineering Capability Catalogue | Test-PWA (sibling) — evaluates; consumes Preview |
| **Reference app** | In-tree demo only | `apps/hello-web` + `packages/site-hello` |

Application-local code stays in the sibling repo until Preview entry (ADR-008) or Stable
promotion ([promote-to-pwa-base](../../.kandev/workflows/promote-to-pwa-base.md)).

## Success looks like

- A new Songara PWA starts as a sibling repo plus documented `@songara/pwa-base` imports —
  not a greenfield copy of host/catalog/telemetry.
- Shared kits grow only when reuse is real (two consumers or an accepted ADR).
- Living docs match the cleaned tree: foundation packages + hello reference.
- Agents follow [VISION](./VISION.md) and [ADR-007](../adr/007-pwa-base-reusable-foundation.md),
  not archived multi-app Website Hosting strategy.

## Non-goals

- Hosting many product apps inside this monorepo again.
- In-tree Telemetry, Document Explorer API, or catalogue SPA.
- Optimising the foundation for a single hero app at the expense of reusable contracts.
- Multi-cloud / multi-tenant SaaS design — household / self-hosted Songara apps remain the scope.

## North-star outcomes

1. **Reuse by default** — sibling apps share contracts, UI, runtime, and kits via
   `@songara/pwa-base`.
2. **Clear home for code** — foundation vs sibling app is obvious; promotion has a gate.
3. **Honest docs** — strategy and architecture stay aligned with the tree after Milestone 0.
