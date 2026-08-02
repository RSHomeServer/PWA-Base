# Review checklist

Use this while reviewing `feat/platform-foundation`. Check items as you go; note findings in your PR / review comments.

## Architecture

- [ ] Modular monolith intent is clear (one host deployable, many path-mounted sites)
- [ ] ADR-001 and ADR-002 match the code
- [ ] Host never imports `@platform/site-*`
- [ ] Sites (when added) must use `@platform/site-registry/contract`, not the package root
- [ ] Catalog is the only registration mechanism (no second discovery path)
- [ ] Out-of-scope items absent: auth, DB, APIs, production Traefik, real product sites

## Package boundaries

- [ ] `@platform/host` — routing + landing only; depends on registry root
- [ ] `@platform/site-registry` — contract + catalog; React-free types (`component: unknown`)
- [ ] `@platform/ui` — tokens + primitives only; no app widgets
- [ ] `@platform/config` — shared baselines; packages extend rather than fork
- [ ] Future sites belong under `packages/site-*`, not inside `apps/platform`

## Dependency direction

- [ ] `host → site-registry` (root) ✓
- [ ] `site → site-registry/contract` ✓ (documented)
- [ ] `site-registry → site-*` only via `catalog.ts` ✓ (documented)
- [ ] No `site → host` dependency
- [ ] `@platform/ui` uses `catalog:` React 19 / shared tsconfig

## Naming consistency

- [ ] Prefer **platform / host** (not “shell”) in docs and package names
- [ ] Scoped packages use `@platform/*`
- [ ] Host package name `@platform/host` lives in `apps/platform`

## Developer experience

- [ ] `README.md` quick start works as written
- [ ] `pnpm dev` starts host on 5173
- [ ] Scripts: `build`, `lint`, `typecheck`, `format`, `format:check`, `test`, `test:unit`, `test:e2e`
- [ ] Creating-a-site guide matches ADR-002 and architecture dependency table
- [ ] CONTRIBUTING states no auto-merge / ownership expectations

## Docker

- [ ] Multi-stage Dockerfile builds host with `pnpm install --frozen-lockfile`
- [ ] nginx serves SPA with `try_files` fallback
- [ ] `/health` returns ok; Compose healthcheck configured
- [ ] Port mapping **8080** documented
- [ ] Traefik is comments/labels only — no Traefik service required for local use
- [ ] `.dockerignore` excludes `node_modules`, tests, git metadata appropriately

## Testing

- [ ] Vitest: empty catalog + `joinPaths` cases
- [ ] Playwright: `/` landing smoke against preview
- [ ] `docs/guides/testing.md` describes scope (platform, not apps)
- [ ] First-time `playwright install chromium` documented

## Documentation

- [ ] ADRs indexed under `docs/adr/`
- [ ] `docs/architecture.md` dependency table matches create-site guide
- [ ] Design-system docs exist and inventory deferred components
- [ ] Review package complete: [README](./README.md)
- [ ] Internal links resolve (spot-check from executive summary and ChatGPT summary)

## Validation commands (run before approving)

```bash
corepack enable   # if needed
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test:unit
pnpm exec playwright install chromium   # first time
pnpm test:e2e
docker compose build                    # optional but recommended
```

## Sign-off

| Question                                                   | Y/N |
| ---------------------------------------------------------- | --- |
| Foundation is mergeable as a platform MVP?                 |     |
| P2 items (host tokens, a11y polish) tracked as follow-ups? |     |
| No accidental feature/app code in this PR?                 |     |

Reviewer: _________________ Date: _________________
