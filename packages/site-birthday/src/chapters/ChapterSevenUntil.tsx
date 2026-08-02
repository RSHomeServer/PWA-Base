import { ChapterMark } from "../components/ChapterMark.js";
import { FilmFrameVideo } from "../components/FilmFrameVideo.js";
import { OpeningConstellation } from "../components/OpeningConstellation.js";
import { PressedFlower } from "../components/PressedFlower.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./ChapterSevenUntil.module.css";

/**
 * Chapter VII — Until The Next Adventure. The closing letter, a film-frame
 * message, and a quiet echo of the opening constellation.
 */
export function ChapterSevenUntil() {
  const { chapters } = useKeepsakeContent();
  const CHAPTER_SEVEN = chapters.until;
  const { letter } = CHAPTER_SEVEN;

  return (
    <section
      className={`bd-section bd-reveal ${styles.scene}`}
      aria-labelledby="chapter-seven-heading"
    >
      <div className="bd-container">
        <ChapterMark numeral="VII" title={CHAPTER_SEVEN.title} id="chapter-seven-heading" />

        <div className={styles.videoWrap}>
          <FilmFrameVideo
            title={CHAPTER_SEVEN.videoTitle}
            note={CHAPTER_SEVEN.videoNote}
            src={CHAPTER_SEVEN.videoSrc || undefined}
          />
        </div>

        <article className={styles.letter}>
          <PressedFlower variant="blossom" className={styles.ornament} />
          <p className={styles.salutation}>{letter.salutation}</p>
          {letter.paragraphs.map((paragraph, i) => (
            <p key={i} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
          <p className={styles.signoff}>{letter.signoff}</p>
          <p className={styles.signature}>{letter.signature}</p>
        </article>

        <footer className={styles.closing}>
          <OpeningConstellation variant="echo" />
          <p className={styles.closingText}>{CHAPTER_SEVEN.closing}</p>
        </footer>
      </div>
    </section>
  );
}
