# Memory Experience Library

Showcase host: [`memories.songara.uk`](https://memories.songara.uk) (`@platform/memories-web` → `@platform/site-memories`).

Reusable stages live in **`@platform/experiences`**. Birthday and future apps should import that package — never the showcase site.

## Art direction — “Cabinet of Keepsakes”

Warm walnut, soft brass, milk glass, ivory paper, amber light. Typography: **Fraunces** (display) + **Literata** (body), scoped under `.mx` so platform chrome keeps Syne / Source Sans 3.

Chosen because it reads handcrafted and premium without cartoon gloss or photoreal CGI. Rejected directions: scrapbook collage, neon cyber, cream+terracotta AI cliché, newspaper broadsheet.

## Definitive Snow Globe (quality bar)

Primary path is **React Three Fiber** (`SnowGlobeScene`), not CSS. CSS `SnowGlobeFallback` is WebGL error recovery only.

| Instance | Role |
| --- | --- |
| `snow-globe-constellation` | Birthday intro — night sky → dedication draw → spiral reveal → idle |
| `snow-globe-paris` | Landmark proof — CC-BY Eiffel GLB under amber light |
| `snow-globe-tree` | Parameterisation proof — Kenney CC0 tree, cool mood |

GLBs live in `apps/memories-web/public/models/snow-globe/` (see `packages/experiences/ATTRIBUTIONS.md`). Visual review artifacts: `docs/artifacts/snow-globe-definitive/`.

## Architecture

| Layer | Package | Role |
| --- | --- | --- |
| Library | `@platform/experiences` | Experience kinds, instance schema, stages, demo instances |
| Showcase | `@platform/site-memories` | Catalogue IA + routes |
| Packaging | `@platform/memories-web` | Vite PWA + nginx + Traefik |

**Concepts**

- **Experience** — reusable stage (`snow-globe` \| `music-box` \| `fridge-door`).
- **Instance** — a memory: JSON params + asset refs driving one stage.
- **Catalogue entry** — Storybook-like index row (slug, blurb, emotion).

Parameterisation philosophy: expensive craft lives in the stage; authors swap palette, lighting, centrepiece/figurine/items, copy, and media.

## Folder structure

```
packages/experiences/
  src/
    types.ts              # contracts
    parseInstance.ts      # JSON → typed instance
    registry.ts           # demo catalogue + loaders
    ExperienceStage.tsx   # kind → component
    theme/                # Cabinet of Keepsakes tokens + shell
    snow-globe/           # R3F globe + procedural centrepieces
    music-box/            # CSS craft box + Web Audio lullaby
    fridge-door/          # DOM fridge + swappable items
    content/instances/    # demo memory JSON (imported)
  content/README.md       # authoring notes

packages/site-memories/src/pages/
  CataloguePage.tsx
  ExperiencePage.tsx      # /:kind/:id

apps/memories-web/        # thin SoloSiteApp host
```

## Asset pipeline

| Kind | Location | Notes |
| --- | --- | --- |
| Reusable stage code | `packages/experiences/src/<kind>/` | Rarely touched when authoring |
| Procedural props | `SnowGlobeFallback` / `Centrepiece` | Eiffel / tree / ballet-shoes (SVG + CSS); R3F/GLTF hook retained |
| GLTF props (optional) | `centrepiece.kind: "gltf"` + `src` | Free licensed models + `ATTRIBUTIONS.md` |
| Instance config | `src/content/instances/*.json` | Title, palette, lighting, items… |
| User / app content | Future packs or app-owned JSON | Birthday supplies instances; does not fork stages |

Adding a memory today: copy a JSON instance, change params, register in `registry.ts` (catalogue + raw map). Next milestone: file-based discovery so registry edits are unnecessary.

## Initial experiences

1. **Snow Globe** — glass sphere, snow field, procedural centrepiece, lighting/palette params; two demos prove emotional swap.
2. **Music Box** — lid open, figurine turn, engraved text, restrained Web Audio melody.
3. **Fridge Door** — constant fridge; magnets / postcards / tickets / notes / reminders / drawings as data.

## Intentionally rejected

| Idea | Why |
| --- | --- |
| Scrapbook pages / photo stacks / envelopes as *library stages* | Explicitly out of scope for the cabinet library — low reuse as generic stages |
| Dashboard catalogue chrome for stages | Experiences are stages, not admin |
| Content packs for this milestone | JSON-in-package is enough; packs when offline media hashing is required |
| Shared `@platform/three` kit | Single consumer so far (ADR-003); R3F stays inside `@platform/experiences` |
| Hand-modeling centrepieces | Procedural low-poly stand-ins + GLTF hook for free assets |

**Birthday note (2026-07 direction review):** Do **not** treat R3F Snow Globe as Birthday’s identity craft. Birthday should follow **Paper, Light & Night** rituals — see [`docs/artifacts/birthday-direction-review/DIRECTION.md`](../artifacts/birthday-direction-review/DIRECTION.md). The Memory Library may keep 3D as optional R&D/showcase.

## Extension points

- Discover instances from a directory / pack without editing `registry.ts`
- GLTF loader path with attribution registry
- Authoring UI for fridge item placement
- Birthday imports `ExperienceStage` + instance JSON only

## Local / deploy

```bash
pnpm --filter @platform/memories-web dev          # :5181
pnpm --filter @platform/experiences test:unit
pnpm --filter @platform/memories-web build
docker compose up -d --build memories-web
```
