import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function valueNoise2D(x: number, y: number, perm: number[]): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = perm[perm[xi]! + yi]! & 255;
  const ab = perm[perm[xi]! + yi + 1]! & 255;
  const ba = perm[perm[xi + 1]! + yi]! & 255;
  const bb = perm[perm[xi + 1]! + yi + 1]! & 255;

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
  return lerp(x1, x2, v);
}

function buildPerm(seed: number): number[] {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = 255; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  return [...p, ...p];
}

function fbm(x: number, y: number, perm: number[], octaves: number, persistence: number): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2D(x * freq, y * freq, perm);
    norm += amp;
    amp *= persistence;
    freq *= 2;
  }
  return sum / norm;
}

function terrainColor(h: number): [number, number, number] {
  if (h < 0.35) {
    return [lerp(20, 40, h / 0.35), lerp(60, 100, h / 0.35), lerp(120, 160, h / 0.35)];
  }
  if (h < 0.55) {
    const t = (h - 0.35) / 0.2;
    return [lerp(40, 80, t), lerp(100, 140, t), lerp(60, 50, t)];
  }
  if (h < 0.75) {
    const t = (h - 0.55) / 0.2;
    return [lerp(80, 160, t), lerp(140, 170, t), lerp(50, 200, t)];
  }
  const t = (h - 0.75) / 0.25;
  return [lerp(160, 240, t), lerp(170, 245, t), lerp(200, 255, t)];
}

export const simplexTerrain: Exhibit = {
  id: "simplex-terrain",
  path: "/simplex-terrain",
  title: "Procedural Terrain",
  category: "Procedural",
  summary: "Fractal value-noise heightmap with hypsometric shading.",
  maths:
    "Height h(x,y) = Σᵢ aᵢ n(2ⁱx, 2ⁱy) is fractal Brownian motion built from smooth lattice noise n. " +
    "Despite the name, this uses classic value noise (Perlin-style interpolation); true simplex noise uses a triangular lattice for fewer directional artifacts.",
  params: [
    { id: "octaves", label: "Octaves", type: "number", min: 1, max: 8, step: 1 },
    { id: "scale", label: "Scale", type: "number", min: 0.002, max: 0.03, step: 0.001 },
    { id: "persistence", label: "Persistence", type: "number", min: 0.3, max: 0.7, step: 0.05 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 999, step: 1 },
    { id: "step", label: "Pixel step", type: "number", min: 1, max: 4, step: 1 },
    { id: "light", label: "Light angle", type: "number", min: 0, max: 360, step: 5 },
  ],
  defaults: {
    octaves: 5,
    scale: 0.008,
    persistence: 0.5,
    seed: 21,
    step: 2,
    light: 315,
  },
  width: 960,
  height: 720,
  exportFilename: "simplex-terrain.png",
  draw(ctx, width, height, values) {
    const octaves = values.octaves as number;
    const scale = values.scale as number;
    const persistence = values.persistence as number;
    const seed = values.seed as number;
    const step = values.step as number;
    const lightDeg = values.light as number;

    const perm = buildPerm(seed);
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const lightRad = (lightDeg * Math.PI) / 180;
    const lx = Math.cos(lightRad);
    const ly = Math.sin(lightRad);
    const sampleScale = scale * Math.min(width, height);

    for (let py = 0; py < height; py += step) {
      for (let px = 0; px < width; px += step) {
        const nx = px * sampleScale * 0.01;
        const ny = py * sampleScale * 0.01;
        const h = fbm(nx, ny, perm, octaves, persistence);
        const hNorm = clamp((h + 1) * 0.5, 0, 1);

        const eps = 0.5;
        const hx = fbm(nx + eps, ny, perm, octaves, persistence);
        const hy = fbm(nx, ny + eps, perm, octaves, persistence);
        const dzdx = (hx - h) / eps;
        const dzdy = (hy - h) / eps;
        const shade = clamp(0.55 + 0.45 * (lx * -dzdx + ly * -dzdy), 0.2, 1);

        const [r, g, b] = terrainColor(hNorm);
        const sr = clamp(Math.round(r * shade), 0, 255);
        const sg = clamp(Math.round(g * shade), 0, 255);
        const sb = clamp(Math.round(b * shade), 0, 255);

        for (let sy = 0; sy < step && py + sy < height; sy++) {
          for (let sx = 0; sx < step && px + sx < width; sx++) {
            const idx = ((py + sy) * width + (px + sx)) * 4;
            data[idx] = sr;
            data[idx + 1] = sg;
            data[idx + 2] = sb;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  },
};
