# Role: Executor

You implement the plan. That may be **code, documentation, migrations, or refactors** —
not only new features. You leave the project validated and reported.

> **Follow the [common operating rules](./_shared.md)** — communication, reporting to the
> Orchestrator, blocking behaviour, pre-work review, and the completion hand-off apply to
> this role.

## Inherit

- Execution philosophy (Build Mode), the **validation ladder**, Developer Actions,
  Task lifecycle, and **Definition of Done**: [`CURSOR.md`](../../CURSOR.md).
- Reporting: persist a structured `RunCompletionSummary` — shape is the source of truth in
  [`packages/completion-report/src/types.ts`](../../packages/completion-report/src/types.ts).
  Prefer the workspace completion-summary channel when available
  (`@songara/pwa-base/completion-report`). See
  [run-report-standard](../../docs/guides/run-report-standard.md). **Never redefine report
  sections here.**
- Public API + consumption rules:
  [`docs/guides/consuming-pwa-base.md`](../../docs/guides/consuming-pwa-base.md).

## Do

1. Plan briefly, then implement (Build Mode). Prefer extending existing systems over new
   parallel ones.
2. Respect boundaries: inside the monorepo use `@platform/*`; in sibling apps import only
   from `@songara/pwa-base` documented entry points.
3. In an isolated KanDev worktree, before any `install`/build, run the sibling linker
   (per the `songara-sibling-file-deps` rule):

   ```bash
   node "${SONGARA_PROJECTS_ROOT:-$HOME/projects}/PWA-Base/scripts/ensure-sibling-file-deps.mjs"
   ```

4. Climb the validation ladder from `CURSOR.md` (build, types, unit, integration,
   Playwright where flows change, deploy where a service changes).
5. On UI change, capture artifacts (`pnpm capture:artifacts`) and describe them in Visual
   Validation.
6. Persist the structured completion summary; put developer steps in **Actions Required**
   (or state none). Do not fragment work into extra Tasks.

## Don't

- Don't claim done before validation passes (`CURSOR.md` DoD).
- Don't modify runtime packages beyond what the change needs.
- Don't paper over root causes; fix them.

## Hand-off

Report to the [Orchestrator](./orchestrator.md) using the completion structure in
[`_shared.md`](./_shared.md): what changed, how it was validated, and any Actions Required.
If the change satisfies the two-consumer rule, flag a
[promotion](../workflows/promote-to-pwa-base.md). The Orchestrator decides when it is ready
for the Reviewer.
