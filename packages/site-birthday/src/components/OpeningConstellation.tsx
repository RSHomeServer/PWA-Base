import { useEffect, type CSSProperties } from "react";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import type { KeepsakeDocument } from "../lib/keepsakeTypes.js";
import styles from "./OpeningConstellation.module.css";

function buildPath(constellation: KeepsakeDocument["constellation"]): string {
  const byId = new Map(constellation.stars.map((s) => [s.id, s]));
  return constellation.order
    .map((id, i) => {
      const star = byId.get(id);
      if (!star) return "";
      return `${i === 0 ? "M" : "L"} ${star.x} ${star.y}`;
    })
    .join(" ");
}

interface OpeningConstellationProps {
  /** "full" plays the slow opening draw; "echo" renders it small and already-lit. */
  variant?: "full" | "echo";
  /** Fires once the constellation line is largely drawn (opening beat). */
  onReady?: () => void;
}

/**
 * A single constellation that draws itself, star by star, then line by
 * line — cool highlight strokes against the night. Reused in miniature
 * as a closing echo.
 */
export function OpeningConstellation({
  variant = "full",
  onReady,
}: OpeningConstellationProps) {
  const { constellation } = useKeepsakeContent();
  const d = buildPath(constellation);

  useEffect(() => {
    if (variant !== "full" || !onReady) return;
    // Stars ~0.6s+, line starts 2.4s / 2.6s — ready as the shape settles.
    const id = window.setTimeout(() => onReady(), 4800);
    return () => window.clearTimeout(id);
  }, [onReady, variant]);

  return (
    <div className={variant === "echo" ? styles.echo : styles.stage}>
      <svg
        className={styles.svg}
        viewBox="0 0 100 60"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`A constellation named ${constellation.name}`}
      >
        <path
          d={d}
          className={variant === "echo" ? styles.lineEcho : styles.line}
          fill="none"
          stroke="var(--bd-accent)"
          strokeWidth="0.22"
          strokeLinecap="round"
        />
        {constellation.stars.map((star, i) => (
          <circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={variant === "echo" ? 0.55 : 0.7}
            className={variant === "echo" ? styles.starEcho : styles.star}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
