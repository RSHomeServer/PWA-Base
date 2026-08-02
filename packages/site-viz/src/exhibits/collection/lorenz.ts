import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { fadeCanvas, paramsKey } from "../lib/simulation.js";

interface LorenzState {
  key: string;
  points: { x: number; y: number; z: number }[];
}

const stateMap = new WeakMap<CanvasRenderingContext2D, LorenzState>();

function getState(ctx: CanvasRenderingContext2D, values: ParamValues): LorenzState {
  const key = paramsKey(values, ["sigma", "rho", "beta", "dt", "steps"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key) {
    return existing;
  }

  const state: LorenzState = { key, points: [] };
  stateMap.set(ctx, state);
  return state;
}

export const lorenzExhibit: Exhibit = {
  id: "lorenz",
  path: "/lorenz",
  title: "Lorenz Attractor",
  category: "Systems",
  summary:
    "A chaotic butterfly-shaped trajectory from three coupled nonlinear ODEs, traced over time.",
  maths:
    "The Lorenz system ẋ = σ(y − x), ẏ = x(ρ − z) − y, ż = xy − βz was derived from atmospheric convection. " +
    "For classic parameters (σ = 10, ρ = 28, β = 8/3) trajectories never repeat yet stay on a strange attractor. " +
    "Small changes in initial conditions diverge exponentially — a hallmark of chaos.",
  animated: true,
  params: [
    {
      id: "sigma",
      type: "number",
      label: "σ (sigma)",
      min: 5,
      max: 20,
      step: 0.5,
    },
    {
      id: "rho",
      type: "number",
      label: "ρ (rho)",
      min: 10,
      max: 40,
      step: 0.5,
    },
    {
      id: "beta",
      type: "number",
      label: "β (beta)",
      min: 1,
      max: 4,
      step: 0.1,
    },
    {
      id: "dt",
      type: "number",
      label: "Time step",
      min: 0.001,
      max: 0.02,
      step: 0.001,
    },
    {
      id: "steps",
      type: "number",
      label: "Steps per frame",
      min: 1,
      max: 20,
      step: 1,
    },
    {
      id: "trail",
      type: "number",
      label: "Trail length",
      min: 500,
      max: 8000,
      step: 500,
    },
  ],
  defaults: {
    sigma: 10,
    rho: 28,
    beta: 2.667,
    dt: 0.005,
    steps: 8,
    trail: 4000,
  },
  exportFilename: "lorenz.png",
  draw(ctx, width, height, values, time) {
    const sigma = Number(values.sigma);
    const rho = Number(values.rho);
    const beta = Number(values.beta);
    const dt = Number(values.dt);
    const steps = Number(values.steps);
    const trail = Number(values.trail);

    const state = getState(ctx, values);
    if (state.points.length === 0) {
      state.points.push({ x: 0.1, y: 0, z: 0 });
    }

    fadeCanvas(ctx, width, height, 0.08, "rgb(6, 8, 18)");

    let { x, y, z } = state.points[state.points.length - 1]!;
    for (let s = 0; s < steps; s++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
      x += dx * dt;
      y += dy * dt;
      z += dz * dt;
      state.points.push({ x, y, z });
    }

    if (state.points.length > trail) {
      state.points.splice(0, state.points.length - trail);
    }

    const scale = Math.min(width, height) * 0.012;
    const cx = width * 0.5;
    const cy = height * 0.55;
    const rot = time * 0.15;

    ctx.lineWidth = 1.2;
    for (let i = 1; i < state.points.length; i++) {
      const a = state.points[i - 1]!;
      const b = state.points[i]!;
      const ax = a.x * Math.cos(rot) - a.z * Math.sin(rot);
      const bx = b.x * Math.cos(rot) - b.z * Math.sin(rot);
      const t = i / state.points.length;
      ctx.strokeStyle = `hsla(${200 + t * 80}, 85%, ${45 + t * 25}%, ${0.35 + t * 0.55})`;
      ctx.beginPath();
      ctx.moveTo(cx + ax * scale, cy - a.y * scale);
      ctx.lineTo(cx + bx * scale, cy - b.y * scale);
      ctx.stroke();
    }
  },
};
