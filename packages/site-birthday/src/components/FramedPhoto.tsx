import { useState, type CSSProperties } from "react";
import styles from "./FramedPhoto.module.css";

interface FramedPhotoProps {
  src?: string;
  alt?: string;
  caption?: string;
  numeral?: string;
  tilt?: number;
  /** Handwritten note revealed by lifting the photograph. */
  noteUnder?: string;
}

/**
 * Gold-edged mat around a photograph or an intentional empty frame.
 * Optional `noteUnder` lets the photo lift to reveal a scrapbook note.
 */
export function FramedPhoto({
  src,
  alt = "",
  caption,
  numeral,
  tilt = 0,
  noteUnder,
}: FramedPhotoProps) {
  const [lifted, setLifted] = useState(false);
  const canLift = Boolean(noteUnder);

  return (
    <figure className={styles.frame} style={{ "--tilt": `${tilt}deg` } as CSSProperties}>
      <div className={styles.mat}>
        {canLift ? (
          <button
            type="button"
            className={`${styles.lift} ${lifted ? styles.lifted : ""}`}
            onClick={() => setLifted((v) => !v)}
            aria-expanded={lifted}
            aria-label={lifted ? "Lower photograph" : "Lift photograph to read the note"}
          >
            <div className={styles.window}>
              {src ? (
                <img src={src} alt={alt} className={styles.image} loading="lazy" />
              ) : (
                <div className={styles.empty} aria-hidden="true">
                  <span className={styles.emptyGlow} />
                  {numeral ? <span className={styles.emptyNumeral}>{numeral}</span> : null}
                </div>
              )}
            </div>
            <span className={styles.note} aria-hidden={!lifted}>
              {noteUnder}
            </span>
          </button>
        ) : (
          <div className={styles.window}>
            {src ? (
              <img src={src} alt={alt} className={styles.image} loading="lazy" />
            ) : (
              <div className={styles.empty} aria-hidden="true">
                <span className={styles.emptyGlow} />
                {numeral ? <span className={styles.emptyNumeral}>{numeral}</span> : null}
              </div>
            )}
          </div>
        )}
        <span className={styles.cornerTL} aria-hidden="true" />
        <span className={styles.cornerBR} aria-hidden="true" />
      </div>
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
