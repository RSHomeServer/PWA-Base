import type { System, World } from "@platform/physics";
import { ParticleBuffer, applyDrag, applyUniformForce } from "@platform/physics";
import { mulberry32 } from "../../shared/rng.js";
import { ChladniField } from "./ChladniField.js";

export interface CymaticsSystemParams {
  /** Overall strength pulling grains down the vibration-energy gradient toward nodes. */
  forceGain: number;
  /** Ambient agitation at antinodes — proportional to local vibration energy, plus a floor so motion never fully stops. */
  jitter: number;
  /** Linear drag coefficient. */
  damping: number;
  /** Small constant bias (simulates a gentle table tilt / settle pull), 0..1. */
  gravity: number;
  /** Seconds before a settled grain respawns elsewhere; <= 0 disables respawning. */
  lifetime: number;
  /** 0..1 — how close the current frequency is to a resonance; scales the whole force field so off-resonance drive just jitters sand aimlessly. */
  resonance: number;
}

const DEFAULT_PARAMS: CymaticsSystemParams = {
  forceGain: 1,
  jitter: 1,
  damping: 2.2,
  gravity: 0,
  lifetime: 0,
  resonance: 1,
};

function readParams(world: World): CymaticsSystemParams {
  const p = world.getParams();
  return {
    forceGain: typeof p.cymForceGain === "number" ? p.cymForceGain : DEFAULT_PARAMS.forceGain,
    jitter: typeof p.cymJitter === "number" ? p.cymJitter : DEFAULT_PARAMS.jitter,
    damping: typeof p.cymDamping === "number" ? p.cymDamping : DEFAULT_PARAMS.damping,
    gravity: typeof p.cymGravity === "number" ? p.cymGravity : DEFAULT_PARAMS.gravity,
    lifetime: typeof p.cymLifetime === "number" ? p.cymLifetime : DEFAULT_PARAMS.lifetime,
    resonance: typeof p.cymResonance === "number" ? p.cymResonance : DEFAULT_PARAMS.resonance,
  };
}

/**
 * Drives a `ParticleBuffer` of "sand" grains across a `ChladniField`: each
 * step, every active grain feels a force down the local vibration-energy
 * gradient (toward nodes), an agitation jitter proportional to local energy
 * (so it settles once it reaches a node), a light drag, and an optional
 * gravity bias. Grains that wander off the plate are reflected back; grains
 * can optionally have a finite lifetime so the migration keeps visibly
 * happening rather than freezing into a static image forever.
 */
export class CymaticsSystem implements System {
  readonly id: string;
  readonly field: ChladniField;
  readonly particles: ParticleBuffer;

  private rng: () => number;
  private readonly seedValue: number;
  private time = 0;

  constructor(id: string, field: ChladniField, capacity: number, seed = 1) {
    this.id = id;
    this.field = field;
    this.particles = new ParticleBuffer(capacity);
    this.seedValue = seed;
    this.rng = mulberry32(seed);
  }

  private randomPointOnPlate(): { x: number; y: number } {
    const field = this.field;
    if (field.shape === "circle") {
      const r = Math.sqrt(this.rng()) * field.radius;
      const theta = this.rng() * Math.PI * 2;
      return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
    }
    return {
      x: (this.rng() - 0.5) * field.length,
      y: (this.rng() - 0.5) * field.width,
    };
  }

  /** Spawns fresh grains up to `count`, scattered uniformly across the plate. */
  scatterAll(count: number): void {
    this.particles.clear();
    const n = Math.min(count, this.particles.capacity);
    for (let i = 0; i < n; i++) {
      const p = this.randomPointOnPlate();
      this.particles.spawn({
        x: p.x,
        y: p.y,
        life: Infinity,
        size: 1,
      });
    }
  }

  /** Grows or shrinks the active count toward `target`, preserving existing
   * grain positions (used by adaptive-quality scaling and the particle-count
   * slider, so changing count doesn't restart the whole simulation). */
  setActiveCount(target: number): void {
    const clamped = Math.max(0, Math.min(target, this.particles.capacity));
    const buf = this.particles;
    while (buf.count < clamped) {
      const p = this.randomPointOnPlate();
      if (buf.spawn({ x: p.x, y: p.y, life: Infinity, size: 1 }) === -1) {
        break;
      }
    }
    while (buf.count > clamped) {
      buf.kill(buf.count - 1);
    }
  }

  reset(): void {
    this.rng = mulberry32(this.seedValue);
    this.time = 0;
    this.scatterAll(this.particles.count || this.particles.capacity);
  }

  step(world: World, dt: number): void {
    const params = readParams(world);
    const buf = this.particles;
    const field = this.field;
    const count = buf.count;
    this.time += dt;

    buf.clearForces();

    const forceScale = params.forceGain * params.resonance * 46;
    // A slow breathing term keeps settled grains from ever going perfectly
    // static, without disturbing the pattern that's formed.
    const breathing = 0.35 + 0.15 * Math.sin(this.time * 0.35);
    const jitterScale = params.jitter * 26;
    const hx = field.halfExtentX;
    const hy = field.halfExtentY;

    for (let i = 0; i < count; i++) {
      const x = buf.x[i]!;
      const y = buf.y[i]!;
      const { gx, gy } = field.sampleEnergyGradient(x, y);
      buf.ax[i]! -= gx * forceScale;
      buf.ay[i]! -= gy * forceScale;

      const energy = field.sampleEnergy(x, y);
      const jitterMag = (breathing * 0.12 + energy) * jitterScale;
      buf.ax[i]! += (this.rng() - 0.5) * jitterMag;
      buf.ay[i]! += (this.rng() - 0.5) * jitterMag;
    }

    if (params.gravity !== 0) {
      applyUniformForce(buf.ax, buf.ay, count, 0, params.gravity * 6);
    }
    applyDrag(buf.ax, buf.ay, buf.vx, buf.vy, count, params.damping);

    buf.integrate(dt);

    for (let i = count - 1; i >= 0; i--) {
      let x = buf.x[i]!;
      let y = buf.y[i]!;
      if (field.shape === "circle") {
        const r = Math.hypot(x, y);
        if (r > field.radius) {
          const nx = x / (r || 1);
          const ny = y / (r || 1);
          x = nx * field.radius * 0.995;
          y = ny * field.radius * 0.995;
          const vDotN = buf.vx[i]! * nx + buf.vy[i]! * ny;
          buf.vx[i]! -= 1.6 * vDotN * nx;
          buf.vy[i]! -= 1.6 * vDotN * ny;
        }
      } else {
        if (x > hx) {
          x = hx;
          buf.vx[i]! *= -0.35;
        } else if (x < -hx) {
          x = -hx;
          buf.vx[i]! *= -0.35;
        }
        if (y > hy) {
          y = hy;
          buf.vy[i]! *= -0.35;
        } else if (y < -hy) {
          y = -hy;
          buf.vy[i]! *= -0.35;
        }
      }
      buf.x[i] = x;
      buf.y[i] = y;

      if (params.lifetime > 0) {
        if (!Number.isFinite(buf.life[i]!)) {
          buf.life[i] = params.lifetime * (0.4 + 0.6 * this.rng());
        }
        buf.life[i]! -= dt;
        if (buf.life[i]! <= 0) {
          const p = this.randomPointOnPlate();
          buf.x[i] = p.x;
          buf.y[i] = p.y;
          buf.vx[i] = 0;
          buf.vy[i] = 0;
          buf.life[i] = params.lifetime * (0.6 + 0.4 * this.rng());
        }
      }
    }
  }
}
