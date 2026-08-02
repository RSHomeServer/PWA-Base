/**
 * A regular 2D grid of scalar samples (temperature, density, wave height, pheromone
 * concentration, ...), backed by a single `Float32Array`. Generic enough to serve
 * reaction-diffusion, cellular automata, fluid, or cymatics-style height fields.
 */
export class ScalarField2D {
  readonly width: number;
  readonly height: number;
  /** World-space size of one grid cell, used by `sampleBilinear`/`worldToGrid`. */
  readonly cellSize: number;
  readonly data: Float32Array;

  constructor(width: number, height: number, cellSize = 1) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.data = new Float32Array(width * height);
  }

  index(ix: number, iy: number): number {
    return iy * this.width + ix;
  }

  get(ix: number, iy: number): number {
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return 0;
    }
    return this.data[this.index(ix, iy)]!;
  }

  set(ix: number, iy: number, value: number): void {
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return;
    }
    this.data[this.index(ix, iy)] = value;
  }

  fill(value: number): void {
    this.data.fill(value);
  }

  clear(): void {
    this.data.fill(0);
  }

  /** Fills every cell from a function of its grid coordinates. Not zero-allocation
   * (invokes `fn` per cell) — intended for one-off initialization, not the hot path. */
  fillWith(fn: (ix: number, iy: number) => number): void {
    for (let iy = 0; iy < this.height; iy++) {
      for (let ix = 0; ix < this.width; ix++) {
        this.data[this.index(ix, iy)] = fn(ix, iy);
      }
    }
  }

  /** Bilinearly-interpolated sample at world-space `(x, y)`, using `cellSize` to map
   * into grid space. Out-of-bounds samples clamp to the field edge. */
  sampleBilinear(x: number, y: number): number {
    const gx = x / this.cellSize;
    const gy = y / this.cellSize;

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const tx = gx - x0;
    const ty = gy - y0;

    const x0c = clampIndex(x0, this.width);
    const x1c = clampIndex(x0 + 1, this.width);
    const y0c = clampIndex(y0, this.height);
    const y1c = clampIndex(y0 + 1, this.height);

    const v00 = this.data[this.index(x0c, y0c)]!;
    const v10 = this.data[this.index(x1c, y0c)]!;
    const v01 = this.data[this.index(x0c, y1c)]!;
    const v11 = this.data[this.index(x1c, y1c)]!;

    const top = v00 + (v10 - v00) * tx;
    const bottom = v01 + (v11 - v01) * tx;
    return top + (bottom - top) * ty;
  }
}

function clampIndex(i: number, size: number): number {
  if (i < 0) {
    return 0;
  }
  if (i > size - 1) {
    return size - 1;
  }
  return i;
}
