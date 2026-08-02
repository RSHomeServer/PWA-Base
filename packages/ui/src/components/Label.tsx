import type { LabelHTMLAttributes } from "react";
import styles from "./field.module.css";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  const classes = [styles.label, className].filter(Boolean).join(" ");
  return <label className={classes} {...props} />;
}
