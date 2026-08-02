import { useEffect, useState, type CSSProperties } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import type { Verdict } from "../lib/verdict.js";
import styles from "./Flourish.module.css";

export interface FlourishProps {
  /** Increment to trigger a fresh play; 0 (or unchanged) renders nothing. */
  playKey: number;
  verdict: Verdict;
  big?: boolean;
}

const VERDICT_COLOR: Record<Verdict, string> = {
  pass: "#6ee7d8",
  warn: "#fbbf24",
  fail: "#f87171",
  info: "#8ba3a3",
};

const SPARK_COUNT = 18;

/** A brief celebratory ring-and-spark burst for benchmark completion. Self-clears. */
export function Flourish({ playKey, verdict, big }: FlourishProps) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (playKey <= 0) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), big ? 1400 : 950);
    return () => window.clearTimeout(timer);
  }, [playKey, big]);

  if (!visible || reducedMotion) return null;

  const color = VERDICT_COLOR[verdict];

  return (
    <div
      className={`${styles.flourish} ${big ? styles.big : ""}`}
      aria-hidden="true"
      style={{ "--flourish-color": color } as CSSProperties}
    >
      <span className={styles.ring} />
      <span className={styles.ringDelayed} />
      <span className={styles.ringOuter} />
      {Array.from({ length: SPARK_COUNT }, (_, i) => (
        <span
          key={i}
          className={styles.spark}
          style={{ "--i": i, "--count": SPARK_COUNT } as CSSProperties}
        />
      ))}
    </div>
  );
}
