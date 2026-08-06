import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge, Button } from "@platform/ui";
import {
  formatNumber,
  useBenchmarkHistory,
  type BenchmarkResult,
  type BenchmarkStatus,
} from "@platform/browser";
import { verdictBadgeVariant, verdictLabel } from "../lib/verdict.js";
import { Flourish } from "./Flourish.js";
import { MeterBar } from "./MeterBar.js";
import { Sparkline } from "./Sparkline.js";
import { TelemetryParticles } from "./TelemetryParticles.js";
import styles from "./BenchmarkCard.module.css";

export interface TypicalReference {
  /** Score a typical desktop machine achieves on this benchmark, in the same unit. */
  value: number;
  label?: string;
}

export interface BenchmarkCardProps {
  title: string;
  description: string;
  status: BenchmarkStatus;
  progress: number;
  result: BenchmarkResult | null;
  error?: string | null;
  onRun: () => void;
  runLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  /** Live visual stage (canvas, DOM playground, etc.) shown above the controls. */
  children?: ReactNode;
  /** Enables localStorage persistence of past runs + personal-best tracking. */
  historyKey?: string;
  /** Whether a bigger score is the better outcome (default true; false for latency-style metrics). */
  higherIsBetter?: boolean;
  /** Reference score for a typical desktop machine, rendered as a comparison bar. */
  typical?: TypicalReference;
}

function ritualPhase(progress: number): string {
  if (progress < 0.08) return "Initializing sensors…";
  if (progress < 0.22) return "Priming workload…";
  if (progress < 0.45) return "Collecting telemetry…";
  if (progress < 0.72) return "Stress phase active…";
  if (progress < 0.92) return "Finalizing readout…";
  return "Sealing result…";
}

function formatNotebookTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BenchmarkCard({
  title,
  description,
  status,
  progress,
  result,
  error,
  onRun,
  runLabel,
  disabled,
  disabledReason,
  children,
  historyKey,
  higherIsBetter = true,
  typical,
}: BenchmarkCardProps) {
  const running = status === "running";
  const history = useBenchmarkHistory(historyKey, higherIsBetter);
  const [flourishKey, setFlourishKey] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const lastRecordedRef = useRef<BenchmarkResult | null>(null);

  useEffect(() => {
    if (!result || status !== "done" || lastRecordedRef.current === result) {
      return;
    }
    lastRecordedRef.current = result;
    const outcome = history.record(result.score);
    setIsNewBest(outcome.isNewBest && outcome.previousBest !== null);
    setFlourishKey((k) => k + 1);
    // history.record intentionally excluded — it's stable-enough per call and
    // re-running this effect on every entries change would double-record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, status]);

  const trend = history.entries.map((entry) => entry.score);
  const compareMax = typical ? Math.max(typical.value, result?.score ?? 0) * 1.15 : undefined;
  const notebookEntries = history.entries.slice(-5).reverse();

  return (
    <article className={`lab-panel ${styles.card} ${running ? styles.cardRunning : ""}`}>
      <div className={styles.head}>
        <h3 className={styles.title}>{title}</h3>
        {result && status === "done" ? (
          <Badge variant={verdictBadgeVariant(result.verdict)}>
            {verdictLabel(result.verdict)}
          </Badge>
        ) : null}
      </div>
      <p className={styles.description}>{description}</p>

      {children ? (
        <div className={styles.stageWrap}>
          <div className={styles.stage}>{children}</div>
          <TelemetryParticles active={running} progress={progress} />
        </div>
      ) : running ? (
        <div className={styles.stageWrap}>
          <div className={styles.stageEmpty} aria-hidden="true" />
          <TelemetryParticles active progress={progress} />
        </div>
      ) : null}

      <div className={styles.controls}>
        <Button
          type="button"
          size="sm"
          variant={status === "done" ? "secondary" : "primary"}
          onClick={onRun}
          disabled={running || disabled}
          aria-describedby={disabled && disabledReason ? `${title}-disabled-reason` : undefined}
        >
          {running ? "Running…" : status === "done" ? "Run again" : (runLabel ?? "Arm experiment")}
        </Button>
        {disabled && disabledReason ? (
          <span id={`${title}-disabled-reason`} className={styles.disabledReason}>
            {disabledReason}
          </span>
        ) : null}
      </div>

      {running ? (
        <div className={styles.runPanel}>
          <div className={styles.ritual} aria-live="polite">
            <span className={styles.ritualPulse} aria-hidden="true" />
            <span className={styles.ritualText}>{ritualPhase(progress)}</span>
            <span className={styles.ritualPct}>{Math.round(progress * 100)}%</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label={`${title} progress`}
          >
            <div
              className={styles.progressFill}
              style={{ width: `${Math.round(progress * 100)}%` }}
            >
              <span className={styles.progressShimmer} />
            </div>
          </div>
          {progress > 0.05 ? (
            <Sparkline
              data={Array.from({ length: 24 }, (_, i) => {
                const wave = Math.sin((i / 24) * Math.PI * 4 + progress * 12) * 0.5 + 0.5;
                const jitter = Math.sin(i * 2.7 + progress * 20) * 4;
                return 20 + wave * 60 + progress * 20 + jitter;
              })}
              label={`${title} live telemetry`}
              height={36}
              color="var(--lab-teal-bright)"
              animate
            />
          ) : null}
        </div>
      ) : null}

      {status === "error" && error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      {status === "done" && result ? (
        <div className={styles.result} role="status">
          <Flourish playKey={flourishKey} verdict={result.verdict} big />
          <div className={styles.resultReadout}>
            <span className={styles.resultScore}>{result.label}</span>
            <div className={styles.resultBadges}>
              {isNewBest ? <span className={styles.bestBadge}>★ New personal best</span> : null}
              {result.detail ? <span className={styles.resultDetail}>{result.detail}</span> : null}
            </div>
          </div>

          {result.series && result.series.length > 1 ? (
            <Sparkline data={result.series} label={`${title} result trend`} height={44} animate />
          ) : null}

          {typical ? (
            <div className={styles.compare}>
              <p className={styles.compareHeading}>Hardware reference</p>
              <MeterBar
                label="This device"
                value={result.score}
                max={compareMax ?? result.score}
                displayValue={result.label}
                verdict={result.verdict}
                compact
              />
              <MeterBar
                label={typical.label ?? "Typical desktop"}
                value={typical.value}
                max={compareMax ?? typical.value}
                displayValue={`${formatNumber(typical.value, typical.value < 10 ? 1 : 0)} ${result.unit}`}
                verdict="info"
                compact
              />
            </div>
          ) : null}

          {notebookEntries.length > 0 ? (
            <div className={styles.notebook}>
              <div className={styles.notebookHeader}>
                <span className={styles.notebookTitle}>Lab notebook</span>
                {history.best !== null ? (
                  <span className={styles.notebookBest}>
                    Best · {formatNumber(history.best, history.best < 10 ? 1 : 0)} {result.unit}
                  </span>
                ) : null}
              </div>
              <ol className={styles.notebookList}>
                {notebookEntries.map((entry, index) => (
                  <li key={`${entry.timestamp}-${index}`} className={styles.notebookEntry}>
                    <span className={styles.notebookDate}>
                      {formatNotebookTime(entry.timestamp)}
                    </span>
                    <span className={styles.notebookScore}>
                      {formatNumber(entry.score, entry.score < 10 ? 1 : 0)} {result.unit}
                    </span>
                  </li>
                ))}
              </ol>
              {trend.length > 1 ? (
                <Sparkline
                  data={trend}
                  label={`${title} history across runs on this device`}
                  height={32}
                  color="var(--lab-muted-strong)"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
