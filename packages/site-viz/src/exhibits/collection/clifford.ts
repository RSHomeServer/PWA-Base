import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { fadeCanvas, paramsKey } from "../lib/simulation.js";

interface CliffordState {
  key: string;
  points: { x: number; y: number }[];
}

const stateMap = new WeakMap<CanvasRenderingContext2D, CliffordState>();

function getState(ctx: CanvasRenderingContext2D, values: ParamValues): CliffordState {
  const key = paramsKey(values, ["a", "b", "c", "d", "iterations"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key) {
    return existing;
  }

  const state: CliffordState = { key, points: [{ x: 0.1, y: 0.1 }] };
  stateMap.set(ctx, state);
  return state;
}

export const cliffordExhibit: Exhibit = {
  id: "clifford",
  path: "/clifford",
  title: "Clifford Attractor",
  category: "Systems",
  summary:
    "A strange attractor from a simple iterated trigonometric map, building dense swirling structure.",
  maths:
    "The Clifford map updates (x, y) ← (sin(a y) + c cos(a x), sin(b x) + d cos(b y)). " +
    "With parameters near a = −1.4, b = 1.6, c = 1.0, d = 0.7 the orbit fills a fractal-like set. " +
    "Each frame adds more points, revealing the attractor's layered symmetry.",
  animated: true,
  params: [
    {
      id: "a",
      type: "number",
      label: "a",
      min: -2,
      max: 2,
      step: 0.05,
    },
    {
      id: "b",
      type: "number",
      label: "b",
      min: -2,
      max: 2,
      step: 0.05,
    },
    {
      id: "c",
      type: "number",
      label: "c",
      min: -2,
      max: 2,
      step: 0.05,
    },
    {
      id: "d",
      type: "number",
      label: "d",
      min: -2,
      max: 2,
      step: 0.05,
    },
    {
      id: "iterations",
      type: "number",
      label: "Points per frame",
      min: 100,
      max: 3000,
      step: 100,
    },
  ],
  defaults: {
    a: -1.4,
    b: 1.6,
    c: 1,
    d: 0.7,
    iterations: 800,
  },
  exportFilename: "clifford.png",
  draw(ctx, width, height, values) {
    const a = Number(values.a);
    const b = Number(values.b);
    const c = Number(values.c);
    const d = Number(values.d);
    const iterations = Number(values.iterations);

    const state = getState(ctx, values);
    fadeCanvas(ctx, width, height, 0.04, "rgb(4, 6, 16)");

    let { x, y } = state.points[state.points.length - 1]!;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const scale = Math.min(width, height) * 0.22;

    for (let i = 0; i < iterations; i++) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      const px = cx + x * scale;
      const py = cy + y * scale;
      const hue = 260 + (nx + ny) * 40;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.35)`;
      ctx.fillRect(px, py, 1.5, 1.5);
      x = nx;
      y = ny;
    }

    state.points.push({ x, y });
    if (state.points.length > 2) {
      state.points.splice(0, state.points.length - 2);
    }
  },
};
