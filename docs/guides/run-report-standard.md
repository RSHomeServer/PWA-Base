# Run Report Standard

Agent behaviour (execution, validation, DoD): see root [`CURSOR.md`](../../CURSOR.md).
Process wrap-up (completion table, local `main`, no AI co-authors):
[`.kandev/prompts/_shared.md`](../../.kandev/prompts/_shared.md).

## Canonical definition (source of truth)

| Concern | Location |
| --- | --- |
| Field shape (`RunCompletionSummary`) | [`packages/completion-report/src/types.ts`](../../packages/completion-report/src/types.ts) |
| Section registry + validation | [`packages/completion-report/src/completion-report-contract.ts`](../../packages/completion-report/src/completion-report-contract.ts) |
| Normalise / markdown export | [`packages/completion-report/src/completion-summary.ts`](../../packages/completion-report/src/completion-summary.ts) |
| Public import | `@songara/pwa-base/completion-report` |

**Do not** redefine sections in prompts, `CURSOR.md`, or editor rules. Change the TypeScript
contract, add/adjust tests, then update this guide if human wording needs a refresh.

Telemetry HTTP APIs are **not** part of PWA-Base. Prefer the workspace completion-summary
channel when available.

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
8. **Actions Required** *(operator steps — not a second Task)*
9. Known Limitations
10. Recommended Next Milestone

Validators may report `reportValidation` (`ok`, `errors`, `warnings`, `missingSections`).
Missing recommended sections are **warnings**; structural issues are **errors**.

## Overview quality

Write for someone returning after several days. Cover: what was implemented, why,
user impact, validation performed, remaining work. Prefer ≥40 characters of real narrative.

## Actions Required

Belongs inside the Task report. Never starts another Task. Each item: Action,
Priority, Reason, Expected Outcome. **When the operator must run something, include the exact command(s)** in the Action or Expected Outcome (copy-pasteable). If none: **“No developer action required.”**

Include push-to-`origin/main` commands here when git changed (agents merge local `main` only).

## Visual Validation

```bash
pnpm capture:artifacts
```

Capture tooling may be a stub in this foundation repo after product removal; still describe
Visual Validation when UI changed.

## How to change the report format

1. Edit `RunCompletionSummary` in `packages/completion-report/src/types.ts` (bump `schemaVersion` on breaking changes).
2. Update `COMPLETION_REPORT_SECTIONS` and validators in `completion-report-contract.ts`.
3. Update `normaliseCompletionSummary` / merge / markdown export in `completion-summary.ts` as needed.
4. Extend unit tests.
5. Refresh this guide — not `CURSOR.md` section lists.

## Related

- Living process: [`.kandev/`](../../.kandev/)
- Reviewer checklist: [`.kandev/review-checklist.md`](../../.kandev/review-checklist.md)
