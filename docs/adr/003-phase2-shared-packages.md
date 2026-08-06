# ADR-003: Phase 2 shared platform packages

## Status

Accepted (two-consumer rule still applies; original Phase 2 product sites are historical)

## Context

*(Historical trigger.)* Phase 2 of the Website Hosting roadmap introduced two interactive
sites (Statistical Analysis and Optical Illusions / Math Visualisations) that both needed
form controls, parameter panels, numeric helpers, and browser downloads. A prior review
flagged premature platform abstraction: packages with a single consumer add maintenance
cost without reuse benefit.

Alternatives considered:

1. **One package per concern inside each site** — fast locally, but duplicates form styling, download logic, and basic stats/math.
2. **Large shared libraries upfront** (charting, data grid, full stats engine, canvas framework) — forces APIs before requirements are known.
3. **Minimal shared packages with a two-consumer rule** — extract only what both sites will use unchanged.

**Today:** the durable rule is the **two-consumer rule** for anything promoted into
`@songara/pwa-base` / `@platform/*`. The second consumer may be a **sibling app**, not
only an in-monorepo site ([ADR-007](./007-pwa-base-reusable-foundation.md)).

## Decision

Add and extend shared packages under `packages/` using the **two-consumer rule**: a
platform package must have a concrete, unchanged use in **two** present or near-term
consumers (historically both Phase 2 sites; now commonly Hello + a sibling app, or two
siblings). Otherwise the code stays in the application.

### Shared in Phase 2

| Package              | Role                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `@platform/ui`       | Extended with `Label`, `TextField`, `Select`, `TextArea`, `Panel` (token-styled, accessible) |
| `@platform/controls` | Generic `ParamDef` types and `ParameterPanel` for demo/analysis options                      |
| `@platform/export`   | `downloadText`, `downloadBlob`, `downloadCanvasPng`                                          |
| `@platform/math`     | `clamp`, `lerp`, `inverseLerp`, `linspace`, `sum`, `mean`, `varianceSample`, `stdevSample`   |

Existing foundation packages (`@platform/config`, `@platform/site-registry`) stay focused.
Site registration uses `@platform/site-registry/contract`; solo entries mount one site
(no in-repo catalog package).

### App-local (not platform packages)

These remain inside site packages until a second consumer exists:

| Concern                       | Rationale                                                     |
| ----------------------------- | ------------------------------------------------------------- |
| Data grid / spreadsheet UI    | Stats-specific table editing; illusions site does not need it |
| Charting / plotting           | Different viz idioms per site; no stable shared API yet       |
| Canvas / WebGL demo framework | Illusion-specific render loops and scene setup                |
| CSV / XLSX import             | Stats input pipeline only                                     |
| Full statistics engine        | t-tests, ANOVA, regression — Statistical Analysis only        |
| Site routes and page layout   | Site packages + host wiring (Lead phase)                      |

### Dependency rules

- React UI packages (`@platform/ui`, `@platform/controls`) declare `react` as a peer dependency and use the workspace `catalog:` versions in dev.
- Pure TS packages (`@platform/export`, `@platform/math`) have no React dependency.
- `@platform/controls` depends on `@platform/ui`; it does **not** embed app-specific parameter definitions — sites pass their own `ParamDef[]` and state.

### Workspace wiring

Packages are registered via existing `pnpm-workspace.yaml` (`packages/*`). Internal deps use `workspace:*`; shared toolchain versions use `catalog:`.

## Consequences

### Positive

- Both sites share consistent form styling and parameter UX without a monolithic “platform app” layer.
- Clear boundary for future extraction: promote to platform only when the second site needs the same API.
- Keeps Phase 2 scope reviewable — no chart/grid/stats-engine commitment in shared packages.

### Negative / trade-offs

- Some duplication may remain between sites (e.g. stats-only parsers) until a true second consumer appears.
- `@platform/math` sample statistics are building blocks only; richer inference stays app-local and may duplicate naming — sites should not re-export platform math as a “stats library.”

### Follow-up

- Revisit charting or data-grid as platform packages only if both sites adopt the same component API.
- Promote additional UI primitives when a third site needs the same control without forking.
