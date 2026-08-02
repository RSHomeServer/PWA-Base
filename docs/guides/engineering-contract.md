# Engineering contract (`CURSOR.md`)

## Purpose

[`CURSOR.md`](../../CURSOR.md) at the repository root is the **project engineering contract**. It tells Cursor (and contributors) how to execute work: build-first behaviour, validation expectations, task lifecycle, documentation duties, and definition of done.

It deliberately avoids embedding report field lists. Those live in TypeScript so the dashboard and APIs cannot drift from agent prose.

## Engineering workflow

1. Read `CURSOR.md` for behaviour; do not wait for milestone prompts to restate it.
2. Prefer extending existing systems; keep planning internal; implement after a short plan.
3. Validate before claiming done (build, types, unit, integration, Playwright as applicable, deploy as applicable).
4. Persist a structured Task completion summary via telemetry (see [run-report-standard.md](./run-report-standard.md)).
5. Document developer actions inside the report (or state none). Capture visual validation when UI changes.

## Reporting workflow

1. Author the structured `RunCompletionSummary` object (not Markdown-as-source).
2. `PUT /telemetry/api/tasks/:id/completion-summary` with that object.
3. Inspect `reportValidation` in the response; address warnings when finishing a milestone.
4. Optional: export Markdown from the structured object for sharing — never the other way around for new work.

## Changing the report structure

Update the **canonical TypeScript contract**, not `CURSOR.md`:

1. `apps/telemetry/src/types.ts` — `RunCompletionSummary`
2. `apps/telemetry/src/completion-report-contract.ts` — sections + validation
3. `apps/telemetry/src/completion-summary.ts` — normalise / export
4. Dashboard mirror types + UI sections
5. This guide and tests

`CURSOR.md` should only link to those files.

## Related

- [Run report standard](./run-report-standard.md)
- [Run lifecycle](./run-lifecycle.md)
- [Architecture](../architecture.md)
- [Testing](./testing.md)
