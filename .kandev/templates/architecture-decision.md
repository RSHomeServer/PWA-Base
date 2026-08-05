# ADR-NNN: <title>

> **Drafting shape only.** The accepted record lives in [`docs/adr/`](../../docs/adr/) and
> is indexed in [`docs/adr/README.md`](../../docs/adr/README.md). Use this template to draft
> a **formal** ADR (a boundary, dependency-rule, or public-API change). For a tactical,
> reversible choice, use a lightweight [decision record](../decisions/) instead.

## Status

Proposed | Accepted | Superseded by ADR-XXX

## Context

The forces at play: requirements, constraints, and the prior state. Link relevant
[architecture](../../docs/architecture.md) sections and existing ADRs.

## Decision

The decision, stated plainly.

### Shared vs app-local (two-consumer check)

Per [ADR-003](../../docs/adr/003-phase2-shared-packages.md), shared placement requires a
**second consumer using the API unchanged**. Record the two consumers, or state why the
code stays app-local.

## Consequences

### Positive

-

### Negative / trade-offs

-

### Follow-up

- Docs to update (e.g. dependency table in `docs/architecture.md`,
  [`consuming-pwa-base.md`](../../docs/guides/consuming-pwa-base.md)).
