export type StarLook = {
  body: string;
  /** Richer, slightly darker ink for message text + tooltips. */
  ink: string;
  core: string;
  glow: string;
  effect?: "regulus" | "rasalas" | "denebola";
  spikeScale?: number;
  twinkleScale?: number;
};

/** Per-star colours / personality for Leo (and shared message bullets). */
export const STAR_LOOK: Record<string, StarLook> = {
  Regulus: {
    body: "#F7A3C8",
    ink: "#E0729E",
    core: "#fff8fb",
    glow: "rgba(247, 163, 200, 0.45)",
    effect: "regulus",
  },
  Algenubi: {
    body: "#FFF5E8",
    ink: "#E6C89A",
    core: "#ffffff",
    glow: "rgba(255, 245, 232, 0.45)",
  },
  Rasalas: {
    body: "#F6D98C",
    ink: "#D4B04A",
    core: "#fffaf0",
    glow: "rgba(246, 217, 140, 0.45)",
    effect: "rasalas",
    spikeScale: 1.28,
  },
  Adhafera: {
    body: "#F8E7C0",
    ink: "#D9C07A",
    core: "#fffdf8",
    glow: "rgba(248, 231, 192, 0.45)",
  },
  Algieba: {
    body: "#EFC07A",
    ink: "#D49A3E",
    core: "#fff8ef",
    glow: "rgba(239, 192, 122, 0.45)",
  },
  "η Leonis": {
    body: "#F4F7FF",
    ink: "#B8C4E0",
    core: "#ffffff",
    glow: "rgba(244, 247, 255, 0.42)",
  },
  Chertan: {
    body: "#C9E7FF",
    ink: "#7EB8DE",
    core: "#f7fbff",
    glow: "rgba(201, 231, 255, 0.45)",
  },
  Denebola: {
    body: "#D8F2FF",
    ink: "#8EC6E4",
    core: "#f5fbff",
    glow: "rgba(216, 242, 255, 0.45)",
    effect: "denebola",
    twinkleScale: 0.55,
  },
  Zosma: {
    body: "#FFF2D6",
    ink: "#E0C48A",
    core: "#fffdf8",
    glow: "rgba(255, 242, 214, 0.45)",
  },
};

export function starBodyColor(name: string, fallback = "#f0c78a"): string {
  return STAR_LOOK[name]?.body ?? fallback;
}

export function starInkColor(name: string, fallback = "#e0c48a"): string {
  return STAR_LOOK[name]?.ink ?? fallback;
}
