# Solo application packaging (ADR-004)

Each Songara PWA is an independently packaged Vite app with its own origin, manifest, and
service worker. Product apps live in **sibling repositories** that depend on
`@songara/pwa-base`. This monorepo keeps one reference: `apps/hello-web` +
`packages/site-hello`.

| Role | Location |
| --- | --- |
| Reference packaging | `apps/hello-web` (`@platform/hello-web`) |
| Reference site module | `packages/site-hello` |
| Shared runtime | `@platform/runtime` (`SoloSiteApp`, PWA helpers, Content Packs) |
| Site contract | `@platform/site-registry/contract` (`defineSite`) |

Feature code for products belongs in the sibling app (or its own packages). Do not
reintroduce a catalogue host or multi-app path-mounting into this repository
([ADR-007](../adr/007-pwa-base-reusable-foundation.md)).

## Local development (foundation)

```bash
pnpm install
pnpm dev                                   # Hello reference → :5182
pnpm --filter @platform/hello-web build
pnpm --filter @platform/hello-web preview
```

Sibling apps run their own Vite entry after linking
[consuming-pwa-base.md](./consuming-pwa-base.md).

## Pattern

1. Site / feature module exports `defineSite({ id, basePath: "/", title, routes })`.
2. Thin Vite app mounts that definition via `SoloSiteApp` (see `apps/hello-web`).
3. Configure `vite-plugin-pwa` with app-scoped `start_url` / SW scope.
4. Optional Content Packs: [content-packs.md](./content-packs.md).
5. Deploy the static build on its own host (Proxmox / Traefik for production products —
   human-operated; not required for foundation DoD on the Ubuntu VM).

Semver for the foundation is the root `VERSION` file — see [versioning.md](./versioning.md).

## Adding another application

**Preferred — sibling repo:**

```bash
# In ~/projects/<new-app>
# package.json: "@songara/pwa-base": "file:../PWA-Base"
```

Follow [consuming-pwa-base.md](./consuming-pwa-base.md) and copy the Hello packaging
shape.

**In-monorepo scaffold** (reference / experiments only):

```bash
pnpm new-app <id>
```

Manual steps mirror Hello: site package + thin `apps/<id>-web` entry. Full walkthrough:
[creating-a-new-site.md](./creating-a-new-site.md). PWA install UX notes:
[pwa-installation.md](./pwa-installation.md).
