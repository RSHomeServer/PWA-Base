import { useNavigate } from "react-router-dom";
import nameplate from "./KeepsakeNameplate.module.css";
import styles from "./AlbumKeepsake.module.css";

export function AlbumKeepsake({ showLabel = true }: { showLabel?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.keepsake}
      onClick={() => navigate("/photos")}
      aria-label="Open Photos"
    >
      <div className={styles.book} aria-hidden="true">
        <div className={styles.cover}>
          <span className={styles.coverTitle}>Photos</span>
        </div>
      </div>
      {showLabel ? <span className={nameplate.nameplate}>Photos</span> : null}
    </button>
  );
}
