import { useCallback, useRef } from "react";
import { BenchmarkCard } from "../../components/BenchmarkCard.js";
import { useBenchmark, type BenchmarkResult } from "../../hooks/useBenchmark.js";
import { formatNumber } from "../../lib/format.js";
import { verdictFromThresholds } from "../../lib/verdict.js";
import styles from "./stage.module.css";

const TOTAL_DURATION_MS = 3000;

async function runAnimationBenchmark(
  stage: HTMLDivElement,
  ball: HTMLDivElement,
): Promise<BenchmarkResult> {
  const width = stage.clientWidth - 22;
  const height = stage.clientHeight - 22;
  let x = width / 2;
  let y = height / 2;
  let vx = 3.4;
  let vy = 2.6;

  return new Promise((resolve) => {
    const start = performance.now();
    let lastFrame = start;
    const fpsWindow: number[] = [];

    const frame = (now: number) => {
      const dt = now - lastFrame;
      lastFrame = now;
      if (dt > 0) {
        fpsWindow.push(1000 / dt);
      }

      x += vx;
      y += vy;
      if (x <= 0 || x >= width) vx *= -1;
      if (y <= 0 || y >= height) vy *= -1;
      ball.style.transform = `translate(${x}px, ${y}px)`;

      const elapsed = now - start;
      if (elapsed < TOTAL_DURATION_MS) {
        requestAnimationFrame(frame);
      } else {
        const avg = fpsWindow.reduce((sum, v) => sum + v, 0) / fpsWindow.length;
        const min = Math.min(...fpsWindow);
        resolve({
          score: avg,
          unit: "fps",
          label: `${formatNumber(avg, 1)} fps avg`,
          verdict: verdictFromThresholds(avg, 30, 55),
          detail: `Minimum frame rate ${formatNumber(min, 1)} fps across ${fpsWindow.length} frames`,
          series: fpsWindow,
        });
      }
    };

    requestAnimationFrame(frame);
  });
}

export function AnimationFpsBenchmark() {
  const stageRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async () => {
    const stage = stageRef.current;
    const ball = ballRef.current;
    if (!stage || !ball) {
      throw new Error("Animation stage was not ready.");
    }
    return runAnimationBenchmark(stage, ball);
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
