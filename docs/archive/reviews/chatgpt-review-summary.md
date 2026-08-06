# ChatGPT review summary — Website Hosting platform foundation

**Purpose:** Self-contained brief for an external reviewer (e.g. ChatGPT). Paste this document into another conversation to review efficiently with minimal repo browsing.

**Repository:** `RSHomeServer/Website_Hosting`  
**Branch:** `feat/platform-foundation` (base: `main`)  
**Iteration goal:** Reusable **platform** only — not product sites (portfolio, blog, illusions, tools, etc.).  
**Merge status:** Do **not** merge until human review completes.

---

## 1. Overall architecture

**Modular monolith:** one Vite + React + TypeScript SPA host serves many path-mounted sites. Sites are workspace packages. The host discovers them only through a catalog API.

| Decision       | Choice                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| Runtime        | Vite 6 + React 19 + TypeScript                                             |
| Attachment     | Path-based (`basePath` + routes)                                           |
| Coupling       | Host → `@platform/site-registry` only                                      |
| Catalog        | Explicit array in `catalog.ts` (empty today)                               |
| Cycle safety   | Sites import `@platform/site-registry/contract`; host imports package root |
| Deploy (local) | Docker multi-stage → nginx static on `:8080`                               |
| Out of scope   | Auth, DB, APIs, production Traefik, real apps, CI workflows                |

ADRs:

- Modular monolith host
- Path-based site registration + catalog

Principles: maintainability, simplicity, accessibility, documentation, reuse, local-first. Prefer small foundations over speculative abstractions.

---

## 2. Repository tree (source of truth)

```text
.
├── apps/
│   └── platform/                 # @platform/host
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── AppRoutes.tsx     # getSites() → <Route>s
│           ├── index.css         # temporary host styles (not tokens yet)
│           ├── lib/join-paths.ts
│           └── pages/LandingPage.tsx
├── packages/
│   ├── site-registry/            # @platform/site-registry
│   │   ├── src/
│   │   │   ├── types.ts          # SiteDefinition, SiteRoute
│   │   │   ├── define-site.ts
│   │   │   ├── contract.ts       # site-facing entry
│   │   │   ├── catalog.ts        # empty array + getSites
│   │   │   ├── index.ts          # host-facing entry
│   │   │   └── catalog.test.ts
│   │   └── README.md
│   ├── ui/                       # @platform/ui
│   │   └── src/
│   │       ├── tokens/tokens.css
│   │       ├── components/{Button,Link,Stack}.tsx
│   │       └── index.ts
│   └── config/                   # @platform/config (ts/eslint/prettier)
├── docs/
│   ├── adr/001-*.md, 002-*.md
│   ├── architecture.md
│   ├── design-system/
│   ├── guides/                   # creating-a-new-site, local-dev, testing
│   └── reviews/                  # THIS PACKAGE
├── e2e/host.spec.ts
├── docker/nginx.conf
├── Dockerfile
├── docker-compose.yml
├── package.json                  # root scripts
├── pnpm-workspace.yaml           # + version catalog
├── pnpm-lock.yaml
├── playwright.config.ts
├── README.md
└── CONTRIBUTING.md
```

---

## 3. Dependency graph

```text
@platform/host
  → @platform/site-registry          # getSites, types (ROOT entry)
  → react, react-dom, react-router-dom, vite…

Future @platform/site-*
  → @platform/site-registry/contract # defineSite, types (NO catalog)
  → @platform/ui (optional)
  → react

@platform/site-registry
  → (future) @platform/site-*        # ONLY from catalog.ts

@platform/ui
  → peer react ^19
  → @platform/config (tsconfig)
  → catalog: typescript, @types/react, react (dev)
```

**Forbidden:** `apps/platform` importing any `@platform/site-*`.  
**Forbidden for sites:** importing `@platform/site-registry` package root (loads catalog → cycle once registered).

---

## 4. Package descriptions

| Package                  | Name                      | Responsibility                               |
| ------------------------ | ------------------------- | -------------------------------------------- |
| `apps/platform`          | `@platform/host`          | SPA host, landing `/`, mounts catalog routes |
| `packages/site-registry` | `@platform/site-registry` | Registration contract + catalog API          |
| `packages/ui`            | `@platform/ui`            | Design tokens + Button/Link/Stack            |
| `packages/config`        | `@platform/config`        | Shared TS/ESLint/Prettier                    |

---

## 5. Registration contract (important interfaces)

```ts
export interface SiteRoute {
  path: string; // relative to basePath; "" or "/about"
  component: unknown; // host casts to React.ComponentType
}

export interface SiteDefinition {
  id: string;
  basePath: string; // absolute prefix, e.g. "/docs"
  title: string;
  routes: readonly SiteRoute[];
}

export function defineSite(site: SiteDefinition): SiteDefinition; // identity helper
export function getSites(): readonly SiteDefinition[]; // catalog reader
```

**Entry points**

| Import path                        | Who   | Exports             |
| ---------------------------------- | ----- | ------------------- |
| `@platform/site-registry`          | Host  | `getSites`, types   |
| `@platform/site-registry/contract` | Sites | `defineSite`, types |

**Add a site (future):**

1. Package exports `defineSite({…})` via `/contract`.
2. Add workspace dependency on registry.
3. One line in `catalog.ts`.
4. Host unchanged.

Catalog is **`[]` today**.

---

## 6. How the host mounts sites

`AppRoutes.tsx` (conceptually):

```ts
const sites = getSites();
// Route "/" → LandingPage
// for each site.route → <Route path={joinPaths(basePath, path)} element={<Component />} />
```

`joinPaths` concatenates `basePath` + relative `path` safely (unit-tested).

---

## 7. Build / dev / Docker commands

```bash
corepack enable
pnpm install --frozen-lockfile

pnpm dev                 # http://127.0.0.1:5173
pnpm build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test:unit           # 5 tests
pnpm exec playwright install chromium   # first time
pnpm test:e2e            # 1 smoke test
pnpm test                # unit + e2e

docker compose up --build
# http://localhost:8080  /health → ok
```

Docker: `pnpm install --frozen-lockfile` then `pnpm --filter @platform/host build`; nginx serves `dist` with SPA fallback.

---

## 8. Validation results (as of review-package authorship)

| Check                             | Result                             |
| --------------------------------- | ---------------------------------- |
| `pnpm build`                      | Pass                               |
| `pnpm lint`                       | Pass                               |
| `pnpm typecheck`                  | Pass                               |
| `pnpm format:check`               | Pass                               |
| `pnpm test:unit`                  | 5 passed (1 catalog + 4 joinPaths) |
| `pnpm test:e2e`                   | 1 passed (landing `/`)             |
| Frozen lockfile install           | Pass                               |
| Docker build with frozen lockfile | Pass (P0/P1 follow-up)             |

---

## 9. Reviewer findings (Agent 7 + Lead P0/P1)

**Verdict:** Pass with remaining **P2 / non-blocking** follow-ups.

### Fixed (was P0/P1)

- Architecture dependency table now allows registry→site **catalog-only** deps.
- Circular import risk removed via `/contract` subpath.
- Docker uses `--frozen-lockfile`.
- `@platform/ui` aligned to React 19 catalog + `@platform/config` tsconfig.
- ADR-002 no longer claims `defineSite` “validates.”

### Unresolved / deferred (P2)

1. Host not wired to `@platform/ui` tokens (dual CSS).
2. No skip link; landing site links are plain `<a>` (OK while catalog empty).
3. No in-repo CI yet.
4. Eager catalog loading (lazy imports later).
5. Extend tests when first site registers.

Full write-up: sibling file `platform-foundation-review.md` in the same folder (in-repo).

---

## 10. Recommended review order

1. This summary (done).
2. Dependency rules + contract entry split (architecture / ADR-002 / site-registry README).
3. `apps/platform/src/AppRoutes.tsx` + `LandingPage.tsx` — confirm no site imports.
4. `packages/site-registry/src/{types,contract,index,catalog}.ts`.
5. Dockerfile + `docker/nginx.conf` + compose health.
6. `packages/ui` tokens + primitives (scope restraint).
7. Guides: creating-a-new-site, testing, local-development.
8. Run validation commands above.
9. Use human checklist: `review-checklist.md`.
10. Skim agent retrospective only if evaluating the multitask process.

---

## 11. What NOT to ask for in this review

Do not expand scope into: building real sites, auth, databases, APIs, Traefik production stack, or speculative microfrontends. Those are explicit non-goals for this iteration.

---

## 12. Sibling documents in-repo (if you gain repo access)

| File                                              | Content                    |
| ------------------------------------------------- | -------------------------- |
| `docs/reviews/executive-summary.md`               | 1–2 page overview          |
| `docs/reviews/repository-tour.md`                 | Guided walkthrough         |
| `docs/reviews/architecture-review-notes.md`       | Trade-offs / debt / evolve |
| `docs/reviews/agent-retrospective.md`             | Multitask agent history    |
| `docs/reviews/review-checklist.md`                | Human checklist            |
| `docs/reviews/multitask-progress-instructions.md` | Cursor multitask UX        |
| `docs/reviews/platform-foundation-review.md`      | Agent 7 technical review   |
| `docs/architecture.md`                            | Living architecture        |
| `docs/adr/001-*.md`, `002-*.md`                   | Decisions                  |
| `README.md`                                       | Quick start                |

---

## 13. One-paragraph pitch

Website Hosting is a greenfield pnpm monorepo that provides a Vite/React host and a tiny site-registration contract so future independent apps can mount under URL prefixes without the host importing them. The catalog is empty; Docker serves the static host locally; tests smoke the empty platform. Architecture is intentionally small, documented, and ready for the first real site package — after human review and merge policy allow.
