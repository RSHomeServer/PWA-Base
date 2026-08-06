# Executive summary

**Repository:** Website Hosting (`RSHomeServer/Website_Hosting`)  
**Branch under review:** `feat/platform-foundation`  
**Iteration goal:** A reusable modular-monolith **platform** that future sites/apps can plug into — not the sites themselves.

## What this is

A pnpm monorepo with one Vite + React + TypeScript host (`@platform/host`) that mounts path-prefixed sites discovered only through `@platform/site-registry`. Shared UI primitives and tooling configs live in packages. Local Docker Compose serves the static build behind nginx.

No authentication, databases, APIs, production Traefik, or real applications (portfolio, blog, illusions, etc.) ship in this iteration.

## Repository structure

```text
apps/platform/           # @platform/host — SPA entry, router, landing
packages/site-registry/  # Contract + catalog (getSites / defineSite)
packages/ui/             # Tokens + Button / Link / Stack
packages/config/         # Shared TS / ESLint / Prettier
docs/                    # ADRs, architecture, guides, design system, reviews
e2e/                     # Playwright smoke
Dockerfile + compose     # Local multi-stage → nginx :8080
```

## Architectural decisions

| Decision         | Choice                                                                  | ADR                                            |
| ---------------- | ----------------------------------------------------------------------- | ---------------------------------------------- |
| Shape            | Modular monolith (one deployable)                                       | [001](../adr/001-modular-monolith-host.md)     |
| Runtime          | Vite + React + TypeScript                                               | 001                                            |
| Site attachment  | Path-based registration via catalog                                     | [002](../adr/002-site-registration-catalog.md) |
| Host coupling    | Host → registry API only; never site packages                           | 001 / 002                                      |
| Catalog coupling | Registry may import sites **only** in `catalog.ts`                      | 002                                            |
| Cycle safety     | Sites import `@platform/site-registry/contract`; host uses package root | 002                                            |

## Package responsibilities

| Package                   | Role                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `@platform/host`          | Router, landing chrome, static build output                     |
| `@platform/site-registry` | `SiteDefinition` types, `defineSite`, empty catalog, `getSites` |
| `@platform/ui`            | CSS tokens + minimal accessible primitives                      |
| `@platform/config`        | Shared compiler / lint / format baselines                       |

## Dependency graph

```text
@platform/host
  └── @platform/site-registry          (getSites / types — package root)
  └── react, react-router-dom, vite…

Site packages (future)
  └── @platform/site-registry/contract (defineSite / types — no catalog)
  └── @platform/ui (optional)
  └── react

@platform/site-registry
  └── (future) @platform/site-*        only from catalog.ts

@platform/ui
  └── peer: react ^19
  └── @platform/config (tsconfig)
```

## Registration contract

```ts
interface SiteDefinition {
  id: string;
  basePath: string; // e.g. "/docs"
  title: string;
  routes: readonly { path: string; component: unknown }[];
}
```

- Sites: `import { defineSite } from "@platform/site-registry/contract"`
- Catalog: one import + array entry in `packages/site-registry/src/catalog.ts`
- Host: `getSites()` → React Router mounts under each `basePath`

Catalog is **empty** today; landing shows an empty-state message.

## Development workflow

```bash
corepack enable && pnpm install
pnpm dev                 # http://127.0.0.1:5173
pnpm lint && pnpm typecheck && pnpm format:check
pnpm test                # unit + e2e
docker compose up --build  # http://localhost:8080  (/health → ok)
```

First-time e2e: `pnpm exec playwright install chromium`.

## Build and validation status

Captured on `feat/platform-foundation` during review-package preparation:

| Check                              | Result                              |
| ---------------------------------- | ----------------------------------- |
| `pnpm build`                       | Pass                                |
| `pnpm lint`                        | Pass                                |
| `pnpm typecheck`                   | Pass                                |
| `pnpm format:check`                | Pass                                |
| `pnpm test:unit`                   | 5 passed                            |
| `pnpm test:e2e`                    | 1 passed                            |
| `pnpm install --frozen-lockfile`   | Pass                                |
| Docker build (`--frozen-lockfile`) | Pass (validated in P0/P1 follow-up) |

## Known limitations

- Host does **not** yet import `@platform/ui` tokens (temporary hard-coded CSS).
- No registered sites; catalog empty by design.
- No skip link on landing; empty-catalog nav uses plain `<a>`.
- Traefik / production edge not implemented (comments only).
- No CI pipeline in-repo yet.

## Future extension points

1. First site package under `packages/site-*` + one catalog line ([guide](../guides/creating-a-new-site.md)).
2. Wire host to `@platform/ui/tokens.css`.
3. Lazy `import()` factories or metadata on `SiteDefinition` without changing host consumption shape.
4. Extract a site to its own container by reusing the same package and dropping the catalog entry.
5. Traefik labels / reverse-proxy wiring when deploying beyond local Compose.

## Review package index

See [docs/reviews/README.md](./README.md).
