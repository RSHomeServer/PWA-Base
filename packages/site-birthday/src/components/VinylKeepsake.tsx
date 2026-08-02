import { useNavigate } from "react-router-dom";
import nameplate from "./KeepsakeNameplate.module.css";
import styles from "./VinylKeepsake.module.css";

export function VinylKeepsake({ showLabel = true }: { showLabel?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.keepsake}
      onClick={() => navigate("/voice")}
      aria-label="Open Voice Notes"
    >
      <div className={styles.player}>
        <div className={styles.platter} aria-hidden="true">
          <div className={styles.vinyl}>
            <span className={styles.labelDisc} />
          </div>
        </div>
        <div className={styles.arm} aria-hidden="true" />
      </div>
      {showLabel ? <span className={nameplate.nameplate}>Voice Notes</span> : null}
    </button>
  );
}
