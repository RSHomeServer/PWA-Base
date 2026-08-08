# `@platform/preview-lottie`

**Preview** thin integration around [lottie-react](https://www.npmjs.com/package/lottie-react)
(peer; wraps lottie-web).

> **Unstable.** This Preview API may break within a foundation minor release.
> Prefer `@songara/pwa-base/preview/lottie` from sibling apps — never deep-import
> `@platform/preview-lottie` outside this monorepo.

## Public import

```ts
import {
  Lottie,
  SongaraLottie,
  useSongaraLottiePlayback,
  resolveLottiePlayback,
  useReducedMotion,
} from "@songara/pwa-base/preview/lottie";
```

Install the peer in the consumer:

```bash
pnpm add lottie-react
```

## Songara helpers

| Export | Purpose |
| --- | --- |
| `useReducedMotion` | Re-export of foundation `@songara/pwa-base/animation` hook |
| `resolveLottiePlayback` | Pure: freeze (`autoplay`/`loop` off) when reduced motion is preferred |
| `useSongaraLottiePlayback` | Hook wrapping `resolveLottiePlayback` + foundation preference |
| `SongaraLottie` | Player that freezes on reduced motion (first frame via `goToAndStop`) |

**App-owned:** Lottie JSON (`animationData`) or Content Pack / CDN URLs (`path`).
**Out of scope:** bundling assets into PWA-Base, commercial plugins, and dotLottie
(deferred — catalogue already uses `lottie-react`).

## Intended Stable home

When graduated: extend **`@songara/pwa-base/animation`** (same kit as
`useReducedMotion` / viewport helpers), then deprecate `/preview/lottie`.

Lifecycle: [ADR-008](../../docs/adr/008-preview-stable-capability-lifecycle.md),
[preview-packages.md](../../docs/guides/preview-packages.md).

## Licence note

`lottie-react` is MIT (lottie-web MIT). Consumers must install `lottie-react`
themselves (peer dependency).
