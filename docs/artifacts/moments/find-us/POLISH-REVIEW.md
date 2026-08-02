# Find Us Moment — polish review

Live: https://memories.songara.uk/moment

## Iteration 1

**Artifacts:** `polish/iter1/`

### Observations
- Active star halo is clearly stronger than background field.
- Leo / Sag separated with real negative space; warm vs cool identities started.
- Paper end-state calm; flecks present.
- Lines read dashed / short of centres; lion silhouette too blob-like / too dark.

### Top 3 weaknesses → fixes
1. Line–star misalignment (HTML cores vs SVG lines) → move star cores into SVG.
2. Dasharray pathLength=1 looked dashed → pathLength 100 + solid finish.
3. Illustration opacity / stroke too timid → raise opacity; refine paths.

## Iteration 2

**Artifacts:** `polish/iter2/`

### Observations
- Active Leo vs active Sag colour difference is clear (gold vs pale blue).
- Illustrations persist; labels remain.
- Lines improved but still optically short of glow centres; illustrations still shy.

### Top 3 weaknesses → fixes
1. Paint lines after star cores so joins read as centre-terminated.
2. Boost illustration opacity (~0.38–0.40) and stroke weight.
3. Stronger Sagittarius archer linework.

## Iteration 3

**Artifacts:** `polish/iter3/`

### Observations
- Final pass on line order, illustration weight, active halo.
- Transition remains: dissolve → particles drift → settle → paper reveal → corner lift → fold relax → stop (no letter).

### Honest remaining weaknesses
- Line art animals are still suggestive, not museum-plate engravings.
- `preserveAspectRatio="none"` stretches constellations with viewport aspect (intentional for % coords).
- Workbox may log when service workers are blocked in automation.
