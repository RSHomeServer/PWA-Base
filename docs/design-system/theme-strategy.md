# Theme Strategy

Songara Studio uses a **CSS-variable theme** with an optional **React theme layer** for persistence and UI controls. Tokens ship as a single stylesheet; components consume variables; the host applies theme state on `<html>`.

## Layers

```
@platform/ui/tokens.css     ← token definitions + base element styles
@platform/ui components     ← primitives styled with var(--token)
@platform/ui/theme          ← ThemeProvider, useTheme, ThemeToggle
apps/platform               ← wraps app in ThemeProvider; imports tokens
site packages               ← use primitives and/or tokens
```

## Consumption

### 1. Import tokens at the app root

```ts
// apps/platform/src/main.tsx
import "@platform/ui/tokens.css";
import { ThemeProvider } from "@platform/ui";

root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
```

### 2. Theme API

| Export              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `ThemeProvider`     | Context + `localStorage` persistence         |
| `useTheme`          | `{ theme, resolvedTheme, setTheme }`         |
| `ThemeToggle`       | Light / dark / system segmented control      |
| `applyTheme`        | Imperative DOM update (SSR hydration, tests) |
| `getSystemTheme`    | Reads `prefers-color-scheme`                 |
| `resolveTheme`      | Maps `"system"` → `"light"` \| `"dark"`      |
| `THEME_STORAGE_KEY` | `"songara-theme"` — localStorage key         |

**Preference values:** `"light"` | `"dark"` | `"system"` (default)

**Resolved values:** `"light"` | `"dark"` — what is actually applied to the DOM

`ThemeProvider` sets both `data-theme="<resolved>"` and `class="theme-<resolved>"` on `<html>`.

### 3. Use tokens in local CSS

```css
.site-card {
  padding: var(--space-4);
  border: var(--border-width-1) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-foreground);
}
```

### 4. Override tokens, not components

When a site needs distinct branding within a theme:

```css
[data-site="example"] {
  --color-accent: #0369a1;
  --color-accent-hover: #075985;
}
```

Do not fork primitive components for color changes alone.

## System preference

When preference is `"system"`, `ThemeProvider` listens to `prefers-color-scheme` changes and re-applies the resolved theme without user action.

For flash-free initial paint, the host may inline a small script before React hydrates:

```html
<script>
  (function () {
    var k = "songara-theme";
    var s = localStorage.getItem(k);
    var t =
      s === "light" || s === "dark"
        ? s
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.classList.add("theme-" + t);
  })();
</script>
```

## What we deliberately avoid

| Approach                   | Why not                                           |
| -------------------------- | ------------------------------------------------- |
| CSS-in-JS theme objects    | Conflicts with Vite + CSS modules; tokens are CSS |
| Per-component theme props  | Encourages one-off styling                        |
| Multiple accent colors     | One teal accent keeps the brand coherent          |
| Tailwind in `@platform/ui` | Sites may choose their own styling approach       |

## Package exports

| Import                    | Provides                                            |
| ------------------------- | --------------------------------------------------- |
| `@platform/ui`            | All React primitives + theme utilities              |
| `@platform/ui/theme`      | Theme-only subpath (same exports as main for theme) |
| `@platform/ui/tokens.css` | CSS custom properties, fonts, base element styles   |
