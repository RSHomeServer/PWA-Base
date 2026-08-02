# Accessibility Baseline

Minimum accessibility requirements for Songara Studio UI and any package that consumes `@platform/ui` tokens and primitives.

## Focus visibility

- **Never remove focus outlines** without providing an equally visible replacement.
- `@platform/ui/tokens.css` sets a global `:focus-visible` outline using `--color-focus-ring`.
- Primitives repeat focus styles in their modules so appearance stays correct when global styles are overridden.
- Use `:focus-visible`, not `:focus`, so pointer clicks do not show a persistent ring.

### Checklist

- [ ] All interactive elements are reachable and show a visible focus indicator.
- [ ] Custom components forward refs and support keyboard activation where applicable.
- [ ] Focus order follows visual reading order.

## Color contrast

Default token pairings target **WCAG 2.1 Level AA** for normal text where noted in [tokens](./tokens.md#contrast-notes).

| Pairing                                           | Intended use            |
| ------------------------------------------------- | ----------------------- |
| `--color-foreground` on `--color-background`      | Body copy, labels       |
| `--color-primary-foreground` on `--color-primary` | Primary button labels   |
| `--color-muted` on `--color-background`           | Supplementary text only |

Re-check contrast in **both light and dark** themes when overriding tokens.

### Checklist

- [ ] Do not use `--color-muted` for required form labels or error messages.
- [ ] When overriding tokens, re-check contrast for text and interactive states.
- [ ] Do not convey state by color alone; pair with text, icons, or pattern.

## Theme & color scheme

- Light theme sets `color-scheme: light`; dark sets `color-scheme: dark`.
- Native form controls inherit appropriate styling via `color-scheme`.
- `ThemeToggle` uses `aria-pressed` on each option and `role="group"` with `aria-label="Theme"`.

## Landmarks and structure

The host owns the document shell. Site content should use semantic HTML.

| Region       | Element                      | Notes                          |
| ------------ | ---------------------------- | ------------------------------ |
| Main content | `<main>`                     | One per page                   |
| Navigation   | `<nav>` with accessible name | Host nav vs in-site nav        |
| Sections     | `<section>` with heading     | When grouping helps navigation |

`Stack` accepts an `as` prop for semantic elements. `Panel` renders a `<section>`; `EmptyState` title is an `<h3>`.

### Checklist

- [ ] Exactly one `<main>` per route view.
- [ ] Page has a descriptive `<title>`.
- [ ] Headings follow a logical order.

## Keyboard access

- **Button** / **IconButton** — native `<button>` with `type="button"` by default.
- **Link** — native `<a href="...">`; use `Button` for non-navigation actions.
- **IconButton** requires an `label` prop mapped to `aria-label`.

### Checklist

- [ ] No `div` click handlers without keyboard support and role.
- [ ] Skip link to main content on host layouts.

## Reduced motion

`tokens.css` minimizes animation/transition duration under `prefers-reduced-motion: reduce`.

`Spinner` stops rotation and shows a static ring. `Skeleton` disables shimmer.

### Checklist

- [ ] Avoid autoplaying motion-critical content.
- [ ] Prefer opacity/color transitions over large positional animation.
- [ ] Test with reduced motion enabled in OS settings.

## Links and external navigation

`Link` with `external`:

- Opens in a new tab (`target="_blank"`).
- Sets `rel="noopener noreferrer"`.
- Appends visually hidden text for screen readers.

## Forms

`Label`, `TextField`, `Select`, and `TextArea` are available. When building forms:

- Associate `<label>` with controls (`htmlFor` / `id`).
- Surface errors with `aria-invalid` and `aria-describedby`.

## Loading states

- **Spinner** exposes `role="status"` and configurable `label` (default: `"Loading"`).
- **Skeleton** uses `aria-hidden="true"` — pair with visible loading text or `Spinner` when appropriate.

## Testing suggestions

- Navigate using keyboard only (Tab, Shift+Tab, Enter, Space).
- Toggle light/dark themes and re-check contrast.
- Run automated checks (e.g. axe) when e2e tooling is available.
