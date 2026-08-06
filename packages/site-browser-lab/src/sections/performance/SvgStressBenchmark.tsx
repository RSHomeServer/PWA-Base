import { useCallback, useRef } from "react";
import { runSvgStressBenchmark, useBenchmark } from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import styles from "./stage.module.css";

export function SvgStressBenchmark() {
  const svgRef = useRef<SVGSVGElement>(null);

  const run = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) {
      throw new Error("SVG stage was not ready.");
    }
    return runSvgStressBenchmark(svg);
  }, []);

  const bench = useBenchmark(run);

  return (
    <BenchmarkCard
      title="SVG node stress"
      description="Grows a live SVG scene by batches of circle nodes while jittering existing ones, until frame time can no longer keep up at 50fps."
      status={bench.status}
      progress={bench.progress}
      result={bench.result}
      error={bench.error}
      onRun={bench.run}
      runLabel="Run SVG test"
      historyKey="svg-node-stress"
      typical={{ value: 1500, label: "Typical desktop" }}
    >
      <svg ref={svgRef} className={styles.svgStage} aria-label="SVG node stress preview" />
    </BenchmarkCard>
  );
}
