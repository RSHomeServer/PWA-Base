import type { PlateShape } from "./sim/ChladniField.js";

export interface ChladniPreset {
  id: string;
  label: string;
  shape: PlateShape;
  n: number;
  m: number;
  description: string;
}

/**
 * Famous Chladni figures. Rectangular presets always use `n !== m` — the
 * free-plate mode formula vanishes identically at `n === m`, matching real
 * plate physics (the symmetric combination carries no net pattern). Circular
 * presets are drum/membrane-style Bessel modes, where `n === m` is perfectly
 * valid.
 */
export const CHLADNI_PRESETS: ChladniPreset[] = [
  {
    id: "rect-1-2",
    label: "Twin Lobe",
    shape: "rect",
    n: 1,
    m: 2,
    description:
      "The simplest asymmetric plate mode — two broad antinode lobes either side of a single curved node.",
  },
  {
    id: "rect-1-3",
    label: "Triple Band",
    shape: "rect",
    n: 1,
    m: 3,
    description:
      "Three bands ripple across the plate as the second harmonic joins the fundamental.",
  },
  {
    id: "rect-2-3",
    label: "Six-Point Star",
    shape: "rect",
    n: 2,
    m: 3,
    description:
      "One of the most photographed Chladni figures — a six-pointed star woven from crossing node lines.",
  },
  {
    id: "rect-1-4",
    label: "Quad Rail",
    shape: "rect",
    n: 1,
    m: 4,
    description: "Four parallel rails of sand form as the mode number climbs.",
  },
  {
    id: "rect-3-4",
    label: "Woven Lattice",
    shape: "rect",
    n: 3,
    m: 4,
    description: "Higher mode numbers interleave into a dense woven lattice of nodal lines.",
  },
  {
    id: "rect-2-5",
    label: "Pinwheel",
    shape: "rect",
    n: 2,
    m: 5,
    description:
      "An asymmetric sweep of curves that spirals like a pinwheel toward the plate's corners.",
  },
  {
    id: "rect-3-5",
    label: "Snowflake",
    shape: "rect",
    n: 3,
    m: 5,
    description:
      "The archetypal high-frequency Chladni snowflake — intricate, six-fold-feeling symmetry from a square plate.",
  },
  {
    id: "rect-4-5",
    label: "Filigree",
    shape: "rect",
    n: 4,
    m: 5,
    description:
      "Fine filigree detail — every increment in mode number roughly doubles the pattern's intricacy.",
  },
  {
    id: "rect-5-6",
    label: "Rosette",
    shape: "rect",
    n: 5,
    m: 6,
    description: "A dense rosette near the top of this plate's practical mode range.",
  },
  {
    id: "circle-0-1",
    label: "Bullseye",
    shape: "circle",
    n: 0,
    m: 1,
    description: "The fundamental drum mode — a single antinode dome ringed by one nodal circle.",
  },
  {
    id: "circle-0-2",
    label: "Twin Ring",
    shape: "circle",
    n: 0,
    m: 2,
    description: "A second concentric nodal ring appears — purely radial, no angular structure.",
  },
  {
    id: "circle-1-1",
    label: "Half Moon",
    shape: "circle",
    n: 1,
    m: 1,
    description:
      "One diametric nodal line splits the plate into two crescents vibrating out of phase.",
  },
  {
    id: "circle-2-1",
    label: "Four Petal",
    shape: "circle",
    n: 2,
    m: 1,
    description: "Two crossing diameters carve the disc into four alternating petals.",
  },
  {
    id: "circle-3-1",
    label: "Six Petal",
    shape: "circle",
    n: 3,
    m: 1,
    description: "Three crossing diameters — six petals alternating in phase around the rim.",
  },
  {
    id: "circle-1-2",
    label: "Target & Line",
    shape: "circle",
    n: 1,
    m: 2,
    description: "A diametric line combines with a radial ring for a lopsided target pattern.",
  },
  {
    id: "circle-2-2",
    label: "Petal Ring",
    shape: "circle",
    n: 2,
    m: 2,
    description: "Angular petals nest inside an extra radial nodal ring.",
  },
  {
    id: "circle-0-3",
    label: "Triple Ring",
    shape: "circle",
    n: 0,
    m: 3,
    description:
      "Three perfectly concentric nodal circles — the purest radial drum mode shown here.",
  },
];

/** Reference scalar so the frequency axis lands in a musically familiar
 * range (tens of Hz to a few kHz) for typical plate sizes. Purely a display
 * convenience — see `ChladniField.eigenvalue`, which is what actually drives
 * the physics. */
export const FREQUENCY_SCALE = 260;
export const FREQUENCY_MIN_HZ = 20;
export const FREQUENCY_MAX_HZ = 2600;

export interface CymaticsPalette {
  id: string;
  label: string;
  /** Resting grain colour. */
  base: [number, number, number];
  /** Colour of agitated / high-energy grains. */
  highlight: [number, number, number];
  /** Plate background. */
  background: [number, number, number];
}

/** Art-directed particle palettes — chosen to stay legible and jewel-toned
 * rather than muddy, across every visual mode. */
export const CYMATICS_PALETTES: CymaticsPalette[] = [
  {
    id: "sand",
    label: "Warm Sand",
    base: [219, 184, 132],
    highlight: [255, 226, 170],
    background: [21, 17, 14],
  },
  {
    id: "salt",
    label: "Salt Flat",
    base: [220, 228, 236],
    highlight: [255, 255, 255],
    background: [8, 12, 18],
  },
  {
    id: "copper",
    label: "Copper Filings",
    base: [190, 112, 62],
    highlight: [255, 176, 96],
    background: [15, 10, 8],
  },
  {
    id: "verdigris",
    label: "Verdigris",
    base: [98, 176, 154],
    highlight: [176, 255, 224],
    background: [7, 15, 13],
  },
  {
    id: "bioluminous",
    label: "Bioluminescent",
    base: [104, 150, 255],
    highlight: [196, 255, 250],
    background: [4, 6, 16],
  },
  {
    id: "ink",
    label: "Ink Wash",
    base: [208, 208, 214],
    highlight: [255, 255, 255],
    background: [8, 8, 10],
  },
];

export type CymaticsVisualMode =
  "sand" | "glow" | "water" | "metal" | "heatmap" | "contours" | "wireframe" | "vectors";

export interface VisualModeSpec {
  id: CymaticsVisualMode;
  label: string;
  description: string;
}

export const VISUAL_MODES: VisualModeSpec[] = [
  {
    id: "sand",
    label: "Sand",
    description: "Classic grainy Chladni sand, piling up on nodal lines.",
  },
  { id: "glow", label: "Glow", description: "Soft luminous particles with additive bloom." },
  {
    id: "water",
    label: "Water Droplets",
    description: "Beaded droplets with a bright specular highlight.",
  },
  {
    id: "metal",
    label: "Metal Filings",
    description: "Fine dark filings with a magnetic-looking sheen.",
  },
  {
    id: "heatmap",
    label: "Heat Map",
    description: "Particle density rendered as a thermal field.",
  },
  {
    id: "contours",
    label: "Nodal Contours",
    description: "The exact theoretical node lines, traced from the field.",
  },
  { id: "wireframe", label: "Wireframe", description: "The mode shape as a lit topographic mesh." },
  {
    id: "vectors",
    label: "Vector Field",
    description: "Arrows showing the force pulling sand toward nodes.",
  },
];

export const EDUCATION_COPY = {
  standingWaves: `A Chladni plate is driven at a single frequency until it locks into a standing wave — a pattern of vibration that stays fixed in space while oscillating in time. Every point on the plate moves up and down, but the *shape* of the pattern doesn't travel anywhere; it just breathes in place.`,
  nodesAntinodes: `Points that never move — no matter how hard the plate rings — are called nodes; the curves they trace out are nodal lines. Points that swing the furthest are antinodes. Sand (or salt, or filings) gets thrown off antinodes by the violent local motion and gradually migrates to the calm of the nodal lines, tracing them out in grain.`,
  harmonics: `Each mode is labelled by two integers, (n, m), counting the half-wavelengths that fit along each axis of the plate. Low (n, m) gives a few broad lobes; as the numbers climb, the plate divides into more and smaller cells, and the pattern's intricacy roughly compounds. These are the plate's harmonics — a 2D analogue of the overtones of a vibrating string.`,
  resonance: `A plate only forms a clean figure very close to a resonant frequency — one that matches a mode's natural frequency for the current size and shape of the plate. Off resonance, no single mode dominates and the sand just jitters without settling. Sweep the frequency slider slowly and watch the pattern snap into focus as you cross a resonance.`,
};
