import type { ParticleTone } from "./types.js";

/** Neutral warm palette — no greens, blues, or purples. */
export const DEFAULT_PARTICLE_TONES: readonly ParticleTone[] = [
  { id: "warmIvory", core: "#fff6e8", mid: "#f0e2c4", deep: "#d9c49a", glow: "rgba(255, 246, 232, 0.42)" },
  { id: "candleWhite", core: "#fffdf8", mid: "#f7efe0", deep: "#e8dcc8", glow: "rgba(255, 253, 248, 0.4)" },
  { id: "softAmber", core: "#ffd48a", mid: "#e9a74a", deep: "#b46724", glow: "rgba(255, 212, 138, 0.45)" },
  { id: "goldenYellow", core: "#ffe27a", mid: "#f0c94a", deep: "#c99620", glow: "rgba(255, 226, 122, 0.44)" },
  { id: "peach", core: "#ffd2b0", mid: "#f0a878", deep: "#d07a4a", glow: "rgba(255, 210, 176, 0.42)" },
  { id: "warmOrange", core: "#ffb86a", mid: "#e8893a", deep: "#b85a18", glow: "rgba(255, 184, 106, 0.46)" },
  { id: "blushPink", core: "#ffc8c0", mid: "#f0a098", deep: "#d07068", glow: "rgba(255, 200, 192, 0.4)" },
  { id: "roseGold", core: "#f0c8a8", mid: "#d4a078", deep: "#b07850", glow: "rgba(240, 200, 168, 0.42)" },
  { id: "paleCoral", core: "#ffb8a0", mid: "#e88870", deep: "#c06048", glow: "rgba(255, 184, 160, 0.43)" },
  { id: "softRed", core: "#f0a090", mid: "#d07060", deep: "#a84838", glow: "rgba(240, 160, 144, 0.4)" },
];
