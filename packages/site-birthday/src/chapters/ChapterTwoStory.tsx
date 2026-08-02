import { ChapterMark } from "../components/ChapterMark.js";
import { PressedFlower } from "../components/PressedFlower.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./ChapterTwoStory.module.css";

/**
 * Chapter II — The Story So Far. A letter on paper, and a thread strung
 * quietly between a beginning and now.
 */
export function ChapterTwoStory() {
  const { chapters } = useKeepsakeContent();
  const CHAPTER_TWO = chapters.story;
  const STORY_WAYPOINTS = chapters.story.waypoints;
  return (
    <section
      className={`bd-section bd-reveal ${styles.scene}`}
      aria-labelledby="chapter-two-heading"
    >
      <div className="bd-container">
        <ChapterMark numeral="II" title={CHAPTER_TWO.title} id="chapter-two-heading" />

        <div className={styles.paper}>
          <PressedFlower variant="sprig" className={styles.ornament} />
          <p className={styles.letterHeading}>{CHAPTER_TWO.letterHeading}</p>
          {CHAPTER_TWO.paragraphs.map((paragraph, i) => (
            <p key={i} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>

        <div className={styles.thread} role="list" aria-label="A thread of years">
          <div className={styles.threadLine} aria-hidden="true" />
          {STORY_WAYPOINTS.map((point) => (
            <div key={point.year} className={styles.waypoint} role="listitem">
              <span className={styles.waypointDot} aria-hidden="true" />
              <span className={styles.waypointYear}>{point.year}</span>
              <span className={styles.waypointLabel}>{point.label}</span>
              <span className={styles.waypointNote}>{point.note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
