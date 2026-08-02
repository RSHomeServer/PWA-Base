import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Badge } from "@platform/ui";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import { useBenchmark, type BenchmarkResult } from "../../hooks/useBenchmark.js";
import { formatNumber } from "../../lib/format.js";
import { verdictBadgeVariant, verdictFromThresholds } from "../../lib/verdict.js";
import type { WorkerOutMessage, WorkerStartMessage } from "./worker/compute.worker.js";
import styles from "./WorkerBenchmark.module.css";

const BUDGET_MS = 700;
const MAX_VISUAL_CORES = 16;

/** Draws a per-core "equalizer" — bars pulse while their worker is busy, then settle to a height proportional to that core's measured throughput. */
function useCoreActivityCanvas(canvasRef: RefObject<HTMLCanvasElement | null>, coreCount: number) {
  const levelsRef = useRef<Float32Array>(new Float32Array(coreCount));
  const targetsRef = useRef<Float32Array>(new Float32Array(coreCount));

  useEffect(() => {
    levelsRef.current = new Float32Array(coreCount);
    targetsRef.current = new Float32Array(coreCount);
  }, [coreCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const levels = levelsRef.current;
      const targets = targetsRef.current;
      const n = levels.length;
      if (n > 0) {
        const gap = Math.max(2, w * 0.012);
        const barW = (w - gap * (n + 1)) / n;
        for (let i = 0; i < n; i += 1) {
          levels[i] += (targets[i] - levels[i]) * 0.14;
          const level = Math.max(0.04, levels[i]);
          const barH = h * level;
          const x = gap + i * (barW + gap);
          const y = h - barH;
          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, "#6ee7d8");
          grad.addColorStop(1, "rgba(45, 212, 191, 0.35)");
          ctx.fillStyle = grad;
          const radius = Math.min(4, barW / 2);
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, [radius, radius, 0, 0]);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [canvasRef]);

  const pulse = useCallback((index: number, value: number) => {
    if (index < 0 || index >= targetsRef.current.length) return;
    targetsRef.current[index] = value;
  }, []);

  return { pulse };
}

export function WorkerBenchmark() {
  const workersRef = useRef<Worker[]>([]);
  const [supported, setSupported] = useState(true);
  const coreCount = Math.max(1, Math.min(MAX_VISUAL_CORES, navigator.hardwareConcurrency || 4));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pulse } = useCoreActivityCanvas(canvasRef, coreCount);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      setSupported(false);
      return;
    }
    try {
      workersRef.current = Array.from(
        { length: coreCount },
        () =>
          new Worker(new URL("./worker/compute.worker.ts", import.meta.url), { type: "module" }),
      );
    } catch {
      setSupported(false);
    }
    return () => {
      for (const worker of workersRef.current) {
        worker.terminate();
      }
      workersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    async (runCtx: { onProgress: (fraction: number) => void }) => {
      const workers = workersRef.current;
      if (workers.length === 0) {
        throw new Error("Web Workers could not be created in this environment.");
      }

      const n = workers.length;
      const fractions = new Array<number>(n).fill(0);
      const totals = { opsPerSec: 0, primesFound: 0, candidatesChecked: 0 };

      const reportProgress = () => {
        const avg = fractions.reduce((sum, v) => sum + v, 0) / n;
        runCtx.onProgress(avg);
      };

      const perCoreOps: number[] = new Array(n).fill(0);

      await Promise.all(
        workers.map(
          (worker, index) =>
            new Promise<void>((resolve, reject) => {
              const handleMessage = (event: MessageEvent<WorkerOutMessage>) => {
                const message = event.data;
                if (message.type === "progress") {
                  fractions[index] = message.fraction;
                  pulse(index, 0.35 + message.fraction * 0.65);
                  reportProgress();
                  return;
                }
                worker.removeEventListener("message", handleMessage);
                worker.removeEventListener("error", handleError);
                perCoreOps[index] = message.opsPerSec;
                totals.opsPerSec += message.opsPerSec;
                totals.primesFound += message.primesFound;
                totals.candidatesChecked += message.candidatesChecked;
                fractions[index] = 1;
                reportProgress();
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

      const peak = Math.max(...perCoreOps, 1);
      perCoreOps.forEach((ops, index) => pulse(index, 0.08 + (ops / peak) * 0.92));

      const perCoreAvg = totals.opsPerSec / n;
      const verdict = verdictFromThresholds(perCoreAvg, 300000, 1500000);
      const result: BenchmarkResult = {
        score: totals.opsPerSec,
        unit: "checks/s",
        label: `${formatNumber(totals.opsPerSec)} checks/s across ${n} cores`,
        verdict,
        detail: `${formatNumber(totals.primesFound)} primes among ${formatNumber(totals.candidatesChecked)} candidates · ~${formatNumber(perCoreAvg)} checks/s per core`,
        series: perCoreOps,
      };
      return result;
    },
    [pulse],
  );

  const bench = useBenchmark(run);

  return (
    <BenchmarkCard
      title="Web Worker compute"
      description={`Runs a prime-counting loop simultaneously across ${coreCount} dedicated Web Workers for ${(BUDGET_MS / 1000).toFixed(1)}s, lighting up a bar per core so you can see real thread utilisation, not just one busy thread.`}
      status={bench.status}
      progress={bench.progress}
      result={bench.result}
      error={bench.error}
      onRun={bench.run}
      runLabel="Run worker test"
      disabled={!supported}
      disabledReason={supported ? undefined : "Web Workers are unavailable in this environment."}
      historyKey="worker-thread-throughput"
      typical={{ value: 300000 * coreCount, label: `Typical ${coreCount}-core desktop` }}
    >
      {!supported ? (
        <div className={styles.unsupported}>
          <Badge variant={verdictBadgeVariant("fail")}>Workers unsupported</Badge>
        </div>
      ) : (
        <div className={styles.stage}>
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          <p className={styles.caption}>
            {coreCount} core{coreCount === 1 ? "" : "s"} · each bar is one dedicated worker
          </p>
        </div>
      )}
    </BenchmarkCard>
  );
}
