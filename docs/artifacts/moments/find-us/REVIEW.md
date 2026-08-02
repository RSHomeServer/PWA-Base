# Find Us Moment — review notes

Live: https://memories.songara.uk/moment  
Config: `packages/site-memories/src/moments/find-us.config.json`

## Iteration 1

**Artifacts:** `iter1/`

### Observations
- Opening sky + “Let’s find us.” lands calmly; immersive chrome hide works.
- Hover label (Regulus) is a delightful discovery.
- Leo completion + sentence feel satisfying; illustration payoff present but weak.
- Paper transition arrives; gold flecks readable.

### Top 3 weaknesses → fixes
1. Background stars clustered left → golden-ratio scatter + more stars.
2. Illustration too dark / cold → warm glow strokes; paths in star viewBox; thinner lines.
3. Closing copy lingered into paper → hide closing when paper begins; soften sky during paper.

## Iteration 2

**Artifacts:** `iter2/`

### Observations
- Starfield reads across the whole sky.
- Closing text no longer sits on the paper.
- Leo sentence + label still emotionally clear.
- Illustration still slightly too shy; paper unfold understated.

### Top 3 weaknesses → fixes
1. Illustration opacity / warmth still low → raise opacity (~0.32 / 0.28).
2. Constellation label placement generic → anchor under star centroid.
3. Paper unfold too subtle → stronger flap + perspective; denser ink flecks; particles aim toward paper.

## Iteration 3

**Artifacts:** `iter3/`

### Observations
- Final polish pass on illustration, label, paper motion, line weight.
- Config remains the personalisation surface for all copy, stars, timings, colours, glow.

### Remaining honest gaps
- Lion silhouette is suggestive, not fine art.
- Platform PWA service-worker registration can log a console error when SW is blocked in automation (unrelated to Moment logic).
- Letter content after unfold is intentionally not built (end of milestone).
