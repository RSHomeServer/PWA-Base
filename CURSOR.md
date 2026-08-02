# Project Engineering Contract

Canonical engineering behaviour for Cursor (and humans) working in this repository.

Do **not** paste milestone boilerplate that repeats this file. Point at `CURSOR.md` instead.

Reporting field shapes and section order are **not** defined here — see [Reporting](#reporting).

---

## Execution Philosophy

- Default to **Build Mode**: plan briefly, then implement.
- Keep planning internal; do not stop to ask the user to switch modes.
- Continue refining the plan while implementing.
- Ask for clarification only when genuinely blocked.

---

## Engineering Principles

- Prefer extending existing systems over new parallel ones.
- Avoid duplicate implementations; reuse shared helpers and packages.
- Prefer deterministic logic over AI/heuristic reasoning when rules are knowable.
- Fix root causes; do not paper over symptoms repeatedly.
- Leave the project better than you found it (small cleanups tied to the change are fine).

---

## Validation

Do not report completion until validation succeeds.

Every implementation should:

1. Build successfully
2. Pass type checking
3. Pass unit tests
4. Pass integration tests
5. Pass Playwright where UI or user flows are affected
6. Deploy successfully when the change touches a deployable service (e.g. Docker telemetry rebuild)
7. Contain no obvious regressions

---

## Developer Actions

- Never request a developer action without **why**, **priority**, and **expected outcome**.
- Never recommend restarting services without evidence (paths, config, process model).
- Explicitly state when **no developer action is required**.
- Developer actions belong in the Task completion report (Actions Required), not as a second Task.

---

## Task Lifecycle

- Treat one user request as **one Task**.
- Prefer consolidating related Runs under that Task; do not fragment work into multiple Tasks.
- Put follow-ups and operator steps inside the completion report.

Lifecycle details: [docs/guides/run-lifecycle.md](docs/guides/run-lifecycle.md).

---

## Visual Validation

When UI changes:

1. Capture screenshots (`pnpm capture:artifacts` when wired for the change).
2. Describe what changed.
3. Explain why the screenshots matter.

Do not drop images without narrative.

---

## Documentation

- When reusable UI components are introduced or changed: update the Components catalogue (`pnpm --filter @platform/site-components generate:catalog` when applicable).
- Update architecture docs when behaviour or boundaries change.
- Prefer linking to this contract and the reporting source of truth over copying prose.

---

## Subagents

- Spawn subagents only when work is genuinely parallel.
- Always integrate results before reporting completion.

---

## Reporting

Structured completion reports use a **single source of truth**:

| Layer | Location |
| --- | --- |
| Type / field shape | `RunCompletionSummary` in [`apps/telemetry/src/types.ts`](apps/telemetry/src/types.ts) |
| Section registry + validation | [`apps/telemetry/src/completion-report-contract.ts`](apps/telemetry/src/completion-report-contract.ts) |
| Normalise / markdown export | [`apps/telemetry/src/completion-summary.ts`](apps/telemetry/src/completion-summary.ts) |
| Human guide | [`docs/guides/run-report-standard.md`](docs/guides/run-report-standard.md) |

**Do not** redefine report sections in prompts or in this file. Change the TypeScript contract (and its tests), then update the human guide if needed.

Prefer:

```http
PUT /telemetry/api/tasks/:id/completion-summary
```

Markdown is an export format only.

---

## Definition of Done

Completion is allowed only when:

- [ ] Implementation finished
- [ ] Validation passed (build, types, unit, integration, Playwright as applicable, deploy as applicable)
- [ ] Documentation updated when reusable components or architecture changed
- [ ] Visual validation captured and described when UI changed
- [ ] Developer actions documented in the report (or explicitly none)
- [ ] No obvious regressions remain
- [ ] Structured completion summary persisted and conforms to the reporting contract (warnings addressed or justified)
