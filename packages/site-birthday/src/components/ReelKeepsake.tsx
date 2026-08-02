import { useNavigate } from "react-router-dom";
import nameplate from "./KeepsakeNameplate.module.css";
import styles from "./ReelKeepsake.module.css";

export function ReelKeepsake({ showLabel = true }: { showLabel?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.keepsake}
      onClick={() => navigate("/videos")}
      aria-label="Open Videos"
    >
      <div className={styles.reel} aria-hidden="true">
        <div className={styles.disc} />
        <div className={styles.canister} />
      </div>
      {showLabel ? <span className={nameplate.nameplate}>Videos</span> : null}
    </button>
  );
}
