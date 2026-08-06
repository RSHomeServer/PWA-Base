# Feature Ticket: <title>

> Follows a [discovery-ticket](./discovery-ticket.md). Implemented by the
> [Executor](../prompts/executor.md) via the [new-feature](../workflows/new-feature.md) workflow.
> KanDev profile: **Executor**.

- **Discovery:** link to the discovery ticket
- **Decision:** link to the ADR ([draft](./architecture-decision.md) → `docs/adr/`) or
  [LDR](../decisions/), if any

## Before you start — sync to `origin/main`

The human pushes after every ticket. Run this **first**:

```bash
cd "${SONGARA_PROJECTS_ROOT:-$HOME/projects}/PWA-Base"
git checkout main
git fetch origin
git pull --ff-only origin main

cd "<this-worktree>"
git fetch origin
git merge --ff-only origin/main
```

Confirm HEAD matches (or is based on) `origin/main`, then create your feature branch.
Details: [`../prompts/_shared.md`](../prompts/_shared.md).

## Summary

What is being added and the user-visible outcome.

## Motivation

Why now; the problem it solves (link Discovery rather than restating it).

## Design

The approach and boundaries from the Architect. Affected packages:

| Package / path | Change |
| --- | --- |
|  |  |

State whether anything is a candidate for [promotion](../workflows/promote-to-pwa-base.md)
under the two-consumer rule.

## Validation plan

Climb the ladder from [`CURSOR.md`](../../CURSOR.md); tick what applies:

- [ ] build
- [ ] typecheck
- [ ] unit
- [ ] integration
- [ ] Playwright (UI / user flows)
- [ ] Visual Validation captured & described (UI changes)

## Actions Required

Developer steps with **why / priority / expected outcome**, or "No developer action required."
These belong in the completion report; the report shape is defined in
[`packages/completion-report/src/types.ts`](../../packages/completion-report/src/types.ts) — do not redefine it here.

## Wrap-up

Commit (no editor/AI co-author trailers) → merge **local `main`** → do not push → completion
table with push commands → `step_complete_kandev`.
