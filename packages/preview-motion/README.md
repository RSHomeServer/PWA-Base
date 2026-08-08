# `@platform/preview-motion`

**Preview** thin integration around [Motion](https://motion.dev/) (ex-Framer Motion).

> **Unstable.** This Preview API may break within a foundation minor release.
> Prefer `@songara/pwa-base/preview/motion` from sibling apps — never deep-import
> `@platform/preview-motion` outside this monorepo.

## Public import

```ts
import {
  motion,
  AnimatePresence,
  useSongaraMotion,
  useMotionTransition,
  resolveTransition,
  useReducedMotion,
} from "@songara/pwa-base/preview/motion";
```

Install the peer in the consumer:

```bash
pnpm add motion
```

## Songara helpers

| Export | Purpose |
| --- | --- |
| `useReducedMotion` | Re-export of foundation `@songara/pwa-base/animation` hook |
| `resolveTransition` | Pure: instant snap when reduced motion is preferred |
| `useMotionTransition` | Hook wrapping `resolveTransition` + foundation preference |
| `useSongaraMotion` | `{ reducedMotion, transition }` for component props |

Viewport / reveal hooks and `ParticleField` stay in **`@songara/pwa-base/animation`**
— they are not part of this Preview surface.

## Intended Stable home

When graduated: extend **`@songara/pwa-base/animation`** (same kit as
`useReducedMotion` / viewport helpers), then deprecate `/preview/motion`.

Lifecycle: [ADR-008](../../docs/adr/008-preview-stable-capability-lifecycle.md),
[preview-packages.md](../../docs/guides/preview-packages.md).

## Licence note

Motion is MIT. Consumers must install `motion` themselves (peer dependency).
