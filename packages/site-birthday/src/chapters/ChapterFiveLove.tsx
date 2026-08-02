import type { CSSProperties } from "react";
import { ChapterMark } from "../components/ChapterMark.js";
import { useInView } from "../hooks/useInView.js";
import { useKeepsakeContent } from "../lib/KeepsakeContent.js";
import styles from "./ChapterFiveLove.module.css";

/**
 * Chapter V — Everything I Love About You. A quiet list that lights
 * one mark at a time, then a stationery card of favourites.
 */
export function ChapterFiveLove() {
  const { chapters } = useKeepsakeContent();
  const REASONS = chapters.love.reasons;
  const FAVOURITE_SONGS = chapters.love.favouriteSongs;
  const FAVOURITE_PLACES = chapters.love.favouritePlaces;
  const [listRef, listInView] = useInView<HTMLUListElement>({ threshold: 0.2 });

  return (
    <section
      className={`bd-section bd-reveal ${styles.scene}`}
      aria-labelledby="chapter-five-heading"
    >
      <div className="bd-container">
        <ChapterMark numeral="V" title={chapters.love.title} id="chapter-five-heading" />

        <ul ref={listRef} className={styles.list}>
          {REASONS.map((reason, i) => (
            <li
              key={i}
              className={`${styles.reason} ${listInView ? styles.reasonLit : ""}`}
              style={{ "--i": i } as CSSProperties}
            >
              <span className={styles.mark} aria-hidden="true" />
              <span className={styles.reasonText}>{reason}</span>
            </li>
          ))}
        </ul>

        <div className={styles.favourites}>
          <div className={styles.favColumn}>
            <p className={styles.favHeading}>Songs, on repeat</p>
            <ul className={styles.favList}>
              {FAVOURITE_SONGS.map((song, i) => (
                <li key={i} className={styles.favItem}>
                  <span className={styles.favTitle}>{song.title}</span>
                  <span className={styles.favMeta}>{song.artist}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.favDivider} aria-hidden="true" />
          <div className={styles.favColumn}>
            <p className={styles.favHeading}>Places, remembered</p>
            <ul className={styles.favList}>
              {FAVOURITE_PLACES.map((place, i) => (
                <li key={i} className={styles.favItem}>
                  <span className={styles.favTitle}>{place}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
