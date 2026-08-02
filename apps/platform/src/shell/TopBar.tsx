import type { SiteDefinition } from "@platform/site-registry";
import { IconButton, Kbd } from "@platform/ui";
import { ThemeToggle } from "@platform/ui";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import { buildBreadcrumbs } from "../lib/breadcrumbs";
import { useCommandPalette } from "./useCommandPalette";
import styles from "./TopBar.module.css";

interface TopBarProps {
  onOpenMobileNav: () => void;
  pathname: string;
  sites: readonly SiteDefinition[];
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
      <path
        d="M2.5 4.25h11M2.5 8h11M2.5 11.75h11"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M8 1.75v1.5M8 12.75v1.5M14.25 8h-1.5M3.25 8H1.75M12.4 3.6l-1.06 1.06M4.66 11.34l-1.06 1.06M12.4 12.4l-1.06-1.06M4.66 4.66L3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.icon}>
      <circle cx="8" cy="5.5" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M3.5 13.25c.75-2.25 2.5-3.5 4.5-3.5s3.75 1.25 4.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.searchIcon}>
      <circle cx="7" cy="7" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 10l3.25 3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function TopBar({ onOpenMobileNav, pathname, sites }: TopBarProps) {
  const { open: openPalette } = useCommandPalette();
  const crumbs = buildBreadcrumbs(pathname, sites);
  const showCrumbs = pathname !== "/" && crumbs.length > 1;

  const handleOpenPalette = useCallback(() => {
    openPalette();
  }, [openPalette]);

  return (
    <>
      <header className={styles.bar}>
        <div className={styles.barMain}>
          <div className={styles.leading}>
            <IconButton
              label="Open navigation"
              variant="ghost"
              size="sm"
              className={styles.menuBtn}
              onClick={onOpenMobileNav}
            >
              <MenuIcon />
            </IconButton>
            <Link to="/" className={styles.brand}>
              Songara Studio
            </Link>
          </div>

          <button
            type="button"
            className={styles.search}
            onClick={handleOpenPalette}
            aria-label="Open command palette"
            title="Jump to a page or change theme"
          >
            <SearchIcon />
            <span className={styles.searchLabel}>Search or jump to…</span>
            <span className={styles.searchShortcut} aria-hidden="true">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <div className={styles.actions}>
            <ThemeToggle className={styles.themeToggle} />
            <IconButton
              label="Settings"
              variant="ghost"
              size="sm"
              disabled
              title="Settings — coming soon"
            >
              <SettingsIcon />
            </IconButton>
            <IconButton
              label="Profile"
              variant="ghost"
              size="sm"
              disabled
              title="Profile — coming soon"
            >
              <ProfileIcon />
            </IconButton>
          </div>
        </div>

        {showCrumbs ? (
          <nav aria-label="Breadcrumb" className={styles.crumbs}>
            <ol className={styles.crumbsList}>
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;

                return (
                  <li key={`${crumb.label}-${index}`} className={styles.crumbsItem}>
                    {index > 0 ? (
                      <span className={styles.crumbsSeparator} aria-hidden="true">
                        /
                      </span>
                    ) : null}
                    {isLast || !crumb.href ? (
                      <span className={styles.crumbsCurrent} aria-current="page">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link to={crumb.href} className={styles.crumbsLink}>
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}
      </header>
    </>
  );
}
