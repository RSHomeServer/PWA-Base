import { useCallback, useRef } from "react";
import { runDomMutateBenchmark, useBenchmark } from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import styles from "./stage.module.css";

export function DomMutateBenchmark() {
  const containerRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (ctx: { onProgress: (fraction: number) => void }) => {
    const container = containerRef.current;
    if (!container) {
      throw new Error("DOM stage was not ready.");
    }
    return runDomMutateBenchmark(container, ctx.onProgress, styles.domCell);
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
