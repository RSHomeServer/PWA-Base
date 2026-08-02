# Document Explorer

Read-only browser for Markdown documentation, organised as a filesystem tree.

- Site: `docs.songara.uk` (`@platform/docs-web` → `@platform/site-docs`)
- API: `@platform/docs-api` (Docker service, port **4320**)
- Shared renderer: `@platform/markdown` (GFM + syntax highlighting)

## Quick start

```bash
pnpm docs-api:up          # or: pnpm docs-api:rebuild after API changes
pnpm telemetry:up         # if you also need the dashboard
pnpm --filter @platform/docs-web dev   # Vite proxies /docs-api → :4320
```

Open [http://127.0.0.1:5176/](http://127.0.0.1:5176/) (see [solo-packaging.md](./solo-packaging.md) for ports).

## Configuring roots

Edit [`config/docs-explorer.roots.json`](../../config/docs-explorer.roots.json). Each root needs `id`, `title`, and `path` (relative to the workspace / `DOCS_API_WORKSPACE`). Optional `skipDirs` hides directories when listing.

Adding a root requires **no application code changes**—restart or rebuild `docs-api` after editing the config.

Default roots (filesystem-oriented):

| Root | Path | Notes |
| --- | --- | --- |
| `Website_Hosting/` | `.` | Repo root Markdown (`CURSOR.md`, `README.md`, …) plus folders that contain Markdown |
| `docs/` | `docs` | Full documentation tree |
| `packages/` | `packages` | Package READMEs and other Markdown under packages |

The left pane shows a **nested folder tree** (folders first, then files). Relative Markdown links inside a document navigate within the active root when they resolve to another `.md` file. Links that walk above a root (for example `../../CURSOR.md` from `docs/milestones/`) are remapped onto another configured root using each root’s mount path.

## API (read-only)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health |
| `GET` | `/api/roots` | List configured roots |
| `GET` | `/api/roots/:id/tree?path=` | List one directory level |
| `GET` | `/api/roots/:id/tree?recursive=1&maxDepth=` | Nested tree for the explorer UI |
| `GET` | `/api/roots/:id/file?path=` | Fetch a Markdown file |

Paths stay sandboxed to each root (`..` may normalise within the root but cannot escape it; symlink escape is blocked; Markdown only).

Same-origin access:

- Dev/preview: Vite proxy `/docs-api` → `http://127.0.0.1:4320`
- Production: nginx `/docs-api/` → `docs-api:4320`

Docker mounts include `docs/`, `packages/`, and root Markdown files so content stays live without rebuilding the image.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm docs-api:up` | Start docs-api container |
| `pnpm docs-api:rebuild` | Rebuild image after API/config packaging changes |
| `pnpm docs-api:logs` | Follow logs |
| `pnpm docs-api:down` | Stop service |

## Architecture notes

Frontend owns navigation and rendering; the API owns configuration and filesystem access. Future Engineering Hub features (search, favourites, editing) can extend this API and the Document Explorer app without unrestricted FS access from the browser.

See also: [architecture.md](../architecture.md), [CURSOR.md](../../CURSOR.md).
