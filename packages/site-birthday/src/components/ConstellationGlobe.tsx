import styles from "./ConstellationGlobe.module.css";

/**
 * Uses the approved keepsake image so the globe reflects the intended
 * miniature artwork instead of a generated preview.
 */
export function ConstellationGlobe() {
  return (
    <div className={styles.globe}>
      <img
        className={styles.image}
        src="/keepsakes/constellation-leo.png"
        alt=""
        draggable={false}
      />
    </div>
  );
}
