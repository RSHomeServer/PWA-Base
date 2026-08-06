# Content Packs (ADR-005)

Versioned, hash-verified content units for offline-complete applications.

## Layout (static v1)

```text
/packs/<appId>/<packId>/<version>/pack.json
/packs/<appId>/<packId>/<version>/<entry paths…>
/packs/<appId>/<packId>/current.json   # optional { "version": "1.0.0" }
```

### Example: Hello (reference)

Pack source: `packages/site-hello/content/hello-base/`.

Mirrored into `apps/hello-web/public/packs/` by the sync script.

```bash
pnpm content-pack:sync -- hello hello-base
```

Update / deferral behaviour for shell vs packs: [platform-preferences.md](./platform-preferences.md).

## Sync tooling

```bash
pnpm content-pack:sync -- <appId> <packId> [version]
node scripts/sync-content-pack.mjs <appId> <packId> [version]
```

`appId` must match the site package (`packages/site-<appId>`) and solo app
(`apps/<appId>-web`) when working inside this monorepo. Sibling apps can mirror the same
layout under their own `public/packs/`.

If `version` is omitted, the script uses `content/<packId>/current.json` when present,
otherwise a default version from the script.

## Manifest shape

```json
{
  "id": "hello-base",
  "version": "1.0.0",
  "appId": "hello",
  "entries": [
    {
      "path": "meta/welcome.json",
      "hash": "sha256:<hex>",
      "size": 123
    }
  ]
}
```

## Runtime API

`@platform/runtime` (and `@songara/pwa-base` for siblings) provides:

- `ensureRequiredPacks(appId, packIds)` — complete-first-install
- `installContentPack` — fetch, verify, Cache Storage + IndexedDB activation
- `useAppReady(appId, requiredPackIds)` — React Ready state hook
- `PackReadyGate` — reusable UI gate around `useAppReady`

Apps declare `requiredPackIds` on their `SiteDefinition`.

## Ready rule

The application must not present its product UI until required base packs are active.
Use `PackReadyGate` from `@platform/runtime` / `@songara/pwa-base`.

## Chrome capabilities

Immersive apps declare layout preferences as capability tags on `SiteDefinition`
(not hard-coded app ids):

| Capability | Effect |
| --- | --- |
| `full-bleed` | Solo chrome: no content inset padding |
| `default-topbar-collapsed` | Solo chrome: mega bar starts collapsed until the user expands it |

See `SITE_CAPABILITY` / `hasSiteCapability` in `@platform/site-registry/contract`
(or `@songara/pwa-base/contract`).
