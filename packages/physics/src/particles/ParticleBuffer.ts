import { semiImplicitEulerStep } from "../integrators/semiImplicit.js";

export interface ParticleSpawnOptions {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  life?: number;
  size?: number;
  mass?: number;
}

/**
 * Fixed-capacity, struct-of-arrays particle store. Every field is a `Float32Array`
 * allocated once at construction; `spawn`/`kill`/`integrate` never allocate, so a
 * `ParticleBuffer` can safely live inside a `System.step()` hot path.
 *
 * Active particles are kept packed into `[0, count)` — `kill()` swap-removes with the
 * last active particle so iteration never has to skip holes.
 */
export class ParticleBuffer {
  readonly capacity: number;

  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly ax: Float32Array;
  readonly ay: Float32Array;
  readonly life: Float32Array;
  readonly size: Float32Array;
  readonly mass: Float32Array;

  /** Number of currently active particles, packed into indices `[0, count)`. */
  count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.ax = new Float32Array(capacity);
    this.ay = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.mass = new Float32Array(capacity);
  }

  /** Activates a new particle. Returns its index, or -1 if the buffer is full. */
  spawn(opts: ParticleSpawnOptions = {}): number {
    if (this.count >= this.capacity) {
      return -1;
    }
    const i = this.count;
    this.x[i] = opts.x ?? 0;
    this.y[i] = opts.y ?? 0;
    this.vx[i] = opts.vx ?? 0;
    this.vy[i] = opts.vy ?? 0;
    this.ax[i] = 0;
    this.ay[i] = 0;
    this.life[i] = opts.life ?? Infinity;
    this.size[i] = opts.size ?? 1;
    this.mass[i] = opts.mass ?? 1;
    this.count += 1;
    return i;
  }

  /** Deactivates the particle at `index` by swapping the last active particle into its
   * slot, keeping active particles packed at `[0, count)`. O(1), zero allocation. */
  kill(index: number): void {
    if (index < 0 || index >= this.count) {
      return;
    }
    const last = this.count - 1;
    if (index !== last) {
      this.x[index] = this.x[last]!;
      this.y[index] = this.y[last]!;
      this.vx[index] = this.vx[last]!;
      this.vy[index] = this.vy[last]!;
      this.ax[index] = this.ax[last]!;
      this.ay[index] = this.ay[last]!;
      this.life[index] = this.life[last]!;
      this.size[index] = this.size[last]!;
      this.mass[index] = this.mass[last]!;
    }
    this.count -= 1;
  }

  /** Deactivates all particles without shrinking the underlying arrays. */
  clear(): void {
    this.count = 0;
  }

  /** Zeroes accumulated acceleration for active particles. Call before force systems run. */
  clearForces(): void {
    this.ax.fill(0, 0, this.count);
    this.ay.fill(0, 0, this.count);
  }

  /** Accumulates a force at `index`, converting to acceleration via F = m*a. */
  addForce(index: number, fx: number, fy: number): void {
    const invMass = this.mass[index]! > 0 ? 1 / this.mass[index]! : 0;
    this.ax[index] += fx * invMass;
    this.ay[index] += fy * invMass;
  }

  /** Advances active particles one fixed step using semi-implicit Euler over
   * `ax`/`ay`. Does not touch life or reap expired particles (see {@link reapExpired}). */
  integrate(dt: number): void {
    semiImplicitEulerStep(this.x, this.y, this.vx, this.vy, this.ax, this.ay, this.count, dt);
  }

  /** Decrements `life` for all active particles. Combine with {@link reapExpired}. */
  decrementLife(dt: number): void {
    for (let i = 0; i < this.count; i++) {
      this.life[i] -= dt;
    }
  }

  /** Kills every active particle whose `life` has reached zero. Iterates backwards so
   * in-flight swap-removes never skip a particle. */
  reapExpired(): void {
    for (let i = this.count - 1; i >= 0; i--) {
      if (this.life[i]! <= 0) {
        this.kill(i);
      }
    }
  }
}
