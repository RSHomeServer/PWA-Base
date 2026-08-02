import { useEffect, useState } from "react";
import { FindUsMomentStage } from "./FindUsMomentStage.js";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./KeepsakeOpeningStage.module.css";
import type { ReactNode } from "react";

type KeepsakeOpeningStageProps = {
  children: ReactNode;
};

/**
 * Cinematic keepsake opening: finished Leo constellation → pullback,
 * then dedication content. Reuses FindUsMoment (same as /constellation).
 */
export function KeepsakeOpeningStage({ children }: KeepsakeOpeningStageProps) {
  const { design } = useKeepsakeContent();
  const reduceMotion = useReducedMotion();
  const enabled = design?.entryRitual !== "none";
  const [phase, setPhase] = useState<"stars" | "pullback" | "settled">(
    reduceMotion || !enabled ? "settled" : "stars",
  );

  useEffect(() => {
    if (reduceMotion || !enabled) {
      setPhase("settled");
      return;
    }
    const readyId = window.setTimeout(() => setPhase("pullback"), 2800);
    return () => window.clearTimeout(readyId);
  }, [enabled, reduceMotion]);

  useEffect(() => {
    if (phase !== "pullback") return;
    const id = window.setTimeout(() => setPhase("settled"), 5200);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div
      className={[
        styles.stage,
        phase === "pullback" ? styles.pullback : null,
        phase === "settled" ? styles.settled : null,
      ]
        .filter(Boolean)
        .join(" ")}
      data-opening-phase={phase}
    >
      <div className={styles.camera} aria-hidden={phase === "stars"}>
        <div
          className={[
            styles.skyDepth,
            phase === "settled" ? styles.skyInteractive : null,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FindUsMomentStage />
        </div>
        <div className={styles.glassHint} aria-hidden="true" />
        <div className={styles.contentLayer}>{children}</div>
      </div>
      {phase !== "settled" ? (
        <p className={styles.whisper} aria-live="polite">
          Look up — the stars are closer than they seem.
        </p>
      ) : null}
    </div>
  );
}
