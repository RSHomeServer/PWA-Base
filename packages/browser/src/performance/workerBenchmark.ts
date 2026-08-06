import { formatNumber } from "../format.js";
import { verdictFromThresholds } from "../verdict.js";
import type { BenchmarkResult } from "../hooks/useBenchmark.js";
import type { WorkerOutMessage, WorkerStartMessage } from "./worker/compute.worker.js";

const BUDGET_MS = 700;
const MAX_VISUAL_CORES = 16;

export function isWorkerSupported(): boolean {
  return typeof Worker !== "undefined";
}

export function resolveWorkerCoreCount(): number {
  return Math.max(1, Math.min(MAX_VISUAL_CORES, navigator.hardwareConcurrency || 4));
}

export function createComputeWorkers(coreCount: number): Worker[] {
  return Array.from(
    { length: coreCount },
    () => new Worker(new URL("./worker/compute.worker.ts", import.meta.url), { type: "module" }),
  );
}

export interface WorkerBenchmarkProgress {
  fraction: number;
  coreIndex: number;
  coreFraction: number;
}

export async function runWorkerBenchmark(
  workers: Worker[],
  onProgress?: (update: WorkerBenchmarkProgress) => void,
): Promise<BenchmarkResult> {
  if (workers.length === 0) {
    throw new Error("Web Workers could not be created in this environment.");
  }

  const n = workers.length;
  const fractions = new Array<number>(n).fill(0);
  const totals = { opsPerSec: 0, primesFound: 0, candidatesChecked: 0 };

  const reportProgress = (coreIndex: number, coreFraction: number) => {
    fractions[coreIndex] = coreFraction;
    const avg = fractions.reduce((sum, v) => sum + v, 0) / n;
    onProgress?.({ fraction: avg, coreIndex, coreFraction });
  };

  const perCoreOps: number[] = new Array(n).fill(0);

  await Promise.all(
    workers.map(
      (worker, index) =>
        new Promise<void>((resolve, reject) => {
          const handleMessage = (event: MessageEvent<WorkerOutMessage>) => {
            const message = event.data;
            if (message.type === "progress") {
              reportProgress(index, message.fraction);
              return;
            }
            worker.removeEventListener("message", handleMessage);
            worker.removeEventListener("error", handleError);
            perCoreOps[index] = message.opsPerSec;
            totals.opsPerSec += message.opsPerSec;
            totals.primesFound += message.primesFound;
            totals.candidatesChecked += message.candidatesChecked;
            fractions[index] = 1;
            reportProgress(index, 1);
            resolve();
          };
          const handleError = (event: ErrorEvent) => {
            worker.removeEventListener("message", handleMessage);
            worker.removeEventListener("error", handleError);
            reject(new Error(event.message || "Worker execution failed."));
          };
          worker.addEventListener("message", handleMessage);
          worker.addEventListener("error", handleError);
          worker.postMessage({
            type: "start",
            budgetMs: BUDGET_MS,
          } satisfies WorkerStartMessage);
        }),
    ),
  );

  const perCoreAvg = totals.opsPerSec / n;
  const verdict = verdictFromThresholds(perCoreAvg, 300000, 1500000);
  return {
    score: totals.opsPerSec,
    unit: "checks/s",
    label: `${formatNumber(totals.opsPerSec)} checks/s across ${n} cores`,
    verdict,
    detail: `${formatNumber(totals.primesFound)} primes among ${formatNumber(totals.candidatesChecked)} candidates · ~${formatNumber(perCoreAvg)} checks/s per core`,
    series: perCoreOps,
  };
}

export { BUDGET_MS, MAX_VISUAL_CORES };
