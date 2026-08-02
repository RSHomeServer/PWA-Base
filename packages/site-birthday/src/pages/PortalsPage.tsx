import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import "@platform/ui/tokens.css";
import "../site.css";
import { ExperiencePreview } from "../experiences/ExperiencePreview.js";
import { LoadExperiencesBar } from "../experiences/LoadExperiencesBar.js";
import { loadStateShortLabel } from "../experiences/loadStateLabels.js";
import { PortalWindow } from "../experiences/PortalWindow.js";
import { useExperienceRuntime } from "../experiences/useExperienceRuntime.js";
import { listPortalExperiences } from "../experiences/registry.js";
import styles from "./PortalsPage.module.css";

/**
 * Window-based launcher prototype: framed portals with live route previews.
 */
export function PortalsPage() {
  const { statuses, enterExperience, markReady, transition } =
    useExperienceRuntime();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const experiences = listPortalExperiences();
  const transitioning = transition !== null;

  return (
    <div className={styles.page}>
      <div className={styles.loadRow}>
        <LoadExperiencesBar />
      </div>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Birthday · Portal Gallery</p>
        <h1 className={styles.title}>Step through a window</h1>
        <p className={styles.subtitle}>
          Each portal shows a static preview of its destination.
        </p>
      </header>

      <ul className={styles.grid} role="list">
        {experiences.map((experience) => {
          const state = statuses[experience.id] ?? "idle";
          // Only mount once ready — preload uses the shared hidden host.
          const active = state === "ready";
          return (
            <li key={experience.id}>
              <PortalWindow
                title={experience.title}
                icon={experience.icon}
                loadLabel={loadStateShortLabel(state)}
                selected={selectedId === experience.id}
                previewRef={(el) => {
                  previewRefs.current[experience.id] = el;
                }}
                onSelect={() => {
                  if (transitioning) return;
                  setSelectedId(experience.id);
                  const origin = previewRefs.current[experience.id];
                  if (!origin) return;
                  enterExperience(experience, origin, "0.55rem");
                }}
              >
                <ExperiencePreview
                  experience={experience}
                  active={active}
                  onReady={() => markReady(experience.id)}
                />
              </PortalWindow>
            </li>
          );
        })}
      </ul>

      <footer className={styles.footer}>
        <Link className={styles.link} to="/bedroom">
          Back to Bedroom
        </Link>
        <Link className={styles.link} to="/">
          Website
        </Link>
      </footer>
    </div>
  );
}
