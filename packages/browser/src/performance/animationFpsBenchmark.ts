import { formatNumber } from "../format.js";
import { verdictFromThresholds } from "../verdict.js";
import type { BenchmarkResult } from "../hooks/useBenchmark.js";

const TOTAL_DURATION_MS = 3000;

export async function runAnimationFpsBenchmark(
  stage: HTMLElement,
  ball: HTMLElement,
): Promise<BenchmarkResult> {
  const width = stage.clientWidth - 22;
  const height = stage.clientHeight - 22;
  let x = width / 2;
  let y = height / 2;
  let vx = 3.4;
  let vy = 2.6;

  return new Promise((resolve) => {
    const start = performance.now();
    let lastFrame = start;
    const fpsWindow: number[] = [];

    const frame = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;
      if (dt > 0) {
        fpsWindow.push(1000 / dt);
      }

      x += vx;
      y += vy;
      if (x <= 0 || x >= width) vx *= -1;
      if (y <= 0 || y >= height) vy *= -1;
      ball.style.transform = `translate(${x}px, ${y}px)`;

      const elapsed = now - start;
      if (elapsed < TOTAL_DURATION_MS) {
        requestAnimationFrame(frame);
      } else {
        const avg = fpsWindow.reduce((sum, v) => sum + v, 0) / fpsWindow.length;
        const min = Math.min(...fpsWindow);
        resolve({
          score: avg,
          unit: "fps",
          label: `${formatNumber(avg, 1)} fps avg`,
          verdict: verdictFromThresholds(avg, 30, 55),
          detail: `Minimum frame rate ${formatNumber(min, 1)} fps across ${fpsWindow.length} frames`,
          series: fpsWindow,
        });
      }
    };

    requestAnimationFrame(frame);
  });
}
