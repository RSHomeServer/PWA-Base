import { clamp, lerp } from "@platform/math";

export interface MandelbrotParams {
  centerRe: number;
  centerIm: number;
  zoom: number;
  maxIter: number;
}

function iterateMandelbrot(re: number, im: number, maxIter: number): number {
  let zr = 0;
  let zi = 0;

  for (let i = 0; i < maxIter; i++) {
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

function colorForIteration(iter: number, maxIter: number): [number, number, number] {
  if (iter >= maxIter) {
    return [10, 10, 20];
  }

  const t = iter / maxIter;
  const r = clamp(Math.floor(lerp(20, 255, t)), 0, 255);
  const g = clamp(Math.floor(lerp(40, 180, 1 - t)), 0, 255);
  const b = clamp(Math.floor(lerp(120, 60, t)), 0, 255);
  return [r, g, b];
}

export function drawMandelbrot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: MandelbrotParams,
): void {
  const { centerRe, centerIm, zoom, maxIter } = params;
  const imageData = ctx.createImageData(width, height);
  const span = 3 / zoom;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const re = centerRe + ((px - width / 2) / width) * span;
      const im = centerIm + ((py - height / 2) / height) * span;
      const iter = iterateMandelbrot(re, im, maxIter);
      const [r, g, b] = colorForIteration(iter, maxIter);
      const idx = (py * width + px) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
