import { Link } from "react-router-dom";
import "@platform/ui/tokens.css";
import "../site.css";
import { SiteNav } from "../components/SiteNav.js";
import { LANDING_EXPERIENCES } from "../nav/experiences.js";
import { bedroomScene } from "../scene/bedroom/bedroomScene.js";
import { SceneRenderer } from "../scene/SceneRenderer.js";
import styles from "./HomePage.module.css";

/**
 * Bedroom scene at /bedroom (Experience default; Editor toggle in-scene).
 * Experience routes stay reachable via the dock; scene fills remaining space.
 */
export function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.editor}>
        <header className={styles.chrome}>
          <div className={styles.chromeTitle}>
            <p className={styles.eyebrow}>{bedroomScene.eyebrow}</p>
            <h1 className={styles.title}>{bedroomScene.title}</h1>
          </div>

          {bedroomScene.navigation?.showExperienceNav ? (
            <nav className={styles.experienceNav} aria-label="Experiences">
              <ul className={styles.experienceList} role="list">
                {LANDING_EXPERIENCES.map((exp) => (
                  <li key={exp.id}>
                    <Link className={styles.experienceLink} to={exp.path}>
                      <span
                        className={styles.experienceLinkEmoji}
                        aria-hidden="true"
                      >
                        {exp.cardEmoji}
                      </span>
                      <span>{exp.cardLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <footer className={styles.footer}>
            <SiteNav variant="inline" className={styles.siteNav} />
            <Link className={styles.linkMuted} to="/portals">
              Portal Gallery
            </Link>
          </footer>
        </header>

        <div className={styles.viewportHost}>
          <SceneRenderer scene={bedroomScene} />
        </div>
      </div>
    </div>
  );
}
