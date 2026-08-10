# `@platform/preview-gsap`

**Preview** thin integration around [GSAP](https://gsap.com/).

> **Unstable.** Prefer `@songara/pwa-base/preview/gsap` from sibling apps.

## Public import

```ts
import {
  gsap,
  resolveGsapPlayback,
  useSongaraGsapPlayback,
} from "@songara/pwa-base/preview/gsap";
```

```bash
pnpm add gsap
```

## Songara helpers

| Export | Purpose |
| --- | --- |
| `resolveGsapPlayback` | Pure: `allowMotion` / `timeScale` for reduced-motion |
| `useSongaraGsapPlayback` | Hook wrapping foundation `useReducedMotion` |

**App-owned:** timelines, targets, Club GreenSock plugins.
**Out of scope:** bundling GSAP plugins into PWA-Base.

## Intended Stable home

`@songara/pwa-base/animation`, then deprecate `/preview/gsap`.

## Licence note

GSAP standard licence is free for most uses; Club plugins / some commercial
contexts need diligence. Consumers install `gsap` themselves.
