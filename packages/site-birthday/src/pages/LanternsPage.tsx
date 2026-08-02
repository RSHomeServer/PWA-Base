import "@platform/ui/tokens.css";
import "../site.css";
import { ExperienceShell } from "../components/ExperienceShell.js";
import { LanternField } from "../components/LanternField.js";
import { LANTERN_WISH_TEXTS } from "../lib/lanternWishes.js";
import styles from "./LanternsPage.module.css";

/**
 * Lantern experience — same LanternField + curated wish pool as Chapter VI.
 */
export function LanternsPage() {
  return (
    <div className={styles.page}>
      <ExperienceShell
        path="/lanterns"
        title="Lantern Wishes"
        variant="overlay"
      />
      <div className={styles.stage}>
        <LanternField wishes={LANTERN_WISH_TEXTS} className={styles.field} />
      </div>
    </div>
  );
}
