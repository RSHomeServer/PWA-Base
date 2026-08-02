import type { InputHTMLAttributes } from "react";
import styles from "./field.module.css";

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ className, type = "text", ...props }: TextFieldProps) {
  const classes = [styles.input, className].filter(Boolean).join(" ");
  return <input type={type} className={classes} {...props} />;
}
