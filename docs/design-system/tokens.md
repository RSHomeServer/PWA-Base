# Design Tokens

Design tokens are CSS custom properties defined in `@platform/ui/tokens.css`. Import once at the application root so all components and app styles share the same values.

```ts
import "@platform/ui/tokens.css";
```

Fonts load via `@import` in the token file. Host apps may also add a `<link>` to Google Fonts for faster discovery:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@500;600;700&display=swap"
  rel="stylesheet"
/>
```

## Theme selectors

Light and dark values apply under:

- `:root` / `[data-theme="light"]` / `.theme-light` — light (default)
- `[data-theme="dark"]` / `.theme-dark` — dark

`ThemeProvider` sets `data-theme` and the matching class on `<html>`.

## Color — surfaces

| Token                      | Usage                        |
| -------------------------- | ---------------------------- |
| `--color-background`       | Page canvas                  |
| `--color-foreground`       | Primary text                 |
| `--color-surface`          | Cards, inputs, panels        |
| `--color-surface-raised`   | Elevated surfaces            |
| `--color-surface-sunken`   | Inset/recessed areas         |
| `--color-muted`            | Secondary text, placeholders |
| `--color-muted-foreground` | Alias for muted text         |
| `--color-muted-background` | Subtle fills, hover states   |

## Color — borders

| Token                   | Usage                 |
| ----------------------- | --------------------- |
| `--color-border`        | Default borders       |
| `--color-border-subtle` | Low-contrast dividers |
| `--color-border-strong` | Hover/emphasis        |

## Color — accent & actions

Teal is the single brand accent. Primary action tokens alias accent values.

| Token                          | Usage                   |
| ------------------------------ | ----------------------- |
| `--color-accent`               | Brand accent            |
| `--color-accent-hover`         | Accent hover            |
| `--color-accent-muted`         | Accent tint backgrounds |
| `--color-accent-foreground`    | Text on accent surfaces |
| `--color-primary`              | Primary buttons         |
| `--color-primary-hover`        | Primary hover           |
| `--color-primary-foreground`   | Text on primary         |
| `--color-secondary`            | Secondary buttons       |
| `--color-secondary-hover`      | Secondary hover         |
| `--color-secondary-foreground` | Text on secondary       |

## Color — links & status

| Token                                       | Usage                                  |
| ------------------------------------------- | -------------------------------------- |
| `--color-link`                              | Inline links                           |
| `--color-link-hover`                        | Link hover                             |
| `--color-link-visited`                      | Visited links (teal-muted, not purple) |
| `--color-success` / `--color-success-muted` | Success states                         |
| `--color-warning` / `--color-warning-muted` | Warnings                               |
| `--color-error` / `--color-error-muted`     | Errors                                 |
| `--color-info` / `--color-info-muted`       | Informational                          |
| `--color-focus-ring`                        | Focus outlines                         |
| `--color-selection`                         | Text selection                         |

### Contrast notes

- Primary button text (`--color-primary-foreground` on `--color-primary`) meets WCAG AA at default values in both themes.
- Body text (`--color-foreground` on `--color-background`) meets WCAG AA.
- Muted text is for supplementary content only — not required labels or errors.

## Typography

| Token                                          | Default / notes                  |
| ---------------------------------------------- | -------------------------------- |
| `--font-family-display`                        | Syne                             |
| `--font-family-sans`                           | Source Sans 3                    |
| `--font-family-mono`                           | IBM Plex Mono                    |
| `--font-size-2xs` … `--font-size-5xl`          | Size scale (incl. display sizes) |
| `--font-weight-normal` … `--font-weight-bold`  | Weights                          |
| `--line-height-none` … `--line-height-relaxed` | Body line heights                |
| `--line-height-3xl` / `4xl` / `5xl`            | Display line heights             |
| `--letter-spacing-tight` / `normal` / `wide`   | Tracking                         |

Headings in `tokens.css` use `--font-family-display`.

## Spacing

`--space-0` through `--space-16`, including half steps (`--space-0-5`, `--space-1-5`, etc.) and `--space-px`.

## Layout

| Token                       | Default / notes                               |
| --------------------------- | --------------------------------------------- |
| `--content-max`             | `72rem` — prose and form content width        |
| `--workspace-max`           | `90rem` — full workspace / dashboard width    |
| `--page-padding-inline`     | `clamp(var(--space-4), 4vw, var(--space-12))` |
| `--shell-sidebar-width`     | `15.5rem` — expanded app shell sidebar        |
| `--shell-sidebar-collapsed` | `4rem` — icon-only sidebar                    |

## Density

| Token                   | Default | Usage                                      |
| ----------------------- | ------- | ------------------------------------------ |
| `--density-space-scale` | `1`     | Multiplier for compact/comfortable layouts |

## Radius

| Token         | Value       |
| ------------- | ----------- |
| `--radius-xs` | `0.1875rem` |
| `--radius-sm` | `0.25rem`   |
| `--radius-md` | `0.375rem`  |
| `--radius-lg` | `0.5rem`    |
| `--radius-xl` | `0.75rem`   |

## Border width

| Token              | Value |
| ------------------ | ----- |
| `--border-width-1` | `1px` |
| `--border-width-2` | `2px` |

## Elevation

| Token         | Usage                 |
| ------------- | --------------------- |
| `--shadow-xs` | Subtle lift (buttons) |
| `--shadow-sm` | Cards, surfaces       |
| `--shadow-md` | Raised panels         |
| `--shadow-lg` | Prominent elevation   |

Single-layer shadows only — no stacked dramatic glow.

## Focus

| Token                 | Value |
| --------------------- | ----- |
| `--focus-ring-width`  | `2px` |
| `--focus-ring-offset` | `2px` |

## Motion

| Token                       | Value                   |
| --------------------------- | ----------------------- |
| `--motion-duration-instant` | `0ms`                   |
| `--motion-duration-fast`    | `120ms`                 |
| `--motion-duration-normal`  | `200ms`                 |
| `--motion-duration-slow`    | `320ms`                 |
| `--motion-easing-standard`  | Material standard curve |
| `--motion-easing-enter`     | Decelerate              |
| `--motion-easing-exit`      | Accelerate              |

## Z-index

| Token          | Value |
| -------------- | ----- |
| `--z-base`     | `0`   |
| `--z-raised`   | `10`  |
| `--z-dropdown` | `100` |
| `--z-sticky`   | `200` |
| `--z-overlay`  | `300` |
| `--z-modal`    | `400` |
| `--z-toast`    | `500` |

## Overriding tokens

Override semantic variables after importing the base file:

```css
[data-site="example"] {
  --color-accent: #0369a1;
  --color-accent-hover: #075985;
}
```

Prefer semantic overrides over ad-hoc variables in application code.
