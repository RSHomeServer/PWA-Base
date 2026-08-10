# `@platform/preview-rapier2d`

**Preview** thin bootstrap around [`@dimforge/rapier2d-compat`](https://rapier.rs/) (WASM).

> **Unstable.** Prefer `@songara/pwa-base/preview/rapier2d` from sibling apps.

## Public import

```ts
import {
  RAPIER,
  initSongaraRapier,
  createSongaraRapierWorld,
  songaraFixedStepSeconds,
} from "@songara/pwa-base/preview/rapier2d";
```

```bash
pnpm add @dimforge/rapier2d-compat
```

Vite/WASM: ensure the compat package’s WASM asset resolves in the consumer bundler.

## Songara helpers

| Export | Purpose |
| --- | --- |
| `initSongaraRapier` | Idempotent WASM `init()` |
| `createSongaraRapierWorld` | Init + `World` with Songara gravity default |
| `songaraFixedStepSeconds` | Pure fixed-timestep helper (default 60 Hz) |

**App-owned:** colliders, joints, scenes. **Not** a replacement for `@songara/pwa-base/physics`.

## Intended Stable home

Dedicated engine kit or thin `/physics` extension after product commitment; then deprecate `/preview/rapier2d`.

## Licence note

Rapier is Apache-2.0. Consumers install the peer themselves.
