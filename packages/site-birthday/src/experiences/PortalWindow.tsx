import type { ReactNode, Ref } from "react";
import styles from "./PortalWindow.module.css";

type Props = {
  title: string;
  icon: string;
  loadLabel: string;
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  previewRef?: Ref<HTMLDivElement>;
};

/** Framed portal window — prototype launcher aperture. */
export function PortalWindow({
  title,
  icon,
  loadLabel,
  children,
  selected = false,
  onSelect,
  previewRef,
}: Props) {
  return (
    <button
      type="button"
      className={[styles.portal, selected ? styles.selected : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onSelect}
      aria-label={`Enter ${title}`}
    >
      <div className={styles.frame}>
        <div className={styles.aperture} ref={previewRef}>
          {children}
        </div>
        <div className={styles.matte} aria-hidden="true" />
      </div>
      <div className={styles.meta}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.title}>{title}</span>
        <span className={styles.status}>{loadLabel}</span>
      </div>
    </button>
  );
}
