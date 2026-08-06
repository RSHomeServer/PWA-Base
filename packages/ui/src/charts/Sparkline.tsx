import { useId, useMemo, type CSSProperties } from "react";
import { useReducedMotion } from "@platform/animation";
import styles from "./Sparkline.module.css";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  label?: string;
  color?: string;
  /** Plays a left-to-right draw-in animation and a pulsing dot at the last sample. */
  animate?: boolean;
}

export function Sparkline({
  data,
  width = 240,
  height = 56,
  label,
  color = "var(--chart-line-color, var(--color-accent))",
  animate = false,
}: SparklineProps) {
  const gradientId = useId();
  const reducedMotion = useReducedMotion();

  const { points, areaPoints, last, pathLength } = useMemo(() => {
    if (data.length === 0) {
      return { points: "", areaPoints: "", last: null, pathLength: 0 };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = data.length > 1 ? width / (data.length - 1) : 0;

    let length = 0;
    let prev: { x: number; y: number } | null = null;
    const coords = data.map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      if (prev) {
        length += Math.hypot(x - prev.x, y - prev.y);
      }
      prev = { x, y };
      return { x, y };
    });

    const area = `0,${height} ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")} ${width},${height}`;
    return {
      points: coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" "),
      areaPoints: area,
      last: coords[coords.length - 1] ?? null,
      pathLength: length || 1,
    };
  }, [data, width, height]);

  const shouldAnimate = animate && !reducedMotion;

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={label ?? "Trend"}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {points ? (
        <>
          <polygon
            points={areaPoints}
            fill={`url(#${gradientId})`}
            stroke="none"
            className={shouldAnimate ? styles.areaAnimated : undefined}
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={shouldAnimate ? styles.lineAnimated : undefined}
            style={
              shouldAnimate
                ? ({
                    strokeDasharray: pathLength,
                    strokeDashoffset: pathLength,
                    "--sparkline-length": pathLength,
                  } as CSSProperties)
                : undefined
            }
          />
          {last ? (
            <circle
              cx={last.x}
              cy={last.y}
              r={2.4}
              fill={color}
              className={styles.dot}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          ) : null}
        </>
      ) : null}
    </svg>
  );
}
