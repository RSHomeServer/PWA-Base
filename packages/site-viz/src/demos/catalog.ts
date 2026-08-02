import { exhibits } from "../exhibits/registry.js";

export interface DemoEntry {
  id: string;
  path: string;
  title: string;
  summary: string;
  category?: string;
  /** Dedicated interactive FlagshipShell experience. */
  flagship?: boolean;
  /** Highlight on the museum homepage carousel. */
  featured?: boolean;
  /** Extra search keywords beyond title and summary. */
  tags?: string[];
  /** Primary = flagship halls; standard = quiet companions; archive = hidden from default gallery. */
  flagshipTier?: "primary" | "standard" | "archive";
  /** When true, omitted from homepage wings (routes remain reachable). */
  hidden?: boolean;
}

export const VIZ_BASE_PATH = "";

export type DemoMeta = Pick<DemoEntry, "featured" | "tags" | "flagshipTier" | "hidden">;

/**
 * Director's Cut catalog truth:
 * — 8 flagship halls on the carousel
 * — a short quiet shelf of companions
 * — everything else archived / hidden (routes still work)
 */
const demoMeta: Record<string, DemoMeta> = {
  // Quiet companions (shown in standard wing)
  newton: { flagshipTier: "standard", tags: ["fractal", "roots"] },
  lorenz: { flagshipTier: "standard", tags: ["attractor", "chaos"] },
  clifford: { flagshipTier: "standard", tags: ["attractor", "orbit"] },
  "perlin-flow": { flagshipTier: "standard", tags: ["noise", "flow"] },
  "simplex-terrain": { flagshipTier: "standard", tags: ["terrain", "noise"] },
  "wave-interference": { flagshipTier: "standard", tags: ["waves", "interference"] },
  "fourier-epicycles": { flagshipTier: "standard", tags: ["fourier", "drawing"] },
  harmonograph: { flagshipTier: "standard", tags: ["pendulum", "drawing"] },
  "moire-interference": { flagshipTier: "archive", tags: ["optical", "moire"] },

  // Hidden / superseded (keep routes, remove from gallery)
  "julia-explorer": { flagshipTier: "archive", hidden: true, tags: ["julia"] },
  "life-lab": { flagshipTier: "archive", hidden: true, tags: ["life"] },
  julia: { flagshipTier: "archive", hidden: true },
  mandelbrot: { flagshipTier: "archive", hidden: true },
  "black-hole": { flagshipTier: "archive", hidden: true },
  "double-pendulum": { flagshipTier: "archive", hidden: true },
  "aurora-ribbons": { flagshipTier: "archive", hidden: true },
  "reaction-diffusion": { flagshipTier: "archive", hidden: true },
  boids: { flagshipTier: "archive", hidden: true },
  "game-of-life": { flagshipTier: "archive", hidden: true },
  "recursive-tree": { flagshipTier: "archive", hidden: true },
  "particle-fountain": { flagshipTier: "archive", hidden: true },
  starfield: { flagshipTier: "archive", hidden: true },
  kaleidoscope: { flagshipTier: "archive", hidden: true },
  "burning-ship": { flagshipTier: "archive", hidden: true },
  "rule-30": { flagshipTier: "archive", hidden: true },
  "voronoi-diagram": { flagshipTier: "archive", hidden: true },
  delaunay: { flagshipTier: "archive", hidden: true },
  "dragon-curve": { flagshipTier: "archive", hidden: true },
  "hilbert-curve": { flagshipTier: "archive", hidden: true },
  "cafe-wall": { flagshipTier: "archive", hidden: true },
  sierpinski: { flagshipTier: "archive", hidden: true },
  lissajous: { flagshipTier: "archive", hidden: true },
};

/** Conference halls — order is intentional for the carousel. */
const flagshipDemos: DemoEntry[] = [
  {
    id: "cymatics",
    path: "/cymatics",
    title: "Cymatics",
    summary: "Sand finds the silence — Chladni figures emerge as grains migrate to nodal lines.",
    category: "Waves",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["chladni", "standing waves", "particles", "resonance"],
  },
  {
    id: "event-horizon",
    path: "/event-horizon",
    title: "Event Horizon",
    summary: "Steer a singularity — lensing, accretion fire, and a photon ring that breathes.",
    category: "Cosmos",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["gravity", "lensing", "space"],
  },
  {
    id: "fluid-lab",
    path: "/fluid-lab",
    title: "Fluid Lab",
    summary:
      "Stir luminous dye — vortices bloom under your hand; smoke mode softens into atmosphere.",
    category: "Matter",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["fluid", "smoke", "dye"],
  },
  {
    id: "reaction-paint",
    path: "/reaction-paint",
    title: "Reaction Paint",
    summary:
      "Paint chemicals into a living Gray–Scott field — coral, spots, and worms from your brush.",
    category: "Matter",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["paint", "patterns", "organic"],
  },
  {
    id: "mandelbrot-explorer",
    path: "/mandelbrot-explorer",
    title: "Mandelbrot Explorer",
    summary:
      "Infinite zoom with living colour — bookmarks, minimap, and a boundary that never ends.",
    category: "Infinity",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["fractal", "zoom"],
  },
  {
    id: "double-pendulum-pro",
    path: "/double-pendulum-pro",
    title: "Double Pendulum",
    summary:
      "Chaos you can stage — glowing trails, a ghost twin, and energy that never quite settles.",
    category: "Chaos",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["chaos", "physics"],
  },
  {
    id: "boids-lab",
    path: "/boids-lab",
    title: "Boids",
    summary: "Emergence you can perform — flock, frighten, feed, and paint birds into the air.",
    category: "Life",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["flocking", "swarm"],
  },
  {
    id: "aurora-sky",
    path: "/aurora-sky",
    title: "Aurora",
    summary:
      "Northern light as installation — drag the moon, pull wind through curtains of colour.",
    category: "Atmosphere",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["aurora", "glow"],
  },
  {
    id: "living-tree",
    path: "/living-tree",
    title: "Living Tree",
    summary: "A canopy with seasons — wind, blossoms, snow, and lightning answering your hand.",
    category: "Nature",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["tree", "seasons"],
  },
  {
    id: "audio-lab",
    path: "/audio-lab",
    title: "Audio Laboratory",
    summary:
      "Songara Studio — visualise, stem, sequence, score, and synthesise with a shared Web Audio bus.",
    category: "Sound",
    flagship: true,
    featured: true,
    flagshipTier: "primary",
    tags: ["audio", "daw", "synth", "sequencer"],
  },
  // Demoted halls — reachable, not featured
  {
    id: "julia-explorer",
    path: "/julia-explorer",
    title: "Julia Explorer",
    summary:
      "Steer the complex constant — absorbed into the Mandelbrot hall for the Director's Cut.",
    category: "Infinity",
    flagship: true,
    featured: false,
    flagshipTier: "archive",
    hidden: true,
    tags: ["julia"],
  },
  {
    id: "life-lab",
    path: "/life-lab",
    title: "Life Lab",
    summary: "Cellular automata studio — kept as archive for the Director's Cut.",
    category: "Life",
    flagship: true,
    featured: false,
    flagshipTier: "archive",
    hidden: true,
    tags: ["life"],
  },
];

const legacyDemos: DemoEntry[] = [
  {
    id: "cafe-wall",
    path: "/cafe-wall",
    title: "Café Wall Illusion",
    summary: "Offset tiles make straight mortar lines appear tilted.",
    category: "Illusion",
  },
  {
    id: "mandelbrot",
    path: "/mandelbrot",
    title: "Mandelbrot Set",
    summary: "Classic fractal explorer — superseded by Mandelbrot Explorer.",
    category: "Fractals",
  },
  {
    id: "sierpinski",
    path: "/sierpinski",
    title: "Sierpinski Triangle",
    summary: "Recursive self-similar triangles.",
    category: "Geometry",
  },
  {
    id: "lissajous",
    path: "/lissajous",
    title: "Lissajous Curves",
    summary: "Harmonic phase curves.",
    category: "Waves",
  },
];

function withMeta(entry: DemoEntry): DemoEntry {
  const meta = demoMeta[entry.id];
  return meta
    ? { ...entry, ...meta }
    : { ...entry, flagshipTier: entry.flagshipTier ?? "archive", hidden: entry.hidden ?? true };
}

export const demos: DemoEntry[] = [
  ...flagshipDemos,
  ...legacyDemos.map(withMeta),
  ...exhibits.map((exhibit) =>
    withMeta({
      id: exhibit.id,
      path: exhibit.path,
      title: exhibit.title,
      summary: exhibit.summary,
      category: exhibit.category,
    }),
  ),
];

/** Visible museum inventory (excludes hidden archive ghosts). */
export function visibleDemos(): DemoEntry[] {
  return demos.filter((demo) => !demo.hidden);
}

export function demoHref(path: string): string {
  return `${VIZ_BASE_PATH}${path}`;
}

export function demoById(id: string): DemoEntry | undefined {
  return demos.find((demo) => demo.id === id);
}

export function primaryDemos(): DemoEntry[] {
  return visibleDemos().filter((demo) => demo.flagshipTier === "primary");
}

export function featuredDemos(): DemoEntry[] {
  return visibleDemos().filter((demo) => demo.flagship && demo.featured);
}

export function archiveDemos(): DemoEntry[] {
  return visibleDemos().filter((demo) => demo.flagshipTier === "archive");
}

export function standardDemos(): DemoEntry[] {
  return visibleDemos().filter(
    (demo) => demo.flagshipTier !== "primary" && demo.flagshipTier !== "archive",
  );
}

export function adjacentDemos(currentPath: string): {
  prev: DemoEntry | null;
  next: DemoEntry | null;
} {
  const hall = featuredDemos();
  const normalized = currentPath.startsWith("/") ? currentPath : `/${currentPath}`;
  const index = hall.findIndex((demo) => demo.path === normalized);
  if (index === -1) {
    const all = demos;
    const i = all.findIndex((demo) => demo.path === normalized);
    if (i === -1) return { prev: null, next: null };
    return {
      prev: i > 0 ? all[i - 1]! : null,
      next: i < all.length - 1 ? all[i + 1]! : null,
    };
  }
  return {
    prev: index > 0 ? hall[index - 1]! : null,
    next: index < hall.length - 1 ? hall[index + 1]! : null,
  };
}
