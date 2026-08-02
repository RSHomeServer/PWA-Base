# Content Packs (ADR-005)

Versioned, hash-verified content units for offline-complete applications.

## Layout (static v1)

```text
/packs/<appId>/<packId>/<version>/pack.json
/packs/<appId>/<packId>/<version>/<entry paths…>
/packs/<appId>/<packId>/current.json   # optional { "version": "1.0.0" }
```

### Example: Birthday

Pack source: [`packages/site-birthday/content/birthday-base/`](../../packages/site-birthday/content/birthday-base/).

Birthday product content lives in `content/keepsake.json` inside that pack — see
[`birthday-experience.md`](./birthday-experience.md) for the design language, opening vision, and milestone plan.
Platform update behaviour: [`platform-preferences.md`](./platform-preferences.md).

```bash
# After editing keepsake.json or media files:
pnpm content-pack:sync -- birthday birthday-base
# Backwards-compatible alias:
pnpm birthday:pack
```

Mirrored into:

- `apps/birthday-web/public/packs/` (solo packaging)
- `apps/platform/public/packs/` (when present — catalogue host static mirror)

## Sync tooling

```bash
pnpm content-pack:sync -- <appId> <packId> [version]
node scripts/sync-content-pack.mjs <appId> <packId> [version]
```

`appId` must match the site package (`packages/site-<appId>`) and solo app (`apps/<appId>-web`).
If `version` is omitted, the script uses `content/<packId>/current.json` when present, otherwise `1.1.0`.

Legacy Birthday entry points (`pnpm birthday:pack`, `scripts/sync-birthday-pack.mjs`) call the same generic syncer.

## Manifest shape

```json
{
  "id": "birthday-base",
  "version": "1.0.0",
  "appId": "birthday",
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

`@platform/runtime` provides:

- `ensureRequiredPacks(appId, packIds)` — complete-first-install
- `installContentPack` — fetch, verify, Cache Storage + IndexedDB activation
- `useAppReady(appId, requiredPackIds)` — React Ready state hook
- `PackReadyGate` — reusable UI gate around `useAppReady`

Apps declare `requiredPackIds` on their `SiteDefinition` / catalog metadata.

## Ready rule

The application must not present its product UI until required base packs are active.
Use `PackReadyGate` from `@platform/runtime` (Birthday wraps it as `BirthdayReadyGate` with themed copy).

## Chrome capabilities

Immersive apps declare layout preferences as capability tags on `SiteDefinition` (not hard-coded app ids):

| Capability | Effect |
| --- | --- |
| `full-bleed` | Solo chrome: no content inset padding |
| `default-topbar-collapsed` | Solo chrome: mega bar starts collapsed until the user expands it |

See `SITE_CAPABILITY` / `hasSiteCapability` in `@platform/site-registry/contract`.
