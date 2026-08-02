import type { ReactNode } from "react";
import styles from "./Controls.module.css";

/** Scrollable full-bleed content area used by every audio-lab mode inside LabShell's frame. */
export function ModeStage({ children }: { children: ReactNode }) {
  return <div className={styles.modeStage}>{children}</div>;
}
