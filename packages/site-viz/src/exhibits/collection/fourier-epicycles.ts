import { linspace } from "@platform/math";
import type { Exhibit } from "../types.js";

type Complex = { re: number; im: number };

type FourierTerm = { freq: number; amp: number; phase: number };

const SQUARE_WAVE: FourierTerm[] = Array.from({ length: 12 }, (_, n) => {
  const k = 2 * n + 1;
  return { freq: k, amp: 4 / (Math.PI * k), phase: n % 2 === 0 ? 0 : Math.PI };
});

const HEART_WAVE: FourierTerm[] = [
  { freq: 1, amp: 1.0, phase: 0 },
  { freq: 2, amp: 0.35, phase: 0.5 },
  { freq: 3, amp: -0.22, phase: 1.2 },
  { freq: 4, amp: 0.15, phase: -0.8 },
  { freq: 5, amp: -0.1, phase: 2.1 },
  { freq: 6, amp: 0.08, phase: 0.3 },
  { freq: 7, amp: -0.06, phase: -1.5 },
  { freq: 8, amp: 0.05, phase: 1.8 },
];

const TRIANGLE_WAVE: FourierTerm[] = Array.from({ length: 10 }, (_, n) => {
  const k = 2 * n + 1;
  const sign = n % 2 === 0 ? 1 : -1;
  return { freq: k, amp: sign * (8 / (Math.PI * Math.PI * k * k)), phase: 0 };
});

function getTerms(shape: string): FourierTerm[] {
  if (shape === "heart") {
    return HEART_WAVE;
  }
  if (shape === "triangle") {
    return TRIANGLE_WAVE;
  }
  return SQUARE_WAVE;
}

export const fourierEpicycles: Exhibit = {
  id: "fourier-epicycles",
  path: "/fourier-epicycles",
  title: "Fourier Epicycles",
  category: "Waves",
  summary: "Rotating circles whose sum traces a closed curve — a visual Fourier series.",
  maths:
    "Any periodic path can be written as Σ cₖ e^{ikωt}. Each term is a circle of radius |cₘ| rotating at frequency kω. " +
    "Summing epicycles reconstructs the original shape; truncating the series gives a low-pass approximation.",
  params: [
    {
      id: "shape",
      label: "Target shape",
      type: "select",
      options: [
        { value: "square", label: "Square wave" },
        { value: "triangle", label: "Triangle wave" },
        { value: "heart", label: "Heart (approx)" },
      ],
    },
    { id: "terms", label: "Terms shown", type: "number", min: 1, max: 12, step: 1 },
    { id: "speed", label: "Rotation speed", type: "number", min: 0.2, max: 3, step: 0.1 },
    { id: "scale", label: "Scale", type: "number", min: 40, max: 200, step: 5 },
    { id: "trail", label: "Trail length", type: "number", min: 50, max: 800, step: 25 },
  ],
  defaults: {
    shape: "square",
    terms: 8,
    speed: 1,
    scale: 120,
    trail: 400,
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "fourier-epicycles.png",
  draw(ctx, width, height, values, time) {
    const shape = values.shape as string;
    const termCount = values.terms as number;
    const speed = values.speed as number;
    const scale = values.scale as number;
    const trailLen = values.trail as number;

    const store = fourierEpicycles as Exhibit & { _trail?: { x: number; y: number }[] };
    if (!store._trail) {
      store._trail = [];
    }
    const trail = store._trail;

    ctx.fillStyle = "#0c1222";
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.38;
    const cy = height * 0.5;
    const terms = getTerms(shape).slice(0, termCount);
    const t = time * speed;

    let pos: Complex = { re: cx, im: cy };
    let angle = 0;

    for (let i = 0; i < terms.length; i++) {
      const term = terms[i]!;
      const radius = term.amp * scale;
      angle += term.freq * t + term.phase;
      const next: Complex = {
        re: pos.re + radius * Math.cos(angle),
        im: pos.im + radius * Math.sin(angle),
      };

      ctx.strokeStyle = `hsla(${200 + i * 12}, 60%, 55%, 0.35)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pos.re, pos.im, Math.abs(radius), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `hsla(${180 + i * 15}, 70%, 65%, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pos.re, pos.im);
      ctx.lineTo(next.re, next.im);
      ctx.stroke();

      pos = next;
    }

    trail.push({ x: pos.re, y: pos.im });
    if (trail.length > trailLen) {
      trail.splice(0, trail.length - trailLen);
    }

    const offsetX = width * 0.22;
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const x = p.x + offsetX;
      const y = p.y;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(pos.re, pos.im, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(pos.re, pos.im);
    ctx.lineTo(pos.re + offsetX, pos.im);
    ctx.stroke();
    ctx.setLineDash([]);

    if (shape === "heart") {
      const samples = linspace(0, Math.PI * 2, 200);
      ctx.strokeStyle = "rgba(96,165,250,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      samples.forEach((a, i) => {
        const hx = 16 * Math.pow(Math.sin(a), 3);
        const hy = -(
          13 * Math.cos(a) -
          5 * Math.cos(2 * a) -
          2 * Math.cos(3 * a) -
          Math.cos(4 * a)
        );
        const x = cx + offsetX + hx * (scale / 40);
        const y = cy + hy * (scale / 40);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  },
};
