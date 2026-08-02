import type { Rgb } from "./palette.js";
import { fractalPalette, setPixel } from "./palette.js";

export interface ComplexView {
  centerRe: number;
  centerIm: number;
  span: number;
}

export function mapPixelToComplex(
  px: number,
  py: number,
  width: number,
  height: number,
  view: ComplexView,
): { re: number; im: number } {
  return {
    re: view.centerRe + ((px - width / 2) / width) * view.span,
    im: view.centerIm + ((py - height / 2) / height) * view.span,
  };
}

export function renderEscapeTime(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: ComplexView,
  maxIter: number,
  iterate: (re: number, im: number, maxIter: number) => number,
  colorize: (iter: number, maxIter: number) => Rgb,
): void {
  const imageData = ctx.createImageData(width, height);
  const { data } = imageData;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const { re, im } = mapPixelToComplex(px, py, width, height, view);
      const iter = iterate(re, im, maxIter);
      setPixel(data, width, px, py, colorize(iter, maxIter));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function smoothEscapeColor(iter: number, maxIter: number, inside: Rgb, accent: Rgb): Rgb {
  if (iter >= maxIter) {
    return inside;
  }
  return fractalPalette(iter / maxIter + (iter % 7) * 0.03, inside, accent);
}
