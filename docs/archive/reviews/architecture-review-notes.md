# Architecture review notes

Notes for reviewers evaluating trade-offs in the platform foundation. Complements ADRs; does not replace them.

## Intentionally simplified

| Area                 | Simplification                                            | Why                                                    |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Catalog              | In-package TypeScript array; manual one-line registration | Explicit reviews; no magic filesystem scanning         |
| `defineSite`         | Typed identity function                                   | Boundary marker without speculative runtime validation |
| `component: unknown` | Registry stays React-free                                 | Host owns rendering cast; sites stay extractable       |
| Host chrome          | Minimal landing + landmarks                               | Prove routing contract, not product marketing          |
| Design system        | Three primitives + tokens                                 | Enough for reuse; inventory lists deferred widgets     |
| Docker               | Single static nginx service                               | Local parity without production edge stack             |
| Tests                | Empty-catalog unit + `/` e2e smoke                        | Validate platform, not hypothetical apps               |

## Technical debt accepted for MVP

1. **Host CSS not on design tokens** — Dual styling until host imports `@platform/ui/tokens.css`.
2. **Landing uses `<a href>` for site links** — Fine with empty catalog; switch to React Router `Link` when sites exist.
3. **No skip link** — Accessibility baseline docs call for it; not yet on host landing.
4. **No CI workflow file** — Validation is documented and runnable locally; GitHub Actions deferred.
5. **Catalog is eager** — All site modules load with the host bundle once registered; lazy `import()` is a planned evolution, not implemented.

Treat these as known, time-boxed debt — not accidental omissions.

## Architectural trade-offs

| Choice                          | Benefit                                      | Cost                                                |
| ------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Modular monolith                | One deploy, shared packages, simple local DX | Sites share a release train until extracted         |
| Explicit catalog                | Greppable coupling; clear PR diffs           | Manual step; registry package gains site deps       |
| Split `/contract` vs root entry | Prevents site ⇄ catalog cycles               | Contributors must remember the correct import path  |
| pnpm catalog versions           | Consistent React/tooling across packages     | Requires discipline (`catalog:` vs pinned versions) |
| Static SPA host                 | Simple Docker/nginx story                    | No SSR/API in platform yet (out of scope)           |

## Do not change lightly

These are load-bearing. Changing them needs an ADR update and broad review:

1. **Host must not import `@platform/site-*`** — Breaks the modular boundary.
2. **Sites must import `/contract`, not the registry package root** — Avoids circular modules.
3. **Catalog is the only registration surface** — Do not add second discovery mechanisms without superseding ADR-002.
4. **`SiteDefinition` field semantics** (`id`, `basePath`, `title`, `routes`) — Additive fields OK; renames/removals are breaking.
5. **Frozen lockfile in Docker** — Reproducible images; do not reintroduce `--no-frozen-lockfile` without cause.
6. **Package naming `@platform/*` and `apps/platform` host naming** — Consistency across docs and imports.

## Expected to evolve

| Area             | Likely direction                                           |
| ---------------- | ---------------------------------------------------------- |
| `SiteDefinition` | Optional metadata, feature flags, lazy route factories     |
| Catalog          | Env-gated entries; code-split site packages                |
| Host chrome      | Consume `@platform/ui`; skip link; site switcher           |
| `@platform/ui`   | Forms, focus-trap dialogs only when a real site needs them |
| Deploy           | Traefik / reverse proxy labels wired for real hosts        |
| Sites            | First real packages under `packages/site-*`                |
| Testing          | Registered-route e2e when catalog is non-empty             |
| Tooling          | CI pipeline mirroring `pnpm lint/typecheck/test/build`     |

## Out of scope (still)

Auth, databases, backend APIs, CMS, multi-tenant billing, production Traefik stack, and concrete product sites (portfolio, blog, illusions, tools). Building those now would muddy the platform review.

## Related

- [Platform foundation review](./platform-foundation-review.md) (Agent 7 + P0/P1 status)
- [Executive summary](./executive-summary.md)
- [ADR index](../adr/README.md)
