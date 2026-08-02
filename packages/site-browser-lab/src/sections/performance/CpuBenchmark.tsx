import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import { useBenchmark, type BenchmarkRunner } from "../../hooks/useBenchmark.js";
import { formatNumber } from "../../lib/format.js";
import { verdictFromThresholds } from "../../lib/verdict.js";
import { nextFrame } from "./frame.js";

function makeMatrix(n: number): Float64Array[] {
  return Array.from({ length: n }, () => {
    const row = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      row[i] = Math.random();
    }
    return row;
  });
}

function multiply(a: Float64Array[], b: Float64Array[], n: number): number {
  let ops = 0;
  for (let i = 0; i < n; i += 1) {
    const rowA = a[i]!;
    for (let j = 0; j < n; j += 1) {
      let sum = 0;
      for (let k = 0; k < n; k += 1) {
        sum += rowA[k]! * b[k]![j]!;
        ops += 1;
      }
      rowA[j] = sum;
    }
  }
  return ops;
}

const runner: BenchmarkRunner = async ({ onProgress }) => {
  const totalBudgetMs = 900;
  const start = performance.now();
  let lastYield = start;

  let fibOps = 0;
  let n = 20;

  function fib(depth: number): number {
    fibOps += 1;
    return depth < 2 ? depth : fib(depth - 1) + fib(depth - 2);
  }

  const fibPhaseEnd = start + totalBudgetMs * 0.5;
  while (performance.now() < fibPhaseEnd) {
    fib(n);
    n = 16 + (n % 7);
    const now = performance.now();
    onProgress(Math.min(0.5, (now - start) / totalBudgetMs));
    if (now - lastYield > 40) {
      await nextFrame();
      lastYield = performance.now();
    }
  }

  const size = 30;
  const a = makeMatrix(size);
  const b = makeMatrix(size);
  let matOps = 0;
  const matPhaseEnd = start + totalBudgetMs;
  while (performance.now() < matPhaseEnd) {
    matOps += multiply(a, b, size);
    const now = performance.now();
    onProgress(Math.min(1, (now - start) / totalBudgetMs));
    if (now - lastYield > 40) {
      await nextFrame();
      lastYield = performance.now();
    }
  }

  onProgress(1);
  const elapsed = performance.now() - start;
  const totalOps = fibOps + matOps;
  const mops = totalOps / 1e6 / (elapsed / 1000);
  const verdict = verdictFromThresholds(mops, 25, 90);

  return {
    score: mops,
    unit: "Mops/s",
    label: `${formatNumber(mops, 1)} Mops/s`,
    verdict,
    detail: `${formatNumber(fibOps)} recursive calls + ${formatNumber(matOps)} matrix multiply-adds in ${formatNumber(elapsed)} ms`,
  };
};

export function CpuBenchmark() {
  const bench = useBenchmark(runner);

  return (
    <BenchmarkCard
      title="CPU: fibonacci + matrix"
      description="Runs recursive Fibonacci calls for 450ms, then dense matrix multiplication for 450ms, and reports combined operations per second."
      status={bench.status}
      progress={bench.progress}
      result={bench.result}
      error={bench.error}
      onRun={bench.run}
      runLabel="Run CPU test"
      historyKey="cpu-fib-matrix"
      typical={{ value: 25, label: "Typical desktop" }}
    />
  );
}
