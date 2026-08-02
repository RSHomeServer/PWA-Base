# Design System — Songara Studio

Shared visual language, accessibility baseline, and UI primitives for the Songara Studio platform.

## Contents

| Document                                        | Purpose                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| [Tokens](./tokens.md)                           | CSS custom properties for color, typography, spacing, elevation, and motion |
| [Theme strategy](./theme-strategy.md)           | Light/dark themes, `ThemeProvider`, and consumption patterns                |
| [Accessibility baseline](./accessibility.md)    | Required patterns for focus, contrast, landmarks, motion, and keyboard use  |
| [Component inventory](./component-inventory.md) | What `@platform/ui` ships today and what is intentionally deferred          |

## Package

Primitives, theme utilities, and tokens live in `@platform/ui` (`packages/ui`).

```ts
import "@platform/ui/tokens.css";
import { Button, ThemeProvider, ThemeToggle, useTheme } from "@platform/ui";
```

## Principles

- **Dual theme** — light and dark via `[data-theme]` with system preference as default.
- **Token-first** — semantic CSS variables; components never hard-code palette values.
- **Small surface** — only primitives with clear platform-wide value; site-specific UI stays in site packages.
- **Accessibility by default** — focus rings, external-link handling, and reduced-motion respect are built in.

## Brand

Songara Studio uses cool stone/ink surfaces with a single **teal accent**, **Syne** for display headings, and **Source Sans 3** for body copy. Avoid purple-indigo AI clichés, warm cream palettes, and heavy glow effects.

## Out of scope (for now)

- Application chrome (header, nav, site switcher) — host responsibility
- Modal/dialog focus traps
- Icon library beyond inline SVG in `ThemeToggle`

See [component inventory](./component-inventory.md) for the full deferred list.
