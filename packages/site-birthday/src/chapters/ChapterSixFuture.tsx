import { ChapterMark } from "../components/ChapterMark.js";
import { LanternField } from "../components/LanternField.js";
import { LANTERN_WISH_TEXTS } from "../lib/lanternWishes.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./ChapterSixFuture.module.css";

interface ChapterSixFutureProps {
  onAllLanternsReleased?: () => void;
}

/**
 * Chapter VI — Our Future. Soft promises, then a sky to release
 * wishes into — same curated pool as /lanterns.
 */
export function ChapterSixFuture({ onAllLanternsReleased }: ChapterSixFutureProps) {
  const { chapters } = useKeepsakeContent();
  const FUTURE_PROMISES = chapters.future.promises;
  return (
    <section
      className={`bd-section bd-reveal ${styles.scene}`}
      aria-labelledby="chapter-six-heading"
    >
      <div className="bd-container">
        <ChapterMark numeral="VI" title={chapters.future.title} id="chapter-six-heading" />

        <ul className={styles.promises}>
          {FUTURE_PROMISES.map((promise) => (
            <li key={promise.title} className={styles.promise}>
              <h3 className={styles.promiseTitle}>{promise.title}</h3>
              <p className={styles.promiseNote}>{promise.note}</p>
            </li>
          ))}
        </ul>

        <LanternField
          wishes={LANTERN_WISH_TEXTS}
          onAllReleased={onAllLanternsReleased}
        />
      </div>
    </section>
  );
}
