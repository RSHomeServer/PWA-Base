# Production Docker (sibling PWAs)

How to build a small **nginx + static assets** production image for an
application that depends on `@songara/pwa-base` via `file:../PWA-Base`.

Day-to-day development stays `npm run dev` / `pnpm dev` — Docker is for
production builds, local image smoke tests, and later CI.

Architecture rationale: [ADR-009](../adr/009-sibling-production-docker.md).

## Layout

```text
<parent>/                 # e.g. ~/projects or a CI workspace root
  PWA-Base/
  Recipe-PWA/             # or KanDev worktree name (pass as --app-dir)
  FPL-PWA/
```

The Docker **build context is `<parent>`**, not the app repo alone, so the
build can see both trees and preserve `file:../PWA-Base`.

## Quick start (recommended)

From any directory, pointing at this checkout’s helper:

```bash
node /path/to/PWA-Base/scripts/docker-build-consumer.mjs \
  --app-dir Recipe-PWA \
  -t recipe-pwa:local
```

When your shell is already inside the app repo (and `package.json` lists
`file:../PWA-Base`), `--app-dir` defaults to that directory’s basename:

```bash
cd ~/projects/Recipe-PWA
node ../PWA-Base/scripts/docker-build-consumer.mjs -t recipe-pwa:local
```

The helper:

1. Resolves the sibling parent (directory containing `PWA-Base`).
2. Writes a temporary parent `.dockerignore` from
   `docker/sibling-context.dockerignore` (only `PWA-Base` + the app).
3. Runs `docker build -f PWA-Base/docker/consumer-spa.Dockerfile …`.
4. Restores any previous parent `.dockerignore`.

### Run the container

```bash
docker run --rm -p 8080:80 recipe-pwa:local
curl -sS http://127.0.0.1:8080/health   # → ok
```

Open `http://127.0.0.1:8080/` for the SPA. Client routes should fall back to
`index.html` (not 404).

## Build arguments

| Arg | Default | Purpose |
| --- | --- | --- |
| `APP_DIR` | (required) | Application directory name under the parent context |
| `PWA_BASE_DIR` | `PWA-Base` | Foundation directory name |
| `NGINX_CONF` | `PWA-Base/docker/nginx-spa.conf` | nginx config path **relative to the build context** |
| `PLATFORM_RUNTIME_MODE` | `production` | Passed through to the app build |
| `PLATFORM_APP_VERSION` | empty | Optional; apps that already embed version metadata keep working |
| `APP_BUILD_CMD` | `npm run build` | Shell command run in the app directory after `npm ci` |

Install behaviour inside the image:

- PWA-Base: `pnpm install --frozen-lockfile`
- Application: `npm ci` then `npm run build` (respects the app’s lockfile and
  scripts; does not convert the app to pnpm)

## Manual `docker build`

```bash
cd ~/projects   # parent of both repos

# Optional: copy/adapt PWA-Base/docker/sibling-context.dockerignore to ./.dockerignore
# (replace __APP_DIR__ / __PWA_BASE_DIR__), or use the helper above.

docker build -f PWA-Base/docker/consumer-spa.Dockerfile \
  --build-arg APP_DIR=Recipe-PWA \
  --build-arg PLATFORM_RUNTIME_MODE=production \
  -t recipe-pwa:local \
  .
```

## Recipe-PWA

```bash
node PWA-Base/scripts/docker-build-consumer.mjs \
  --app-dir Recipe-PWA \
  -t recipe-pwa:local
```

Uses the generic `nginx-spa.conf` (SPA fallback, `/assets/`, `/packs/`,
`/health`, no-cache for `index.html` / `sw.js` / workbox / manifest /
`version.json`).

The app’s thin `Dockerfile` documents the same contract; prefer the helper or
the shared `consumer-spa.Dockerfile` path so nginx/config stay single-sourced
in PWA-Base.

## FPL-PWA

Production browser calls use the same-origin `/fpl-api` prefix (CORS prevents
calling `fantasy.premierleague.com` directly). That proxy is **not** part of
the generic SPA config; FPL ships an overlay. The helper auto-selects
`FPL-PWA/docker/nginx-spa-fpl.conf` when that file exists:

```bash
node PWA-Base/scripts/docker-build-consumer.mjs \
  --app-dir FPL-PWA \
  -t fpl-pwa:local
```

If the app’s `tsc -b` step is temporarily broken on a branch, do **not** change
the default contract permanently — override for a smoke build only:

```bash
node PWA-Base/scripts/docker-build-consumer.mjs \
  --app-dir FPL-PWA \
  --build-cmd 'PLATFORM_RUNTIME_MODE=production npx vite build' \
  -t fpl-pwa:local
```

The Vite `server` / `preview` proxy remains development-only. The production
proxy lives in nginx for this static container; Traefik/edge routing for public
hostnames is out of scope here.

Smoke-test the proxy after `docker run`:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  http://127.0.0.1:8080/fpl-api/api/bootstrap-static/
# expect 200 (upstream FPL JSON)
```

## CI (later)

Do **not** invent a special CI-only context. Check out both repositories as
siblings, then run the same helper:

```yaml
# Illustrative only — no workflow is added by this ticket
- uses: actions/checkout@v4
  with:
    path: PWA-Base
- uses: actions/checkout@v4
  with:
    repository: org/Recipe-PWA
    path: Recipe-PWA
- run: node PWA-Base/scripts/docker-build-consumer.mjs --app-dir Recipe-PWA -t recipe-pwa:${{ github.sha }}
```

KanDev worktrees may be named `Recipe-PWA-main`; pass that name as `--app-dir`.
Ensure a checkout or symlink named `PWA-Base` sits beside the app
([ADR-006](../adr/006-kandev-sibling-file-deps.md)).

## Runtime image contents

The final stage is `nginx:1.27-alpine` plus:

- Static files from the app `dist/`
- One nginx config

It does **not** contain Node, pnpm, npm, source trees, or `node_modules`.

## Hello reference (in-monorepo)

`Dockerfile` + `docker-compose.yml` at the PWA-Base root still build
`apps/hello-web` with context `.` (the monorepo itself). That path is separate
from the sibling consumer pattern above.
