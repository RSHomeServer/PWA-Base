# ADR-009: Sibling-context production Docker builds

## Status

Accepted

## Context

Product PWAs (Recipe-PWA, FPL-PWA, …) consume the foundation as:

```json
"@songara/pwa-base": "file:../PWA-Base"
```

Vite configs and ensure scripts also resolve `../PWA-Base` on disk. A normal
`docker build` whose context is only the application repository cannot see that
sibling, so production images need an intentional build-context strategy.

Alternatives considered:

| Option | Idea | Assessment |
| --- | --- | --- |
| **A — Parent sibling context** | `docker build -f …/consumer-spa.Dockerfile <parent>` where parent contains `PWA-Base/` and `App/` | Preserves `file:../PWA-Base` and path aliases; matches primary `~/projects` layout and CI side-by-side checkouts; caching via ordered COPY still works |
| **B — Stage PWA-Base into the app context** | Copy/build foundation into the app tree before `docker build` | Extra generated state; easy to drift from the real sibling; complicates CI |
| **C — Publish `@songara/pwa-base`** | Registry dependency inside the image build | Explicitly out of scope while the foundation is under active development |

Constraints: do not break `npm run dev` on siblings; do not hard-code product
domains or Traefik; keep the runtime image nginx + static assets only.

## Decision

1. **Use Option A** — build context is the directory that contains both
   checkouts (e.g. `~/projects` or a CI workspace parent).
2. **Ship a parameterized Dockerfile** at `docker/consumer-spa.Dockerfile` with
   build-args `APP_DIR`, `PWA_BASE_DIR`, `NGINX_CONF`, `PLATFORM_RUNTIME_MODE`,
   `PLATFORM_APP_VERSION`.
3. **Install deterministically** — `pnpm install --frozen-lockfile` in
   PWA-Base; `npm ci` (or the app’s existing lockfile workflow) in the
   application.
4. **Scope the context** with `docker/sibling-context.dockerignore` applied via
   `scripts/docker-build-consumer.mjs` (temporary parent `.dockerignore`) so
   unrelated siblings under `~/projects` are not uploaded.
5. **Keep `docker/nginx-spa.conf` generic** (SPA fallback, asset/pack caching,
   `/health`, SW-friendly no-cache for HTML/SW/manifest). Application-specific
   reverse proxies (e.g. FPL `/fpl-api`) live in the **application** repo and
   are selected with `NGINX_CONF`.
6. **Retain** the existing hello-web root `Dockerfile` / Compose as the
   in-monorepo reference image; consumer apps do not use that file.

## Consequences

- Local and CI builds use the same parent-context command shape.
- Developers keep day-to-day `npm run dev` without Docker.
- Apps differ mainly by `APP_DIR`, build script (via `npm run build`), image
  tag, and optional nginx overlay path.
- Until BuildKit `--ignorefile` is universally available on the VM, the helper
  script manages a temporary parent `.dockerignore`.

## See also

- Guide: [production-docker.md](../guides/production-docker.md)
- Sibling `file:` layout: [ADR-006](./006-kandev-sibling-file-deps.md)
