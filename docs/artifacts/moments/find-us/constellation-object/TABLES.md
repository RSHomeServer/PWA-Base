# Constellation Object tables (baseline export)

Source: `packages/site-memories/src/moments/constellations/{leo,sagittarius}.json`  
Baseline: Leo polish + Sagittarius polish-2 geometry. Definitions store `origin`; Find Us places via `constellationInstances` in `find-us.config.json` (identity: centre = origin).

## Leo (`leo`)

### Vertices

| UID | Star Name | Subtitle | X | Y | Special Effects |
| --- | --- | ---: | ---: | ---: | --- |
| A | ν Leonis | — | 43.98 | 41.86 | — |
| B | Algenubi | The Southern Eyebrow | 48.0 | 14.92 | — |
| C | Rasalas | The Lion's Head | 45.76 | 9.64 | — |
| D | Adhafera | The Curl | 37.99 | 15.76 | — |
| E | Algieba | The Mane | 36.92 | 24.21 | — |
| F | η Leonis | — | 41.03 | 31.48 | — |
| G | Regulus | The Little King | 40.69 | 42.8 | — |
| H | Chertan | The Ribs | 19.3 | 34.63 | — |
| I | Denebola | The Lion's Tail | 8.0 | 36.65 | — |
| J | Zosma | The Girdle | 19.35 | 22.59 | — |

### Graph Edges

A–B, B–C, C–D, D–E, E–F, F–G, G–H, H–I, I–J, J–E

### Draw Order

A → B → C → D → E → F → G → H → I → J → E

(Activation = first occurrence of each UID. Closing revisit `E` completes Algieba–Zosma.)

### Artwork

| Field | Value |
| --- | --- |
| Image | `/moments/find-us/leo-atlas.png` |
| Centre | (28, 26.225) |
| Rotation | 0° |
| Scale | 1 |
| Opacity | 0.28 |
| Base size | 50 × 41.45 |
| Fit | fill |

### Definition Origin

| Field | Value |
| --- | --- |
| Origin | (28, 26.225) |

### Instance Transform (Find Us placement)

| Field | Value |
| --- | --- |
| Centre | (28, 26.225) |
| Rotation | 0° |
| Scale | 1 |

*(Identity: instance centre = definition origin.)*

### Palette

glow `#f0c78a`, glowSoft `rgba(240, 199, 138, 0.55)`, line `#e0b878`, starIdle `rgba(240, 210, 170, 0.5)`, label `rgba(232, 210, 170, 0.85)`

---

## Sagittarius (`sagittarius`)

### Vertices

| UID | Star Name | Subtitle | X | Y | Special Effects |
| --- | --- | ---: | ---: | ---: | --- |
| A | Alnasi | The Point of the Arrow | 91.7 | 78.8 | — |
| B | Kaus Media | The Middle of the Bow | 83.5 | 77.3 | — |
| C | Kaus Australis | The Southern Bow | 81.8 | 88.8 | — |
| D | Kaus Borealis | The Northern Bow | 79.8 | 66.3 | — |
| E | Albaldah | The City | 57.3 | 55.2 | — |
| F | Nunki | — | 65.1 | 68.5 | — |
| G | Ascella | The Armpit | 61.1 | 77.5 | — |
| H | τ Sagittarii | — | 58.8 | 71.9 | — |

### Graph Edges

A–B, B–C, B–D, D–F, F–G, G–B, F–H, H–E, E–F

### Draw Order

A → B → C → D → F → G → H → E

(Discovery sequence. Consecutive pairs are **not** a full Euler pencil walk; renderer falls back to completed `graphEdges` so UX matches prior Sagittarius behaviour.)

### Artwork

| Field | Value |
| --- | --- |
| Image | `/moments/find-us/sagittarius-atlas.png` |
| Centre | (75, 72) |
| Rotation | 0° |
| Scale | 1 |
| Opacity | 0.32 |
| Base size | 46 × 48 |
| Fit | meet |

### Definition Origin

| Field | Value |
| --- | --- |
| Origin | (75, 72) |

### Instance Transform (Find Us placement)

| Field | Value |
| --- | --- |
| Centre | (75, 72) |
| Rotation | 0° |
| Scale | 1 |

*(Identity: instance centre = definition origin.)*

### Palette

glow `#d0e4f8`, glowSoft `rgba(170, 210, 245, 0.5)`, line `#a8c4e0`, starIdle `rgba(190, 215, 240, 0.45)`, label `rgba(200, 220, 245, 0.85)`
