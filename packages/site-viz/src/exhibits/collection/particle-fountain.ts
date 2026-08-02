import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { paramsKey } from "../lib/simulation.js";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface FountainState {
  key: string;
  particles: Particle[];
}

const stateMap = new WeakMap<CanvasRenderingContext2D, FountainState>();

function getState(ctx: CanvasRenderingContext2D, values: ParamValues): FountainState {
  const key = paramsKey(values, ["spawnRate", "gravity", "spread", "wind"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key) {
    return existing;
  }

  const state: FountainState = { key, particles: [] };
  stateMap.set(ctx, state);
  return state;
}

function spawnParticle(width: number, spread: number, wind: number): Particle {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
  const speed = 6 + Math.random() * 6;
  return {
    x: width * 0.5 + (Math.random() - 0.5) * 20,
    y: 0,
    vx: Math.cos(angle) * speed + wind,
    vy: Math.sin(angle) * speed,
    life: 1,
  };
}

export const particleFountainExhibit: Exhibit = {
  id: "particle-fountain",
  path: "/particle-fountain",
  title: "Particle Fountain",
  category: "Particles",
  summary:
    "A continuous spray of particles arcing under gravity — tweak spread, wind, and spawn rate.",
  maths:
    "Each particle follows Newtonian kinematics: position integrates velocity, velocity integrates acceleration. " +
    "Gravity pulls downward while initial velocity is sampled from a cone above the spout. " +
    "Stochastic spread produces the turbulent plume shape.",
  animated: true,
  params: [
    {
      id: "spawnRate",
      type: "number",
      label: "Spawn rate",
      min: 1,
      max: 20,
      step: 1,
    },
    {
      id: "gravity",
      type: "number",
      label: "Gravity",
      min: 0.05,
      max: 0.5,
      step: 0.05,
    },
    {
      id: "spread",
      type: "number",
      label: "Spray spread",
      min: 0.2,
      max: 1.2,
      step: 0.05,
    },
    {
      id: "wind",
      type: "number",
      label: "Wind",
      min: -3,
      max: 3,
      step: 0.1,
    },
  ],
  defaults: {
    spawnRate: 8,
    gravity: 0.18,
    spread: 0.6,
    wind: 0.4,
  },
  exportFilename: "particle-fountain.png",
  draw(ctx, width, height, values, time) {
    const spawnRate = Number(values.spawnRate);
    const gravity = Number(values.gravity);
    const spread = Number(values.spread);
    const wind = Number(values.wind);
    const state = getState(ctx, values);

    ctx.fillStyle = "rgba(4, 6, 16, 0.25)";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < spawnRate; i++) {
      state.particles.push(spawnParticle(width, spread, wind));
    }

    const groundY = height * 0.88;
    const remaining: Particle[] = [];

    for (const p of state.particles) {
      p.vy += gravity;
      p.vx += wind * 0.01;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.008;

      if (p.y >= groundY || p.life <= 0 || p.x < -20 || p.x > width + 20) {
        continue;
      }

      const hue = 200 + (p.vy + 8) * 8 + Math.sin(time + p.x * 0.01) * 20;
      ctx.fillStyle = `hsla(${hue}, 85%, 55%, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + p.life * 2, 0, Math.PI * 2);
      ctx.fill();
      remaining.push(p);
    }

    state.particles = remaining.slice(-800);

    ctx.fillStyle = "rgb(30, 35, 50)";
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = "rgb(80, 120, 200)";
    ctx.fillRect(width * 0.5 - 12, groundY - 8, 24, 8);
  },
};
