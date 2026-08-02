import { useNavigate } from "react-router-dom";
import nameplate from "./KeepsakeNameplate.module.css";
import styles from "./LanternKeepsake.module.css";

/** Small lantern keepsake that sits on the shelf and links to /lanterns. */
export function LanternKeepsake({ showLabel = true }: { showLabel?: boolean }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={styles.keepsake}
      onClick={() => navigate("/lanterns")}
      aria-label="Open Lantern Wishes"
    >
      <div className={styles.lanternBox}>
        <svg
          className={styles.art}
          viewBox="0 0 160 220"
          role="img"
          aria-label="Lantern keepsake"
        >
          <defs>
            <linearGradient id="lanternCore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd48a" />
              <stop offset="55%" stopColor="#e9a74a" />
              <stop offset="100%" stopColor="#b46724" />
            </linearGradient>
            <linearGradient id="lanternFrame" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffe3a8" />
              <stop offset="100%" stopColor="#9f6429" />
            </linearGradient>
            <radialGradient id="lanternGlow" cx="50%" cy="48%" r="52%">
              <stop offset="0%" stopColor="rgba(255, 223, 145, 0.95)" />
              <stop offset="60%" stopColor="rgba(255, 174, 88, 0.35)" />
              <stop offset="100%" stopColor="rgba(255, 174, 88, 0)" />
            </radialGradient>
          </defs>
          <ellipse cx="80" cy="122" rx="56" ry="70" fill="url(#lanternGlow)" />

          <path d="M68 26 L92 26 L88 44 L72 44 Z" className={styles.frame} />
          <path d="M80 8 L72 26 L88 26 Z" className={styles.frame} />
          <path d="M70 44 L90 44 L100 62 L60 62 Z" className={styles.frame} />

          <polygon points="54,62 106,62 116,142 44,142" fill="url(#lanternCore)" />
          <polygon points="62,72 98,72 104,134 56,134" className={styles.facetA} />
          <polygon points="54,62 80,78 106,62 80,48" className={styles.facetTop} />
          <polygon points="44,142 80,162 116,142 80,126" className={styles.facetBottom} />

          <line x1="54" y1="62" x2="44" y2="142" className={styles.frameStroke} />
          <line x1="106" y1="62" x2="116" y2="142" className={styles.frameStroke} />
          <line x1="80" y1="48" x2="80" y2="162" className={styles.frameStroke} />
          <line x1="54" y1="62" x2="106" y2="62" className={styles.frameStroke} />
          <line x1="44" y1="142" x2="116" y2="142" className={styles.frameStroke} />

          <path d="M74 162 L86 162 L83 188 L77 188 Z" className={styles.frame} />
          <path d="M72 188 L88 188 L84 200 L76 200 Z" className={styles.frame} />
        </svg>
      </div>
      {showLabel ? (
        <span className={nameplate.nameplate}>Lantern Wishes</span>
      ) : null}
    </button>
  );
}
