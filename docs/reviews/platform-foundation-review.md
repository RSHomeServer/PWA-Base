# Platform foundation review

**Branch:** `feat/platform-foundation`  
**Reviewer:** Agent 7 (initial) + Lead follow-up (P0/P1 fixes)  
**Dates:** 2026-07-18 (initial), 2026-07-19 (re-check after P0/P1)  
**Scope:** Docs, `packages/*`, `apps/platform`, Docker, tests — no merge.

## 1. Executive summary

**Verdict: Pass with remaining P2 / non-blocking follow-ups.**

P0 and P1 items from the initial review are addressed:

| Item                                                      | Status                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Architecture dependency table vs create-site guide        | **Fixed** — registry may depend on sites for catalog only; sites use `/contract` |
| Latent registry ⇄ site circular import                    | **Fixed** — `@platform/site-registry/contract` vs host root entry                |
| Docker `--frozen-lockfile`                                | **Fixed**                                                                        |
| `@platform/ui` React/catalog/`@platform/config` alignment | **Fixed**                                                                        |

Remaining concerns are intentional deferrals (host ↔ UI tokens) or polish (ADR already softened for `defineSite`; a11y/router nits).

## 2. What aligns well

- **Host ↔ contract:** Host imports only `@platform/site-registry` (`getSites`, types). No site-package imports in `apps/platform`.
- **Split entry points:** Sites use `@platform/site-registry/contract` (`defineSite` + types); host uses package root (`getSites` + types). Catalog never loads through the contract path.
- **Catalog coupling:** Docs and ADR-002 now match: registry → site deps are allowed **only** for `catalog.ts`.
- **Minimal catalog:** Empty list; `defineSite` remains a typed identity helper (ADR wording corrected).
- **Local-first ops:** pnpm workspace, Docker multi-stage → nginx + `/health`, Traefik comments only.
- **UI package:** Uses `catalog:` React 19 / types / typescript and extends `@platform/config/tsconfig.react.json`.
- **Tests / docs surface:** Foundation smoke coverage and guides remain appropriate.

## 3. Architectural inconsistencies (updated)

### Resolved

- ~~Dependency table contradicted create-site guide~~ → table and ADR updated.
- ~~Barrel export would cycle on first site~~ → `/contract` subpath.
- ~~Dockerfile `--no-frozen-lockfile`~~ → `--frozen-lockfile`.
- ~~UI React 18 / parallel tooling~~ → catalog + shared tsconfig.
- ~~ADR-002 “validates”~~ → typed identity / contract wording.

### Still open (non-blocking / P2)

1. **Host ↔ `@platform/ui` unwired** — Host still uses hard-coded `index.css`; tokens/primitives unused. Acceptable deferral; wire tokens (or mark host chrome temporary) before visual polish.
2. **Landing a11y / SPA nav** — Landmarks present; no skip link; empty-catalog `<a href>` fine until sites exist (then prefer React Router `Link`).
3. **Testing guide path wording** — Minor: sites documented under `packages/site-*` elsewhere; keep guides consistent when first site lands.

## 4. Duplication / complexity

No new speculative abstractions from the P0/P1 work. Split entry points add a small, documented surface that pays for cycle safety.

## 5. Recommendations before merge (remaining)

1. **P2 — Host tokens (optional for this PR):** Depend on `@platform/ui`, import `tokens.css`, replace hard-coded host CSS — or explicitly document temporary host chrome.
2. **P2 — When first site lands:** Extend unit/e2e for a registered route; confirm catalog dependency + `/contract` imports in practice.
3. **Non-blocking polish:** Skip link; Router `Link` on landing once sites exist; drop premature `color-scheme: light dark` until a dark-theme ADR.

P0/P1 from the original review are **not** merge blockers anymore.

## 6. Suggested follow-ups

- Keep Traefik, auth, DB, and real sites out of this PR.
- Consider `pnpm --filter @platform/host...` (ellipsis) in Docker once site packages enter the graph.
- Re-run full validation after any lockfile change (`pnpm install --frozen-lockfile` in CI/Docker).

## Inspection checklist (re-check)

| Area                                                      | Result                             |
| --------------------------------------------------------- | ---------------------------------- |
| Dependency docs / ADR-002 / create-site / registry README | Aligned                            |
| `/contract` vs root exports                               | Present; host still uses root only |
| Dockerfile frozen lockfile                                | Confirmed                          |
| `@platform/ui` catalog + config                           | Confirmed                          |
| Host site-agnostic rule                                   | Still holds                        |
| Out of scope                                              | Honored                            |
