import { useId } from "react";
import type { LabTooltipProps } from "./types.js";
import styles from "./LabShell.module.css";

export function LabTooltip({ label, children, placement = "top" }: LabTooltipProps) {
  const tipId = useId();
  const wrapClass = [styles.toolWrap, placement === "bottom" ? styles.toolWrapBottom : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapClass} data-tooltip={label}>
      <span id={tipId} className={styles.srOnly}>
        {label}
      </span>
      <span aria-describedby={tipId}>{children}</span>
    </span>
  );
}

export type { LabTooltipProps };
