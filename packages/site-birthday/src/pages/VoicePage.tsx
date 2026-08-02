import "@platform/ui/tokens.css";
import "../site.css";
import { ExperienceShell } from "../components/ExperienceShell.js";
import { VoiceTurntable } from "../components/VoiceTurntable.js";
import { useMediaCatalog } from "../media/useMediaCatalog.js";
import styles from "./VoicePage.module.css";

export function VoicePage() {
  const { catalog, loading, error } = useMediaCatalog();

  return (
    <div className={styles.page}>
      <ExperienceShell path="/voice" title="Voice Notes" variant="overlay" />
      <div className={styles.stage}>
        {loading ? <p className={styles.status}>Warming the turntable…</p> : null}
        {error ? <p className={styles.status}>{error}</p> : null}
        {catalog ? <VoiceTurntable notes={catalog.voiceNotes} /> : null}
      </div>
    </div>
  );
}
