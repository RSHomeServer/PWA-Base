import { useMemo, type CSSProperties } from "react";
import { useAnimatedValue } from "./useAnimatedValue.js";
import { clamp } from "./scale.js";
import type { GaugeTone } from "./types.js";
import styles from "./Gauge.module.css";

export interface GaugeProps {
  value: number;
  min?: number;
  max: number;
  label: string;
  displayValue?: string;
  unit?: string;
  tone?: GaugeTone;
  /** Overrides tone-based stroke/readout color when set. */
  color?: string;
  size?: number;
  /** Value representing a typical reference point, drawn as a notch on the dial for comparison. */
  typicalValue?: number;
}

const SWEEP_DEG = 270;
const START_DEG = 225;
const RADIUS = 50;
const CENTER = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TRACK_LENGTH = CIRCUMFERENCE * (SWEEP_DEG / 360);
const TICK_COUNT = 10;

const TONE_COLOR: Record<GaugeTone, string> = {
  success: "var(--chart-tone-success, var(--color-success))",
  warning: "var(--chart-tone-warning, var(--color-warning))",
  error: "var(--chart-tone-error, var(--color-error))",
  neutral: "var(--chart-tone-neutral, var(--color-muted-foreground))",
};

function pointOnArc(fraction: number, radius: number) {
  const angle = ((START_DEG + fraction * SWEEP_DEG) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

export function Gauge({
  value,
  min = 0,
  max,
  label,
  displayValue,
  unit,
  tone = "neutral",
  color,
  size = 168,
  typicalValue,
}: GaugeProps) {
  const clamped = clamp(value, min, max);
  const animated = useAnimatedValue(clamped, 900, min);
  const fraction = max > min ? clamp((animated - min) / (max - min), 0, 1) : 0;

  const valueLength = TRACK_LENGTH * fraction;
  const trackDash = useMemo(() => `${TRACK_LENGTH} ${CIRCUMFERENCE - TRACK_LENGTH}`, []);
  const valueDash = `${valueLength} ${CIRCUMFERENCE - valueLength}`;
  const strokeColor = color ?? TONE_COLOR[tone];

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT + 1 }, (_, i) => {
        const f = i / TICK_COUNT;
        const outer = pointOnArc(f, RADIUS + 7);
        const inner = pointOnArc(f, RADIUS + 2.5);
        return { f, outer, inner };
      }),
    [],
  );

  const typicalFraction =
    typicalValue !== undefined && max > min
      ? clamp((typicalValue - min) / (max - min), 0, 1)
      : null;
  const typicalPoint = typicalFraction !== null ? pointOnArc(typicalFraction, RADIUS) : null;

  return (
    <div className={styles.gauge} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 120 120"
        className={styles.svg}
        role="img"
        aria-label={`${label}: ${displayValue ?? Math.round(clamped)}${unit ?? ""}`}
      >
        {ticks.map((tick) => (
          <line
            key={tick.f}
            x1={tick.inner.x}
            y1={tick.inner.y}
            x2={tick.outer.x}
            y2={tick.outer.y}
            className={styles.tick}
          />
        ))}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          className={styles.track}
          strokeDasharray={trackDash}
          transform={`rotate(${START_DEG} ${CENTER} ${CENTER})`}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          strokeDasharray={valueDash}
          transform={`rotate(${START_DEG} ${CENTER} ${CENTER})`}
          className={styles.value}
          style={{ stroke: strokeColor, "--gauge-color": strokeColor } as CSSProperties}
        />
        {typicalPoint ? (
          <circle
            cx={typicalPoint.x}
            cy={typicalPoint.y}
            r={2.4}
            className={styles.typicalMark}
            aria-hidden="true"
          />
        ) : null}
      </svg>
      <div className={styles.readout}>
        <span className={styles.readoutValue} style={{ color: strokeColor }}>
          {displayValue ?? Math.round(animated)}
        </span>
        {unit ? <span className={styles.readoutUnit}>{unit}</span> : null}
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
