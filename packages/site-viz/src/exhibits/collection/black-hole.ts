import { clamp, lerp } from "@platform/math";
import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { paramsKey } from "../lib/simulation.js";

type Star = { x: number; y: number; hue: number; bright: number };

interface BlackHoleState {
  key: string;
  stars: Star[];
  bg: ImageData | null;
}

const stateMap = new WeakMap<CanvasRenderingContext2D, BlackHoleState>();

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildStarfield(width: number, height: number, count: number, seed: number): Star[] {
  const rand = seededRand(seed);
  const stars: Star[] = [];
  const pad = Math.max(width, height) * 0.6;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * (width + pad * 2) - pad,
      y: rand() * (height + pad * 2) - pad,
      hue: rand() * 60 + 200,
      bright: lerp(0.35, 1, rand() ** 2),
    });
  }
  return stars;
}

function rasterizeStars(width: number, height: number, stars: Star[]): ImageData {
  const image = new ImageData(width, height);
  const data = image.data;
  for (const star of stars) {
    const sx = Math.round(star.x);
    const sy = Math.round(star.y);
    if (sx < 0 || sx >= width || sy < 0 || sy >= height) {
      continue;
    }
    const idx = (sy * width + sx) * 4;
    const b = star.bright;
    const h = star.hue;
    const r = lerp(180, 255, b) * (0.6 + 0.4 * Math.sin((h * Math.PI) / 180));
    const g = lerp(160, 240, b);
    const bl = lerp(220, 255, b);
    data[idx] = clamp(r, 0, 255);
    data[idx + 1] = clamp(g, 0, 255);
    data[idx + 2] = clamp(bl, 0, 255);
    data[idx + 3] = 255;
    if (sx + 1 < width) {
      const idx2 = idx + 4;
      data[idx2] = data[idx]!;
      data[idx2 + 1] = data[idx + 1]!;
      data[idx2 + 2] = data[idx + 2]!;
      data[idx2 + 3] = 180;
    }
    if (sy + 1 < height) {
      const idx3 = idx + width * 4;
      data[idx3] = data[idx]!;
      data[idx3 + 1] = data[idx + 1]!;
      data[idx3 + 2] = data[idx + 2]!;
      data[idx3 + 3] = 180;
    }
  }
  return image;
}

function sampleBg(
  bg: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number, number] {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || ix >= width || iy < 0 || iy >= height) {
    return [4, 2, 12];
  }
  const idx = (iy * width + ix) * 4;
  const d = bg.data;
  return [d[idx]!, d[idx + 1]!, d[idx + 2]!];
}

function getState(
  ctx: CanvasRenderingContext2D,
  values: ParamValues,
  width: number,
  height: number,
): BlackHoleState {
  const key = paramsKey(values, ["stars", "seed"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key && existing.bg) {
    return existing;
  }
  const stars = buildStarfield(width, height, Number(values.stars), Number(values.seed));
  const state: BlackHoleState = {
    key,
    stars,
    bg: rasterizeStars(width, height, stars),
  };
  stateMap.set(ctx, state);
  return state;
}

export const blackHole: Exhibit = {
  id: "black-hole",
  path: "/black-hole",
  title: "Black Hole Lensing",
  category: "Simulation",
  summary:
    "A starfield warped by gravitational lensing around a singularity, with a glowing accretion disk.",
  maths:
    "In the weak-field limit, light deflection follows α ≈ 4GM/(c²b) for impact parameter b. " +
    "This exhibit approximates the inverse ray map r_src = r · (1 + M²/r²), magnifying background stars " +
    "into Einstein rings. Inside the Schwarzschild radius r_s = 2GM/c², no light escapes — the event horizon.",
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "black-hole.png",
  params: [
    { id: "mass", label: "Lens mass", type: "number", min: 0.3, max: 4, step: 0.1 },
    { id: "horizon", label: "Event horizon", type: "number", min: 8, max: 80, step: 2 },
    { id: "stars", label: "Star count", type: "number", min: 800, max: 6000, step: 200 },
    { id: "disk", label: "Accretion disk", type: "number", min: 0, max: 1, step: 0.05 },
    { id: "step", label: "Pixel step", type: "number", min: 1, max: 3, step: 1 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 999, step: 1 },
  ],
  defaults: {
    mass: 1.6,
    horizon: 28,
    stars: 3200,
    disk: 0.85,
    step: 2,
    seed: 42,
  },
  draw(ctx, width, height, values, time) {
    const mass = Number(values.mass);
    const horizon = Number(values.horizon);
    const disk = Number(values.disk);
    const step = Number(values.step);
    const state = getState(ctx, values, width, height);
    const bg = state.bg!;

    const cx = width * 0.5;
    const cy = height * 0.5;
    const massSq = mass * mass * 1200;

    const imageData = ctx.createImageData(width, height);
    const out = imageData.data;

    for (let py = 0; py < height; py += step) {
      for (let px = 0; px < width; px += step) {
        const dx = px - cx;
        const dy = py - cy;
        const r = Math.hypot(dx, dy) + 0.001;

        let rOut: number;
        let gOut: number;
        let bOut: number;

        if (r < horizon) {
          rOut = 0;
          gOut = 0;
          bOut = 0;
        } else {
          const warp = 1 + massSq / (r * r);
          const srcX = cx + dx * warp;
          const srcY = cy + dy * warp;
          [rOut, gOut, bOut] = sampleBg(bg, srcX, srcY, width, height);

          const ringDist = Math.abs(r - horizon * 1.35);
          const photonRing = Math.exp(-ringDist * 0.08) * disk;
          rOut = clamp(rOut + photonRing * 255, 0, 255);
          gOut = clamp(gOut + photonRing * 140, 0, 255);
          bOut = clamp(bOut + photonRing * 40, 0, 255);
        }

        for (let sy = 0; sy < step && py + sy < height; sy++) {
          for (let sx = 0; sx < step && px + sx < width; sx++) {
            const idx = ((py + sy) * width + (px + sx)) * 4;
            out[idx] = rOut;
            out[idx + 1] = gOut;
            out[idx + 2] = bOut;
            out[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    if (disk > 0.05) {
      const diskR = horizon * 1.55;
      const tilt = 0.35;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, tilt);
      const grad = ctx.createRadialGradient(0, 0, horizon, 0, 0, diskR * 1.4);
      grad.addColorStop(0, "rgba(255, 120, 30, 0)");
      grad.addColorStop(0.45, `rgba(255, 180, 60, ${0.15 * disk})`);
      grad.addColorStop(0.7, `rgba(255, 90, 20, ${0.35 * disk})`);
      grad.addColorStop(1, "rgba(80, 20, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, diskR * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(time * 0.4);
      ctx.strokeStyle = `rgba(255, 210, 120, ${0.5 * disk})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, diskR, diskR * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  },
};
