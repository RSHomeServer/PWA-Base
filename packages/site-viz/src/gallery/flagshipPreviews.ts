import type { ParamValues } from "@platform/controls";
import type { ExhibitDraw } from "../exhibits/types.js";

/** Lightweight animated stand-ins so flagship cards pulse before you open them. */

function auroraPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  ctx.fillStyle = "#061018";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) {
    const y = h * (0.25 + i * 0.12) + Math.sin(t * 0.7 + i) * 8;
    const g = ctx.createLinearGradient(0, y - 20, 0, y + 40);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.5, `hsla(${160 + i * 18}, 80%, 55%, 0.35)`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 30, w, 60);
  }
}

function fluidPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  ctx.fillStyle = "#0a0c14";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) {
    const x = ((t * 40 + i * 47) % (w + 40)) - 20;
    const y = h * 0.3 + Math.sin(t + i) * h * 0.2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 40);
    g.addColorStop(0, `hsla(${190 + i * 8}, 90%, 60%, 0.55)`);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pendulumPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  ctx.fillStyle = "#080a12";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.2;
  const a1 = Math.sin(t * 1.3) * 0.9;
  const a2 = Math.sin(t * 2.1 + 1) * 1.2;
  const l1 = h * 0.28;
  const l2 = h * 0.28;
  const x1 = cx + Math.sin(a1) * l1;
  const y1 = cy + Math.cos(a1) * l1;
  const x2 = x1 + Math.sin(a2) * l2;
  const y2 = y1 + Math.cos(a2) * l2;
  ctx.strokeStyle = "rgba(94, 234, 212, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = "#5eead4";
  ctx.beginPath();
  ctx.arc(x2, y2, 5, 0, Math.PI * 2);
  ctx.fill();
}

function fractalZoomPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const zoom = 1.5 + Math.sin(t * 0.4) * 0.4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let zr = ((x / w) * 3.2 - 2.2) / zoom;
      let zi = ((y / h) * 2.4 - 1.2) / zoom;
      let i = 0;
      for (; i < 24; i++) {
        const zr2 = zr * zr - zi * zi + -0.4;
        zi = 2 * zr * zi + 0.6;
        zr = zr2;
        if (zr * zr + zi * zi > 4) break;
      }
      const o = (y * w + x) * 4;
      const v = i / 24;
      data[o] = v * 40;
      data[o + 1] = v * 180;
      data[o + 2] = 80 + v * 140;
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function boidsPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  ctx.fillStyle = "rgba(8, 12, 20, 0.35)";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#5eead4";
  for (let i = 0; i < 28; i++) {
    const x = (Math.sin(t * 0.8 + i * 0.7) * 0.4 + 0.5) * w;
    const y = (Math.cos(t * 0.6 + i * 1.1) * 0.4 + 0.5) * h;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lifePreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  const cell = 6;
  ctx.fillStyle = "#0c1018";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#34d399";
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      if (Math.sin(x * 0.08 + t) * Math.cos(y * 0.09 - t * 0.7) > 0.55) {
        ctx.fillRect(x, y, cell - 1, cell - 1);
      }
    }
  }
}

function treePreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  ctx.fillStyle = "#0a1210";
  ctx.fillRect(0, 0, w, h);
  const wind = Math.sin(t) * 0.15;
  function branch(x: number, y: number, angle: number, depth: number, len: number): void {
    if (depth <= 0) return;
    const x2 = x + Math.cos(angle + wind * (4 - depth) * 0.08) * len;
    const y2 = y + Math.sin(angle + wind * (4 - depth) * 0.08) * len;
    ctx.strokeStyle = `hsla(${140 + depth * 10}, 50%, ${30 + depth * 8}%, 0.9)`;
    ctx.lineWidth = depth * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    branch(x2, y2, angle - 0.45, depth - 1, len * 0.72);
    branch(x2, y2, angle + 0.4, depth - 1, len * 0.72);
  }
  branch(w / 2, h * 0.92, -Math.PI / 2, 6, h * 0.18);
}

function horizonPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  for (let i = 0; i < 80; i++) {
    const a = (i / 80) * Math.PI * 2 + t * 0.2;
    const r = 20 + (i % 17) * 4;
    const x = cx + Math.cos(a) * r * (1 + 8 / (r + 1));
    const y = cy + Math.sin(a) * r * (1 + 8 / (r + 1));
    ctx.fillStyle = `hsla(${30 + i}, 90%, 60%, 0.7)`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 180, 80, 0.8)";
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();
}

function reactionPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  _v: ParamValues,
  t: number,
): void {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.sin(x * 0.12 + t) * Math.cos(y * 0.1 - t * 0.8);
      const o = (y * w + x) * 4;
      data[o] = 20 + v * 40;
      data[o + 1] = 80 + v * 100;
      data[o + 2] = 140 + v * 80;
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

const FLAGSHIP_PREVIEWS: Record<string, { draw: ExhibitDraw; animated: boolean }> = {
  "mandelbrot-explorer": { draw: fractalZoomPreview, animated: true },
  "julia-explorer": { draw: fractalZoomPreview, animated: true },
  "double-pendulum-pro": { draw: pendulumPreview, animated: true },
  "boids-lab": { draw: boidsPreview, animated: true },
  "life-lab": { draw: lifePreview, animated: true },
  "reaction-paint": { draw: reactionPreview, animated: true },
  "fluid-lab": { draw: fluidPreview, animated: true },
  "aurora-sky": { draw: auroraPreview, animated: true },
  "event-horizon": { draw: horizonPreview, animated: true },
  "living-tree": { draw: treePreview, animated: true },
};

export function flagshipPreviewFor(demoId: string): {
  draw: ExhibitDraw;
  animated: boolean;
  defaults: ParamValues;
} | null {
  const entry = FLAGSHIP_PREVIEWS[demoId];
  if (!entry) return null;
  return { draw: entry.draw, animated: entry.animated, defaults: {} };
}
