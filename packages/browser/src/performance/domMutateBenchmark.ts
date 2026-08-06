import { formatNumber } from "../format.js";
import { verdictFromThresholds } from "../verdict.js";
import type { BenchmarkResult } from "../hooks/useBenchmark.js";
import { nextFrame } from "./frame.js";

const TOTAL_DURATION_MS = 1400;
const MAX_VISIBLE = 260;
export const DEFAULT_DOM_CELL_CLASS = "browser-bench-dom-cell";

export async function runDomMutateBenchmark(
  container: HTMLDivElement,
  onProgress: (fraction: number) => void,
  cellClassName = DEFAULT_DOM_CELL_CLASS,
): Promise<BenchmarkResult> {
  container.innerHTML = "";
  const start = performance.now();
  let ops = 0;
  let lastYield = start;

  while (performance.now() - start < TOTAL_DURATION_MS) {
    const cell = document.createElement("div");
    cell.className = cellClassName;
    container.appendChild(cell);
    ops += 1;

    if (container.children.length > MAX_VISIBLE) {
      container.removeChild(container.firstElementChild as Node);
      ops += 1;
    }

    const now = performance.now();
    onProgress(Math.min(1, (now - start) / TOTAL_DURATION_MS));
    if (now - lastYield > 30) {
      await nextFrame();
      lastYield = performance.now();
    }
  }

  const elapsed = performance.now() - start;
  container.innerHTML = "";
  onProgress(1);

  const opsPerSec = ops / (elapsed / 1000);
  return {
    score: opsPerSec,
    unit: "ops/s",
    label: `${formatNumber(opsPerSec)} mutations/s`,
    verdict: verdictFromThresholds(opsPerSec, 8000, 30000),
    detail: `${formatNumber(ops)} create/remove operations in ${elapsed.toFixed(0)} ms`,
  };
}

