import type { HTMLAttributes } from "react";
import styles from "./Divider.module.css";

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Vertical divider (default: horizontal). */
  orientation?: "horizontal" | "vertical";
}

export function Divider({ orientation = "horizontal", className, ...props }: DividerProps) {
  const classes = [styles.divider, styles[orientation], className].filter(Boolean).join(" ");
  return <hr className={classes} {...props} />;
}
