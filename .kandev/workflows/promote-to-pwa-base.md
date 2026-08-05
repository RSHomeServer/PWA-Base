# Workflow: Promote to PWA-Base

Move code from an app (or a candidate module) **up** into the shared foundation
`@songara/pwa-base`. This is the workflow that makes PWA-Base a real platform.

Triggered and coordinated by the **[Orchestrator](../prompts/orchestrator.md)** when the
two-consumer rule is satisfied. Driven by the **[Maintainer](../prompts/maintainer.md)**, with
an **[Architect](../prompts/architect.md)** decision and an
**[Executor](../prompts/executor.md)** implementation. Each specialist reports back to the
Orchestrator, which decides milestone readiness.

## Gate — the two-consumer rule (required first)

Per [ADR-003](../../docs/adr/003-phase2-shared-packages.md), promote only when a **second**
consumer will use the API **unchanged**. Record both consumers in the
[promotion-ticket](../templates/promotion-ticket.md). **One consumer is not enough** — the
code stays app-local.

## Steps

1. **Maintainer/Architect** — confirm the gate; choose the target package and a documented
   public entry point (see [`consuming-pwa-base.md`](../../docs/guides/consuming-pwa-base.md)).
   Record the decision: formal [ADR](../templates/architecture-decision.md) if it changes a
   boundary/dependency rule/public API; otherwise an [LDR](../decisions/).
2. **Executor** — move the code, wire the export, and update:
   - the dependency-rules table in [`docs/architecture.md`](../../docs/architecture.md),
   - the public API table in [`consuming-pwa-base.md`](../../docs/guides/consuming-pwa-base.md),
   - and check the "remaining work before publishing" list there.
   Verify a consumer builds against the new entry point. Respect the internal/public split
   (consumers import only from `@songara/pwa-base`).
3. **Maintainer** — versioning: renames/removals are **breaking**; bump per
   [`docs/guides/versioning.md`](../../docs/guides/versioning.md) and root `VERSION`.
4. **Reviewer** — read-only pass; verify no consumer imports an internal path and the docs
   match the exports.

## Exit

Public API and docs in sync, a second consumer builds against it, version bumped as needed,
human review approved (**no auto-merge**, [`CONTRIBUTING.md`](../../CONTRIBUTING.md)).
