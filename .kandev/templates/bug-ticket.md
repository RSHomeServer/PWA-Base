# Bug Ticket: <title>

> Follows a [discovery-ticket](./discovery-ticket.md). Fixed by the
> [Executor](../prompts/executor.md) via the [bug-fix](../workflows/bug-fix.md) workflow.
> KanDev profile: **Executor**.

- **Severity:** blocker | major | minor
- **Discovery / report:** link

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

Confirm HEAD matches (or is based on) `origin/main`, then branch. Details:
[`../prompts/_shared.md`](../prompts/_shared.md).

## Reproduction

Exact steps, environment, and inputs.

1.
2.

## Expected vs actual

- **Expected:**
- **Actual:**

## Suspected root cause

Where the defect likely lives and why. Fix the root cause, not the symptom
([`CURSOR.md`](../../CURSOR.md)).

## Affected packages

| Package / path | Note |
| --- | --- |
|  |  |

## Fix & regression test

- Change:
- **Regression test added:** yes / no — where:

## Validation

- [ ] build · [ ] typecheck · [ ] unit · [ ] integration · [ ] Playwright (if flow affected)
- [ ] Visual Validation (if UI changed)

## Actions Required

Developer steps, or "No developer action required." Recorded in the completion report
(shape: [`packages/completion-report/src/types.ts`](../../packages/completion-report/src/types.ts)).

## Wrap-up

Commit (no editor/AI co-author trailers) → merge **local `main`** → do not push → completion
table with push commands → `step_complete_kandev`.
