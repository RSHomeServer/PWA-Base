import { useAppReady } from "@platform/runtime";
import type { ReactNode } from "react";
import styles from "./BirthdayReadyGate.module.css";

const REQUIRED_PACKS = ["birthday-base"] as const;

/**
 * Complete-first-install gate (ADR-005): Birthday does not render until the
 * required base Content Pack is installed and active.
 */
export function BirthdayReadyGate({ children }: { children: ReactNode }) {
  const ready = useAppReady("birthday", REQUIRED_PACKS);

  if (ready.status === "ready") {
    return children;
  }

  if (ready.status === "error") {
    return (
      <div className={styles.gate} role="alert">
        <h1 className={styles.title}>The keepsake could not finish installing</h1>
        <p className={styles.body}>{ready.message}</p>
        <p className={styles.hint}>
          Check that Content Packs are available under <code>/packs/birthday/</code>, then reload.
        </p>
      </div>
    );
  }

  const progress = ready.progress;
  const detail =
    progress?.message ??
    (progress?.phase === "done" ? "Almost ready…" : "Gathering letters, photos, and quiet things…");

  return (
    <div className={styles.gate} aria-busy="true" aria-live="polite">
      <h1 className={styles.title}>Preparing the keepsake</h1>
      <p className={styles.body}>
        Installing the offline content pack so every memory is here when you need it.
      </p>
      <p className={styles.hint}>{detail}</p>
      {progress && progress.totalEntries > 0 ? (
        <p className={styles.hint}>
          {progress.completedEntries}/{progress.totalEntries} files · {progress.phase}
        </p>
      ) : null}
    </div>
  );
}
