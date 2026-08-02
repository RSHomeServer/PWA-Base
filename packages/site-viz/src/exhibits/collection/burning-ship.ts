import type { Exhibit } from "../types.js";
import { renderEscapeTime } from "../lib/fractal.js";
import { heatPalette } from "../lib/palette.js";

function iterateBurningShip(re: number, im: number, maxIter: number): number {
  let zr = 0;
  let zi = 0;

  for (let i = 0; i < maxIter; i++) {
    zr = Math.abs(zr);
    zi = Math.abs(zi);
    const zr2 = zr * zr - zi * zi + re;
    const zi2 = 2 * zr * zi + im;
    zr = zr2;
    zi = zi2;
    if (zr * zr + zi * zi > 4) {
      return i;
    }
  }

  return maxIter;
}

export const burningShipExhibit: Exhibit = {
  id: "burning-ship",
  path: "/burning-ship",
  title: "Burning Ship Fractal",
  category: "Fractals",
  summary:
    "A Mandelbrot variant with absolute values — asymmetric folds create a ship-like silhouette.",
  maths:
    "The Burning Ship fractal uses the map zₙ₊₁ = (|Re zₙ| + i|Im zₙ|)² + c with c equal to the pixel coordinate. " +
    "Taking absolute values breaks symmetry and produces sharp, flame-like ridges. " +
    "Zoom toward the 'deck' region to see intricate hull detail.",
  params: [
    {
      id: "zoom",
      type: "number",
      label: "Zoom",
      min: 0.5,
      max: 200,
      step: 0.5,
    },
    {
      id: "centerRe",
      type: "number",
      label: "Centre (real)",
      min: -2,
      max: 0.5,
      step: 0.01,
    },
    {
      id: "centerIm",
      type: "number",
      label: "Centre (imaginary)",
      min: -2.5,
      max: 0.5,
      step: 0.01,
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
    zoom: 1,
    centerRe: -0.4,
    centerIm: -0.6,
    maxIter: 128,
  },
  exportFilename: "burning-ship.png",
  draw(ctx, width, height, values) {
    const zoom = Number(values.zoom);
    const centerRe = Number(values.centerRe);
    const centerIm = Number(values.centerIm);
    const maxIter = Number(values.maxIter);

    renderEscapeTime(
      ctx,
      width,
      height,
      { centerRe, centerIm, span: 3 / zoom },
      maxIter,
      iterateBurningShip,
      (iter, limit) => {
        if (iter >= limit) {
          return [20, 8, 4];
        }
        return heatPalette(iter / limit);
      },
    );
  },
};
