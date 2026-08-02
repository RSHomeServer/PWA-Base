# Content Packs (ADR-005)

Versioned, hash-verified content units for offline-complete applications.

## Layout (static v1)

```text
/packs/<appId>/<packId>/<version>/pack.json
/packs/<appId>/<packId>/<version>/<entry paths…>
/packs/<appId>/<packId>/current.json   # optional { "version": "1.0.0" }
```

Example Birthday base pack source: [`packages/site-birthday/content/birthday-base/`](../../packages/site-birthday/content/birthday-base/).

Birthday product content lives in `content/keepsake.json` inside that pack — see
[`birthday-experience.md`](./birthday-experience.md) for the design language, opening vision, and milestone plan.
Platform update behaviour: [`platform-preferences.md`](./platform-preferences.md).

```bash
# After editing keepsake.json or media files:
pnpm birthday:pack
```

Mirrored into:

- `apps/platform/public/packs/` (multi-app host)
- `apps/birthday-web/public/packs/` (solo packaging)

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
- `useAppReady(appId, requiredPackIds)` — React Ready gate

Apps declare `requiredPackIds` on their `SiteDefinition` / catalog metadata.

## Ready rule

The application must not present its product UI until required base packs are active. Birthday uses `BirthdayReadyGate` for this.
