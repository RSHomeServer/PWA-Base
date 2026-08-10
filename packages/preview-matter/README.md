# `@platform/preview-matter`

**Preview** thin integration around [Matter.js](https://brm.io/matter-js/).

> **Unstable.** Prefer `@songara/pwa-base/preview/matter` from sibling apps.

## Public import

```ts
import {
  Matter,
  createSongaraMatterEngine,
  resolveMatterRunner,
  songaraFixedStepSeconds,
} from "@songara/pwa-base/preview/matter";
```

```bash
pnpm add matter-js
pnpm add -D @types/matter-js
```

## Intended Stable home

Dedicated physics-engine kit; do not fold into `@songara/pwa-base/physics` SoA core casually.

## Licence note

Matter.js is MIT. Consumers install the peer themselves.
