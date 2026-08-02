import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { paramsKey } from "../lib/simulation.js";

interface RdState {
  key: string;
  cols: number;
  rows: number;
  a: Float32Array;
  b: Float32Array;
  nextA: Float32Array;
  nextB: Float32Array;
}

const stateMap = new WeakMap<CanvasRenderingContext2D, RdState>();

function seedPattern(cols: number, rows: number, a: Float32Array, b: Float32Array): void {
  a.fill(1);
  b.fill(0);
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const r = Math.min(cols, rows) * 0.08;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < r * r) {
        b[y * cols + x] = 1;
      }
    }
  }
}

function getState(ctx: CanvasRenderingContext2D, values: ParamValues): RdState {
  const cols = 240;
  const rows = 180;
  const key = paramsKey(values, ["feed", "kill", "diffA", "diffB"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key) {
    return existing;
  }

  const a = new Float32Array(cols * rows);
  const b = new Float32Array(cols * rows);
  seedPattern(cols, rows, a, b);
  const state: RdState = {
    key,
    cols,
    rows,
    a,
    b,
    nextA: new Float32Array(cols * rows),
    nextB: new Float32Array(cols * rows),
  };
  stateMap.set(ctx, state);
  return state;
}

function laplacian(field: Float32Array, cols: number, rows: number, x: number, y: number): number {
  const idx = y * cols + x;
  const left = field[y * cols + ((x - 1 + cols) % cols)]!;
  const right = field[y * cols + ((x + 1) % cols)]!;
  const up = field[((y - 1 + rows) % rows) * cols + x]!;
  const down = field[((y + 1) % rows) * cols + x]!;
  return left + right + up + down - 4 * field[idx]!;
}

function stepReactionDiffusion(
  state: RdState,
  feed: number,
  kill: number,
  diffA: number,
  diffB: number,
): void {
  const { cols, rows, a, b, nextA, nextB } = state;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const aa = a[idx]!;
      const bb = b[idx]!;
      const reaction = aa * bb * bb;
      nextA[idx] = aa + diffA * laplacian(a, cols, rows, x, y) - reaction + feed * (1 - aa);
      nextB[idx] = bb + diffB * laplacian(b, cols, rows, x, y) + reaction - (kill + feed) * bb;
    }
  }
  a.set(nextA);
  b.set(nextB);
}

export const reactionDiffusionExhibit: Exhibit = {
  id: "reaction-diffusion",
  path: "/reaction-diffusion",
  title: "Reaction–Diffusion",
  category: "Simulation",
  summary: "Gray–Scott spots and stripes emerge from two diffusing chemicals reacting on a torus.",
  maths:
    "The Gray–Scott model evolves concentrations u and v: ∂u/∂t = Du∇²u − uv² + f(1−u), " +
    "∂v/∂t = Dv∇²v + uv² − (f+k)v. Feed rate f and kill rate k select morphologies — mitosis, coral, worms, or mazes.",
  animated: true,
  width: 960,
  height: 720,
  params: [
    {
      id: "feed",
      type: "number",
      label: "Feed (f)",
      min: 0.01,
      max: 0.08,
      step: 0.001,
    },
    {
      id: "kill",
      type: "number",
      label: "Kill (k)",
      min: 0.03,
      max: 0.07,
      step: 0.001,
    },
    {
      id: "diffA",
      type: "number",
      label: "Diffusion A",
      min: 0.2,
      max: 1.2,
      step: 0.05,
    },
    {
      id: "diffB",
      type: "number",
      label: "Diffusion B",
      min: 0.05,
      max: 0.6,
      step: 0.01,
    },
    {
      id: "steps",
      type: "number",
      label: "Steps per frame",
      min: 1,
      max: 10,
      step: 1,
    },
  ],
  defaults: {
    feed: 0.055,
    kill: 0.062,
    diffA: 1,
    diffB: 0.5,
    steps: 4,
  },
  exportFilename: "reaction-diffusion.png",
  draw(ctx, width, height, values) {
    const feed = Number(values.feed);
    const kill = Number(values.kill);
    const diffA = Number(values.diffA);
    const diffB = Number(values.diffB);
    const steps = Number(values.steps);
    const state = getState(ctx, values);

    for (let s = 0; s < steps; s++) {
      stepReactionDiffusion(state, feed, kill, diffA, diffB);
    }

    const imageData = ctx.createImageData(state.cols, state.rows);
    const { data } = imageData;
    for (let i = 0; i < state.a.length; i++) {
      const v = state.b[i]!;
      const r = Math.floor(20 + v * 180);
      const g = Math.floor(40 + v * 120);
      const b = Math.floor(80 + (1 - v) * 140);
      const offset = i * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = state.cols;
    offscreen.height = state.rows;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) {
      return;
    }
    offCtx.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offscreen, 0, 0, width, height);
  },
};
