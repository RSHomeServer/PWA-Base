import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

function gridValue(x: number, y: number, spacing: number, angle: number, phase: number): number {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const u = x * ca + y * sa;
  return 0.5 + 0.5 * Math.cos((u / spacing) * Math.PI * 2 + phase);
}

export const moireInterference: Exhibit = {
  id: "moire-interference",
  path: "/moire-interference",
  title: "Moiré Interference",
  category: "Illusion",
  summary:
    "Two rotating line grids superpose into shifting moiré bands — pure optical interference in the browser.",
  maths:
    "Moiré patterns arise when two periodic structures of similar spatial frequency beat together: " +
    "I ≈ G₁ · G₂ where each grid Gᵢ = ½(1 + cos(kᵢ·r + φᵢ)). " +
    "Small differences in spacing or angle create low-frequency envelopes that appear to move independently of either grid.",
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "moire-interference.png",
  params: [
    { id: "spacing1", label: "Grid 1 spacing", type: "number", min: 4, max: 24, step: 1 },
    { id: "spacing2", label: "Grid 2 spacing", type: "number", min: 4, max: 24, step: 1 },
    { id: "angle", label: "Grid angle °", type: "number", min: 0, max: 45, step: 0.5 },
    { id: "speed1", label: "Rotation 1", type: "number", min: -1.5, max: 1.5, step: 0.05 },
    { id: "speed2", label: "Rotation 2", type: "number", min: -1.5, max: 1.5, step: 0.05 },
    { id: "contrast", label: "Contrast", type: "number", min: 0.3, max: 1, step: 0.05 },
    { id: "step", label: "Pixel step", type: "number", min: 1, max: 3, step: 1 },
    {
      id: "blend",
      label: "Blend mode",
      type: "select",
      options: [
        { value: "multiply", label: "Multiply" },
        { value: "difference", label: "Difference" },
        { value: "additive", label: "Additive" },
      ],
    },
  ],
  defaults: {
    spacing1: 10,
    spacing2: 11,
    angle: 12,
    speed1: 0.25,
    speed2: -0.18,
    contrast: 0.85,
    step: 2,
    blend: "multiply",
  },
  draw(ctx, width, height, values, time) {
    const spacing1 = values.spacing1 as number;
    const spacing2 = values.spacing2 as number;
    const angleDeg = values.angle as number;
    const speed1 = values.speed1 as number;
    const speed2 = values.speed2 as number;
    const contrast = values.contrast as number;
    const step = values.step as number;
    const blend = values.blend as string;

    const cx = width * 0.5;
    const cy = height * 0.5;
    const baseAngle = (angleDeg * Math.PI) / 180;
    const rot1 = time * speed1;
    const rot2 = -time * speed2 + baseAngle;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py += step) {
      for (let px = 0; px < width; px += step) {
        const x = px - cx;
        const y = py - cy;

        const g1 = gridValue(x, y, spacing1, rot1, 0);
        const g2 = gridValue(x, y, spacing2, rot2, Math.PI * 0.25);

        let v: number;
        if (blend === "difference") {
          v = 1 - Math.abs(g1 - g2);
        } else if (blend === "additive") {
          v = clamp((g1 + g2) * 0.5, 0, 1);
        } else {
          v = g1 * g2;
        }

        v = clamp(0.5 + (v - 0.5) * contrast * 2, 0, 1);

        const hue = lerp(240, 320, v);
        const sat = lerp(40, 85, v);
        const lit = lerp(8, 78, v);
        const [r, g, b] = hslToRgb(hue, sat, lit);

        for (let sy = 0; sy < step && py + sy < height; sy++) {
          for (let sx = 0; sx < step && px + sx < width; sx++) {
            const idx = ((py + sy) * width + (px + sx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  },
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sat = s / 100;
  const lit = l / 100;
  const c = (1 - Math.abs(2 * lit - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lit - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) {
    rp = c;
    gp = x;
  } else if (h < 120) {
    rp = x;
    gp = c;
  } else if (h < 180) {
    gp = c;
    bp = x;
  } else if (h < 240) {
    gp = x;
    bp = c;
  } else if (h < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return [Math.round((rp + m) * 255), Math.round((gp + m) * 255), Math.round((bp + m) * 255)];
}
