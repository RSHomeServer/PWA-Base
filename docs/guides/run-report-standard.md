# Run Report Standard

Agent behaviour (execution, validation, DoD): see root [`CURSOR.md`](../../CURSOR.md).

## Canonical definition (source of truth)

| Concern | Location |
| --- | --- |
| Field shape (`RunCompletionSummary`) | [`apps/telemetry/src/types.ts`](../../apps/telemetry/src/types.ts) |
| Section registry + validation | [`apps/telemetry/src/completion-report-contract.ts`](../../apps/telemetry/src/completion-report-contract.ts) |
| Normalise / markdown export | [`apps/telemetry/src/completion-summary.ts`](../../apps/telemetry/src/completion-summary.ts) |

**Do not** redefine sections in prompts, `CURSOR.md`, or Cursor rules. Change the TypeScript contract, add/adjust tests, then update this guide if human wording needs a refresh.

Schema version: **2** (`COMPLETION_SUMMARY_SCHEMA_VERSION`).

## Section order (chat + JSON + UI)

Persisted summary fields plus presentation-only sections (registry-driven):

0. Overview (20–30 lines, max 500 words — sprint-review narrative)
1. Executive Summary
2. User Visible Changes
3. Architecture Changes
4. Files Modified
5. Configuration Changes
6. Testing Performed
7. Visual Validation *(artifacts; when UI changed)*
8. **Actions Required** *(derived in dashboard from modified paths — not a summary JSON field)*
9. Known Limitations
10. Recommended Next Milestone

PUT responses include `reportValidation` (`ok`, `errors`, `warnings`, `missingSections`) from the contract validator. Missing required/recommended sections are **warnings** (persist still succeeds); structural issues are **errors**.

## Overview quality

Write for someone returning after several days. Cover: what was implemented, why,
user impact, validation performed, remaining work. Avoid fixture one-liners
(e.g. “E2E fixture…”). Prefer ≥40 characters of real narrative.

API: `PUT /telemetry/api/tasks/:id/completion-summary` (preferred) or
`PUT /telemetry/api/runs/:id/completion-summary`.

## Actions Required

Belongs inside the Task report. Never starts another Task. Each item: Action,
Priority, Reason, Expected Outcome. **When the operator must run something, include the exact command(s)** in the Action or Expected Outcome (copy-pasteable). If none: **“No developer action required.”**

## Visual Validation

```bash
pnpm capture:artifacts -- --run-id <uuid> --files … --base-url http://127.0.0.1:4173
```

## How to change the report format

1. Edit `RunCompletionSummary` in `apps/telemetry/src/types.ts` (bump `schemaVersion` on breaking changes).
2. Update `COMPLETION_REPORT_SECTIONS` and validators in `completion-report-contract.ts`.
3. Update `normaliseCompletionSummary` / merge / markdown export in `completion-summary.ts` as needed.
4. Mirror field types in `packages/site-dashboard/src/api/types.ts`.
5. Extend unit tests; keep Playwright green.
6. Refresh this guide — not `CURSOR.md` section lists.

## Lifecycle

See [run-lifecycle.md](./run-lifecycle.md) for Task/Run consolidation and auto-complete.

## Notification Centre

API: `/telemetry/api/inbox`, `/telemetry/api/notification-preferences`.
