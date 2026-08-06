# Engineering contract (`CURSOR.md`)

## Purpose

[`CURSOR.md`](../../CURSOR.md) at the repository root is the **project engineering contract**.
It tells contributors how to execute work: build-first behaviour, validation expectations,
task lifecycle, documentation duties, and definition of done.

It deliberately avoids embedding report field lists. Those live in TypeScript so tools
cannot drift from agent prose.

Process details (completion table, local `main`, no editor co-authors):
[`.kandev/prompts/_shared.md`](../../.kandev/prompts/_shared.md).

## Engineering workflow

1. Read `CURSOR.md` for behaviour; do not wait for milestone prompts to restate it.
2. Prefer extending existing systems; keep planning internal; implement after a short plan.
3. Validate before claiming done (build, types, unit, integration, Playwright as applicable).
4. Persist a structured Task completion summary via `packages/completion-report` (see
   [run-report-standard.md](./run-report-standard.md)).
5. Document developer actions inside the report (or state none). Capture visual validation
   when UI changes.

## Reporting workflow

1. Author the structured `RunCompletionSummary` object (not Markdown-as-source).
2. Persist via the workspace completion-summary channel when available
   (`@songara/pwa-base/completion-report`).
3. Address `reportValidation` warnings when finishing a milestone.
4. Optional: export Markdown from the structured object for sharing — never the other way
   around for new work.

Telemetry HTTP APIs are not part of this repository.

## Changing the report structure

Update the **canonical TypeScript contract**, not `CURSOR.md`:

1. `packages/completion-report/src/types.ts` — `RunCompletionSummary`
2. `packages/completion-report/src/completion-report-contract.ts` — sections + validation
3. `packages/completion-report/src/completion-summary.ts` — normalise / export
4. This guide and tests

`CURSOR.md` should only link to those files.

## Related

- [Run report standard](./run-report-standard.md)
- [`.kandev/` operating system](../../.kandev/README.md)
- [Architecture](../architecture.md)
