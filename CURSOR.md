# Project Engineering Contract

Canonical engineering behaviour for people working in this repository.

Do **not** paste milestone boilerplate that repeats this file. Point at `CURSOR.md` instead.

Reporting field shapes and section order are **not** defined here — see [Reporting](#reporting).

---

## Environment

- **Dev / validation:** Ubuntu VM (this checkout and sibling app repos).
- **Production:** Proxmox (Website Hosting). Deploy there only after Ubuntu validation.
- **Telemetry:** not in this repository. Task orchestration is KanDev; completion-report
  types live in `packages/completion-report`. Do not start or depend on a Telemetry service
  for work in PWA-Base.
- **Layout:** foundation monorepo + `hello-web` reference app; product apps are sibling repos.

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
- Prefer deterministic logic over heuristic reasoning when rules are knowable.
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
6. Contain no obvious regressions

Production deploy to Proxmox is a **human** step after Ubuntu VM validation — not a
local DoD gate for foundation work unless the ticket explicitly requires it.

---

## Developer Actions

- Never request a developer action without **why**, **priority**, and **expected outcome**.
- Never recommend restarting services without evidence (paths, config, process model).
- Explicitly state when **no developer action is required**.
- Developer actions belong in the Task completion report (Actions Required), not as a second Task.

---

## Task Lifecycle

- Treat one user request as **one Task**.
- Prefer consolidating related work under that Task; do not fragment work into multiple Tasks.
- Put follow-ups and operator steps inside the completion report.
- Process details: [`.kandev/prompts/_shared.md`](.kandev/prompts/_shared.md).

---

## Visual Validation

When UI changes:

1. Capture screenshots (`pnpm capture:artifacts` when wired for the change).
2. Describe what changed.
3. Explain why the screenshots matter.

Do not drop images without narrative.

---

## Documentation

- Update architecture docs when behaviour or boundaries change.
- Prefer linking to this contract and the reporting source of truth over copying prose.
- When reusable UI components are introduced or changed, update design-system docs as needed.

---

## Parallel work

- Spawn parallel specialists only when work is genuinely independent.
- Always integrate results before reporting completion.

---

## Git authorship and publish path

- Authorship is the human account only. **Never** add editor/AI co-author trailers
  (`Co-authored-by:`, `Generated-by:`, `Made-with:`, and similar) or mention tooling brands
  in commit messages.
- Default wrap-up: commit on the feature branch → merge into **local `main`** → **do not
  push**. The human runs `git push origin main` from their terminal.
- **Start of every ticket:** sync primary + worktree to `origin/main` (commands in
  `.kandev/prompts/_shared.md` and in the ticket brief).
- End each specialist run with the completion table in `.kandev/prompts/_shared.md`
  (what / why / push commands) and signal `step_complete_kandev`.
- Do not start the next ticket without explicit human approval.
- If work depends on a human push to `origin/main`, wait until they **confirm the push**,
  then start — never auto-start and race their terminal.

---

## Reporting

Structured completion reports use a **single source of truth**:

| Layer | Location |
| --- | --- |
| Type / field shape | `RunCompletionSummary` in [`packages/completion-report/src/types.ts`](packages/completion-report/src/types.ts) |
| Section registry + validation | [`packages/completion-report/src/completion-report-contract.ts`](packages/completion-report/src/completion-report-contract.ts) |
| Normalise / markdown export | [`packages/completion-report/src/completion-summary.ts`](packages/completion-report/src/completion-summary.ts) |
| Human guide | [`docs/guides/run-report-standard.md`](docs/guides/run-report-standard.md) |
| Public import | `@songara/pwa-base/completion-report` |

**Do not** redefine report sections in prompts or in this file. Change the TypeScript contract (and its tests), then update the human guide if needed.

Prefer the workspace completion-summary channel when available. Markdown is an export format only.

---

## Definition of Done

Completion is allowed only when:

- [ ] Implementation finished
- [ ] Validation passed (build, types, unit, integration, Playwright as applicable)
- [ ] Documentation updated when architecture or public API changed
- [ ] Visual validation captured and described when UI changed
- [ ] Developer actions documented in the report (or explicitly none)
- [ ] No obvious regressions remain
- [ ] Structured completion summary persisted and conforms to the reporting contract (warnings addressed or justified)
- [ ] Commits are free of editor/AI co-author trailers
- [ ] Completion table + `step_complete_kandev` delivered to the Orchestrator (when working under `.kandev/`)
