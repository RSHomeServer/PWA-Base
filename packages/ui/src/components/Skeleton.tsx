import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Render as a circle (avatars, icons). */
  circle?: boolean;
}

export function Skeleton({ circle = false, className, ...props }: SkeletonProps) {
  const classes = [styles.skeleton, circle ? styles.circle : null, className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes} aria-hidden="true" {...props} />;
}
