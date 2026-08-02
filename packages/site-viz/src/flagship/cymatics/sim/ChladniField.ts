import { clamp } from "@platform/math";
import { besselJ, besselJZero } from "./bessel.js";

export type PlateShape = "rect" | "circle";

export interface ChladniModeSpec {
  n: number;
  m: number;
}

export interface ExcitationPoint {
  x: number;
  y: number;
}

export interface GradientSample {
  gx: number;
  gy: number;
}

const MIN_COUPLING = 0.22;

/**
 * A vibrating-plate mode field: computes the standing-wave amplitude
 * `u(x, y)` of a rectangular or circular plate for a given `(n, m)` mode (or a
 * weighted blend of two modes), and caches it on a grid so it can be sampled
 * cheaply — with bilinear interpolation — for every particle, every frame.
 *
 * Rectangular plates use the classic free-plate approximation
 *   `u(x,y) = cos(nπx/L)cos(mπy/W) − cos(mπx/L)cos(nπy/W)`
 * (the antisymmetric combination that produces the familiar Chladni figures —
 * note it vanishes identically for `n === m`, matching real free-plate physics
 * where those combinations carry no net pattern).
 *
 * Circular plates use the drum/membrane approximation
 *   `u(r,θ) = J_n(j_{n,m} · r/R) · cos(nθ)`
 * where `j_{n,m}` is the `m`-th zero of the Bessel function `J_n` — the same
 * family of patterns Chladni himself photographed on circular plates.
 *
 * Particles migrate toward nodes (`u ≈ 0`) because the simulation pushes them
 * down the gradient of vibration *energy* `u²`, which is zero exactly on nodal
 * lines and maximal at antinodes — see `sampleEnergyGradient`.
 */
export class ChladniField {
  shape: PlateShape = "rect";
  length = 12;
  width = 12;
  radius = 6;

  private readonly resolution: number;
  private primary: ChladniModeSpec = { n: 3, m: 5 };
  private secondary: ChladniModeSpec | null = null;
  private secondaryBlend = 0;
  private sources: ExcitationPoint[] = [];

  /** Normalized amplitude, range roughly [-1, 1]. */
  private ampGrid: Float32Array;
  /** Gradient of normalized energy (u²) w.r.t. world x/y. */
  private gradXGrid: Float32Array;
  private gradYGrid: Float32Array;

  constructor(resolution = 176) {
    this.resolution = resolution;
    const cells = resolution * resolution;
    this.ampGrid = new Float32Array(cells);
    this.gradXGrid = new Float32Array(cells);
    this.gradYGrid = new Float32Array(cells);
    this.recompute();
  }

  get halfExtentX(): number {
    return this.shape === "circle" ? this.radius : this.length / 2;
  }

  get halfExtentY(): number {
    return this.shape === "circle" ? this.radius : this.width / 2;
  }

  setPlate(shape: PlateShape, length: number, width: number, radius: number): void {
    this.shape = shape;
    this.length = length;
    this.width = width;
    this.radius = radius;
    this.recompute();
  }

  setPrimaryMode(mode: ChladniModeSpec): void {
    this.primary = mode;
    this.recompute();
  }

  setSecondaryMode(mode: ChladniModeSpec | null, blend: number): void {
    this.secondary = mode;
    this.secondaryBlend = clamp(blend, 0, 1);
    this.recompute();
  }

  setSources(sources: readonly ExcitationPoint[]): void {
    this.sources = sources.slice();
    this.recompute();
  }

  getSources(): ExcitationPoint[] {
    return this.sources.slice();
  }

  /** The plate's spatial eigenvalue `k²` for `(n, m)` — proportional to the
   * square of the mode's resonant angular frequency for a thin plate, so the
   * UI can present a physically ordered "frequency" axis and snap to presets. */
  eigenvalue(mode: ChladniModeSpec): number {
    if (this.shape === "circle") {
      const k = besselJZero(mode.n, mode.m) / Math.max(this.radius, 1e-6);
      return k * k;
    }
    const kx = mode.n / Math.max(this.length, 1e-6);
    const ky = mode.m / Math.max(this.width, 1e-6);
    return kx * kx + ky * ky;
  }

  /** Raw (unnormalized, unscaled) mode shape value at plate-local `(x, y)`. */
  private modeShape(mode: ChladniModeSpec, x: number, y: number): number {
    if (this.shape === "circle") {
      const r = Math.hypot(x, y);
      if (r > this.radius + 1e-6) {
        return 0;
      }
      const zero = besselJZero(mode.n, mode.m);
      const radial = besselJ(mode.n, (zero * r) / this.radius);
      const theta = Math.atan2(y, x);
      return radial * Math.cos(mode.n * theta);
    }
    const xs = x + this.length / 2;
    const ys = y + this.width / 2;
    const a =
      Math.cos((mode.n * Math.PI * xs) / this.length) *
      Math.cos((mode.m * Math.PI * ys) / this.width);
    const b =
      Math.cos((mode.m * Math.PI * xs) / this.length) *
      Math.cos((mode.n * Math.PI * ys) / this.width);
    return a - b;
  }

  /** How strongly a mode is driven given the current excitation points — a
   * crude modal-coupling model: coupling is the mode shape evaluated at the
   * drive point(s), floored so a driver never sits in perfect silence (real
   * excitation is never a pure single mode). */
  private couplingFor(mode: ChladniModeSpec): number {
    const points = this.sources.length > 0 ? this.sources : [{ x: 0, y: 0 }];
    let sum = 0;
    for (const p of points) {
      sum += this.modeShape(mode, p.x, p.y);
    }
    const avg = sum / points.length;
    const magnitude = Math.max(Math.abs(avg), MIN_COUPLING);
    return Math.sign(avg) >= 0 ? magnitude : -magnitude;
  }

  private evaluate(x: number, y: number): number {
    const primaryCoupling = this.couplingFor(this.primary);
    let value = primaryCoupling * this.modeShape(this.primary, x, y);
    if (this.secondary && this.secondaryBlend > 0) {
      const secondaryCoupling = this.couplingFor(this.secondary);
      const blended = secondaryCoupling * this.modeShape(this.secondary, x, y);
      value = value * (1 - this.secondaryBlend) + blended * this.secondaryBlend;
    }
    return value;
  }

  /** Rebuilds the amplitude + energy-gradient grids. Cheap (a few hundred
   * thousand trig/Bessel evaluations) and only needed when plate geometry,
   * modes, or excitation points change — never per animation frame. */
  recompute(): void {
    const res = this.resolution;
    const hx = this.halfExtentX;
    const hy = this.halfExtentY;
    const dx = (2 * hx) / (res - 1);
    const dy = (2 * hy) / (res - 1);

    let maxAbs = 1e-6;
    for (let iy = 0; iy < res; iy++) {
      const y = -hy + dy * iy;
      for (let ix = 0; ix < res; ix++) {
        const x = -hx + dx * ix;
        const v = this.evaluate(x, y);
        this.ampGrid[iy * res + ix] = v;
        const abs = Math.abs(v);
        if (abs > maxAbs) {
          maxAbs = abs;
        }
      }
    }

    const invMax = 1 / maxAbs;
    for (let i = 0; i < this.ampGrid.length; i++) {
      this.ampGrid[i] = this.ampGrid[i]! * invMax;
    }

    // Gradient of normalized energy (amplitude²) via central differences —
    // this is the vector particles are pushed *down*, so they slide off
    // antinodes and collect on nodal lines.
    for (let iy = 0; iy < res; iy++) {
      for (let ix = 0; ix < res; ix++) {
        const i = iy * res + ix;
        const xm = ix > 0 ? ix - 1 : ix;
        const xp = ix < res - 1 ? ix + 1 : ix;
        const ym = iy > 0 ? iy - 1 : iy;
        const yp = iy < res - 1 ? iy + 1 : iy;
        const eLeft = this.ampGrid[iy * res + xm]! ** 2;
        const eRight = this.ampGrid[iy * res + xp]! ** 2;
        const eDown = this.ampGrid[ym * res + ix]! ** 2;
        const eUp = this.ampGrid[yp * res + ix]! ** 2;
        const spanX = Math.max((xp - xm) * dx, 1e-6);
        const spanY = Math.max((yp - ym) * dy, 1e-6);
        this.gradXGrid[i] = (eRight - eLeft) / spanX;
        this.gradYGrid[i] = (eUp - eDown) / spanY;
      }
    }
  }

  private toGridSpace(x: number, y: number): { fx: number; fy: number } {
    const res = this.resolution;
    const hx = this.halfExtentX;
    const hy = this.halfExtentY;
    const fx = clamp(((x + hx) / (2 * hx)) * (res - 1), 0, res - 1.0001);
    const fy = clamp(((y + hy) / (2 * hy)) * (res - 1), 0, res - 1.0001);
    return { fx, fy };
  }

  private sampleGrid(grid: Float32Array, x: number, y: number): number {
    const res = this.resolution;
    const { fx, fy } = this.toGridSpace(x, y);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = Math.min(x0 + 1, res - 1);
    const y1 = Math.min(y0 + 1, res - 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const v00 = grid[y0 * res + x0]!;
    const v10 = grid[y0 * res + x1]!;
    const v01 = grid[y1 * res + x0]!;
    const v11 = grid[y1 * res + x1]!;
    const top = v00 + (v10 - v00) * tx;
    const bottom = v01 + (v11 - v01) * tx;
    return top + (bottom - top) * ty;
  }

  /** Normalized amplitude in roughly [-1, 1] at plate-local `(x, y)`. */
  sampleAmplitude(x: number, y: number): number {
    return this.sampleGrid(this.ampGrid, x, y);
  }

  /** Vibration energy density (`amplitude²`), in [0, 1]. Zero on nodal lines. */
  sampleEnergy(x: number, y: number): number {
    const a = this.sampleAmplitude(x, y);
    return a * a;
  }

  /** Gradient of energy — particles are pushed along `-gradient` to descend
   * toward nodes. */
  sampleEnergyGradient(x: number, y: number): GradientSample {
    return {
      gx: this.sampleGrid(this.gradXGrid, x, y),
      gy: this.sampleGrid(this.gradYGrid, x, y),
    };
  }

  /** True if `(x, y)` lies within the plate boundary. */
  contains(x: number, y: number): boolean {
    if (this.shape === "circle") {
      return x * x + y * y <= this.radius * this.radius;
    }
    return Math.abs(x) <= this.length / 2 && Math.abs(y) <= this.width / 2;
  }

  /** Grid resolution, exposed read-only for renderers that sample the field
   * directly (contours, wireframe, vector field). */
  get gridResolution(): number {
    return this.resolution;
  }
}
