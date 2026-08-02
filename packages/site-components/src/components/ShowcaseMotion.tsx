import type { ReactNode } from "react";
import motionStyles from "./ShowcaseMotion.module.css";

export interface ShowcaseMotionProps {
  children: ReactNode;
}

/** Applies token-based enter animation to swapped content. */
export function ShowcaseMotion({ children }: ShowcaseMotionProps) {
  return <div className={motionStyles.fadeEnter}>{children}</div>;
}
