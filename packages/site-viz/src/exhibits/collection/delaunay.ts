import { clamp } from "@platform/math";
import type { Exhibit } from "../types.js";

type Point = { x: number; y: number };
type Triangle = { a: number; b: number; c: number };

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

function generatePoints(count: number, width: number, height: number, seed: number): Point[] {
  const rand = mulberry32(seed);
  const margin = 30;
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({
      x: margin + rand() * (width - margin * 2),
      y: margin + rand() * (height - margin * 2),
    });
  }
  return pts;
}

function circumcircle(a: Point, b: Point, c: Point): { x: number; y: number; r2: number } | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-10) {
    return null;
  }
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const ux = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const uy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  const dx = ux - a.x;
  const dy = uy - a.y;
  return { x: ux, y: uy, r2: dx * dx + dy * dy };
}

function inCircle(p: Point, tri: Triangle, pts: Point[]): boolean {
  const cc = circumcircle(pts[tri.a]!, pts[tri.b]!, pts[tri.c]!);
  if (!cc) {
    return false;
  }
  const dx = p.x - cc.x;
  const dy = p.y - cc.y;
  return dx * dx + dy * dy < cc.r2 - 1e-8;
}

function bowyerWatson(points: Point[], width: number, height: number): Triangle[] {
  const pts = [...points];
  const superA = { x: -width, y: -height };
  const superB = { x: width * 2, y: -height };
  const superC = { x: width * 0.5, y: height * 2 };
  pts.push(superA, superB, superC);
  const sa = pts.length - 3;
  const sb = pts.length - 2;
  const sc = pts.length - 1;

  let tris: Triangle[] = [{ a: sa, b: sb, c: sc }];

  for (let i = 0; i < points.length; i++) {
    const p = pts[i]!;
    const bad: Triangle[] = [];
    for (const tri of tris) {
      if (inCircle(p, tri, pts)) {
        bad.push(tri);
      }
    }

    const edges: [number, number][] = [];
    for (const tri of bad) {
      const sides: [number, number][] = [
        [tri.a, tri.b],
        [tri.b, tri.c],
        [tri.c, tri.a],
      ];
      for (const [u, v] of sides) {
        let shared = false;
        for (const other of bad) {
          if (other === tri) {
            continue;
          }
          const verts = [other.a, other.b, other.c];
          if (verts.includes(u) && verts.includes(v)) {
            shared = true;
            break;
          }
        }
        if (!shared) {
          edges.push([u, v]);
        }
      }
    }

    tris = tris.filter((t) => !bad.includes(t));
    for (const [u, v] of edges) {
      tris.push({ a: u, b: v, c: i });
    }
  }

  return tris.filter((t) => t.a < points.length && t.b < points.length && t.c < points.length);
}

function triangleColor(index: number): string {
  const hues = [210, 195, 180, 165, 225, 240];
  const h = hues[index % hues.length]!;
  return `hsla(${h}, 55%, 55%, 0.45)`;
}

export const delaunay: Exhibit = {
  id: "delaunay",
  path: "/delaunay",
  title: "Delaunay Triangulation",
  category: "Geometry",
  summary: "Connect sites into triangles that maximise the minimum interior angle.",
  maths:
    "A Delaunay triangulation satisfies the empty circumcircle property: no site lies inside the circumcircle of any triangle. " +
    "It is the primal graph dual to the Voronoi diagram and is widely used in mesh generation and interpolation.",
  params: [
    { id: "points", label: "Points", type: "number", min: 3, max: 80, step: 1 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 9999, step: 1 },
    { id: "fill", label: "Fill triangles", type: "boolean" },
    { id: "showCircles", label: "Circumcircles", type: "boolean" },
  ],
  defaults: {
    points: 32,
    seed: 7,
    fill: true,
    showCircles: false,
  },
  width: 960,
  height: 720,
  exportFilename: "delaunay.png",
  draw(ctx, width, height, values) {
    const count = values.points as number;
    const seed = values.seed as number;
    const fill = values.fill as boolean;
    const showCircles = values.showCircles as boolean;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    const pts = generatePoints(count, width, height, seed);
    const tris = bowyerWatson(pts, width, height);

    if (fill) {
      tris.forEach((tri, i) => {
        ctx.fillStyle = triangleColor(i);
        ctx.beginPath();
        ctx.moveTo(pts[tri.a]!.x, pts[tri.a]!.y);
        ctx.lineTo(pts[tri.b]!.x, pts[tri.b]!.y);
        ctx.lineTo(pts[tri.c]!.x, pts[tri.c]!.y);
        ctx.closePath();
        ctx.fill();
      });
    }

    if (showCircles) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      for (const tri of tris) {
        const cc = circumcircle(pts[tri.a]!, pts[tri.b]!, pts[tri.c]!);
        if (!cc) {
          continue;
        }
        ctx.beginPath();
        ctx.arc(cc.x, cc.y, Math.sqrt(cc.r2), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "rgba(226, 232, 240, 0.85)";
    ctx.lineWidth = 1.2;
    for (const tri of tris) {
      ctx.beginPath();
      ctx.moveTo(pts[tri.a]!.x, pts[tri.a]!.y);
      ctx.lineTo(pts[tri.b]!.x, pts[tri.b]!.y);
      ctx.lineTo(pts[tri.c]!.x, pts[tri.c]!.y);
      ctx.closePath();
      ctx.stroke();
    }

    for (let i = 0; i < pts.length; i++) {
      const t = pts.length <= 1 ? 0 : i / (pts.length - 1);
      const hue = clamp(180 + t * 60, 0, 360);
      ctx.fillStyle = `hsl(${hue}, 70%, 65%)`;
      ctx.beginPath();
      ctx.arc(pts[i]!.x, pts[i]!.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
