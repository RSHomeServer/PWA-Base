import { useNavigate } from "react-router-dom";
import "@platform/ui/tokens.css";
import "../site.css";
import { AlbumKeepsake } from "../components/AlbumKeepsake.js";
import { ConstellationGlobe } from "../components/ConstellationGlobe.js";
import { LanternKeepsake } from "../components/LanternKeepsake.js";
import { ReelKeepsake } from "../components/ReelKeepsake.js";
import { SiteNav } from "../components/SiteNav.js";
import { VinylKeepsake } from "../components/VinylKeepsake.js";
import { SnowGlobe } from "../experiences/SnowGlobe.js";
import styles from "./ExperiencesPage.module.css";

/**
 * Keepsake shelf — handcrafted objects that launch individual experiences.
 */
export function ExperiencesPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <SiteNav variant="bar" />
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Keepsakes</p>
          <h1 className={styles.title}>Experiences</h1>
          <p className={styles.subtitle}>
            Choose a keepsake from the shelf.
          </p>
        </div>
      </header>

      <div className={styles.shelfScene} aria-label="Keepsake shelf">
        <div className={styles.board}>
          <div className={styles.slot}>
            <SnowGlobe
              label="Constellation"
              onSelect={() => navigate("/constellation")}
            >
              <ConstellationGlobe />
            </SnowGlobe>
          </div>
          <div className={styles.slot}>
            <LanternKeepsake />
          </div>
          <div className={styles.slot}>
            <VinylKeepsake />
          </div>
          <div className={styles.slot}>
            <AlbumKeepsake />
          </div>
          <div className={styles.slot}>
            <ReelKeepsake />
          </div>
        </div>
        <div className={styles.ledge} aria-hidden="true" />
        <div className={styles.wallShadow} aria-hidden="true" />
      </div>
    </div>
  );
}
