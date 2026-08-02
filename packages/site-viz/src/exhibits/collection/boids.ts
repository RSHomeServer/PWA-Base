import type { ParamValues } from "@platform/controls";
import type { Exhibit } from "../types.js";
import { paramsKey } from "../lib/simulation.js";

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface BoidsState {
  key: string;
  boids: Boid[];
}

const stateMap = new WeakMap<CanvasRenderingContext2D, BoidsState>();

function createBoids(count: number, width: number, height: number): Boid[] {
  const boids: Boid[] = [];
  for (let i = 0; i < count; i++) {
    boids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
    });
  }
  return boids;
}

function getState(
  ctx: CanvasRenderingContext2D,
  values: ParamValues,
  width: number,
  height: number,
): BoidsState {
  const key = paramsKey(values, ["count", "separation", "alignment", "cohesion", "maxSpeed"]);
  const existing = stateMap.get(ctx);
  if (existing && existing.key === key) {
    return existing;
  }

  const state: BoidsState = {
    key,
    boids: createBoids(Number(values.count), width, height),
  };
  stateMap.set(ctx, state);
  return state;
}

function limitSpeed(boid: Boid, maxSpeed: number): void {
  const speed = Math.hypot(boid.vx, boid.vy);
  if (speed > maxSpeed) {
    boid.vx = (boid.vx / speed) * maxSpeed;
    boid.vy = (boid.vy / speed) * maxSpeed;
  }
}

function updateBoids(state: BoidsState, width: number, height: number, values: ParamValues): void {
  const separation = Number(values.separation);
  const alignment = Number(values.alignment);
  const cohesion = Number(values.cohesion);
  const maxSpeed = Number(values.maxSpeed);
  const perception = 60;

  for (const boid of state.boids) {
    let sepX = 0;
    let sepY = 0;
    let alignX = 0;
    let alignY = 0;
    let cohX = 0;
    let cohY = 0;
    let sepCount = 0;
    let flockCount = 0;

    for (const other of state.boids) {
      if (other === boid) {
        continue;
      }
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const dist = Math.hypot(dx, dy);
      if (dist > perception || dist === 0) {
        continue;
      }
      if (dist < 25) {
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepCount += 1;
      }
      alignX += other.vx;
      alignY += other.vy;
      cohX += other.x;
      cohY += other.y;
      flockCount += 1;
    }

    if (sepCount > 0) {
      boid.vx += (sepX / sepCount) * separation;
      boid.vy += (sepY / sepCount) * separation;
    }
    if (flockCount > 0) {
      boid.vx += (alignX / flockCount - boid.vx) * alignment;
      boid.vy += (alignY / flockCount - boid.vy) * alignment;
      boid.vx += (cohX / flockCount - boid.x) * cohesion * 0.01;
      boid.vy += (cohY / flockCount - boid.y) * cohesion * 0.01;
    }

    limitSpeed(boid, maxSpeed);
    boid.x += boid.vx;
    boid.y += boid.vy;

    if (boid.x < 0) {
      boid.x += width;
    } else if (boid.x > width) {
      boid.x -= width;
    }
    if (boid.y < 0) {
      boid.y += height;
    } else if (boid.y > height) {
      boid.y -= height;
    }
  }
}

export const boidsExhibit: Exhibit = {
  id: "boids",
  path: "/boids",
  title: "Boids Flocking",
  category: "Particles",
  summary:
    "Emergent flocking from three local rules — separation, alignment, and cohesion — on a torus.",
  maths:
    "Each boid steers based on nearby neighbours: avoid crowding (separation), match velocity (alignment), " +
    "and move toward the flock centre (cohesion). Craig Reynolds showed these three forces produce " +
    "lifelike murmurations without central control.",
  animated: true,
  params: [
    {
      id: "count",
      type: "number",
      label: "Boid count",
      min: 20,
      max: 200,
      step: 10,
    },
    {
      id: "separation",
      type: "number",
      label: "Separation",
      min: 0,
      max: 2,
      step: 0.1,
    },
    {
      id: "alignment",
      type: "number",
      label: "Alignment",
      min: 0,
      max: 0.2,
      step: 0.01,
    },
    {
      id: "cohesion",
      type: "number",
      label: "Cohesion",
      min: 0,
      max: 2,
      step: 0.1,
    },
    {
      id: "maxSpeed",
      type: "number",
      label: "Max speed",
      min: 1,
      max: 8,
      step: 0.5,
    },
  ],
  defaults: {
    count: 80,
    separation: 0.8,
    alignment: 0.05,
    cohesion: 0.6,
    maxSpeed: 4,
  },
  exportFilename: "boids.png",
  draw(ctx, width, height, values) {
    const state = getState(ctx, values, width, height);
    updateBoids(state, width, height, values);

    ctx.fillStyle = "rgb(5, 8, 18)";
    ctx.fillRect(0, 0, width, height);

    for (const boid of state.boids) {
      const speed = Math.hypot(boid.vx, boid.vy);
      const hue = 180 + speed * 15;
      const angle = Math.atan2(boid.vy, boid.vx);
      ctx.save();
      ctx.translate(boid.x, boid.y);
      ctx.rotate(angle);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.85)`;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, 3);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, -3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },
};
