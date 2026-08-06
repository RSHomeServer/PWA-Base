import { runCpuBenchmark, useBenchmark } from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";

export function CpuBenchmark() {
  const bench = useBenchmark(({ onProgress }) => runCpuBenchmark(onProgress));

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
