# @platform/animation

Cross-app UI motion utilities and reusable animated UI for PWAs.

## Public import

```typescript
import {
  useReducedMotion,
  useInView,
  useParallax,
  useSectionReveal,
  ParticleField,
  DEFAULT_PARTICLE_TONES,
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

## Components

| Component | Purpose |
| --- | --- |
| `ParticleField` | Click-to-release labelled particles over a night-sky field; configurable pool, tones, hints, and glyph |
| `DEFAULT_PARTICLE_TONES` | Neutral warm palette for distant / interactive particles |

React is a peer dependency.
