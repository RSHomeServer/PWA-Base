import styles from "./FilmFrameVideo.module.css";

interface FilmFrameVideoProps {
  src?: string;
  title: string;
  note: string;
}

/**
 * A film-strip framed slot for a video keepsake. Reads as an intentional,
 * cinematic placeholder — sprocket holes and all — until a real clip is
 * supplied via `src`.
 */
export function FilmFrameVideo({ src, title, note }: FilmFrameVideoProps) {
  return (
    <figure className={styles.strip}>
      <div className={styles.sprockets} aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className={styles.frame}>
        {src ? (
          <video className={styles.video} src={src} controls preload="metadata" />
        ) : (
          <div className={styles.empty}>
            <span className={styles.play} aria-hidden="true">
              ▷
            </span>
            <p className={styles.emptyTitle}>{title}</p>
            <p className={styles.emptyNote}>{note}</p>
          </div>
        )}
      </div>
      <div className={styles.sprockets} aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </figure>
  );
}
