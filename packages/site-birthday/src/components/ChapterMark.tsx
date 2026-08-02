import styles from "./ChapterMark.module.css";

interface ChapterMarkProps {
  numeral: string;
  title: string;
  id: string;
}

/**
 * Quiet scene title — a soft roman numeral and the chapter name.
 * No eyebrow strip, no marketing kicker.
 */
export function ChapterMark({ numeral, title, id }: ChapterMarkProps) {
  return (
    <header className={styles.mark}>
      <span className={styles.numeral} aria-hidden="true">
        {numeral}
      </span>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
    </header>
  );
}
