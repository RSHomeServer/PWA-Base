import { clamp, lerp } from "@platform/math";
import type { Exhibit } from "../types.js";

type Star = { x: number; y: number; z: number };

function initStars(count: number, width: number, height: number, seed: number): Star[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: (rand() - 0.5) * width,
    y: (rand() - 0.5) * height,
    z: rand() * width,
  }));
}

export const starfield: Exhibit = {
  id: "starfield",
  path: "/starfield",
  title: "Warp Starfield",
  category: "Particles",
  summary: "Classic perspective starfield simulating forward flight through space.",
  maths:
    "Each star at (x, y, z) projects to screen (x/z, y/z) with perspective divide. " +
    "Advancing z ← z − v each frame creates radial streaks; resetting z when z ≤ 0 recycles stars at the far plane.",
  params: [
    { id: "stars", label: "Stars", type: "number", min: 100, max: 2000, step: 50 },
    { id: "speed", label: "Warp speed", type: "number", min: 1, max: 40, step: 1 },
    { id: "seed", label: "Seed", type: "number", min: 0, max: 999, step: 1 },
    { id: "streak", label: "Streak length", type: "number", min: 0, max: 1, step: 0.05 },
    { id: "fov", label: "Field of view", type: "number", min: 128, max: 512, step: 16 },
  ],
  defaults: {
    stars: 800,
    speed: 12,
    seed: 77,
    streak: 0.6,
    fov: 256,
  },
  animated: true,
  width: 960,
  height: 720,
  exportFilename: "starfield.png",
  draw(ctx, width, height, values, time) {
    const count = values.stars as number;
    const speed = values.speed as number;
    const seed = values.seed as number;
    const streak = values.streak as number;
    const fov = values.fov as number;

    const store = starfield as Exhibit & {
      _state?: { stars: Star[]; lastSeed: number; lastCount: number };
    };
    if (!store._state || store._state.lastSeed !== seed || store._state.lastCount !== count) {
      store._state = {
        stars: initStars(count, width, height, seed),
        lastSeed: seed,
        lastCount: count,
      };
      ctx.fillStyle = "#000008";
      ctx.fillRect(0, 0, width, height);
    }
    const state = store._state;
    const cx = width / 2;
    const cy = height / 2;

    ctx.fillStyle = "rgba(0, 0, 12, 0.35)";
    ctx.fillRect(0, 0, width, height);

    const pulse = 1 + Math.sin(time * 2) * 0.05;

    for (const star of state.stars) {
      star.z -= speed * pulse;
      if (star.z <= 1) {
        star.z = width;
        star.x = (Math.random() - 0.5) * width;
        star.y = (Math.random() - 0.5) * height;
      }

      const k = fov / star.z;
      const sx = cx + star.x * k;
      const sy = cy + star.y * k;

      if (sx < 0 || sx >= width || sy < 0 || sy >= height) {
        continue;
      }

      const depth = clamp(1 - star.z / width, 0, 1);
      const size = lerp(0.4, 2.5, depth);
      const brightness = lerp(80, 255, depth);

      if (streak > 0) {
        const prevK = fov / (star.z + speed * streak * 4);
        const px = cx + star.x * prevK;
        const py = cy + star.y * prevK;
        ctx.strokeStyle = `rgba(${brightness}, ${brightness}, 255, ${lerp(0.2, 0.9, depth)})`;
        ctx.lineWidth = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, 255)`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
};
