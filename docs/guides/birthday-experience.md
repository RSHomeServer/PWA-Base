# Birthday experience — vision & milestones

Art direction for `birthday.songara.uk`. Engineering: root [`CURSOR.md`](../../CURSOR.md).
Content packs: [`content-packs.md`](./content-packs.md). Preferences: [`platform-preferences.md`](./platform-preferences.md).

**Creative direction review (2026-07):** [`docs/artifacts/birthday-direction-review/DIRECTION.md`](../artifacts/birthday-direction-review/DIRECTION.md) — pivot away from miniature 3D as the quality strategy; adopt **Paper, Light & Night** rituals.

---

## Updated opening vision

The Birthday app should feel like a sequence of **small ceremonies**, not a website and not a 3D museum piece.

### Sequence (full intent)

1. **Night** — quiet dark; sparse stars.
2. **Light enters** — match strike or single candle (optional beat).
3. **Dedication** — constellation **drawn** in 2D (trace or self-drawing SVG), not trapped in photoreal glass.
4. **Keepsake desk / letter box** — paper, seal, photographs, and chapter invitations — the root of exploration.
5. **Chapter rituals** — lantern wishes, letters, candle, photo lifts; each with one verb and a clear end.

Tone: warm, nostalgic, magical, elegant, handcrafted.  
Avoid: heavy particles, fast motion, game-like UI, GLTF/R3F hero moments, “parameterisation proof” framing.

### What we are not doing (for Birthday identity)

- Handcrafted miniature **Three.js / snow-globe** scenes as the opening or visual identity.
- Further investment in believable glass refraction as a prerequisite for wonder.

Memory Experience Library stages may remain R&D / showcase; they are **not** the Birthday north star. See the direction review.

### Wax seal

Appropriate for **letters** (`EnvelopeLetter` — break seal / unfold). Strong identity candidate. The standalone `WaxSealOpening` gate remains optional.

### Proven emotional grammar

`LanternField` (Chapter VI): click → lantern → handwritten wish → slow rise → finite completion. This timing and interaction pattern is the template for new rituals.

---

## Identity rituals (Top 5)

| Ritual | Role |
| --- | --- |
| Sky Lantern Wish | Release / future |
| Wax Seal Letter | Intimacy / words |
| Single Candle Wish | Birthday itself |
| Trace the Constellation | Dedication / “us” |
| Polaroid Lift | Memory / photographs |

---

## Milestone plan

Build incrementally. Each milestone leaves a polished, shippable Birthday.

### Milestone 1 — Architecture of wonder *(adjust)*

| | |
| --- | --- |
| **Objective** | Cinematic night + dedication without depending on 3D glass |
| **UX** | Night → constellation draw / settle → dedication copy; scroll into chapters |
| **Birthday-specific** | Keep `KeepsakeOpeningStage` motion; treat globe/glass as optional vignette only if CSS-simple |

### Milestone 2 — Signature ritual polish

| | |
| --- | --- |
| **Objective** | Highest-confidence emotional win |
| **UX** | Elevate **Lantern Wish** to a full-viewport ceremonial beat (anticipation, handwriting, completion) |
| **Birthday-specific** | `LanternField` lineage — HTML/CSS only |

### Milestone 3 — Letter & candle

| | |
| --- | --- |
| **Objective** | Two more identity rituals |
| **UX** | Seal break / unfold letter; single candle blow + wish line |
| **Birthday-specific** | Reuse pack copy (`letters`, wishes) |

### Milestone 4 — Keepsake navigation

| | |
| --- | --- |
| **Objective** | Chapters feel like opening kept things |
| **UX** | Ribbon / compartment / photo stack transitions into scrapbook/letter/moments |
| **Birthday-specific** | Box ↔ chapter mapping without 3D |

### Milestone 5 — Content richness

| | |
| --- | --- |
| **Objective** | Real media + paper craft without new React for each memory |
| **UX** | Photo clusters, lift-notes, seasonal atmospheres |
| **Reusable** | Pack schema extensions |

---

## Content architecture (unchanged foundation)

```text
packages/site-birthday/content/birthday-base/<version>/
  content/keepsake.json
  media/photos|videos|voice|letters/
```

```bash
pnpm content-pack:sync -- birthday birthday-base
# alias: pnpm birthday:pack
```

---

## Recommended next implementation

**Milestone 2 — Lantern Wish ritual polish**: full-viewport ceremonial lantern beat from existing `LanternField`, still no Three.js, validate in Cursor’s browser as well as Chromium.
