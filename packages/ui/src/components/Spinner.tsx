import type { HTMLAttributes } from "react";
import styles from "./Spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  /** Accessible label (default: "Loading"). */
  label?: string;
}

export function Spinner({ size = "md", label = "Loading", className, ...props }: SpinnerProps) {
  const classes = [styles.spinner, styles[size], className].filter(Boolean).join(" ");

  return (
    <span className={classes} role="status" aria-label={label} {...props}>
      <span className={styles.srOnly}>{label}</span>
    </span>
  );
}
