# Bug Ticket: <title>

> Follows a [discovery-ticket](./discovery-ticket.md). Fixed by the
> [Executor](../prompts/executor.md) via the [bug-fix](../workflows/bug-fix.md) workflow.

- **Severity:** blocker | major | minor
- **Discovery / report:** link

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
