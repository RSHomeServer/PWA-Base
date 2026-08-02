import type { Verdict } from "../lib/verdict.js";
import { clamp } from "../lib/format.js";
import styles from "./MeterBar.module.css";

export interface MeterBarProps {
  label: string;
  value: number;
  max: number;
  displayValue?: string;
  verdict?: Verdict;
  compact?: boolean;
}

const VERDICT_CLASS: Record<Verdict, string> = {
  pass: "verdictPass",
  warn: "verdictWarn",
  fail: "verdictFail",
  info: "verdictInfo",
};

export function MeterBar({
  label,
  value,
  max,
  displayValue,
  verdict = "info",
  compact,
}: MeterBarProps) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;

  return (
    <div className={`${styles.meter} ${compact ? styles.compact : ""}`}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{displayValue ?? `${Math.round(pct)}%`}</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
      >
        <div
          className={`${styles.fill} ${styles[VERDICT_CLASS[verdict]]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
