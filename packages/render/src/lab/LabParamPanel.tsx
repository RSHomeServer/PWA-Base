import type { LabParamPanelProps } from "./types.js";
import styles from "./LabShell.module.css";

export function LabParamPanel({ title = "Parameters", children, footer }: LabParamPanelProps) {
  return (
    <aside className={styles.paramPanel} aria-label={title}>
      <header className={styles.paramHeader}>
        <h2 className={styles.paramTitle}>{title}</h2>
      </header>
      <div className={styles.paramBody}>{children}</div>
      {footer ? <footer className={styles.paramFooter}>{footer}</footer> : null}
    </aside>
  );
}

export type { LabParamPanelProps };
