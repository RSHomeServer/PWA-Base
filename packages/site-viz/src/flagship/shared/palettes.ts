import { clamp } from "@platform/math";

export type Rgb = [number, number, number];

function toByte(v: number): number {
  return clamp(Math.round(v * 255), 0, 255);
}

/** Inigo Quilez style cosine palette — cheap, smooth, endlessly tunable gradients. */
export function cosinePalette(t: number, a: Rgb, b: Rgb, c: Rgb, d: Rgb): Rgb {
  return [
    toByte(a[0] + b[0] * Math.cos(6.28318 * (c[0] * t + d[0]))),
    toByte(a[1] + b[1] * Math.cos(6.28318 * (c[1] * t + d[1]))),
    toByte(a[2] + b[2] * Math.cos(6.28318 * (c[2] * t + d[2]))),
  ];
}

/** Named cosine-palette presets for fractal explorers. */
export const FRACTAL_PALETTES: Record<string, (t: number) => Rgb> = {
  Nebula: (t) =>
    cosinePalette(t, [0.5, 0.4, 0.6], [0.5, 0.4, 0.5], [1, 0.9, 0.6], [0.0, 0.15, 0.55]),
  Ember: (t) =>
    cosinePalette(t, [0.6, 0.3, 0.2], [0.5, 0.4, 0.3], [1.0, 0.9, 0.6], [0.0, 0.1, 0.25]),
  Ocean: (t) =>
    cosinePalette(t, [0.2, 0.45, 0.55], [0.3, 0.4, 0.5], [0.9, 0.7, 0.5], [0.3, 0.35, 0.4]),
  Emerald: (t) =>
    cosinePalette(t, [0.3, 0.5, 0.4], [0.3, 0.4, 0.3], [0.9, 0.8, 0.6], [0.2, 0.4, 0.3]),
  Mono: (t) => cosinePalette(t, [0.55, 0.55, 0.58], [0.45, 0.45, 0.45], [1, 1, 1], [0, 0.08, 0.18]),
};

export const FRACTAL_PALETTE_NAMES = Object.keys(FRACTAL_PALETTES);

export function rgbToCss([r, g, b]: Rgb, alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
