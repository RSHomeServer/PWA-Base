import { Kbd } from "@platform/ui";
import type { LabHelpOverlayProps } from "./types.js";
import styles from "./LabShell.module.css";

function groupShortcuts(shortcuts: LabHelpOverlayProps["shortcuts"]) {
  const groups = new Map<string, typeof shortcuts>();

  for (const shortcut of shortcuts) {
    const category = shortcut.category ?? "General";
    const list = groups.get(category) ?? [];
    list.push(shortcut);
    groups.set(category, list);
  }

  return groups;
}

export function LabHelpOverlay({
  shortcuts,
  open,
  onClose,
  title = "Keyboard & controls",
}: LabHelpOverlayProps) {
  if (!open) {
    return null;
  }

  const groups = groupShortcuts(shortcuts);

  return (
    <div className={styles.helpOverlay} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.helpHeader}>
        <span>{title}</span>
        <button
          type="button"
          className={styles.helpClose}
          onClick={onClose}
          aria-label="Close shortcut legend"
        >
          ×
        </button>
      </div>

      <div className={styles.helpBody}>
        {[...groups.entries()].map(([category, items]) => (
          <section key={category} className={styles.helpSection}>
            <h3 className={styles.helpCategory}>{category}</h3>
            <ul className={styles.helpList}>
              {items.map((shortcut) => (
                <li key={`${category}-${shortcut.keys}`}>
                  <Kbd className={styles.labKbd}>{shortcut.keys}</Kbd>
                  <span>{shortcut.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export type { LabHelpOverlayProps };
