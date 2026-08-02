import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

type Point = { x: number; y: number };

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

function generateSites(
  count: number,
  width: number,
  height: number,
  seed: number,
  margin: number,
): Point[] {
  const rand = mulberry32(seed);
  const sites: Point[] = [];
  for (let i = 0; i < count; i++) {
    sites.push({
      x: margin + rand() * (width - margin * 2),
      y: margin + rand() * (height - margin * 2),
    });
  }
  return sites;
}

const PALETTE = [
  [26, 54, 93],
  [46, 89, 132],
  [72, 118, 158],
  [99, 146, 183],
  [130, 176, 206],
  [168, 208, 230],
  [205, 233, 245],
  [240, 248, 255],
];

function siteColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  const idx = clamp(Math.floor(t * (PALETTE.length - 1)), 0, PALETTE.length - 1);
  const next = clamp(idx + 1, 0, PALETTE.length - 1);
  const local = t * (PALETTE.length - 1) - idx;
  const [r0, g0, b0] = PALETTE[idx]!;
  const [r1, g1, b1] = PALETTE[next]!;
  const r = Math.round(lerp(r0, r1, local));
  const g = Math.round(lerp(g0, g1, local));
  const b = Math.round(lerp(b0, b1, local));
  return `rgb(${r},${g},${b})`;
}

function jitterSites(sites: Point[], time: number, amount: number): Point[] {
  return sites.map((p, i) => ({
    x: p.x + Math.sin(time * 1.3 + i * 0.7) * amount,
    y: p.y + Math.cos(time * 1.1 + i * 1.1) * amount,
  }));
}

function drawVoronoiRegions(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sites: Point[],
  step: number,
): void {
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < sites.length; i++) {
        const dx = px - sites[i]!.x;
        const dy = py - sites[i]!.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }

      const [r, g, b] = PALETTE[clamp(best % PALETTE.length, 0, PALETTE.length - 1)]!;
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
}

function drawVoronoiEdges(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sites: Point[],
): void {
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.2;

  const step = 4;
  for (let py = 0; py < height; py += step) {
    for (let px = 0; px < width; px += step) {
      let bestDist = Infinity;
      let secondDist = Infinity;

      for (let i = 0; i < sites.length; i++) {
        const dx = px - sites[i]!.x;
        const dy = py - sites[i]!.y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          secondDist = bestDist;
          bestDist = d;
        } else if (d < secondDist) {
          secondDist = d;
        }
      }

      if (Math.abs(secondDist - bestDist) < 120) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillRect(px, py, step, step);
      }
    }
  }

  ctx.fillStyle = "#ffffff";
  for (const site of sites) {
    ctx.beginPath();
    ctx.arc(site.x, site.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const voronoiDiagram: Exhibit = {
  id: "voronoi-diagram",
  path: "/voronoi-diagram",
  title: "Voronoi Diagram",
  category: "Geometry",
  summary: "Partition the plane into nearest-neighbour regions around seed sites.",
  maths:
    "Given sites {pᵢ}, the Voronoi cell Vᵢ = {x : ||x − pᵢ|| ≤ ||x − pⱼ|| for all j}. " +
    "It is the dual of the Delaunay triangulation: Voronoi edges meet at circumcenters of Delaunay triangles.",
  params: [
    { id: "sites", label: "Sites", type: "number", min: 4, max: 64, step: 1 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 9999, step: 1 },
    { id: "jitter", label: "Animate jitter", type: "boolean" },
    { id: "jitterAmount", label: "Jitter amount", type: "number", min: 0, max: 40, step: 1 },
    { id: "pixelStep", label: "Resolution step", type: "number", min: 1, max: 6, step: 1 },
  ],
  defaults: {
    sites: 24,
    seed: 42,
    jitter: true,
    jitterAmount: 12,
    pixelStep: 2,
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "voronoi-diagram.png",
  draw(ctx, width, height, values, time) {
    const count = values.sites as number;
    const seed = values.seed as number;
    const jitter = values.jitter as boolean;
    const jitterAmount = values.jitterAmount as number;
    const step = values.pixelStep as number;

    let sites = generateSites(count, width, height, seed, 24);
    if (jitter) {
      sites = jitterSites(sites, time, jitterAmount);
    }

    drawVoronoiRegions(ctx, width, height, sites, step);
    drawVoronoiEdges(ctx, width, height, sites);

    for (let i = 0; i < sites.length; i++) {
      ctx.fillStyle = siteColor(i, sites.length);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sites[i]!.x, sites[i]!.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  },
};
