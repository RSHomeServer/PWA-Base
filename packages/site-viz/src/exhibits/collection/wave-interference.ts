import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

type Source = { x: number; y: number; phase: number; amp: number };

function waveHeight(x: number, y: number, sources: Source[], k: number, time: number): number {
  let sum = 0;
  for (const s of sources) {
    const dx = x - s.x;
    const dy = y - s.y;
    const r = Math.sqrt(dx * dx + dy * dy) + 0.001;
    sum += (s.amp / Math.sqrt(r)) * Math.sin(k * r - time * 3 + s.phase);
  }
  return sum;
}

export const waveInterference: Exhibit = {
  id: "wave-interference",
  path: "/wave-interference",
  title: "Wave Interference",
  category: "Waves",
  summary: "Circular waves from multiple sources superpose into standing and travelling patterns.",
  maths:
    "Each source emits u(r,t) = (A/√r) sin(kr − ωt + φ). By linear superposition, u_total = Σ uᵢ. " +
    "Constructive interference occurs where phases align; destructive where they cancel. " +
    "The 1/√r factor approximates cylindrical spreading in 2D.",
  params: [
    { id: "sources", label: "Sources", type: "number", min: 1, max: 6, step: 1 },
    { id: "wavelength", label: "Wavelength", type: "number", min: 20, max: 120, step: 5 },
    { id: "amplitude", label: "Amplitude", type: "number", min: 0.5, max: 3, step: 0.1 },
    { id: "step", label: "Pixel step", type: "number", min: 1, max: 4, step: 1 },
    {
      id: "palette",
      label: "Palette",
      type: "select",
      options: [
        { value: "ocean", label: "Ocean" },
        { value: "thermal", label: "Thermal" },
        { value: "mono", label: "Monochrome" },
      ],
    },
  ],
  defaults: {
    sources: 3,
    wavelength: 60,
    amplitude: 1.5,
    step: 2,
    palette: "ocean",
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "wave-interference.png",
  draw(ctx, width, height, values, time) {
    const sourceCount = values.sources as number;
    const wavelength = values.wavelength as number;
    const amplitude = values.amplitude as number;
    const step = values.step as number;
    const palette = values.palette as string;

    const k = (Math.PI * 2) / wavelength;
    const sources: Source[] = [];
    for (let i = 0; i < sourceCount; i++) {
      const angle = (i / sourceCount) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(width, height) * 0.28;
      sources.push({
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        phase: i * 1.2,
        amp: amplitude,
      });
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py += step) {
      for (let px = 0; px < width; px += step) {
        const h = waveHeight(px, py, sources, k, time);
        const t = clamp((h + 2) / 4, 0, 1);

        let r: number;
        let g: number;
        let b: number;
        if (palette === "thermal") {
          r = lerp(20, 255, t);
          g = lerp(10, lerp(80, 220, t), t);
          b = lerp(60, lerp(200, 40, t), 1 - t);
        } else if (palette === "mono") {
          const v = Math.round(lerp(15, 235, t));
          r = g = b = v;
        } else {
          r = lerp(10, lerp(30, 180, t), t);
          g = lerp(30, lerp(120, 230, t), t);
          b = lerp(80, lerp(200, 255, t), t);
        }

        for (let sy = 0; sy < step && py + sy < height; sy++) {
          for (let sx = 0; sx < step && px + sx < width; sx++) {
            const idx = ((py + sy) * width + (px + sx)) * 4;
            data[idx] = Math.round(r);
            data[idx + 1] = Math.round(g);
            data[idx + 2] = Math.round(b);
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (const s of sources) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
