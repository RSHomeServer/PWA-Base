# `@platform/preview-dexie`

**Preview** thin integration around [Dexie.js](https://dexie.org/) core.

> **Unstable.** This Preview API may break within a foundation minor release.
> Prefer `@songara/pwa-base/preview/dexie` from sibling apps — never deep-import
> `@platform/preview-dexie` outside this monorepo.

## Public import

```ts
import {
  Dexie,
  createSongaraDb,
  songaraDbName,
  applySchemaVersions,
  sortSchemaVersions,
} from "@songara/pwa-base/preview/dexie";
```

Install the peer in the consumer:

```bash
pnpm add dexie
```

## Songara helpers

| Export | Purpose |
| --- | --- |
| `songaraDbName` | Stable name: `songara:<appId>:<dbKey>` |
| `createSongaraDb` | Factory: Dexie instance + schema versions applied |
| `applySchemaVersions` | Register versions on an existing Dexie (e.g. subclass) |
| `sortSchemaVersions` | Validate / sort version list (pure) |

**App-owned:** concrete table schemas, entity types, and product queries.
**Out of scope:** Dexie Cloud / commercial plugins, RxDB / Yjs / Electric sync,
and Content Pack `packStore` (runtime keeps its own IndexedDB helpers).

## Intended Stable home

When graduated: a dedicated **`@songara/pwa-base/storage`** (or offline) kit,
then deprecate `/preview/dexie`. Do not fold this into Content Pack storage.

Lifecycle: [ADR-008](../../docs/adr/008-preview-stable-capability-lifecycle.md),
[preview-packages.md](../../docs/guides/preview-packages.md).

## Licence note

Dexie is Apache-2.0. Consumers must install `dexie` themselves (peer dependency).
Core only — do not add Dexie Cloud via this Preview surface.
