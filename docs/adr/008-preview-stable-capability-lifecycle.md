# ADR-008: Preview / Stable capability lifecycle

## Status

Accepted

## Context

Songara is standardising on carefully selected, mature OSS rather than reinventing
browser capabilities. The Engineering Capability Catalogue in **Test-PWA** discovers,
evaluates, and validates technologies. **PWA-Base** must expose curated integrations of
technologies Songara intends to standardise on, without turning the foundation into a
dumping ground for every spike.

Prior guidance treated [ADR-003](./003-phase2-shared-packages.md)’s **two-consumer rule**
as the primary gate for any shared kit. That rule correctly stopped speculative
extraction during the Website Hosting monorepo era, and the Test-PWA
`oss-adoption-plan` correctly held wraps while catalogue work was research-only.

That interpretation is too strict for a curated platform that wants:

1. A deliberate **Preview** channel for production-worthy thin integrations of chosen OSS.
2. Catalogue and products validating the **same** implementation.
3. **Stable** APIs only after real product confidence — not after catalogue demos alone.

Orchestrator drafts used the synonym **Experimental** for the same Preview stage.
This ADR standardises on **Preview** for docs and public exports.

Related: [ADR-007](./007-pwa-base-reusable-foundation.md),
[capability-lifecycle.md](../guides/capability-lifecycle.md),
[preview-packages.md](../guides/preview-packages.md).

## Decision

1. **Capability lifecycle** (ordered):

   Research → Capability Catalogue (Test-PWA) → Engineering Evaluation →
   **Preview integration (PWA-Base)** → Product consumption → **Stable API (PWA-Base)**.

2. **Naming.** Public docs and exports use **Preview**. “Experimental” in older briefs
   means Preview. Existing `@platform/*` kits without a `/preview/` export are
   **implicit Stable**.

3. **Package layout.** Do **not** re-home existing kits under `packages/stable/`.
   New curated OSS integrations land as `packages/preview-<name>/` (workspace
   `@platform/preview-<name>`) and are exported **only** as
   `@songara/pwa-base/preview/<name>`. Never add Preview symbols to the root
   `@songara/pwa-base` barrel.

4. **Enter Preview** when all of the following hold:

   - Catalogue research selected a preferred OSS (licence/SPDX re-verified).
   - Integration quality is production-worthy and intentionally **thin**.
   - Songara intends to standardise on it for future PWAs.
   - Expected multi-app benefit (not a single vertical scene).
   - Peer/bundle cost is accepted (heavy OSS as `peerDependencies`).

5. **Enter Stable** when:

   - At least one **product** repository consumes the Preview API unchanged
     (Test-PWA / Hello alone are **not** enough).
   - The API has stayed coherent through real usage.
   - Engineering confidence exists (docs, tests, a11y/offline notes as relevant).
   - ADR-003’s two-consumer check is the preferred confidence signal when a second
     product exists; one strong product plus clear standardisation intent may suffice
     with Architect sign-off recorded in an ADR/LDR.

6. **ADR-003 relationship.** ADR-003 remains **Accepted** for Stable kit extraction and
   as a Stable confidence signal. It is **no longer the primary gate for entering
   Preview**. Catalogue eligibility ≠ Preview approval ≠ Stable graduation.

7. **Repo ownership.**

   | Concern | Repo |
   | --- | --- |
   | Research, comparisons, benchmarks, catalogue UX | Test-PWA |
   | Thin Preview wrappers around chosen OSS | PWA-Base `packages/preview-*` |
   | Runtime, theme, Stable kits | PWA-Base (existing packages) |
   | Real product usage | Sibling product repos (consume `@songara/pwa-base` only) |

8. **Wrapper philosophy.** Prefer re-export + Songara defaults over deep abstraction.
   Songara-specific: reduced-motion policy, token-aware defaults, Content Pack asset
   URLs, Vite/WASM bootstrap, schema/version conventions. App-owned: concrete schemas,
   scenes, asset authoring, product UX. Do not fork or reimplement mature OSS.

9. **Versioning.** Preview exports may break without a major bump of the foundation
   surface; document breaks in the capability notes. Stable exports follow strict
   semver. Graduation deprecates `/preview/<name>` then removes it after a Maintainer
   window.

## Consequences

### Positive

- Products and the catalogue share one Preview implementation path.
- Songara can standardise early without pretending Preview APIs are frozen.
- Existing Stable kits stay put — no mass rename under `packages/stable/`.
- ADR-003 continues to protect Stable from speculative bloat.

### Negative / trade-offs

- Preview increases foundation surface area; entry criteria must be enforced by
  Architect / Orchestrator, not by “catalogue Ready” alone.
- Dual vocabulary risk if tickets keep saying Experimental — prompts and tickets
  should say Preview.
- Prior Test-PWA “hold all wraps” language is superseded for Preview entry; that
  catalogue doc should be updated by the Test-PWA lane.

### Follow-up

- Guides: [capability-lifecycle.md](../guides/capability-lifecycle.md),
  [preview-packages.md](../guides/preview-packages.md).
- Update [architecture.md](../architecture.md), [VISION.md](../milestones/VISION.md),
  [consuming-pwa-base.md](../guides/consuming-pwa-base.md),
  [promote-to-pwa-base](../../.kandev/workflows/promote-to-pwa-base.md).
- Wave 1 Preview packages are **Executor work** after this ADR — not part of this
  decision record.
