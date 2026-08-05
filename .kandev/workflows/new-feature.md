# Workflow: New Feature

Add new capability to an app or the shared foundation.

> Coordinated by the [Orchestrator](../prompts/orchestrator.md). It briefs each specialist,
> collects the report, and returns to the centre between steps to decide the next one based
> on project state. Every specialist reports back to the Orchestrator, never to the user.
> The sequence below is typical, not rigid.

## Sequence (Orchestrator-coordinated)

1. **[Discovery](../prompts/discovery.md)** → [discovery-ticket](../templates/discovery-ticket.md).
   Scope the problem, acceptance criteria, in/out of scope.
2. **[Architect](../prompts/architect.md)** *(skippable for small, boundary-preserving
   features)* → decide app-local vs shared (two-consumer rule,
   [ADR-003](../../docs/adr/003-phase2-shared-packages.md)); record a formal
   [ADR](../templates/architecture-decision.md) if a boundary/API changes, else an
   [LDR](../decisions/) → produce a [feature-ticket](../templates/feature-ticket.md).
3. **[Executor](../prompts/executor.md)** → implement in Build Mode, climb the validation
   ladder ([`CURSOR.md`](../../CURSOR.md)), capture Visual Validation on UI change, persist
   the structured completion summary.
4. **[Reviewer](../prompts/reviewer.md)** → read-only pass against the
   [review checklist](../../docs/reviews/review-checklist.md); findings back to the
   Orchestrator, which dispatches any fixes.

The Orchestrator may run **multiple Executors in parallel** when the feature splits into
independent, non-overlapping pieces.

## When to skip Architect

Skip when the change stays inside one package, touches no dependency rule, and adds no
public export. If in doubt, do a short Architect pass.

## New site inside the monorepo

Prefer `pnpm new-app <name>` and follow
[creating-a-new-site.md](../../docs/guides/creating-a-new-site.md); the Architect confirms
catalogue wiring per [ADR-002](../../docs/adr/002-site-registration-catalog.md).

## Exit

DoD in [`CURSOR.md`](../../CURSOR.md) met; human review approved (**no auto-merge**,
[`CONTRIBUTING.md`](../../CONTRIBUTING.md)).
