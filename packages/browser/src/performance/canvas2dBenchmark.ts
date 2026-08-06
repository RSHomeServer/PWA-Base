import { formatNumber } from "../format.js";
import { verdictFromThresholds } from "../verdict.js";
import type { BenchmarkResult } from "../hooks/useBenchmark.js";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function createParticles(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 3.2,
    vy: (Math.random() - 0.5) * 3.2,
  }));
}

function step(particles: Particle[], width: number, height: number) {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;
  }
}

function draw(ctx: CanvasRenderingContext2D, width: number, height: number, particles: Particle[]) {
  ctx.fillStyle = "rgba(6, 10, 12, 0.32)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#2dd4bf";
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

const MAX_COUNT = 24000;
const TOTAL_DURATION_MS = 4200;

export async function runCanvas2dBenchmark(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<BenchmarkResult> {
  const width = canvas.width;
  const height = canvas.height;
  let count = 200;
  let particles = createParticles(count, width, height);
  let sustainedCount = count;
  let lastFps = 60;

  return new Promise((resolve) => {
    const start = performance.now();
    let lastFrame = start;
    let lastRampCheck = start;
    const fpsWindow: number[] = [];

    const frame = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;
      const fps = dt > 0 ? 1000 / dt : 60;
      fpsWindow.push(fps);
      if (fpsWindow.length > 40) fpsWindow.shift();

      step(particles, width, height);
      draw(ctx, width, height, particles);

      const elapsed = now - start;

      if (now - lastRampCheck > 320) {
        const avgFps = fpsWindow.reduce((sum, v) => sum + v, 0) / fpsWindow.length;
        lastFps = avgFps;
        if (avgFps >= 50 && count < MAX_COUNT) {
          count = Math.min(MAX_COUNT, Math.round(count * 1.7));
          particles = createParticles(count, width, height);
          sustainedCount = count;
        }
        lastRampCheck = now;
      }

      if (elapsed < TOTAL_DURATION_MS) {
        requestAnimationFrame(frame);
      } else {
        const verdict = verdictFromThresholds(sustainedCount, 2000, 8000);
        resolve({
          score: sustainedCount,
          unit: "particles",
          label: `${formatNumber(sustainedCount)} particles`,
          verdict,
          detail: `Sustained ~${lastFps.toFixed(0)} fps at peak load`,
          series: fpsWindow.slice(),
        });
      }
    };

    requestAnimationFrame(frame);
  });
}
