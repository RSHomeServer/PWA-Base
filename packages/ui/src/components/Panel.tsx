import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Panel.module.css";

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Optional section heading rendered as an h2. */
  title?: string;
  children: ReactNode;
}

export function Panel({ title, className, children, ...props }: PanelProps) {
  const classes = [styles.panel, className].filter(Boolean).join(" ");

  return (
    <section className={classes} {...props}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {children}
    </section>
  );
}
