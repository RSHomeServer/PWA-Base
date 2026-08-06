# @platform/render

Canvas render utilities, simulation shells, and lab chrome for interactive PWAs.

## Public import

```typescript
import {
  RenderShell,
  LabShell,
  useAnimationFrame,
  mulberry32,
  prepareCanvas,
} from "@songara/pwa-base/render";
// or workspace: import { … } from "@platform/render";
```

## Modules

| Area | Exports |
| --- | --- |
| Shell | `RenderShell`, `LabShell`, lab toolbar/transport/panels |
| Canvas | `prepareCanvas`, default/large canvas dimensions, `canvasStyles` |
| Hooks | `useAnimationFrame`, `useMountShimmer`, `useResetFeedback`, `useShortcuts`, `useLabShortcuts` |
| Utils | `mulberry32`, `toCanvasPoint`, `primaryTouch`, `loadJSON`, `saveJSON`, `prefersReducedMotion` |

React is a peer dependency via `@platform/ui`.
