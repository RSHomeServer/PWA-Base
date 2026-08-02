export interface FractalView {
  centerRe: number;
  centerIm: number;
  span: number;
}

export interface FractalField {
  width: number;
  height: number;
  maxIter: number;
  /** Smooth (fractional) escape iteration count; -1 means the point never escaped. */
  values: Float32Array;
  rowsDone: number;
}

export function createField(width: number, height: number, maxIter: number): FractalField {
  const values = new Float32Array(width * height);
  values.fill(-1);
  return { width, height, maxIter, values, rowsDone: 0 };
}

/** Smooth escape-time estimate for z -> z^2 + c, seeded at z0 = (re0, im0). */
export function escapeSmooth(
  zr0: number,
  zi0: number,
  cr: number,
  ci: number,
  maxIter: number,
): number {
  let zr = zr0;
  let zi = zi0;
  let zr2 = zr * zr;
  let zi2 = zi * zi;
  let i = 0;
  for (; i < maxIter; i++) {
    zi = 2 * zr * zi + ci;
    zr = zr2 - zi2 + cr;
    zr2 = zr * zr;
    zi2 = zi * zi;
    if (zr2 + zi2 > 4) {
      break;
    }
  }
  if (i >= maxIter) {
    return -1;
  }
  const logZn = Math.log(zr2 + zi2) / 2;
  const nu = Math.log(logZn / Math.LN2) / Math.LN2;
  return i + 1 - nu;
}

export function mandelbrotEscape(re: number, im: number, maxIter: number): number {
  return escapeSmooth(0, 0, re, im, maxIter);
}

export function makeJuliaEscape(
  cr: number,
  ci: number,
): (re: number, im: number, maxIter: number) => number {
  return (re, im, maxIter) => escapeSmooth(re, im, cr, ci, maxIter);
}

/**
 * Fills rows into `field` from where it left off, spending at most `budgetMs`
 * of wall-clock time. Returns true once the whole field is filled. Call again
 * on the next frame to continue — this keeps the UI thread responsive even at
 * high iteration counts.
 */
export function computeBudget(
  field: FractalField,
  view: FractalView,
  budgetMs: number,
  escape: (re: number, im: number, maxIter: number) => number,
): boolean {
  const { width, height, values, maxIter } = field;
  const aspect = width / height;
  const spanX = view.span;
  const spanY = view.span / aspect;
  const start = performance.now();
  let py = field.rowsDone;

  while (py < height) {
    const im = view.centerIm + (py / height - 0.5) * spanY;
    const rowBase = py * width;
    for (let px = 0; px < width; px++) {
      const re = view.centerRe + (px / width - 0.5) * spanX;
      values[rowBase + px] = escape(re, im, maxIter);
    }
    py++;
    if (performance.now() - start > budgetMs) {
      break;
    }
  }

  field.rowsDone = py;
  return py >= height;
}

export function paintField(
  field: FractalField,
  imageData: ImageData,
  palette: (t: number) => [number, number, number],
  phase: number,
  cycles: number,
  insideColor: [number, number, number] = [6, 7, 14],
): void {
  const { values, maxIter } = field;
  const data = imageData.data;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    const idx = i * 4;
    if (v < 0) {
      data[idx] = insideColor[0];
      data[idx + 1] = insideColor[1];
      data[idx + 2] = insideColor[2];
      data[idx + 3] = 255;
      continue;
    }
    let t = (v / maxIter) * cycles + phase;
    t -= Math.floor(t);
    const [r, g, b] = palette(t);
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
}

/** Suggests a higher iteration budget as zoom increases, to keep detail crisp. */
export function suggestMaxIter(span: number): number {
  const zoom = 3 / span;
  const suggested = 100 + Math.log2(Math.max(zoom, 1)) * 42;
  return Math.round(Math.min(2000, Math.max(80, suggested)));
}
