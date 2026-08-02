# Logos (single folder)

Put one logo per navigable site here:

```
apps/platform/public/logos/<id>.svg
# or .png / .webp
```

`<id>` must match `packages/runtime/src/chrome/nav.ts` (Homepage, Media, Monitoring, Workspace, Apps).

Examples: `home`, `qbt`, `radarr`, `components`, `birthday`, …

Used by the apps.songara.uk catalogue cards and the mega-bar dropdowns on every host.
Dropdown/catalogue chips tint their outline/background from the logo’s dominant colour
(with fallbacks in `packages/runtime/src/chrome/logoAccent.ts`).

Resolution order: `.svg` → `.png` → `.webp` → letter fallback.
