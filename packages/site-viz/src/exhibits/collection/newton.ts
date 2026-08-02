import type { Exhibit } from "../types.js";
import { mapPixelToComplex } from "../lib/fractal.js";
import { heatPalette } from "../lib/palette.js";

const ROOTS = [
  { re: 1, im: 0 },
  { re: -0.5, im: 0.8660254 },
  { re: -0.5, im: -0.8660254 },
];

function iterateNewton(re: number, im: number, maxIter: number): number {
  let zr = re;
  let zi = im;

  for (let i = 0; i < maxIter; i++) {
    const z2r = zr * zr - zi * zi;
    const z2i = 2 * zr * zi;
    const z3r = z2r * zr - z2i * zi;
    const z3i = z2r * zi + z2i * zr;

    const denom = 3 * (z2r * z2r + z2i * z2i);
    if (denom < 1e-12) {
      return i;
    }

    const numR = z3r - 1;
    const numI = z3i;
    const fracR = (numR * z2r + numI * z2i) / denom;
    const fracI = (numI * z2r - numR * z2i) / denom;

    zr -= fracR;
    zi -= fracI;

    let minDist = Infinity;
    for (const root of ROOTS) {
      const dr = zr - root.re;
      const di = zi - root.im;
      minDist = Math.min(minDist, dr * dr + di * di);
    }
    if (minDist < 1e-6) {
      return i;
    }
  }

  return maxIter;
}

function rootIndex(re: number, im: number): number {
  let best = 0;
  let minDist = Infinity;
  for (let i = 0; i < ROOTS.length; i++) {
    const root = ROOTS[i]!;
    const dr = re - root.re;
    const di = im - root.im;
    const dist = dr * dr + di * di;
    if (dist < minDist) {
      minDist = dist;
      best = i;
    }
  }
  return best;
}

const ROOT_COLORS: [number, number, number][] = [
  [255, 90, 120],
  [80, 220, 160],
  [100, 160, 255],
];

export const newtonExhibit: Exhibit = {
  id: "newton",
  path: "/newton",
  title: "Newton Fractal",
  category: "Fractals",
  summary:
    "Basins of attraction for Newton's method on z³ − 1, coloured by which root each seed converges to.",
  maths:
    "Newton's method iterates z ← z − f(z)/f′(z). For f(z) = z³ − 1 the roots are the cube roots of unity. " +
    "Each starting point is drawn toward one root; the boundary between basins is a fractal. " +
    "Points on the boundary take many iterations — shading by iteration count reveals filigree structure.",
  params: [
    {
      id: "zoom",
      type: "number",
      label: "Zoom",
      min: 0.5,
      max: 20,
      step: 0.5,
    },
    {
      id: "centerRe",
      type: "number",
      label: "Centre (real)",
      min: -2,
      max: 2,
      step: 0.05,
    },
    {
      id: "centerIm",
      type: "number",
      label: "Centre (imaginary)",
      min: -2,
      max: 2,
      step: 0.05,
    },
    {
      id: "maxIter",
      type: "number",
      label: "Max iterations",
      min: 8,
      max: 64,
      step: 4,
    },
  ],
  defaults: {
    zoom: 1,
    centerRe: 0,
    centerIm: 0,
    maxIter: 32,
  },
  exportFilename: "newton.png",
  draw(ctx, width, height, values) {
    const zoom = Number(values.zoom);
    const centerRe = Number(values.centerRe);
    const centerIm = Number(values.centerIm);
    const maxIter = Number(values.maxIter);
    const view = { centerRe, centerIm, span: 3.5 / zoom };

    const imageData = ctx.createImageData(width, height);
    const { data } = imageData;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const { re, im } = mapPixelToComplex(px, py, width, height, view);
        const iter = iterateNewton(re, im, maxIter);
        const idx = rootIndex(re, im);
        const base = ROOT_COLORS[idx] ?? [200, 200, 200];
        const shade = heatPalette(iter / maxIter);
        const r = Math.floor(base[0] * 0.55 + shade[0] * 0.45);
        const g = Math.floor(base[1] * 0.55 + shade[1] * 0.45);
        const b = Math.floor(base[2] * 0.55 + shade[2] * 0.45);
        const offset = (py * width + px) * 4;
        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
        data[offset + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  },
};
