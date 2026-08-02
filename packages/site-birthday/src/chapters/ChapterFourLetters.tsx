import type { CSSProperties } from "react";
import { ChapterMark } from "../components/ChapterMark.js";
import { EnvelopeLetter } from "../components/EnvelopeLetter.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./ChapterFourLetters.module.css";

/**
 * Chapter IV — Letters Never Sent. Envelopes on a writing desk —
 * not a card grid of marketing tiles.
 */
export function ChapterFourLetters() {
  const { chapters } = useKeepsakeContent();
  const LETTERS = chapters.letters.letters;
  return (
    <section
      className={`bd-section bd-reveal ${styles.scene}`}
      aria-labelledby="chapter-four-heading"
    >
      <div className="bd-container">
        <ChapterMark numeral="IV" title={chapters.letters.title} id="chapter-four-heading" />

        <div className={styles.desk}>
          {LETTERS.map((letter, i) => (
            <div
              key={letter.id}
              className={styles.slot}
              style={
                {
                  "--offset": `${(i % 2 === 0 ? -1 : 1) * (0.4 + i * 0.15)}deg`,
                } as CSSProperties
              }
            >
              <EnvelopeLetter seal={letter.seal} title={letter.title} body={letter.body} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
