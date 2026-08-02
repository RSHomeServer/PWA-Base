import "@platform/ui/tokens.css";
import "../site.css";
import { ExperienceShell } from "../components/ExperienceShell.js";
import { VideoProjector } from "../components/VideoProjector.js";
import { useMediaCatalog } from "../media/useMediaCatalog.js";
import styles from "./VideosPage.module.css";

export function VideosPage() {
  const { catalog, loading, error } = useMediaCatalog();

  return (
    <div className={styles.page}>
      <ExperienceShell path="/videos" title="Videos" variant="overlay" />
      <div className={styles.stage}>
        {loading ? <p className={styles.status}>Threading the projector…</p> : null}
        {error ? <p className={styles.status}>{error}</p> : null}
        {catalog ? <VideoProjector videos={catalog.videos} /> : null}
      </div>
    </div>
  );
}
