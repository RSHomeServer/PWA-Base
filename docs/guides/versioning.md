# App versioning

Semantic version for all Songara Studio web apps (`version.json` + top-bar update control).

Format: `MAJOR.MINOR.PATCH` (e.g. `0.1.0`, `1.2.3`).

## Bump before a release/redeploy

```bash
# patch: 0.1.0 → 0.1.1
pnpm version:bump

# or explicitly:
pnpm version:bump patch
pnpm version:bump minor
pnpm version:bump major
```

Then rebuild/redeploy. Clients still on the old build will see the update control turn yellow.

Builds copy the root `VERSION` file into each image. Optionally override with `PLATFORM_APP_VERSION` at compose build time; when unset, Vite reads `VERSION` inside the image.
