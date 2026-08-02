import type { ReactNode } from "react";
import { ShowcaseSection } from "./ShowcaseSection.js";
import styles from "./AccessibilitySection.module.css";

export interface AccessibilitySectionProps {
  children: ReactNode;
}

export function AccessibilitySection({ children }: AccessibilitySectionProps) {
  return (
    <ShowcaseSection title="Accessibility">
      <div className={styles.notes}>{children}</div>
    </ShowcaseSection>
  );
}
