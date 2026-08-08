# Capability lifecycle

Songara’s path from ecosystem research to a frozen foundation API.

| | |
| --- | --- |
| **Status** | Living |
| **Authority** | [ADR-008](../adr/008-preview-stable-capability-lifecycle.md) |
| **Package detail** | [preview-packages.md](./preview-packages.md) |
| **Related** | [ADR-003](../adr/003-phase2-shared-packages.md) · [ADR-007](../adr/007-pwa-base-reusable-foundation.md) · [VISION.md](../milestones/VISION.md) |

## Stages

```text
Research
  → Capability Catalogue (Test-PWA)
  → Engineering Evaluation
  → Preview integration (PWA-Base)
  → Product consumption
  → Stable API (PWA-Base)
```

| Stage | Owner | Outcome |
| --- | --- | --- |
| Research | Discovery / catalogue notes | Shortlist of mature OSS; SPDX notes |
| Catalogue | Test-PWA | Live exploration, scores, comparisons, visual validation |
| Evaluation | Architect (+ catalogue evidence) | Preferred implementation selected; Preview yes/no |
| Preview | PWA-Base Executor | Thin `@songara/pwa-base/preview/<name>` integration |
| Product consumption | Sibling product repos | Real usage of the **same** Preview export |
| Stable | Maintainer + Architect | Graduated documented Stable export; Preview path deprecated |

Test-PWA **consumes Preview** wherever a Preview package exists so the catalogue
validates the implementation products will use. Test-PWA and Hello are **not** product
consumers for Stable graduation.

## Promotion criteria

### Enter Preview

All must hold:

1. Catalogue research selected a preferred OSS (licence/SPDX re-verified at adopt time).
2. Integration quality is production-worthy and intentionally thin.
3. Songara intends to standardise on it for future PWAs.
4. Expected multi-app benefit — not a single vertical scene.
5. Peer/bundle cost accepted (heavy OSS as `peerDependencies`).

Preview is **not** a dumping ground for every catalogue `Ready` row.

### Enter Stable

1. At least one **product** repository consumes the Preview API unchanged.
2. API surface stayed coherent through real usage.
3. Engineering confidence (docs, tests, a11y/offline notes as relevant).
4. Prefer [ADR-003](../adr/003-phase2-shared-packages.md) two-consumer evidence when a
   second product exists; one strong product + clear standardisation intent may suffice
   with Architect sign-off (ADR or LDR).

Catalogue-only evidence never graduates Preview to Stable.

## What lives where

| Concern | Home |
| --- | --- |
| Research / demos / comparisons / benchmarks / eng notes | Test-PWA |
| Thin wrapper around chosen OSS | PWA-Base `packages/preview-*` |
| Runtime, theme, existing Stable kits | PWA-Base (`packages/runtime`, `ui`, `animation`, …) |
| Real product features | Sibling product repositories |

Products import only documented `@songara/pwa-base` entry points — never Test-PWA and
never deep `@platform/*` paths from outside this monorepo.

## Naming

- **Preview** — public docs and export paths (`/preview/…`).
- **Experimental** — historical synonym from Orchestrator drafts; do not use in new
  tickets or export maps.
- **Stable** — existing kits and graduated APIs without a `/preview/` prefix.

## Related workflows

- Preview package rules and Wave 1 plan: [preview-packages.md](./preview-packages.md).
- App-local → foundation promote (Stable extraction): [promote-to-pwa-base](../../.kandev/workflows/promote-to-pwa-base.md).
- Consumer API table: [consuming-pwa-base.md](./consuming-pwa-base.md).
