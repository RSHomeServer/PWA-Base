import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteNav } from "./SiteNav.js";
import { useExperienceNav } from "../nav/useExperienceNav.js";
import styles from "./ExperienceShell.module.css";

type Props = {
  path: string;
  title?: string;
  description?: string;
  /** Overlay sits lightly over full-bleed experiences (e.g. constellation). */
  variant?: "default" | "overlay";
  children?: ReactNode;
};

/**
 * Experience chrome. Hierarchy: Website → Bedroom → Experiences → here.
 * Home returns to the Experiences shelf; SiteNav covers the upper levels.
 */
export function ExperienceShell({
  path,
  title,
  description,
  variant = "default",
  children,
}: Props) {
  const { homePath } = useExperienceNav(path);
  const isOverlay = variant === "overlay";

  return (
    <div
      className={[styles.shell, isOverlay ? styles.overlay : styles.default]
        .filter(Boolean)
        .join(" ")}
    >
      <header className={styles.header}>
        <div className={styles.navRow}>
          <Link className={styles.homeLink} to={homePath}>
            Experiences
          </Link>
          <SiteNav
            variant={isOverlay ? "overlay" : "inline"}
            className={styles.siteNav}
          />
        </div>
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {description && !isOverlay ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </header>
      {children ? <div className={styles.body}>{children}</div> : null}
    </div>
  );
}
