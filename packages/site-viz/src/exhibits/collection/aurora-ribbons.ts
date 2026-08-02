import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";
import { fadeCanvas } from "../lib/simulation.js";

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp1(a: number, b: number, t: number): number {
  return a + (b - a) * t;
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

  const x1 = lerp1(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
  const x2 = lerp1(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
  return lerp1(x1, x2, v);
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

type Ribbon = { phase: number; baseY: number; hue: number; amp: number };

function initRibbons(count: number, height: number, seed: number): Ribbon[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    phase: rand() * Math.PI * 2,
    baseY: height * (0.15 + (i / Math.max(count - 1, 1)) * 0.55),
    hue: lerp(120, 280, rand()),
    amp: lerp(30, 90, rand()),
  }));
}

export const auroraRibbons: Exhibit = {
  id: "aurora-ribbons",
  path: "/aurora-ribbons",
  title: "Aurora Ribbons",
  category: "Waves",
  summary:
    "Flowing curtains of light drift across a polar sky, driven by layered sine and noise modulation.",
  maths:
    "Auroral arcs follow Earth's magnetic field lines; visually they resemble modulated ribbons y(x,t) = y₀ + A sin(kx − ωt + φ) + η(x,t), " +
    "where η is turbulent noise. Layering multiple ribbons with additive blending mimics the green–violet emission of excited atmospheric gases.",
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "aurora-ribbons.png",
  params: [
    { id: "ribbons", label: "Ribbon count", type: "number", min: 3, max: 12, step: 1 },
    { id: "speed", label: "Drift speed", type: "number", min: 0.2, max: 2.5, step: 0.1 },
    { id: "wave", label: "Wave scale", type: "number", min: 0.003, max: 0.015, step: 0.001 },
    { id: "noise", label: "Turbulence", type: "number", min: 0, max: 1, step: 0.05 },
    { id: "fade", label: "Trail fade", type: "number", min: 0.04, max: 0.2, step: 0.01 },
    { id: "glow", label: "Glow intensity", type: "number", min: 0.3, max: 1, step: 0.05 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 999, step: 1 },
  ],
  defaults: {
    ribbons: 7,
    speed: 0.9,
    wave: 0.008,
    noise: 0.55,
    fade: 0.08,
    glow: 0.75,
    seed: 17,
  },
  draw(ctx, width, height, values, time) {
    const ribbonCount = values.ribbons as number;
    const speed = values.speed as number;
    const waveScale = values.wave as number;
    const noiseAmt = values.noise as number;
    const fadeAmt = values.fade as number;
    const glow = values.glow as number;
    const seed = values.seed as number;

    const store = auroraRibbons as Exhibit & {
      _state?: { ribbons: Ribbon[]; perm: number[]; lastSeed: number; lastCount: number };
    };
    if (!store._state || store._state.lastSeed !== seed || store._state.lastCount !== ribbonCount) {
      store._state = {
        ribbons: initRibbons(ribbonCount, height, seed),
        perm: buildPerm(seed),
        lastSeed: seed,
        lastCount: ribbonCount,
      };
    }
    const { ribbons, perm } = store._state;

    fadeCanvas(ctx, width, height, fadeAmt, "rgb(2, 4, 14)");

    const stars = 120;
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let i = 0; i < stars; i++) {
      const sx = (i * 7919) % width;
      const sy = (i * 6271) % (height * 0.45);
      const twinkle = 0.4 + 0.6 * Math.sin(time * 1.5 + i * 0.7);
      ctx.globalAlpha = twinkle * 0.5;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = "lighter";

    for (let r = 0; r < ribbons.length; r++) {
      const ribbon = ribbons[r]!;
      const t = time * speed + ribbon.phase;

      ctx.beginPath();
      let first = true;
      for (let x = 0; x <= width; x += 6) {
        const n = valueNoise2D(x * 0.004, t * 0.35 + r * 2, perm) * noiseAmt;
        const y =
          ribbon.baseY +
          ribbon.amp * Math.sin(x * waveScale * Math.PI * 2 + t) +
          n * ribbon.amp * 1.4 +
          Math.sin(t * 0.6 + x * 0.002) * 12;
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      for (let x = width; x >= 0; x -= 6) {
        const n = valueNoise2D(x * 0.004 + 50, t * 0.35 + r * 2 + 10, perm) * noiseAmt;
        const y =
          ribbon.baseY +
          ribbon.amp * Math.sin(x * waveScale * Math.PI * 2 + t) +
          n * ribbon.amp * 1.4 +
          Math.sin(t * 0.6 + x * 0.002) * 12 +
          28 +
          Math.sin(x * 0.01 + t) * 8;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      const hue = ribbon.hue + Math.sin(t * 0.3) * 15;
      const grad = ctx.createLinearGradient(0, ribbon.baseY - 60, 0, ribbon.baseY + 120);
      grad.addColorStop(0, `hsla(${hue}, 80%, 55%, 0)`);
      grad.addColorStop(0.35, `hsla(${hue + 20}, 90%, 60%, ${0.25 * glow})`);
      grad.addColorStop(0.55, `hsla(${hue + 60}, 85%, 65%, ${0.45 * glow})`);
      grad.addColorStop(1, `hsla(${hue + 100}, 70%, 40%, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue + 40}, 95%, 75%, ${0.35 * glow})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      first = true;
      for (let x = 0; x <= width; x += 4) {
        const n = valueNoise2D(x * 0.004, t * 0.35 + r * 2, perm) * noiseAmt;
        const y =
          ribbon.baseY +
          ribbon.amp * Math.sin(x * waveScale * Math.PI * 2 + t) +
          n * ribbon.amp * 1.4 +
          Math.sin(t * 0.6 + x * 0.002) * 12;
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";

    const horizon = ctx.createLinearGradient(0, height * 0.7, 0, height);
    horizon.addColorStop(0, "rgba(2, 8, 20, 0)");
    horizon.addColorStop(1, "rgba(1, 3, 8, 0.85)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    const shimmer = clamp(0.15 + Math.sin(time * 0.8) * 0.05, 0, 1);
    ctx.fillStyle = `rgba(80, 200, 140, ${shimmer * glow * 0.08})`;
    ctx.fillRect(0, 0, width, height * 0.12);
  },
};
