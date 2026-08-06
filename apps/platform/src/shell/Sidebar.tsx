import type { SiteDefinition } from "@platform/site-registry";
import { IconButton, Kbd } from "@platform/ui";
import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

const COMPONENTS_PATH = "/components";

interface SidebarProps {
  sites: readonly SiteDefinition[];
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

const SITE_ACCENTS: Record<string, string> = {
};

function getAppAccent(siteId: string): string | undefined {
  return SITE_ACCENTS[siteId];
}

function NavIcon({ name }: { name: "home" | "components" | "app" | "collapse" }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.navIcon}>
        <path
          d="M2.5 7.25 8 2.75l5.5 4.5V13a1 1 0 0 1-1 1h-3.25v-3.5H6.75V14H3.5a1 1 0 0 1-1-1V7.25Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "components") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.navIcon}>
        <rect
          x="2.5"
          y="2.5"
          width="4.5"
          height="4.5"
          rx="0.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <rect
          x="9"
          y="2.5"
          width="4.5"
          height="4.5"
          rx="0.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <rect
          x="2.5"
          y="9"
          width="4.5"
          height="4.5"
          rx="0.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <rect
          x="9"
          y="9"
          width="4.5"
          height="4.5"
          rx="0.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
    );
  }

  if (name === "app") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.navIcon}>
        <rect
          x="3"
          y="2.5"
          width="10"
          height="11"
          rx="1.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M5.5 5.25h5M5.5 8h5M5.5 10.75h3"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.navIcon}>
      <path
        d="M10.25 3.5H5.75a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h4.5M6.75 8H12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar({
  sites,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();
  const appSites = sites.filter((site) => site.id !== "components");

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const sidebarClasses = [
    styles.sidebar,
    collapsed ? styles.collapsed : null,
    mobileOpen ? styles.mobileOpen : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close navigation"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside className={sidebarClasses} aria-label="Application navigation">
        <div className={styles.header}>
          {!collapsed ? (
            <Link to="/" className={styles.brand} onClick={onCloseMobile}>
              <span className={styles.brandMark} aria-hidden="true" />
              <span className={styles.brandText}>Songara Studio</span>
            </Link>
          ) : (
            <Link
              to="/"
              className={styles.brandCollapsed}
              aria-label="Songara Studio home"
              onClick={onCloseMobile}
            >
              <span className={styles.brandMark} aria-hidden="true" />
            </Link>
          )}
          <IconButton
            label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            size="sm"
            variant="ghost"
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
          >
            <NavIcon name="collapse" />
          </IconButton>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <Link
                to="/"
                className={[styles.navLink, location.pathname === "/" ? styles.navLinkActive : null]
                  .filter(Boolean)
                  .join(" ")}
                onClick={onCloseMobile}
                title={collapsed ? "Home" : undefined}
              >
                <NavIcon name="home" />
                {!collapsed ? <span>Home</span> : null}
              </Link>
            </li>
            <li>
              <Link
                to={COMPONENTS_PATH}
                className={[styles.navLink, isActive(COMPONENTS_PATH) ? styles.navLinkActive : null]
                  .filter(Boolean)
                  .join(" ")}
                onClick={onCloseMobile}
                title={collapsed ? "Components" : undefined}
              >
                <NavIcon name="components" />
                {!collapsed ? <span>Components</span> : null}
              </Link>
            </li>
          </ul>

          {!collapsed ? <p className={styles.sectionLabel}>Applications</p> : null}
          <ul className={styles.navList} aria-label="Registered applications">
            {appSites.length > 0 ? (
              appSites.map((site) => {
                const accent = getAppAccent(site.id);

                return (
                  <li key={site.id}>
                    <Link
                      to={site.basePath}
                      className={[
                        styles.navLink,
                        isActive(site.basePath) ? styles.navLinkActive : null,
                        accent ?? null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={onCloseMobile}
                      title={collapsed ? site.title : undefined}
                    >
                      <span className={styles.appIconWrap} aria-hidden="true">
                        <NavIcon name="app" />
                      </span>
                      {!collapsed ? (
                        <span className={styles.navLinkText}>
                          <span>{site.title}</span>
                          <span className={styles.navLinkPath}>{site.basePath}</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })
            ) : !collapsed ? (
              <li className={styles.navEmpty}>
                <p>No apps registered</p>
              </li>
            ) : null}
          </ul>
        </nav>

        {!collapsed ? (
          <div className={styles.footer}>
            <p className={styles.footerHint}>
              Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to jump
            </p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
