import { linspace } from "@platform/math";
import type { Exhibit } from "../types.js";

function harmonographPoint(
  t: number,
  freqX: number,
  freqY: number,
  phaseX: number,
  phaseY: number,
  dampX: number,
  dampY: number,
): { x: number; y: number } {
  const x = Math.sin(freqX * t + phaseX) * Math.exp(-dampX * t);
  const y = Math.sin(freqY * t + phaseY) * Math.exp(-dampY * t);
  return { x, y };
}

export const harmonograph: Exhibit = {
  id: "harmonograph",
  path: "/harmonograph",
  title: "Harmonograph",
  category: "Waves",
  summary: "Damped pendulums trace delicate Lissajous-like figures on paper.",
  maths:
    "A harmonograph sums two damped oscillators: x(t) = A sin(f_x t + φ_x) e^{-d_x t}, y(t) = B sin(f_y t + φ_y) e^{-d_y t}. " +
    "Incommensurate frequencies f_x : f_y produce quasi-periodic curves; damping makes the amplitude decay toward the origin.",
  params: [
    { id: "freqX", label: "Frequency X", type: "number", min: 1, max: 8, step: 0.1 },
    { id: "freqY", label: "Frequency Y", type: "number", min: 1, max: 8, step: 0.1 },
    { id: "phaseX", label: "Phase X", type: "number", min: 0, max: 6.28, step: 0.1 },
    { id: "phaseY", label: "Phase Y", type: "number", min: 0, max: 6.28, step: 0.1 },
    { id: "dampX", label: "Damping X", type: "number", min: 0, max: 0.08, step: 0.005 },
    { id: "dampY", label: "Damping Y", type: "number", min: 0, max: 0.08, step: 0.005 },
    { id: "samples", label: "Samples", type: "number", min: 500, max: 8000, step: 250 },
    { id: "scale", label: "Scale", type: "number", min: 80, max: 320, step: 10 },
  ],
  defaults: {
    freqX: 3,
    freqY: 2,
    phaseX: 0,
    phaseY: 1.57,
    dampX: 0.015,
    dampY: 0.018,
    samples: 4000,
    scale: 220,
  },
  width: 960,
  height: 720,
  exportFilename: "harmonograph.png",
  draw(ctx, width, height, values) {
    const freqX = values.freqX as number;
    const freqY = values.freqY as number;
    const phaseX = values.phaseX as number;
    const phaseY = values.phaseY as number;
    const dampX = values.dampX as number;
    const dampY = values.dampY as number;
    const samples = values.samples as number;
    const scale = values.scale as number;

    ctx.fillStyle = "#faf7f2";
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const tValues = linspace(0, Math.PI * 40, samples);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#7c3aed");
    grad.addColorStop(0.5, "#db2777");
    grad.addColorStop(1, "#ea580c");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.2;
    ctx.beginPath();

    tValues.forEach((t, i) => {
      const { x, y } = harmonographPoint(t, freqX, freqY, phaseX, phaseY, dampX, dampY);
      const px = cx + x * scale;
      const py = cy + y * scale;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - scale * 1.1, cy);
    ctx.lineTo(cx + scale * 1.1, cy);
    ctx.moveTo(cx, cy - scale * 1.1);
    ctx.lineTo(cx, cy + scale * 1.1);
    ctx.stroke();

    const start = harmonographPoint(0, freqX, freqY, phaseX, phaseY, dampX, dampY);
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath();
    ctx.arc(cx + start.x * scale, cy + start.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();
  },
};
