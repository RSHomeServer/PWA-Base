import type { ParamValues } from "@platform/controls";
import type { ExhibitDraw } from "../exhibits/types.js";
import { drawCafeWall } from "../canvas/cafe-wall.js";
import { drawLissajous } from "../canvas/lissajous.js";
import { drawMandelbrot } from "../canvas/mandelbrot.js";
import { drawSierpinski } from "../canvas/sierpinski.js";

interface LegacyPreview {
  draw: ExhibitDraw;
  animated?: boolean;
  defaults: ParamValues;
}

const legacyPreviewDrawers: Record<string, LegacyPreview> = {
  "cafe-wall": {
    defaults: { tileSize: 28, mortarWidth: 4, rowOffset: 14, rows: 8, showGuides: false },
    draw(ctx, width, height, values) {
      drawCafeWall(ctx, width, height, {
        tileSize: Number(values.tileSize ?? 28),
        mortarWidth: Number(values.mortarWidth ?? 4),
        rowOffset: Number(values.rowOffset ?? 14),
        rows: Number(values.rows ?? 8),
        showGuides: Boolean(values.showGuides ?? false),
      });
    },
  },
  mandelbrot: {
    defaults: { centerRe: -0.5, centerIm: 0, zoom: 1, maxIter: 64 },
    draw(ctx, width, height, values) {
      drawMandelbrot(ctx, width, height, {
        centerRe: Number(values.centerRe ?? -0.5),
        centerIm: Number(values.centerIm ?? 0),
        zoom: Number(values.zoom ?? 1),
        maxIter: Number(values.maxIter ?? 64),
      });
    },
  },
  sierpinski: {
    defaults: { depth: 5, fillColor: "#0d7a72", strokeColor: "#042f2e" },
    draw(ctx, width, height, values) {
      drawSierpinski(ctx, width, height, {
        depth: Number(values.depth ?? 5),
        fillColor: String(values.fillColor ?? "#0d7a72"),
        strokeColor: String(values.strokeColor ?? "#042f2e"),
      });
    },
  },
  lissajous: {
    defaults: { freqA: 3, freqB: 4, phase: 1.57, amplitude: 0.9, time: 0 },
    animated: true,
    draw(ctx, width, height, values, time) {
      drawLissajous(ctx, width, height, {
        freqA: Number(values.freqA ?? 3),
        freqB: Number(values.freqB ?? 4),
        phase: Number(values.phase ?? 1.57),
        amplitude: Number(values.amplitude ?? 0.9),
        time: Number(values.time ?? 0) + time * 0.35,
      });
    },
  },
};

export function legacyPreviewFor(id: string): LegacyPreview | undefined {
  return legacyPreviewDrawers[id];
}
