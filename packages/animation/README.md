# @platform/animation

Cross-app UI motion utilities for PWAs.

## Public import

```typescript
import {
  useReducedMotion,
  useInView,
  useParallax,
  useSectionReveal,
} from "@songara/pwa-base/animation";
// or workspace: import { … } from "@platform/animation";
```

## Hooks

| Hook | Purpose |
| --- | --- |
| `useReducedMotion` | Tracks `prefers-reduced-motion: reduce` |
| `useInView` | IntersectionObserver visibility (`[ref, inView]`) |
| `useParallax` | Scroll-driven `--parallax-y` CSS variable (no-op when reduced motion) |
| `useSectionReveal` | One-shot section reveal (`{ ref, visible }`), respects reduced motion |

React is a peer dependency.
