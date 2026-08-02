import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

function hilbertIndexToXY(index: number, order: number): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let t = index;
  let s = 1;
  const n = 1 << order;

  while (s < n) {
    const rx = 1 & (t / 2);
    const ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      [x, y] = [y, x];
    }
    x += s * rx;
    y += s * ry;
    t = Math.floor(t / 4);
    s *= 2;
  }
  return { x, y };
}

export const hilbertCurve: Exhibit = {
  id: "hilbert-curve",
  path: "/hilbert-curve",
  title: "Hilbert Curve",
  category: "Fractals",
  summary: "A space-filling curve that visits every cell in a grid exactly once.",
  maths:
    "The Hilbert curve is a continuous surjection [0,1] → [0,1]² built by recursively replacing a line segment with a rotated copy of itself. " +
    "Order n has 4ⁿ points and fills a 2ⁿ × 2ⁿ grid. It preserves locality: nearby indices map to nearby points.",
  params: [
    { id: "order", label: "Order", type: "number", min: 1, max: 8, step: 1 },
    { id: "lineWidth", label: "Line width", type: "number", min: 0.5, max: 6, step: 0.5 },
    { id: "padding", label: "Padding", type: "number", min: 10, max: 80, step: 5 },
    {
      id: "colorMode",
      label: "Color",
      type: "select",
      options: [
        { value: "rainbow", label: "Rainbow" },
        { value: "teal", label: "Teal" },
        { value: "mono", label: "Monochrome" },
      ],
    },
  ],
  defaults: {
    order: 6,
    lineWidth: 2,
    padding: 40,
    colorMode: "rainbow",
  },
  width: 960,
  height: 720,
  exportFilename: "hilbert-curve.png",
  draw(ctx, width, height, values) {
    const order = values.order as number;
    const lineWidth = values.lineWidth as number;
    const padding = values.padding as number;
    const colorMode = values.colorMode as string;

    ctx.fillStyle = "#0b1120";
    ctx.fillRect(0, 0, width, height);

    const n = 1 << order;
    const total = n * n;
    const cell = (Math.min(width, height) - padding * 2) / (n - 1 || 1);
    const ox = (width - (n - 1) * cell) / 2;
    const oy = (height - (n - 1) * cell) / 2;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < total - 1; i++) {
      const a = hilbertIndexToXY(i, order);
      const b = hilbertIndexToXY(i + 1, order);
      const t = i / (total - 2 || 1);

      if (colorMode === "rainbow") {
        const hue = lerp(200, 320, t);
        ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
      } else if (colorMode === "teal") {
        ctx.strokeStyle = `hsla(175, 65%, ${lerp(45, 70, t)}%, 0.9)`;
      } else {
        const v = Math.round(lerp(80, 220, t));
        ctx.strokeStyle = `rgb(${v},${v},${v})`;
      }

      ctx.beginPath();
      ctx.moveTo(ox + a.x * cell, oy + a.y * cell);
      ctx.lineTo(ox + b.x * cell, oy + b.y * cell);
      ctx.stroke();
    }

    const start = hilbertIndexToXY(0, order);
    const end = hilbertIndexToXY(total - 1, order);
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(ox + start.x * cell, oy + start.y * cell, clamp(lineWidth * 2, 3, 8), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.arc(ox + end.x * cell, oy + end.y * cell, clamp(lineWidth * 2, 3, 8), 0, Math.PI * 2);
    ctx.fill();
  },
};
