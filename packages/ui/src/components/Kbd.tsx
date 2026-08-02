import type { HTMLAttributes } from "react";
import styles from "./Kbd.module.css";

export type KbdProps = HTMLAttributes<HTMLElement>;

export function Kbd({ className, ...props }: KbdProps) {
  const classes = [styles.kbd, className].filter(Boolean).join(" ");
  return <kbd className={classes} {...props} />;
}
