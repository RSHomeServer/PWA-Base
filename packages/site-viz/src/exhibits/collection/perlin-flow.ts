import { clamp } from "@platform/math";
import type { Exhibit } from "../types.js";

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

function fbm(x: number, y: number, perm: number[], octaves: number): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2D(x * freq, y * freq, perm);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

type Particle = { x: number; y: number; age: number };

function spawnParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    age: 0,
  };
}

export const perlinFlow: Exhibit = {
  id: "perlin-flow",
  path: "/perlin-flow",
  title: "Perlin Flow Field",
  category: "Particles",
  summary: "Particles trace streamlines through a smooth value-noise velocity field.",
  maths:
    "A flow field assigns a velocity v(x) = ∇⊥ψ where ψ is scalar noise. " +
    "Value noise blends random gradients on a lattice with smooth interpolation (Perlin fade). " +
    "Particles integrate dx/dt = v(x), revealing hidden structure in turbulent-looking fields.",
  params: [
    { id: "particles", label: "Particles", type: "number", min: 100, max: 3000, step: 50 },
    { id: "scale", label: "Noise scale", type: "number", min: 0.002, max: 0.02, step: 0.001 },
    { id: "speed", label: "Speed", type: "number", min: 0.5, max: 6, step: 0.1 },
    { id: "octaves", label: "Octaves", type: "number", min: 1, max: 5, step: 1 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 999, step: 1 },
    { id: "trailFade", label: "Trail fade", type: "number", min: 0.02, max: 0.3, step: 0.01 },
  ],
  defaults: {
    particles: 1200,
    scale: 0.006,
    speed: 2.5,
    octaves: 3,
    seed: 13,
    trailFade: 0.08,
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "perlin-flow.png",
  draw(ctx, width, height, values, time) {
    const count = values.particles as number;
    const scale = values.scale as number;
    const speed = values.speed as number;
    const octaves = values.octaves as number;
    const seed = values.seed as number;
    const trailFade = values.trailFade as number;

    const store = perlinFlow as Exhibit & {
      _state?: { particles: Particle[]; perm: number[]; lastSeed: number; lastCount: number };
    };
    if (!store._state || store._state.lastSeed !== seed) {
      store._state = { particles: [], perm: buildPerm(seed), lastSeed: seed, lastCount: 0 };
    }
    const state = store._state;
    if (state.lastCount !== count) {
      state.particles = Array.from({ length: count }, () => spawnParticle(width, height));
      state.lastCount = count;
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = `rgba(11, 16, 32, ${trailFade})`;
    ctx.fillRect(0, 0, width, height);

    const perm = state.perm;
    const t = time * 0.15;

    for (const p of state.particles) {
      const nx = p.x * scale + t;
      const ny = p.y * scale + t * 0.7;
      const n = fbm(nx, ny, perm, octaves);
      const angle = n * Math.PI * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const hue = clamp(180 + n * 80, 0, 360);
      ctx.strokeStyle = `hsla(${hue}, 75%, 62%, 0.35)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      p.x += vx;
      p.y += vy;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      p.age += 1;
      if (p.x < 0 || p.x > width || p.y < 0 || p.y > height || p.age > 400) {
        Object.assign(p, spawnParticle(width, height));
      }
    }
  },
};
