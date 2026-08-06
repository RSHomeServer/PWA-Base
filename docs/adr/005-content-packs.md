# ADR-005: Content Packs for offline-complete applications

## Status

Accepted

## Context

Several applications must work entirely offline after installation and carry substantial
authored content: images, audio, video, markdown, configuration, and metadata. (Birthday
was the original in-monorepo driver; the format applies to Hello and sibling PWAs.)

Bundling all bytes into the JS/CSS app shell couples content churn to app deploys and blows up first-load size. Ad-hoc `public/` files lack versioning, integrity checks, and deferred updates. A vague “Asset Store” conflates human library UX, blob storage, and distribution.

We need a distribution unit that:

- Makes the **first install complete** (no hollow “partially installed” app)
- Allows **later updates** at content granularity, hash-verified and user-deferrable
- Can grow into independently installable optional packs
- Stays independent of Cursor telemetry storage

## Decision

Adopt **Content Packs** as the distribution abstraction.

### Definitions

| Term | Meaning |
| --- | --- |
| **Content Pack** | Versioned, hash-verified, immutable artifact (static directory or archive) with a `pack.json` manifest: `id`, `version`, `appId`, content-addressable `entries` (path, hash, size). May contain media, markdown, JSON config, metadata, and other downloadable resources. |
| **Required base pack(s)** | Packs listed on the app manifest (`requiredPackIds`). The app must not report **Ready** until these are installed and active. |
| **Pack client** (`@platform/runtime`) | Resolves pack URL → fetches manifest + entries → verifies hashes → persists (Cache Storage and/or IndexedDB metadata) → activates → emits progress. |
| **Object / blob storage** | Future durable backend for pack bytes; v1 may serve packs as static files under `/packs/<appId>/<packId>/<version>/`. |
| **Asset resolver** (optional later) | App-facing `getAsset(logicalId)` over *active* packs; does not own networking or versioning. |

Do **not** invent a separate productized “Asset Store” unless building a human-facing library UI. Storage backend ≠ pack format ≠ app asset API.

### First-install UX

```text
Install / open application
  → runtime ensures required base pack(s)
  → only then mark application Ready
  → user never uses a hollow shell as the product
```

Subsequent updates preferably arrive as newer pack versions (shell updates remain separate via the service worker / app version). Updates are **user-deferrable** where the product UX allows.

### Integrity

Every entry hash is verified before activation. Failed verification rejects the pack; the previous active version remains.

### Serving (v1)

Static nginx (or Vite `public/packs`) paths:

`/packs/<appId>/<packId>/<version>/pack.json`  
`/packs/<appId>/<packId>/<version>/<entry path>`

## Consequences

### Positive

- Offline-complete installs with clear Ready gating.
- Content versioning decoupled from app JS deploys.
- Same format for Hello, sibling PWAs, and future offline-complete apps.
- Path to optional packs and object-store backends without changing app APIs much.

### Negative / trade-offs

- More engineering than dumping files in `public/`.
- Browser storage quotas can fail for large video; need sizing guidelines and GC later.
- Pack build steps become part of the app release process.

### Follow-ups

- Pack build script / CI hashing — see `scripts/sync-content-pack.mjs` / `pnpm content-pack:sync`.
- Object-store sidecar when static nginx is insufficient.
- Optional quality / language packs.
- Media transcoding pipeline (separate from pack format).
- Reusable Ready UI — `PackReadyGate` in `@platform/runtime`.
