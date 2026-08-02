import { useCallback, useEffect, useState } from "react";
import styles from "./WaxSealOpening.module.css";

const STORAGE_KEY = "birthday.keepsake.sealBroken";

export function hasBrokenWaxSeal(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markSealBroken(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

type WaxSealOpeningProps = {
  recipientName: string;
  gifterName: string;
  enabled?: boolean;
  onOpened: () => void;
};

/**
 * First-launch wax-sealed envelope ritual.
 *
 * No longer the primary Birthday opening (see `KeepsakeOpeningStage` cinematic
 * prologue). Kept for possible reuse beside letter desks. When used as a gate,
 * subsequent visits skip via localStorage.
 */
export function WaxSealOpening({
  recipientName,
  gifterName,
  enabled = true,
  onOpened,
}: WaxSealOpeningProps) {
  const [alreadyOpened] = useState(() => !enabled || hasBrokenWaxSeal());
  const [phase, setPhase] = useState<"idle" | "breaking" | "gone">(
    alreadyOpened ? "gone" : "idle",
  );

  useEffect(() => {
    if (alreadyOpened) onOpened();
  }, [alreadyOpened, onOpened]);

  const breakSeal = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("breaking");
    markSealBroken();
    window.setTimeout(() => {
      setPhase("gone");
      onOpened();
    }, 1600);
  }, [onOpened, phase]);

  if (alreadyOpened || phase === "gone") {
    return null;
  }

  return (
    <div
      className={`${styles.stage} ${phase === "breaking" ? styles.stageOpening : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wax-seal-title"
    >
      <div className={styles.paperGlow} aria-hidden="true" />
      <div className={styles.envelope}>
        <p className={styles.eyebrow}>A letter, kept</p>
        <h1 id="wax-seal-title" className={styles.title}>
          For {recipientName}
        </h1>
        <p className={styles.from}>from {gifterName}</p>
        <button
          type="button"
          className={styles.sealButton}
          onClick={breakSeal}
          disabled={phase !== "idle"}
          aria-label="Break the wax seal"
        >
          <span className={styles.wax} aria-hidden="true" />
          <span className={styles.sealHint}>
            {phase === "idle" ? "Break the seal" : "Opening…"}
          </span>
        </button>
        <p className={styles.whisper}>Take a breath. This was made to be opened slowly.</p>
      </div>
    </div>
  );
}
