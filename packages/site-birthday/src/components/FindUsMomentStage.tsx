import type { ReactNode } from "react";
import { FindUsMoment } from "@platform/site-memories";
import styles from "./FindUsMomentStage.module.css";

type Props = {
  className?: string;
  children?: ReactNode;
};

/**
 * Shared mount for the finished Leo constellation.
 * Used by /constellation and the Birthday website opening — one implementation.
 */
export function FindUsMomentStage({ className, children }: Props) {
  return (
    <div
      className={[styles.stage, className].filter(Boolean).join(" ")}
      data-constellation-stage
    >
      <FindUsMoment />
      {children}
    </div>
  );
}
