import { useCallback, useRef, useState } from "react";
import type { Verdict } from "../lib/verdict.js";

export interface BenchmarkResult {
  score: number;
  unit: string;
  label: string;
  verdict: Verdict;
  detail?: string;
  /** Optional sample series for a result sparkline (e.g. FPS over time). */
  series?: number[];
}

export type BenchmarkStatus = "idle" | "running" | "done" | "error";

export interface BenchmarkRunContext {
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}

export type BenchmarkRunner = (ctx: BenchmarkRunContext) => Promise<BenchmarkResult>;

export interface UseBenchmarkState {
  status: BenchmarkStatus;
  progress: number;
  result: BenchmarkResult | null;
  error: string | null;
  run: () => void;
  reset: () => void;
}

export function useBenchmark(runner: BenchmarkRunner): UseBenchmarkState {
  const [status, setStatus] = useState<BenchmarkStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(() => {
    if (runningRef.current) {
      return;
    }
    runningRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("running");
    setProgress(0);
    setError(null);

    runner({ onProgress: setProgress, signal: controller.signal })
      .then((next) => {
        setResult(next);
        setProgress(1);
        setStatus("done");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Benchmark failed to run.");
        setStatus("error");
      })
      .finally(() => {
        runningRef.current = false;
      });
  }, [runner]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { status, progress, result, error, run, reset };
}
