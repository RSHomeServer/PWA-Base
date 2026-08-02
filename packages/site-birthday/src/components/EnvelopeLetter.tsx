import { useState } from "react";
import { PressedFlower } from "./PressedFlower.js";
import styles from "./EnvelopeLetter.module.css";

interface EnvelopeLetterProps {
  seal: string;
  title: string;
  body: readonly string[];
}

/**
 * A sealed envelope on writing paper. Clicking breaks the wax seal, the
 * flap falls open, and the folded letter rises out to be read.
 */
export function EnvelopeLetter({ seal, title, body }: EnvelopeLetterProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.slot}>
      <button
        type="button"
        className={`${styles.envelope} ${open ? styles.envelopeOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-no-bloom
      >
        <span className={styles.flap} aria-hidden="true" />
        <span className={styles.seal} aria-hidden="true">
          <span className={styles.wax} />
        </span>
        <span className={styles.sealLabel}>{seal}</span>
      </button>

      {open ? (
        <div className={styles.letter} role="region" aria-label={title}>
          <PressedFlower variant="blossom" className={styles.letterOrnament} />
          <p className={styles.letterTitle}>{title}</p>
          {body.map((line, i) => (
            <p key={i} className={styles.letterLine}>
              {line}
            </p>
          ))}
          <button type="button" className={styles.close} onClick={() => setOpen(false)}>
            Fold closed
          </button>
        </div>
      ) : null}
    </div>
  );
}
