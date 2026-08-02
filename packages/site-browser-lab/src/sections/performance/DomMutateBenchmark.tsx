import { useCallback, useRef } from "react";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import { useBenchmark, type BenchmarkResult } from "../../hooks/useBenchmark.js";
import { formatNumber } from "../../lib/format.js";
import { verdictFromThresholds } from "../../lib/verdict.js";
import { nextFrame } from "./frame.js";
import styles from "./stage.module.css";

const TOTAL_DURATION_MS = 1400;
const MAX_VISIBLE = 260;

async function runDomBenchmark(
  container: HTMLDivElement,
  onProgress: (fraction: number) => void,
): Promise<BenchmarkResult> {
  container.innerHTML = "";
  const start = performance.now();
  let ops = 0;
  let lastYield = start;

  while (performance.now() - start < TOTAL_DURATION_MS) {
    const cell = document.createElement("div");
    cell.className = styles.domCell;
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

export function DomMutateBenchmark() {
  const containerRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (ctx: { onProgress: (fraction: number) => void }) => {
    const container = containerRef.current;
    if (!container) {
      throw new Error("DOM stage was not ready.");
    }
    return runDomBenchmark(container, ctx.onProgress);
  }, []);

  const bench = useBenchmark(run);

  return (
    <BenchmarkCard
      title="DOM mutation throughput"
      description="Continuously creates, appends, and evicts DOM nodes in a live grid for 1.4 seconds and reports mutation operations per second."
      status={bench.status}
      progress={bench.progress}
      result={bench.result}
      error={bench.error}
      onRun={bench.run}
      runLabel="Run DOM test"
      historyKey="dom-mutation"
      typical={{ value: 8000, label: "Typical desktop" }}
    >
      <div
        ref={containerRef}
        className={styles.domStage}
        aria-label="DOM mutation benchmark preview"
      />
    </BenchmarkCard>
  );
}
