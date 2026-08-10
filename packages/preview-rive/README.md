# `@platform/preview-rive`

**Preview** thin integration around [`@rive-app/react-canvas`](https://www.npmjs.com/package/@rive-app/react-canvas).

> **Unstable.** This Preview API may break within a foundation minor release.
> Prefer `@songara/pwa-base/preview/rive` from sibling apps — never deep-import
> `@platform/preview-rive` outside this monorepo.

## Public import

```ts
import {
  useRive,
  useSongaraRivePlayback,
  resolveRivePlayback,
  useReducedMotion,
} from "@songara/pwa-base/preview/rive";
```

```bash
pnpm add @rive-app/react-canvas
```

## Songara helpers

| Export | Purpose |
| --- | --- |
| `useReducedMotion` | Foundation reduced-motion hook |
| `resolveRivePlayback` | Pure: `autoplay: false` when reduced motion |
| `useSongaraRivePlayback` | Hook wrapping resolve + foundation preference |

**App-owned:** `.riv` assets (ship offline for Songara PWAs; CDN only for catalogue smoke).
**Out of scope:** bundling Rive assets into PWA-Base.

## Intended Stable home

When graduated: extend **`@songara/pwa-base/animation`**, then deprecate `/preview/rive`.

Lifecycle: [ADR-008](../../docs/adr/008-preview-stable-capability-lifecycle.md),
[preview-packages.md](../../docs/guides/preview-packages.md).

## Licence note

`@rive-app/react-canvas` is proprietary runtime + OSS bindings — confirm licence
for product use. Consumers install the peer themselves.
