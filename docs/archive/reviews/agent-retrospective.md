# Agent retrospective

How the platform foundation was built with phased multitask agents on branch `feat/platform-foundation`. No worktrees were used; all agents shared one checkout with **exclusive file ownership** to reduce merge conflicts.

Parent / Lead coordinated phases and applied P0/P1 fixes after Agent 7’s review.

## Phase map

```text
Phase 1  Architecture          (sequential)
Phase 2  Tooling ∥ Design System
Phase 3  Docker ∥ Testing
Phase 4  Documentation         (sequential)
Phase 5  Reviewer              (read-only)
Lead     P0/P1 remediation     (after review)
```

## Agent summaries

### Agent 1 — Architecture

|                      |                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------- |
| **Responsibilities** | ADRs, package boundaries, site registration contract, folder stubs                 |
| **Owned paths**      | `docs/adr/**`, `packages/site-registry/**`, stub `package.json` for host/ui/config |
| **Completed**        | ADR-001/002; `SiteDefinition` / `defineSite` / `getSites`; empty catalog; stubs    |
| **Validation**       | Local `tsc` on site-registry                                                       |
| **Challenges**       | Nested npm install under site-registry (cleaned by Agent 2)                        |

### Agent 2 — Workspace & Tooling

|                      |                                                                                   |
| -------------------- | --------------------------------------------------------------------------------- |
| **Responsibilities** | pnpm workspace, Vite host, ESLint/Prettier/EditorConfig, scripts                  |
| **Owned paths**      | Root tooling, `packages/config/**`, `apps/platform/**`                            |
| **Completed**        | Full monorepo; host landing + `getSites()` routing; root scripts                  |
| **Validation**       | `pnpm install/build/lint/typecheck/format:check`                                  |
| **Challenges**       | Avoiding Agent 3’s UI sources; temporary Prettier ignores for other agents’ trees |

### Agent 3 — Design System

|                      |                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------- |
| **Responsibilities** | Tokens, a11y baseline, UI primitives, inventory docs                                         |
| **Owned paths**      | `packages/ui/**`, `docs/design-system/**`                                                    |
| **Completed**        | tokens.css; Button/Link/Stack; design-system docs                                            |
| **Validation**       | Package-local typecheck                                                                      |
| **Challenges**       | Parallel with Agent 2 — host not wired to UI (accepted); initial React 18 pins (fixed in P1) |

### Agent 4 — Docker

|                      |                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Responsibilities** | Dockerfile, Compose, nginx, healthcheck, `.dockerignore`                             |
| **Owned paths**      | `Dockerfile`, `docker-compose.yml`, `docker/**`, `.dockerignore`                     |
| **Completed**        | Multi-stage Node→nginx; `:8080`; `/health`                                           |
| **Validation**       | `docker compose build/up`; healthcheck healthy                                       |
| **Challenges**       | Temporarily used `--no-frozen-lockfile` while Agent 5 updated lockfile (fixed in P1) |

### Agent 5 — Testing

|                      |                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **Responsibilities** | Vitest, Playwright, smoke tests, testing guide                                           |
| **Owned paths**      | `e2e/**`, Playwright/Vitest configs, `*.test.ts`, `docs/guides/testing.md`, test scripts |
| **Completed**        | Catalog + `joinPaths` unit tests; landing e2e; root `test` scripts                       |
| **Validation**       | `pnpm test:unit`, `pnpm test:e2e`, `pnpm build`                                          |
| **Challenges**       | Extracted `joinPaths` for testability; Playwright browser install prerequisite           |

### Agent 6 — Documentation

|                      |                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Responsibilities** | README, CONTRIBUTING, architecture overview, create-site / local-dev guides                                 |
| **Owned paths**      | `README.md`, `CONTRIBUTING.md`, `docs/architecture.md`, `docs/guides/*` (except rewriting testing strategy) |
| **Completed**        | Product docs consuming ADRs; link index                                                                     |
| **Validation**       | Internal link pass (reported 37 links)                                                                      |
| **Challenges**       | Documenting UI consumption while host still unwired — called out as foundation status                       |

### Agent 7 — Reviewer

|                      |                                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| **Responsibilities** | Read-only architectural review; no implementation                            |
| **Owned paths**      | `docs/reviews/platform-foundation-review.md` only                            |
| **Completed**        | Pass-with-recommendations report (P0/P1/P2)                                  |
| **Validation**       | Inspection checklist across packages/docs/Docker/tests                       |
| **Challenges**       | Found doc/code mismatches and latent cycle — correctly did not “fix forward” |

### Lead (parent) — P0/P1 remediation + review package

|                      |                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Responsibilities** | Phase orchestration; apply P0/P1; prepare architectural review docs                            |
| **Completed**        | `/contract` split; dependency docs; frozen lockfile; UI catalog alignment; this review package |
| **Validation**       | Full suite + Docker frozen build                                                               |

## What parallelisation worked well

- **Exclusive ownership** (path leases) allowed Phase 2 and Phase 3 to run two agents concurrently without rebase wars.
- **Sequential gates** (Architecture before Tooling; Docs after implementation; Reviewer last) kept contracts stable.
- **Empty catalog** meant Tooling and Design System did not need a real site to unblock.
- Background subagents returned concise summaries that the Lead could chain into the next phase.

## What caused friction / conflicts

- **Shared lockfile / root `package.json`**: Docker (Agent 4) and Testing (Agent 5) both affected install reproducibility → temporary `--no-frozen-lockfile`.
- **Prettier ownership**: Agent 2 ignored other agents’ trees so `format:check` would pass; later cleaned up.
- **UI vs host**: Parallel delivery left host unwired — correct for ownership, but created dual styling (still open P2).
- **Doc drift**: Architecture table initially forbade registry→site deps while the create-site guide required them (fixed P0).
- **No worktrees**: Safe only because ownership was strict; overlapping files would have conflicted.

## Recommendations for future multitask runs

1. **Keep path leases written in the plan** before spawning agents; treat lease violations as bugs.
2. **Prefer worktrees** when two agents must edit the same manifests (`package.json`, lockfile).
3. **Assign a single “manifest owner”** (usually Tooling) for root `package.json` / lockfile; others request changes via Lead.
4. **Freeze Docker to `--frozen-lockfile` only after** the Testing/Tooling lockfile update lands — or sequence Docker after Testing.
5. **Reviewer stays read-only**; Lead or a fix-forward agent applies P0/P1.
6. **Document import paths in the contract package README** before parallel site work begins (`/contract` vs root).
7. **Validate at phase boundaries** (`build`/`test`) before spawning the next wave.

## Agent ID reference (this conversation)

Useful if inspecting chat history / subagent transcripts in Cursor:

| Phase | Role                                | Notes            |
| ----- | ----------------------------------- | ---------------- |
| 1     | Architecture                        | Contract + ADRs  |
| 2     | Workspace & Tooling ∥ Design System | Parallel         |
| 3     | Docker ∥ Testing                    | Parallel         |
| 4     | Documentation                       | Sequential       |
| 5     | Reviewer                            | Read-only report |

Parent chat title historically: “Platform foundation execution” / architecture breakdown.
