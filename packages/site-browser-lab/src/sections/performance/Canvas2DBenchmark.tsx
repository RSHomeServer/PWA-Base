import { useCallback, useRef } from "react";
import { runCanvas2dBenchmark, useBenchmark, type BenchmarkRunContext } from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import styles from "./stage.module.css";

export function Canvas2DBenchmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const run = useCallback(async (ctx: BenchmarkRunContext) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error("Canvas stage was not ready.");
    }
    const g = canvas.getContext("2d");
    if (!g) {
      throw new Error("2D canvas context is unavailable.");
    }
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    ctx.onProgress(0.02);
    return runCanvas2dBenchmark(canvas, g);
  }, []);

  const bench = useBenchmark(run);

  return (
    <BenchmarkCard
      title="Canvas 2D particles"
      description="Ramps a bouncing particle field until frame time degrades below 50fps, then reports the sustained particle count."
      status={bench.status}
      progress={bench.progress}
      result={bench.result}
      error={bench.error}
      onRun={bench.run}
      runLabel="Run particle test"
      historyKey="canvas2d-particles"
      typical={{ value: 2000, label: "Typical desktop" }}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvasStage}
        aria-label="Canvas particle benchmark preview"
      />
    </BenchmarkCard>
  );
}
