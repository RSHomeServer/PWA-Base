# Bug Ticket: <title>

> Follows a [discovery-ticket](./discovery-ticket.md). Fixed by the
> [Executor](../prompts/executor.md) via the [bug-fix](../workflows/bug-fix.md) workflow.
> KanDev profile: **Executor**. Remote Git Policy: [`../prompts/_shared.md`](../prompts/_shared.md).

- **Severity:** blocker | major | minor
- **Discovery / report:** link

## Before you start — sync + feature branch

```bash
cd "${SONGARA_PROJECTS_ROOT:-$HOME/projects}/PWA-Base"
git fetch origin && git checkout main && git pull --ff-only origin main

cd "<this-worktree>"
git fetch origin && git merge --ff-only origin/main
git checkout -b <feature-branch>
```

Do **not** commit on `main`. Details: [`../prompts/_shared.md`](../prompts/_shared.md).

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

When the ticket work is validated (wrap-up — no extra human “open a PR” prompt needed):
commit on the feature branch → push feature branch → open/update PR into `main` →
completion table (branch + PR URL) → `step_complete_kandev`. **Do not** merge, approve, or
push `main`. Human reviews and squash-merges; the next ticket syncs to `origin/main` after
that merge.
