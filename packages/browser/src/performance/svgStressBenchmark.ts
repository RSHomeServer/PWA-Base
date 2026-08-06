import { formatNumber } from "../format.js";
import { verdictFromThresholds } from "../verdict.js";
import type { BenchmarkResult } from "../hooks/useBenchmark.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_NODES = 14000;
const BATCH_SIZE = 150;
const TOTAL_DURATION_MS = 4200;

export async function runSvgStressBenchmark(svg: SVGSVGElement): Promise<BenchmarkResult> {
  const width = svg.clientWidth;
  const height = svg.clientHeight;

  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  let nodeCount = 0;
  let sustainedCount = 0;
  let lastFps = 60;

  return new Promise((resolve) => {
    const start = performance.now();
    let lastFrame = start;
    const fpsWindow: number[] = [];

    const frame = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;
      const fps = dt > 0 ? 1000 / dt : 60;
      fpsWindow.push(fps);
      if (fpsWindow.length > 40) fpsWindow.shift();
      const avgFps = fpsWindow.reduce((sum, v) => sum + v, 0) / fpsWindow.length;
      lastFps = avgFps;

      if (avgFps >= 50 && nodeCount < MAX_NODES) {
        for (let i = 0; i < BATCH_SIZE && nodeCount < MAX_NODES; i += 1) {
          const circle = document.createElementNS(SVG_NS, "circle");
          circle.setAttribute("cx", String(Math.random() * width));
          circle.setAttribute("cy", String(Math.random() * height));
          circle.setAttribute("r", String(1 + Math.random() * 2));
          circle.setAttribute("fill", "rgba(45, 212, 191, 0.55)");
          svg.appendChild(circle);
          nodeCount += 1;
        }
        sustainedCount = nodeCount;
      }

      const children = svg.children;
      const jitterCount = Math.min(children.length, 500);
      for (let i = 0; i < jitterCount; i += 1) {
        const node = children[Math.floor(Math.random() * children.length)];
        if (!(node instanceof SVGCircleElement)) continue;
        const cx = parseFloat(node.getAttribute("cx") ?? "0") + (Math.random() - 0.5) * 2.4;
        node.setAttribute("cx", String(((cx % width) + width) % width));
      }

      const elapsed = now - start;
      if (elapsed < TOTAL_DURATION_MS) {
        requestAnimationFrame(frame);
      } else {
        resolve({
          score: sustainedCount,
          unit: "nodes",
          label: `${formatNumber(sustainedCount)} SVG nodes`,
          verdict: verdictFromThresholds(sustainedCount, 1500, 6000),
          detail: `Sustained ~${lastFps.toFixed(0)} fps while jittering live nodes`,
          series: fpsWindow.slice(),
        });
      }
    };

    requestAnimationFrame(frame);
  });
}
