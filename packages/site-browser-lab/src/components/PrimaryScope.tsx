import { useState, type CSSProperties } from "react";
import { fpsHealth, getWebglInfo, useLiveFrameTelemetry } from "@platform/browser";
import { Sparkline } from "./Sparkline.js";
import styles from "./PrimaryScope.module.css";

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function PrimaryScope() {
  const [gpu] = useState(() => getWebglInfo());
  const { fps, frameMs, fpsHistory } = useLiveFrameTelemetry();
  const health = fpsHealth(fps);

  const toneClass =
    health.tone === "good"
      ? styles.toneGood
      : health.tone === "warn"
        ? styles.toneWarn
        : health.tone === "bad"
          ? styles.toneBad
          : styles.tonePending;

  const traceColor =
    health.tone === "bad"
      ? "var(--lab-fail)"
      : health.tone === "warn"
        ? "var(--lab-warn)"
        : "var(--lab-teal-bright)";

  return (
    <div
      className={`${styles.scope} ${toneClass}`}
      aria-label="Primary frame-rate oscilloscope"
      role="img"
    >
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.sweep} aria-hidden="true" />
      <div className={styles.phosphor} aria-hidden="true" />

      <div className={styles.header}>
        <span className={styles.channel}>CH·01 · FRAME RATE</span>
        <span className={`${styles.status} ${styles[`status-${health.tone}`] ?? ""}`}>
          <span className={styles.statusDot} aria-hidden="true" />
          {health.status}
        </span>
      </div>

      <div className={styles.readoutRow}>
        <div className={styles.fpsReadout}>
          <span className={styles.fpsValue}>{fps || "—"}</span>
          <span className={styles.fpsUnit}>FPS</span>
        </div>
        <div className={styles.meta}>
          <span className={styles.metaLine}>
            {frameMs > 0 ? `${frameMs.toFixed(2)} ms/frame` : "Sampling…"}
          </span>
          <span className={styles.metaLine} title={gpu.supported ? gpu.renderer : undefined}>
            GPU · {gpu.supported ? truncate(gpu.renderer, 48) : "Unavailable"}
          </span>
        </div>
      </div>

      <div className={styles.trace}>
        {fpsHistory.length > 1 ? (
          <Sparkline
            data={fpsHistory}
            width={640}
            height={88}
            label="Live frame rate trace"
            color={traceColor}
            animate
          />
        ) : (
          <span className={styles.tracePlaceholder}>Awaiting signal…</span>
        )}
        <div className={styles.reticle} aria-hidden="true" />
      </div>

      <div className={styles.footer} aria-hidden="true">
        <span>LIVE</span>
        <span
          className={styles.footerPulse}
          style={{ "--pulse-color": traceColor } as CSSProperties}
        />
        <span>60 Hz REF</span>
      </div>
    </div>
  );
}
