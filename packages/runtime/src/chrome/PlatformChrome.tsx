import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MegaBar } from "./MegaBar.js";
import styles from "./PlatformChrome.module.css";

const TOPBAR_COLLAPSED_KEY = "songara-topbar-collapsed";

export interface PlatformChromeProps {
  children: ReactNode;
  /**
   * When true, main content has no inset padding (full-bleed experiences).
   * Birthday defaults the top bar to collapsed as well when no preference is stored.
   */
  flush?: boolean;
  /** Site id — used for birthday default top-bar collapsed state. */
  siteId?: string;
}

function readTopbarCollapsed(siteId?: string): boolean {
  try {
    const stored = localStorage.getItem(TOPBAR_COLLAPSED_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // ignore
  }
  return siteId === "birthday";
}

/**
 * Shared sticky mega bar chrome for catalogue and solo apps.
 */
export function PlatformChrome({ children, flush = false, siteId }: PlatformChromeProps) {
  const [topbarCollapsed, setTopbarCollapsed] = useState(() => readTopbarCollapsed(siteId));

  useEffect(() => {
    try {
      localStorage.setItem(TOPBAR_COLLAPSED_KEY, String(topbarCollapsed));
    } catch {
      // ignore
    }
  }, [topbarCollapsed]);

  const collapseTopbar = useCallback(() => setTopbarCollapsed(true), []);
  const expandTopbar = useCallback(() => setTopbarCollapsed(false), []);

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div
        className={[styles.shell, flush ? styles.flush : null].filter(Boolean).join(" ")}
      >
        {topbarCollapsed ? (
          <button
            type="button"
            className={styles.expandTopbar}
            aria-label="Expand top bar"
            title="Expand top bar"
            onClick={expandTopbar}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M3 6.5 8 11l5-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <MegaBar onCollapse={collapseTopbar} />
        )}
        <main id="main-content" className={styles.content} tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
}
