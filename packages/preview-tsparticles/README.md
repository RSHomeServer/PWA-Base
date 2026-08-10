# `@platform/preview-tsparticles`

**Preview** thin integration around [tsparticles](https://particles.js.org/) slim + React.

> **Unstable.** Prefer `@songara/pwa-base/preview/tsparticles` from sibling apps.

## Public import

```ts
import {
  Particles,
  ParticlesProvider,
  loadSlim,
  resolveParticlesMotion,
  useSongaraParticlesMotion,
} from "@songara/pwa-base/preview/tsparticles";
```

```bash
pnpm add @tsparticles/react @tsparticles/slim
```

## Songara helpers

| Export | Purpose |
| --- | --- |
| `resolveParticlesMotion` | Pure: zero particles / disable move+links when reduced |
| `useSongaraParticlesMotion` | Hook wrapping foundation preference |

Compare with Stable `ParticleField` in `@songara/pwa-base/animation` for branded ambience.

## Intended Stable home

`@songara/pwa-base/animation` (or dedicated particles kit), then deprecate `/preview/tsparticles`.

## Licence note

tsparticles is MIT. Consumers install peers themselves.
