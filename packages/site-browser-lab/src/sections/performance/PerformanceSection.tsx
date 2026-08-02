import { SectionHeader } from "../../components/SectionHeader.js";
import { AnimationFpsBenchmark } from "./AnimationFpsBenchmark.js";
import { Canvas2DBenchmark } from "./Canvas2DBenchmark.js";
import { CpuBenchmark } from "./CpuBenchmark.js";
import { DomMutateBenchmark } from "./DomMutateBenchmark.js";
import { SvgStressBenchmark } from "./SvgStressBenchmark.js";
import { WorkerBenchmark } from "./WorkerBenchmark.js";
import styles from "./PerformanceSection.module.css";

export function PerformanceSection() {
  return (
    <section aria-labelledby="lab-performance-title">
      <SectionHeader
        eyebrow="Experiment Stage · Primary"
        title="Performance"
        description="The lab's central experiment floor — six stress protocols measuring CPU throughput, rendering pipelines, DOM churn, animation smoothness, and off-main-thread compute. Arm any experiment; telemetry streams live until the readout seals."
      />
      <div className={styles.stage}>
        <div className={styles.stageGlow} aria-hidden="true" />
        <div className={styles.grid}>
          <CpuBenchmark />
          <Canvas2DBenchmark />
          <SvgStressBenchmark />
          <DomMutateBenchmark />
          <AnimationFpsBenchmark />
          <WorkerBenchmark />
        </div>
      </div>
    </section>
  );
}
