import type { ReactNode, Ref } from "react";
import nameplate from "../components/KeepsakeNameplate.module.css";
import styles from "./SnowGlobe.module.css";

type Props = {
  label: string;
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  previewRef?: Ref<HTMLDivElement>;
  showLabel?: boolean;
};

/** Prototype 2D snow-globe frame — intentionally simple SVG/CSS. */
export function SnowGlobe({
  label,
  children,
  selected = false,
  onSelect,
  previewRef,
  showLabel = true,
}: Props) {
  return (
    <button
      type="button"
      className={[styles.globeButton, selected ? styles.selected : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect}
      aria-label={`Enter ${label}`}
    >
      <div className={styles.globe}>
        <div className={styles.glass} ref={previewRef}>
          <div className={styles.preview}>{children}</div>
          <svg
            className={styles.shine}
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="globeGlass" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="45%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="96" fill="url(#globeGlass)" />
            <circle
              cx="100"
              cy="100"
              r="96"
              fill="none"
              stroke="rgba(199,232,255,0.45)"
              strokeWidth="3"
            />
          </svg>
        </div>
        <div className={styles.base} aria-hidden="true">
          <div className={styles.baseTop} />
          <div className={styles.baseBody} />
        </div>
      </div>
      {showLabel ? <span className={nameplate.nameplate}>{label}</span> : null}
    </button>
  );
}
