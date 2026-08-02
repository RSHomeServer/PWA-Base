# ADR-001: Modular monolith with Vite/React/TypeScript host

## Status

Accepted

## Context

We need a platform that hosts multiple websites under one deployment while keeping each site independently developable. Options considered:

1. **Separate apps per site** — each site is its own Vite app and deployable. Maximum isolation, but shared UI, routing, and ops multiply quickly.
2. **Microfrontends (runtime federation)** — strong runtime boundaries, higher complexity and operational cost than we need for an early platform.
3. **Modular monolith** — one Vite + React + TypeScript host application; sites live as packages that register into a shared catalog. One build, one deploy, clear package boundaries.

The platform must stay small at the foundation: prefer host/platform naming (not “shell”), avoid speculative abstractions, and keep the host free of site-specific knowledge.

## Decision

Adopt a **modular monolith**:

- **Host**: a Vite + React + TypeScript application (`apps/platform`) that owns the single SPA entry, root router, and layout chrome.
- **Sites**: packages that implement a shared registration contract and appear in a central catalog.
- **Shared libraries**: packages such as `@platform/ui` and `@platform/config` for cross-cutting concerns when needed.

The host depends only on the site registration contract/catalog API (`@platform/site-registry`), never on individual site package implementations.

## Consequences

### Positive

- One build pipeline and one runtime for all sites.
- Clear ownership: host vs site packages vs shared contract.
- Sites can later be extracted into separate apps if boundaries stay clean (see ADR-002).

### Negative / trade-offs

- Sites share a single deploy and dependency tree; a bad site change can affect the whole platform unless CI and ownership discipline catch it.
- Path-based routing and catalog discipline are required so the host stays site-agnostic.

### Follow-ups

- Tooling (Vite, ESLint, workspace wiring) is owned by subsequent platform setup work.
- Site registration mechanics are defined in ADR-002.
