import type { Exhibit } from "../types.js";
import { renderEscapeTime } from "../lib/fractal.js";
import { nebulaPalette } from "../lib/palette.js";

function iterateJulia(re: number, im: number, maxIter: number, cr: number, ci: number): number {
  let zr = re;
  let zi = im;

  for (let i = 0; i < maxIter; i++) {
    const zr2 = zr * zr - zi * zi + cr;
    const zi2 = 2 * zr * zi + ci;
    zr = zr2;
    zi = zi2;
    if (zr * zr + zi * zi > 4) {
      return i;
    }
  }

  return maxIter;
}

export const juliaExhibit: Exhibit = {
  id: "julia",
  path: "/julia",
  title: "Julia Set",
  category: "Fractals",
  summary:
    "Fix a complex constant c and colour each point by how its orbit under z → z² + c behaves.",
  maths:
    "The Julia set J(c) is the boundary of points z₀ whose iteration zₙ₊₁ = zₙ² + c remains bounded. " +
    "For some c the set is connected (inside the Mandelbrot set); for others it shatters into dust. " +
    "The same quadratic map as the Mandelbrot set, but c is fixed and the starting point z₀ varies across the plane.",
  params: [
    {
      id: "cr",
      type: "number",
      label: "c (real)",
      min: -1.5,
      max: 1.5,
      step: 0.01,
    },
    {
      id: "ci",
      type: "number",
      label: "c (imaginary)",
      min: -1.5,
      max: 1.5,
      step: 0.01,
    },
    {
      id: "zoom",
      type: "number",
      label: "Zoom",
      min: 0.5,
      max: 50,
      step: 0.5,
    },
    {
      id: "maxIter",
      type: "number",
      label: "Max iterations",
      min: 32,
      max: 256,
      step: 8,
    },
  ],
  defaults: {
    cr: -0.7,
    ci: 0.27015,
    zoom: 1,
    maxIter: 128,
  },
  exportFilename: "julia.png",
  draw(ctx, width, height, values) {
    const cr = Number(values.cr);
    const ci = Number(values.ci);
    const zoom = Number(values.zoom);
    const maxIter = Number(values.maxIter);

    renderEscapeTime(
      ctx,
      width,
      height,
      { centerRe: 0, centerIm: 0, span: 3 / zoom },
      maxIter,
      (re, im, limit) => iterateJulia(re, im, limit, cr, ci),
      (iter, limit) => {
        if (iter >= limit) {
          return [8, 6, 24];
        }
        return nebulaPalette(iter / limit);
      },
    );
  },
};
