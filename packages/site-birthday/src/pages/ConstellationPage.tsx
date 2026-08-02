import { FindUsMomentStage } from "../components/FindUsMomentStage.js";
import { ExperienceShell } from "../components/ExperienceShell.js";
import "@platform/ui/tokens.css";
import "../site.css";
import styles from "./ConstellationPage.module.css";

/**
 * Mounts Leo FindUsMoment at /constellation with thin experience nav overlay.
 * Platform chrome stays visible via FindUsMomentStage overrides.
 */
export function ConstellationPage() {
  return (
    <div className={styles.page}>
      <ExperienceShell
        path="/constellation"
        title="Constellation"
        variant="overlay"
      />
      <FindUsMomentStage className={styles.leoStage} />
    </div>
  );
}
