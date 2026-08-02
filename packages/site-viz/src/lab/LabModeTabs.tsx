import type { LabModeTabsProps } from "./types.js";
import styles from "./LabShell.module.css";

export function LabModeTabs({
  modes,
  activeMode,
  onModeChange,
  label = "Lab modes",
}: LabModeTabsProps) {
  if (modes.length === 0) {
    return null;
  }

  return (
    <div className={styles.modeTabs} role="tablist" aria-label={label}>
      {modes.map((mode) => {
        const selected = mode.id === activeMode;
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            className={[styles.modeTab, selected ? styles.modeTabActive : ""]
              .filter(Boolean)
              .join(" ")}
            aria-selected={selected}
            aria-controls={`lab-mode-panel-${mode.id}`}
            disabled={mode.disabled}
            onClick={() => onModeChange(mode.id)}
          >
            {mode.icon ? <span className={styles.modeIcon}>{mode.icon}</span> : null}
            <span className={styles.modeLabel}>{mode.label}</span>
            {mode.description ? (
              <span className={styles.modeDescription}>{mode.description}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export type { LabModeTabsProps };
