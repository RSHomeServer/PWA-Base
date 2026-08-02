import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Surface.module.css";

export type SurfaceElevation = "none" | "xs" | "sm" | "md";

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: SurfaceElevation;
  /** Lift elevation one step on hover (uses shadow tokens). */
  interactive?: boolean;
  children: ReactNode;
}

export function Surface({
  elevation = "sm",
  interactive = false,
  className,
  children,
  ...props
}: SurfaceProps) {
  const classes = [
    styles.surface,
    styles[`elevation-${elevation}`],
    interactive ? styles.interactive : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
