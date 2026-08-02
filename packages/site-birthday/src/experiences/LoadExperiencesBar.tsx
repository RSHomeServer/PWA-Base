import { LAUNCHER_EXPERIENCES } from "./registry.js";
import { useExperienceRuntime } from "./useExperienceRuntime.js";
import { statusGlyph, statusLabel } from "./loadStateLabels.js";
import styles from "./LoadExperiencesBar.module.css";

export function LoadExperiencesBar() {
  const { statuses, loadingAll, startLoadingAll } = useExperienceRuntime();

  return (
    <div className={styles.bar}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.loadButton}
          onClick={startLoadingAll}
          disabled={loadingAll}
        >
          {loadingAll ? "Loading Experiences…" : "Load Experiences"}
        </button>
      </div>
      <ul className={styles.list} aria-live="polite">
        {LAUNCHER_EXPERIENCES.map((experience) => {
          const state = statuses[experience.id] ?? "idle";
          return (
            <li key={experience.id} className={styles.item} data-state={state}>
              <span className={styles.glyph} aria-hidden="true">
                {statusGlyph(state)}
              </span>
              <span className={styles.name}>{experience.title}</span>
              <span className={styles.state}>{statusLabel(state, loadingAll)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
