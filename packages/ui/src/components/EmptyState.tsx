import type { HTMLAttributes, ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Primary message. */
  title: string;
  /** Supporting description. */
  description?: string;
  /** Optional icon or illustration slot. */
  media?: ReactNode;
  /** Optional action area (buttons, links). */
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  media,
  action,
  className,
  ...props
}: EmptyStateProps) {
  const classes = [styles.root, className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      {media ? <div className={styles.media}>{media}</div> : null}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
