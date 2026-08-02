import { clamp } from "@platform/math";
import type { CymaticsPalette, CymaticsVisualMode } from "../education.js";
import type { ChladniField } from "../sim/ChladniField.js";
import type { CymaticsSystem } from "../sim/CymaticsSystem.js";

export interface StageTransform {
  scale: number;
  originX: number;
  originY: number;
  plateLeft: number;
  plateTop: number;
  plateW: number;
  plateH: number;
}

/** Fits the plate (in its own local units) into the canvas, centered, with a margin. */
export function computeStageTransform(
  field: ChladniField,
  width: number,
  height: number,
  margin = 30,
): StageTransform {
  const hx = field.halfExtentX;
  const hy = field.halfExtentY;
  const availW = Math.max(width - margin * 2, 10);
  const availH = Math.max(height - margin * 2, 10);
  const scale = Math.min(availW / (2 * hx), availH / (2 * hy));
  const originX = width / 2;
  const originY = height / 2;
  return {
    scale,
    originX,
    originY,
    plateLeft: originX - hx * scale,
    plateTop: originY - hy * scale,
    plateW: hx * 2 * scale,
    plateH: hy * 2 * scale,
  };
}

function toScreen(t: StageTransform, x: number, y: number): [number, number] {
  return [t.originX + x * t.scale, t.originY + y * t.scale];
}

function toPlate(t: StageTransform, sx: number, sy: number): [number, number] {
  return [(sx - t.originX) / t.scale, (sy - t.originY) / t.scale];
}

function mixByte(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  const c = clamp(t, 0, 1);
  return [mixByte(a[0], b[0], c), mixByte(a[1], b[1], c), mixByte(a[2], b[2], c)];
}

function rgbCss([r, g, b]: readonly [number, number, number], alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Thermal false-colour gradient for the "Heat Map" mode — deliberately
 * independent of the chosen particle palette, since it's a diagnostic
 * overlay rather than a material render. */
function heatColor(t: number): [number, number, number] {
  const stops: Array<[number, number, number, number]> = [
    [0, 6, 10, 24],
    [0.25, 32, 24, 110],
    [0.5, 132, 36, 132],
    [0.72, 232, 96, 48],
    [1, 255, 226, 120],
  ];
  const c = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i++) {
    const [p0, r0, g0, b0] = stops[i - 1]!;
    const [p1, r1, g1, b1] = stops[i]!;
    if (c <= p1) {
      const local = (c - p0) / Math.max(p1 - p0, 1e-6);
      return [mixByte(r0, r1, local), mixByte(g0, g1, local), mixByte(b0, b1, local)];
    }
  }
  return [255, 255, 255];
}

const OFF_MAX = 320;

/**
 * Renders a `CymaticsSystem` onto a 2D canvas in one of eight visual modes.
 * Density-based modes (sand, metal, heat map, and the base wash under glow /
 * water) splat every particle into a small offscreen grid rather than
 * issuing one canvas draw call per particle — this is what makes 50k–100k+
 * particles affordable every frame. Field-based modes (contours, wireframe,
 * vectors) sample the `ChladniField` directly instead of the particles.
 */
export class CymaticsRenderer {
  private offCanvas: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private density = new Float32Array(0);
  private speedAccum = new Float32Array(0);
  private offW = 0;
  private offH = 0;
  private configuredFor = "";

  constructor() {
    this.offCanvas = document.createElement("canvas");
    const ctx = this.offCanvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("2D context unavailable for cymatics offscreen buffer");
    }
    this.offCtx = ctx;
  }

  private configurePlate(field: ChladniField): void {
    const hx = field.halfExtentX;
    const hy = field.halfExtentY;
    const key = `${field.shape}:${hx.toFixed(3)}:${hy.toFixed(3)}`;
    if (key === this.configuredFor) {
      return;
    }
    this.configuredFor = key;
    const aspect = hx / hy;
    const w = aspect >= 1 ? OFF_MAX : Math.round(OFF_MAX * aspect);
    const h = aspect >= 1 ? Math.round(OFF_MAX / aspect) : OFF_MAX;
    this.offW = Math.max(w, 8);
    this.offH = Math.max(h, 8);
    this.offCanvas.width = this.offW;
    this.offCanvas.height = this.offH;
    this.density = new Float32Array(this.offW * this.offH);
    this.speedAccum = new Float32Array(this.offW * this.offH);
  }

  private splatParticles(field: ChladniField, system: CymaticsSystem, speedGain: number): void {
    this.density.fill(0);
    this.speedAccum.fill(0);
    const hx = field.halfExtentX;
    const hy = field.halfExtentY;
    const buf = system.particles;
    const count = buf.count;
    const w = this.offW;
    const h = this.offH;
    for (let i = 0; i < count; i++) {
      const gx = ((buf.x[i]! + hx) / (2 * hx)) * (w - 1);
      const gy = ((buf.y[i]! + hy) / (2 * hy)) * (h - 1);
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) {
        continue;
      }
      const tx = gx - x0;
      const ty = gy - y0;
      const speed = Math.min(1, Math.hypot(buf.vx[i]!, buf.vy[i]!) * speedGain);
      const w00 = (1 - tx) * (1 - ty);
      const w10 = tx * (1 - ty);
      const w01 = (1 - tx) * ty;
      const w11 = tx * ty;
      const i00 = y0 * w + x0;
      const i10 = y0 * w + x0 + 1;
      const i01 = (y0 + 1) * w + x0;
      const i11 = (y0 + 1) * w + x0 + 1;
      this.density[i00]! += w00;
      this.density[i10]! += w10;
      this.density[i01]! += w01;
      this.density[i11]! += w11;
      this.speedAccum[i00]! += w00 * speed;
      this.speedAccum[i10]! += w10 * speed;
      this.speedAccum[i01]! += w01 * speed;
      this.speedAccum[i11]! += w11 * speed;
    }
  }

  private paintDensityToOffscreen(
    mode: CymaticsVisualMode,
    palette: CymaticsPalette,
    normDensity: number,
  ): void {
    const w = this.offW;
    const h = this.offH;
    const img = this.offCtx.createImageData(w, h);
    const data = img.data;
    const base = palette.base;
    const highlight = palette.highlight;
    for (let i = 0; i < this.density.length; i++) {
      const d = this.density[i]!;
      const o = i * 4;
      if (d <= 0.0004) {
        data[o + 3] = 0;
        continue;
      }
      const avgSpeed = this.speedAccum[i]! / d;
      const alpha = clamp(d / normDensity, 0, 1);
      let rgb: [number, number, number];
      if (mode === "heatmap") {
        rgb = heatColor(alpha);
      } else if (mode === "metal") {
        const cool: [number, number, number] = [70, 78, 90];
        const sheen: [number, number, number] = [214, 224, 236];
        rgb = mixRgb(mixRgb(cool, base, 0.35), sheen, Math.min(1, avgSpeed * 1.4 + alpha * 0.15));
      } else {
        rgb = mixRgb(base, highlight, Math.min(1, avgSpeed * 1.3));
      }
      data[o] = rgb[0];
      data[o + 1] = rgb[1];
      data[o + 2] = rgb[2];
      data[o + 3] = Math.round(Math.pow(alpha, 0.62) * 255);
    }
    this.offCtx.putImageData(img, 0, 0);
  }

  private drawPlateBezel(
    ctx: CanvasRenderingContext2D,
    field: ChladniField,
    t: StageTransform,
    palette: CymaticsPalette,
  ): void {
    ctx.save();
    if (field.shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(t.originX, t.originY, t.plateW / 2, t.plateH / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.beginPath();
      ctx.rect(t.plateLeft, t.plateTop, t.plateW, t.plateH);
    }
    const grad = ctx.createRadialGradient(
      t.originX,
      t.originY,
      4,
      t.originX,
      t.originY,
      Math.max(t.plateW, t.plateH) * 0.72,
    );
    grad.addColorStop(0, rgbCss(palette.background, 1));
    grad.addColorStop(
      1,
      rgbCss(
        [
          Math.max(0, palette.background[0] - 4),
          Math.max(0, palette.background[1] - 4),
          Math.max(0, palette.background[2] - 2),
        ],
        1,
      ),
    );
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.stroke();
    ctx.restore();
  }

  private drawExcitationMarkers(
    ctx: CanvasRenderingContext2D,
    field: ChladniField,
    t: StageTransform,
    elapsed: number,
  ): void {
    const sources = field.getSources();
    for (const s of sources) {
      const [sx, sy] = toScreen(t, s.x, s.y);
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3.2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, 5 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 214, 120, 0.9)";
      ctx.shadowColor = "rgba(255, 200, 90, 0.9)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(sx, sy, 12 + pulse * 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 214, 120, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawWireframe(
    ctx: CanvasRenderingContext2D,
    field: ChladniField,
    t: StageTransform,
    palette: CymaticsPalette,
  ): void {
    const hx = field.halfExtentX;
    const hy = field.halfExtentY;
    const lines = 34;
    ctx.save();
    ctx.lineWidth = 1;
    for (let row = 0; row <= lines; row++) {
      const y = -hy + (2 * hy * row) / lines;
      ctx.beginPath();
      let started = false;
      for (let col = 0; col <= lines * 2; col++) {
        const x = -hx + (2 * hx * col) / (lines * 2);
        if (!field.contains(x, y)) {
          started = false;
          continue;
        }
        const amp = field.sampleAmplitude(x, y);
        const [sx, sy] = toScreen(t, x, y);
        const lift = amp * 6;
        if (!started) {
          ctx.moveTo(sx, sy - lift);
          started = true;
        } else {
          ctx.lineTo(sx, sy - lift);
        }
      }
      const rgb = mixRgb(palette.base, palette.highlight, 0.35);
      ctx.strokeStyle = rgbCss(rgb, 0.28 + 0.18 * Math.abs(Math.sin((row / lines) * Math.PI)));
      ctx.stroke();
    }
    for (let col = 0; col <= lines * 2; col += 2) {
      const x = -hx + (2 * hx * col) / (lines * 2);
      ctx.beginPath();
      let started = false;
      for (let row = 0; row <= lines; row++) {
        const y = -hy + (2 * hy * row) / lines;
        if (!field.contains(x, y)) {
          started = false;
          continue;
        }
        const amp = field.sampleAmplitude(x, y);
        const [sx, sy] = toScreen(t, x, y);
        const lift = amp * 6;
        if (!started) {
          ctx.moveTo(sx, sy - lift);
          started = true;
        } else {
          ctx.lineTo(sx, sy - lift);
        }
      }
      ctx.strokeStyle = rgbCss(mixRgb(palette.base, palette.highlight, 0.2), 0.18);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawVectorField(
    ctx: CanvasRenderingContext2D,
    field: ChladniField,
    t: StageTransform,
    palette: CymaticsPalette,
  ): void {
    const hx = field.halfExtentX;
    const hy = field.halfExtentY;
    const cols = 24;
    const rows = Math.max(6, Math.round((cols * hy) / hx));
    ctx.save();
    ctx.lineWidth = 1.4;
    for (let row = 0; row < rows; row++) {
      const y = -hy + (2 * hy * (row + 0.5)) / rows;
      for (let col = 0; col < cols; col++) {
        const x = -hx + (2 * hx * (col + 0.5)) / cols;
        if (!field.contains(x, y)) {
          continue;
        }
        const { gx, gy } = field.sampleEnergyGradient(x, y);
        const mag = Math.hypot(gx, gy);
        if (mag < 1e-5) {
          continue;
        }
        const norm = Math.min(1, mag * 8);
        const len = 4 + norm * 10;
        const nx = -gx / mag;
        const ny = -gy / mag;
        const [sx, sy] = toScreen(t, x, y);
        const ex = sx + nx * len;
        const ey = sy + ny * len;
        ctx.strokeStyle = rgbCss(mixRgb(palette.base, palette.highlight, norm), 0.35 + norm * 0.5);
        ctx.beginPath();
        ctx.moveTo(sx - nx * len * 0.4, sy - ny * len * 0.4);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, ey, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(mixRgb(palette.base, palette.highlight, norm), 0.6);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawContours(
    ctx: CanvasRenderingContext2D,
    field: ChladniField,
    t: StageTransform,
    palette: CymaticsPalette,
  ): void {
    const hx = field.halfExtentX;
    const hy = field.halfExtentY;
    const res = 96;
    const values = new Float32Array((res + 1) * (res + 1));
    for (let iy = 0; iy <= res; iy++) {
      const y = -hy + (2 * hy * iy) / res;
      for (let ix = 0; ix <= res; ix++) {
        const x = -hx + (2 * hx * ix) / res;
        values[iy * (res + 1) + ix] = field.contains(x, y)
          ? field.sampleAmplitude(x, y)
          : Number.NaN;
      }
    }
    ctx.save();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = rgbCss(palette.highlight, 0.85);
    ctx.shadowColor = rgbCss(palette.highlight, 0.5);
    ctx.shadowBlur = 3;
    ctx.beginPath();
    const cellW = (2 * hx) / res;
    const cellH = (2 * hy) / res;
    for (let iy = 0; iy < res; iy++) {
      const y0 = -hy + iy * cellH;
      const y1 = y0 + cellH;
      for (let ix = 0; ix < res; ix++) {
        const x0 = -hx + ix * cellW;
        const x1 = x0 + cellW;
        const v00 = values[iy * (res + 1) + ix]!;
        const v10 = values[iy * (res + 1) + ix + 1]!;
        const v01 = values[(iy + 1) * (res + 1) + ix]!;
        const v11 = values[(iy + 1) * (res + 1) + ix + 1]!;
        if ([v00, v10, v01, v11].some((v) => Number.isNaN(v))) {
          continue;
        }
        const crossings: Array<[number, number]> = [];
        const edge = (va: number, vb: number, pa: [number, number], pb: [number, number]) => {
          if (va === 0 || vb === 0 || va < 0 !== vb < 0) {
            const denom = va - vb;
            const frac = Math.abs(denom) > 1e-9 ? va / denom : 0.5;
            crossings.push([pa[0] + (pb[0] - pa[0]) * frac, pa[1] + (pb[1] - pa[1]) * frac]);
          }
        };
        edge(v00, v10, [x0, y0], [x1, y0]);
        edge(v10, v11, [x1, y0], [x1, y1]);
        edge(v11, v01, [x1, y1], [x0, y1]);
        edge(v01, v00, [x0, y1], [x0, y0]);
        if (crossings.length >= 2) {
          const [a, b] = crossings;
          const [sax, say] = toScreen(t, a![0], a![1]);
          const [sbx, sby] = toScreen(t, b![0], b![1]);
          ctx.moveTo(sax, say);
          ctx.lineTo(sbx, sby);
        }
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawDroplets(
    ctx: CanvasRenderingContext2D,
    field: ChladniField,
    t: StageTransform,
    system: CymaticsSystem,
    palette: CymaticsPalette,
    particleSize: number,
  ): void {
    const buf = system.particles;
    const count = buf.count;
    const maxDrawn = 5000;
    const stride = Math.max(1, Math.ceil(count / maxDrawn));
    ctx.save();
    for (let i = 0; i < count; i += stride) {
      const x = buf.x[i]!;
      const y = buf.y[i]!;
      const [sx, sy] = toScreen(t, x, y);
      const speed = Math.min(1, Math.hypot(buf.vx[i]!, buf.vy[i]!) * 0.35);
      const r = particleSize * (1.1 + speed * 0.4);
      const body = mixRgb(palette.base, palette.highlight, 0.15);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = rgbCss(body, 0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fill();
    }
    ctx.restore();
    void field;
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    field: ChladniField,
    system: CymaticsSystem,
    options: {
      palette: CymaticsPalette;
      visualMode: CymaticsVisualMode;
      particleSize: number;
      elapsed: number;
    },
  ): void {
    this.configurePlate(field);
    const t = computeStageTransform(field, width, height);
    const { palette, visualMode, particleSize, elapsed } = options;

    ctx.save();
    ctx.fillStyle = rgbCss(palette.background);
    ctx.fillRect(0, 0, width, height);
    this.drawPlateBezel(ctx, field, t, palette);

    ctx.save();
    if (field.shape === "circle") {
      ctx.beginPath();
      ctx.ellipse(t.originX, t.originY, t.plateW / 2, t.plateH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(t.plateLeft, t.plateTop, t.plateW, t.plateH);
      ctx.clip();
    }

    if (visualMode === "wireframe") {
      this.drawWireframe(ctx, field, t, palette);
    } else if (visualMode === "vectors") {
      this.splatParticles(field, system, particleSize * 0.4);
      this.paintDensityToOffscreen("sand", palette, 2.6);
      ctx.globalAlpha = 0.35;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.offCanvas, t.plateLeft, t.plateTop, t.plateW, t.plateH);
      ctx.globalAlpha = 1;
      this.drawVectorField(ctx, field, t, palette);
    } else if (visualMode === "contours") {
      this.splatParticles(field, system, particleSize * 0.4);
      this.paintDensityToOffscreen("sand", palette, 3.2);
      ctx.globalAlpha = 0.4;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.offCanvas, t.plateLeft, t.plateTop, t.plateW, t.plateH);
      ctx.globalAlpha = 1;
      this.drawContours(ctx, field, t, palette);
    } else if (visualMode === "water") {
      this.splatParticles(field, system, particleSize * 0.4);
      this.paintDensityToOffscreen("sand", palette, 2.4);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.offCanvas, t.plateLeft, t.plateTop, t.plateW, t.plateH);
      this.drawDroplets(ctx, field, t, system, palette, particleSize);
    } else if (visualMode === "glow") {
      this.splatParticles(field, system, particleSize * 0.5);
      this.paintDensityToOffscreen("sand", palette, 1.9);
      ctx.imageSmoothingEnabled = true;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(this.offCanvas, t.plateLeft, t.plateTop, t.plateW, t.plateH);
      ctx.filter = "blur(6px)";
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.offCanvas, t.plateLeft, t.plateTop, t.plateW, t.plateH);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } else {
      // sand, metal, heatmap
      this.splatParticles(field, system, particleSize * 0.4);
      const norm = visualMode === "heatmap" ? 4.5 : visualMode === "metal" ? 2.0 : 2.6;
      this.paintDensityToOffscreen(visualMode, palette, norm);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.offCanvas, t.plateLeft, t.plateTop, t.plateW, t.plateH);
    }

    ctx.restore();
    this.drawExcitationMarkers(ctx, field, t, elapsed);
    ctx.restore();
  }
}

export function screenToPlate(
  field: ChladniField,
  width: number,
  height: number,
  sx: number,
  sy: number,
): { x: number; y: number } | null {
  const t = computeStageTransform(field, width, height);
  const [x, y] = toPlate(t, sx, sy);
  if (!field.contains(x, y)) {
    return null;
  }
  return { x, y };
}
