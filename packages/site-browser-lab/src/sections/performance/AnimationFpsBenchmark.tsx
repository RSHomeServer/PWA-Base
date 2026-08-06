import { useCallback, useRef } from "react";
import { runAnimationFpsBenchmark, useBenchmark } from "@platform/browser";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import styles from "./stage.module.css";

export function AnimationFpsBenchmark() {
  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    const stage = stageRef.current;
    const ball = ballRef.current;
    if (!stage || !ball) {
      throw new Error("Animation stage was not ready.");
    }
    return runAnimationFpsBenchmark(stage, ball);
  }, []);

  const bench = useBenchmark(run);

  return (
    <BenchmarkCard
      title="Animation frame rate"
      description="Drives a bouncing element directly via requestAnimationFrame for 3 seconds and reports the achieved and minimum frame rate."
      status={bench.status}
      progress={bench.progress}
      result={bench.result}
      error={bench.error}
      onRun={bench.run}
      runLabel="Run animation test"
      historyKey="animation-fps"
      typical={{ value: 30, label: "Typical desktop" }}
    >
      <div
        ref={stageRef}
        className={styles.animationStage}
        aria-label="Animation benchmark preview"
      >
        <div ref={ballRef} className={styles.animationBall} />
      </div>
    </BenchmarkCard>
  );
}
