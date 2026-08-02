import { useState } from "react";
import type { PhotoItem } from "../media/index.js";
import styles from "./PhotoAlbum.module.css";

type Props = {
  photos: readonly PhotoItem[];
};

/**
 * Photo album: turn pages one photograph at a time.
 */
export function PhotoAlbum({ photos }: Props) {
  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState(false);
  const photo = photos[index] ?? null;
  const total = photos.length;

  function go(delta: number) {
    if (!total || turning) return;
    setTurning(true);
    window.setTimeout(() => {
      setIndex((prev) => (prev + delta + total) % total);
      setTurning(false);
    }, 280);
  }

  if (!photo) {
    return <p className={styles.empty}>No photographs yet.</p>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.album}>
        <div className={styles.spine} aria-hidden="true" />
        <div className={[styles.page, turning ? styles.pageTurn : ""].filter(Boolean).join(" ")}>
          <figure className={styles.frame}>
            <img
              className={styles.image}
              src={photo.src}
              alt={photo.title}
              draggable={false}
            />
            <figcaption className={styles.captionBlock}>
              <span className={styles.photoTitle}>{photo.title}</span>
              <span className={styles.caption}>{photo.caption}</span>
              {photo.date ? <span className={styles.date}>{photo.date}</span> : null}
              <span className={styles.format}>{photo.format.toUpperCase()}</span>
            </figcaption>
          </figure>
        </div>
      </div>

      <div className={styles.nav}>
        <button type="button" className={styles.navBtn} onClick={() => go(-1)}>
          Previous page
        </button>
        <span className={styles.counter}>
          {index + 1} / {total}
        </span>
        <button type="button" className={styles.navBtn} onClick={() => go(1)}>
          Next page
        </button>
      </div>
      {photo.attribution ? (
        <p className={styles.attribution}>{photo.attribution}</p>
      ) : null}
    </div>
  );
}
