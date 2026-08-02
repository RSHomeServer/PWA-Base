# Solo application packaging (ADR-004)

Applications are independently packaged and hosted. `apps.songara.uk` is the **catalogue only**.

| Application | Package | Host |
| --- | --- | --- |
| Catalogue | `@platform/host` | `apps.songara.uk` |
| Components | `@platform/components-web` | `components.songara.uk` |
| Documents | `@platform/docs-web` | `docs.songara.uk` |
| Stats | `@platform/stats-web` | `stats.songara.uk` |
| Viz | `@platform/viz-web` | `viz.songara.uk` |
| Birthday | `@platform/birthday-web` | `birthday.songara.uk` |
| Memories | `@platform/memories-web` | `memories.songara.uk` |
| Browser Lab | `@platform/browser-lab-web` | `browser-lab.songara.uk` |
| Dashboard | `@platform/dashboard-web` | `dashboard.songara.uk` |

Feature code stays in `packages/site-*`. Each `apps/*-web` entry mounts that package at `/` with its own Vite PWA / service worker.

## Local development

```bash
pnpm install
pnpm --filter @platform/host dev                 # catalogue :5173
pnpm --filter @platform/birthday-web dev         # birthday :5174
pnpm --filter @platform/dashboard-web dev        # dashboard :5180 (proxies /telemetry)
pnpm --filter @platform/docs-web dev             # docs :5176 (proxies /docs-api)
```

## Docker / Traefik

```bash
docker compose up -d --build
```

Each `*-web` service has a Traefik `Host(...)` rule. DNS and TLS for every subdomain must exist at the edge (wildcard `*.songara.uk` is enough).

Shared chrome: `@platform/runtime` `PlatformChrome` (sticky mega bar) wraps catalogue and every solo app. Nav + catalogue cards share `packages/runtime/src/chrome/nav.ts`. Logos live in `apps/platform/public/logos/`. Semver is the root `VERSION` file — see [versioning.md](./versioning.md).

Dashboard nginx proxies `/telemetry/` → `telemetry:4310`. Docs nginx proxies `/docs-api/` → `docs-api:4320`.

## Adding another application

Preferred:

```bash
pnpm new-app <id>
```

Manual steps (same outcome as the scaffold, minus Docker):

1. Keep feature code in `packages/site-<id>` with `basePath: "/"`.
2. Add catalogue metadata (`host`) in `packages/catalog/src/entries.ts` and a loader in `loaders.ts`.
3. Add thin `apps/<id>-web` (copy an existing `*-web` entry).
4. Register nav + logo accent in `packages/runtime` chrome; drop a logo in `apps/platform/public/logos/`.
5. Optionally add a Compose service + Traefik Host label when deploying.
