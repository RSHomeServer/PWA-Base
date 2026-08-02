# Component Inventory

Status of UI building blocks in `@platform/ui` for Songara Studio.

## Shipped primitives

### Actions & navigation

| Component      | Export       | Purpose                                                                          |
| -------------- | ------------ | -------------------------------------------------------------------------------- |
| **Button**     | `Button`     | Primary/secondary actions; variants `primary` \| `secondary`, sizes `sm` \| `md` |
| **IconButton** | `IconButton` | Icon-only control; requires `label`; variants `ghost` \| `subtle` \| `outline`   |
| **Link**       | `Link`       | Accessible anchor; optional `external` for new-tab links with safe `rel`         |

### Layout

| Component   | Export    | Purpose                                                            |
| ----------- | --------- | ------------------------------------------------------------------ |
| **Stack**   | `Stack`   | Flex layout with `direction`, `gap`, `align`, `justify`, `as` prop |
| **Divider** | `Divider` | Horizontal or vertical rule                                        |
| **Surface** | `Surface` | Elevated panel wrapper; elevations `none` \| `xs` \| `sm` \| `md`  |
| **Panel**   | `Panel`   | Bordered section with optional `title` heading                     |

### Forms

| Component     | Export      | Purpose                             |
| ------------- | ----------- | ----------------------------------- |
| **Label**     | `Label`     | Styled `<label>`                    |
| **TextField** | `TextField` | Token-styled text/number `<input>`  |
| **Select**    | `Select`    | Token-styled native `<select>`      |
| **TextArea**  | `TextArea`  | Token-styled multiline `<textarea>` |

### Feedback & display

| Component      | Export       | Purpose                                                               |
| -------------- | ------------ | --------------------------------------------------------------------- |
| **Badge**      | `Badge`      | Status/tag label; variants include `accent`, status colors            |
| **Spinner**    | `Spinner`    | Loading indicator; respects reduced motion                            |
| **Skeleton**   | `Skeleton`   | Loading placeholder; optional `circle`                                |
| **EmptyState** | `EmptyState` | Structured empty content with title, description, media, action slots |
| **Kbd**        | `Kbd`        | Keyboard shortcut styling                                             |

### Theme

| Component         | Export          | Purpose                       |
| ----------------- | --------------- | ----------------------------- |
| **ThemeProvider** | `ThemeProvider` | Theme context + persistence   |
| **useTheme**      | `useTheme`      | Read/set theme preference     |
| **ThemeToggle**   | `ThemeToggle`   | Light / dark / system control |

## Design tokens

| Asset                | Import                    | Purpose                                       |
| -------------------- | ------------------------- | --------------------------------------------- |
| **Token stylesheet** | `@platform/ui/tokens.css` | Full token system, fonts, base element styles |

## Shared Markdown (`@platform/markdown`)

Not part of `@platform/ui`, but a platform rendering capability used by Document Explorer and the AI dashboard conversation view.

| Export     | Import                         | Purpose                                              |
| ---------- | ------------------------------ | ---------------------------------------------------- |
| `Markdown` | `@platform/markdown`           | GFM + syntax-highlighted Markdown (`document`/`compact`) |
| Styles     | `@platform/markdown/styles.css` | Prose + code highlighting styles (token-aware)      |

## Intentionally deferred

### Layout and chrome

| Item                        | Rationale                        |
| --------------------------- | -------------------------------- |
| App header / footer         | Host application concern         |
| Site switcher / catalog nav | Host + `@platform/site-registry` |
| Grid system                 | Sites use CSS Grid locally       |

### Forms

| Item                               | Rationale                |
| ---------------------------------- | ------------------------ |
| Checkbox, Radio, Switch            | High variation per site  |
| Form field wrapper (label + error) | Depends on form strategy |

### Feedback and overlays

| Item        | Rationale                                  |
| ----------- | ------------------------------------------ |
| Modal       | Focus trap needs coordinated host behavior |
| Toast/Alert | No global notification bus yet             |
| Tooltip     | Defer until pattern repeats                |

### Data display

| Item            | Rationale                 |
| --------------- | ------------------------- |
| Table           | Site-specific data shapes |
| Tabs, Accordion | Not required yet          |
| Avatar          | Decorative; low value     |

### Theming

| Item     | Rationale                   |
| -------- | --------------------------- |
| Icon set | Sites bring their own icons |

## Components catalogue (`@platform/site-components`)

The live design system at `components.songara.uk` is driven by `packages/site-components/src/catalog.ts`. Each
`ComponentEntry` records purpose, props, states, source files, usage sites, screenshots, and last
update metadata for the catalogue home page.

When adding or changing a public export in `@platform/ui` or `@platform/controls`:

1. Add or update the matching entry in `catalog.ts` (and a showcase page if needed).
2. Map the export in `scripts/generate-components-catalog.mts` (`EXPORT_TO_CATALOG_ID` or
   `ALLOWLIST`).
3. Run the catalogue gate:

```bash
pnpm --filter @platform/site-components generate:catalog
```

Wire this into CI alongside `typecheck` so undocumented major exports fail the build.

## Adding a new primitive

Before adding to `@platform/ui`, confirm:

1. **Shared need** — at least two consumers will use it unchanged.
2. **Stable API** — props map to accessible HTML patterns.
3. **Token-driven** — styling uses semantic CSS variables.
4. **Documented** — update this inventory, the components catalogue, and [tokens](./tokens.md) if
   new variables are introduced.

## Version note

Package version `0.0.0` — APIs may evolve while the platform foundation is established. Import from documented exports only.
