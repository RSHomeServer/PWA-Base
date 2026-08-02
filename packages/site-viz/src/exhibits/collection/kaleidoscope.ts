import type { Exhibit } from "../types.js";

type Segment = { x1: number; y1: number; x2: number; y2: number; hue: number };

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawMirroredSegment(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  seg: Segment,
  segments: number,
  radius: number,
): void {
  const mx1 = seg.x1 - cx;
  const my1 = seg.y1 - cy;
  const mx2 = seg.x2 - cx;
  const my2 = seg.y2 - cy;
  const wedge = (Math.PI * 2) / segments;

  for (let i = 0; i < segments; i++) {
    const rot = i * wedge;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    const ax = mx1 * cos - my1 * sin;
    const ay = mx1 * sin + my1 * cos;
    const bx = mx2 * cos - my2 * sin;
    const by = mx2 * sin + my2 * cos;

    const mirror = (x: number, y: number) => {
      const ang = Math.atan2(y, x);
      const local = ((ang % wedge) + wedge) % wedge;
      const m = local > wedge / 2 ? wedge - local : local;
      const r = Math.sqrt(x * x + y * y);
      return { x: Math.cos(m) * r, y: Math.sin(m) * r };
    };

    const pa = mirror(ax, ay);
    const pb = mirror(bx, by);
    const r = Math.sqrt(pa.x * pa.x + pa.y * pa.y);
    if (r > radius) {
      continue;
    }

    ctx.strokeStyle = `hsla(${seg.hue}, 75%, 62%, 0.55)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + pa.x, cy + pa.y);
    ctx.lineTo(cx + pb.x, cy + pb.y);
    ctx.stroke();
  }
}

export const kaleidoscope: Exhibit = {
  id: "kaleidoscope",
  path: "/kaleidoscope",
  title: "Kaleidoscope",
  category: "Illusion",
  summary: "Mirrored segments rotate into ever-changing symmetric patterns.",
  maths:
    "Dihedral symmetry group Dₙ acts on the plane by n-fold rotation combined with reflection across a wedge boundary. " +
    "Mapping a point through these transforms tiles the disk with congruent copies, producing kaleidoscopic repetition.",
  params: [
    { id: "segments", label: "Segments", type: "number", min: 3, max: 16, step: 1 },
    { id: "particles", label: "Brush strokes", type: "number", min: 20, max: 200, step: 5 },
    { id: "speed", label: "Rotation speed", type: "number", min: 0, max: 2, step: 0.1 },
    { id: "radius", label: "Radius", type: "number", min: 100, max: 400, step: 10 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 999, step: 1 },
    { id: "fade", label: "Trail fade", type: "number", min: 0.02, max: 0.25, step: 0.01 },
  ],
  defaults: {
    segments: 8,
    particles: 80,
    speed: 0.6,
    radius: 280,
    seed: 3,
    fade: 0.06,
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "kaleidoscope.png",
  draw(ctx, width, height, values, time) {
    const segments = values.segments as number;
    const strokeCount = values.particles as number;
    const speed = values.speed as number;
    const radius = values.radius as number;
    const seed = values.seed as number;
    const fade = values.fade as number;

    const store = kaleidoscope as Exhibit & {
      _state?: { segs: Segment[]; rand: () => number; lastSeed: number; lastCount: number };
    };
    if (!store._state || store._state.lastSeed !== seed || store._state.lastCount !== strokeCount) {
      const rand = mulberry32(seed);
      store._state = {
        segs: Array.from({ length: strokeCount }, () => ({
          x1: (rand() - 0.5) * radius * 0.4,
          y1: (rand() - 0.5) * radius * 0.4,
          x2: (rand() - 0.5) * radius * 0.4,
          y2: (rand() - 0.5) * radius * 0.4,
          hue: rand() * 360,
        })),
        rand: mulberry32(seed + 99),
        lastSeed: seed,
        lastCount: strokeCount,
      };
    }
    const state = store._state;
    const cx = width / 2;
    const cy = height / 2;

    ctx.fillStyle = `rgba(8, 12, 24, ${fade})`;
    ctx.fillRect(0, 0, width, height);

    const rot = time * speed;
    for (const seg of state.segs) {
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const x1 = seg.x1 * cos - seg.y1 * sin;
      const y1 = seg.x1 * sin + seg.y1 * cos;
      const x2 = seg.x2 * cos - seg.y2 * sin;
      const y2 = seg.x2 * sin + seg.y2 * cos;
      drawMirroredSegment(
        ctx,
        cx,
        cy,
        { x1, y1, x2, y2, hue: seg.hue + rot * 30 },
        segments,
        radius,
      );

      if (Math.random() < 0.02) {
        seg.x2 += (state.rand() - 0.5) * 8;
        seg.y2 += (state.rand() - 0.5) * 8;
        seg.hue = (seg.hue + 5) % 360;
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2 + rot;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      ctx.stroke();
    }
  },
};
