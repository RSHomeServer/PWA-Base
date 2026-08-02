import "@platform/ui/tokens.css";
import "../site.css";
import { ExperienceShell } from "../components/ExperienceShell.js";
import { PhotoAlbum } from "../components/PhotoAlbum.js";
import { useMediaCatalog } from "../media/useMediaCatalog.js";
import styles from "./PhotosPage.module.css";

export function PhotosPage() {
  const { catalog, loading, error } = useMediaCatalog();

  return (
    <div className={styles.page}>
      <ExperienceShell path="/photos" title="Photos" variant="overlay" />
      <div className={styles.stage}>
        {loading ? <p className={styles.status}>Opening the album…</p> : null}
        {error ? <p className={styles.status}>{error}</p> : null}
        {catalog ? <PhotoAlbum photos={catalog.photos} /> : null}
      </div>
    </div>
  );
}
