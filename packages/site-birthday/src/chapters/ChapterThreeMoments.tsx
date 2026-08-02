import { ChapterMark } from "../components/ChapterMark.js";
import { FramedPhoto } from "../components/FramedPhoto.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import { toRoman } from "../lib/roman.js";
import styles from "./ChapterThreeMoments.module.css";

const TILTS = [-2.5, 1.5, -1, 2, -1.8, 1, -2.2, 1.8];

/**
 * Chapter III — Twenty-One Moments. Frames hung like a gallery wall,
 * not a marketing card grid.
 */
export function ChapterThreeMoments() {
  const { chapters } = useKeepsakeContent();
  const MOMENTS = chapters.moments.moments;
  const title = chapters.moments.title;
  return (
    <section
      className={`bd-section bd-reveal ${styles.scene}`}
      aria-labelledby="chapter-three-heading"
    >
      <div className="bd-container bd-container--wide">
        <ChapterMark numeral="III" title={title} id="chapter-three-heading" />

        <div className={styles.wall}>
          {MOMENTS.map((moment) => (
            <FramedPhoto
              key={moment.number}
              numeral={toRoman(moment.number)}
              caption={moment.caption}
              src={moment.src || undefined}
              tilt={TILTS[moment.number % TILTS.length]}
              noteUnder={moment.noteUnder}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
