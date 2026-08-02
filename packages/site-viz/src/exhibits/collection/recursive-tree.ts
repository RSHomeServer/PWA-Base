import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

function drawBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number,
  depth: number,
  branchAngle: number,
  shrink: number,
  time: number,
  wind: boolean,
  windStrength: number,
): void {
  if (depth <= 0 || length < 1.5) {
    return;
  }

  const sway = wind ? Math.sin(time * 1.5 + depth * 0.4) * windStrength * (6 - depth) * 0.02 : 0;
  const a = angle + sway;
  const x2 = x + Math.cos(a) * length;
  const y2 = y + Math.sin(a) * length;

  const t = 1 - depth / 10;
  const hue = lerp(25, 95, clamp(t, 0, 1));
  const light = lerp(35, 55, clamp(t, 0, 1));
  ctx.strokeStyle = `hsl(${hue}, 45%, ${light}%)`;
  ctx.lineWidth = clamp(depth * 0.9, 0.8, 8);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const nextLen = length * shrink;
  drawBranch(
    ctx,
    x2,
    y2,
    nextLen,
    a - branchAngle,
    depth - 1,
    branchAngle,
    shrink,
    time,
    wind,
    windStrength,
  );
  drawBranch(
    ctx,
    x2,
    y2,
    nextLen,
    a + branchAngle,
    depth - 1,
    branchAngle,
    shrink,
    time,
    wind,
    windStrength,
  );
}

function expandLSystem(axiom: string, rules: Record<string, string>, iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of current) {
      next += rules[ch] ?? ch;
    }
    current = next;
  }
  return current;
}

function drawLSystemTree(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  instructions: string,
  angleDeg: number,
  step: number,
  time: number,
  wind: boolean,
  windStrength: number,
): void {
  const stack: { x: number; y: number; angle: number; width: number }[] = [];
  let x = width / 2;
  let y = height - 40;
  let angle = -Math.PI / 2;
  let lw = 6;
  const turn = (angleDeg * Math.PI) / 180;
  const swayBase = wind ? Math.sin(time) * windStrength * 0.03 : 0;

  for (const ch of instructions) {
    if (ch === "F" || ch === "G") {
      const a = angle + swayBase;
      const nx = x + Math.cos(a) * step;
      const ny = y + Math.sin(a) * step;
      ctx.strokeStyle = `hsl(${lerp(30, 100, lw / 6)}, 40%, ${lerp(30, 50, lw / 6)}%)`;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      x = nx;
      y = ny;
    } else if (ch === "+") {
      angle += turn;
    } else if (ch === "-") {
      angle -= turn;
    } else if (ch === "[") {
      stack.push({ x, y, angle, width: lw });
      lw = Math.max(lw * 0.72, 0.5);
    } else if (ch === "]") {
      const state = stack.pop();
      if (state) {
        x = state.x;
        y = state.y;
        angle = state.angle;
        lw = state.width;
      }
    }
  }
}

export const recursiveTree: Exhibit = {
  id: "recursive-tree",
  path: "/recursive-tree",
  title: "Recursive Tree",
  category: "Procedural",
  summary: "Branching fractal tree with optional wind sway or L-system foliage.",
  maths:
    "A binary tree branches with angle θ and length scaled by r at each depth d: L_d = L₀ r^d. " +
    "L-systems encode self-similar growth as string rewriting (e.g. F → F[+F]F[-F]F), then interpret F as forward, ± as turn.",
  params: [
    {
      id: "mode",
      label: "Mode",
      type: "select",
      options: [
        { value: "recursive", label: "Recursive" },
        { value: "lsystem", label: "L-system" },
      ],
    },
    { id: "depth", label: "Depth / iterations", type: "number", min: 1, max: 12, step: 1 },
    { id: "angle", label: "Branch angle", type: "number", min: 10, max: 60, step: 1 },
    { id: "length", label: "Trunk length", type: "number", min: 40, max: 180, step: 5 },
    { id: "shrink", label: "Length shrink", type: "number", min: 0.55, max: 0.85, step: 0.01 },
    { id: "wind", label: "Wind sway", type: "boolean" },
    { id: "windStrength", label: "Wind strength", type: "number", min: 0, max: 3, step: 0.1 },
  ],
  defaults: {
    mode: "recursive",
    depth: 9,
    angle: 26,
    length: 120,
    shrink: 0.72,
    wind: true,
    windStrength: 1.2,
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "recursive-tree.png",
  draw(ctx, width, height, values, time) {
    const mode = values.mode as string;
    const depth = values.depth as number;
    const angle = values.angle as number;
    const length = values.length as number;
    const shrink = values.shrink as number;
    const wind = values.wind as boolean;
    const windStrength = values.windStrength as number;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#334155";
    ctx.fillRect(0, height - 30, width, 30);

    ctx.lineCap = "round";

    if (mode === "lsystem") {
      const rules = { F: "F[+F][-F]F" };
      const instr = expandLSystem("F", rules, clamp(depth, 1, 6));
      drawLSystemTree(ctx, width, height, instr, angle, 4, time, wind, windStrength);
    } else {
      const branchAngle = (angle * Math.PI) / 180;
      drawBranch(
        ctx,
        width / 2,
        height - 30,
        length,
        -Math.PI / 2,
        depth,
        branchAngle,
        shrink,
        time,
        wind,
        windStrength,
      );
    }
  },
};
