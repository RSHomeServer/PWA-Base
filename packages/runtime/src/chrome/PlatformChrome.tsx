import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MegaBar } from "./MegaBar.js";
import { hasPlatformNav, type PlatformNavConfig } from "./nav.js";
import { PlatformNavProvider } from "./PlatformNavProvider.js";
import styles from "./PlatformChrome.module.css";

const TOPBAR_COLLAPSED_KEY = "pwa-base-topbar-collapsed";
const LEGACY_TOPBAR_COLLAPSED_KEY = "songara-topbar-collapsed";

export interface PlatformChromeProps {
  children: ReactNode;
  /**
   * Injectable navigation for the mega bar. When omitted or empty, no mega bar
   * is shown (solo apps default). Catalogue hosts pass an explicit config.
   */
  nav?: PlatformNavConfig | null;
  /**
   * When true, main content has no inset padding (full-bleed experiences).
   * SoloSiteApp sets this from the `full-bleed` site capability.
   */
  flush?: boolean;
  /**
   * When true and no localStorage preference exists, start with the mega bar collapsed.
   * SoloSiteApp sets this from the `default-topbar-collapsed` site capability.
   */
  defaultTopbarCollapsed?: boolean;
}

function readTopbarCollapsed(defaultCollapsed: boolean): boolean {
  try {
    const stored =
      localStorage.getItem(TOPBAR_COLLAPSED_KEY) ??
      localStorage.getItem(LEGACY_TOPBAR_COLLAPSED_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // ignore
  }
  return defaultCollapsed;
}

/**
 * Shared sticky mega bar chrome for catalogue and solo apps.
 * Mega bar appears only when {@link PlatformChromeProps.nav} has content.
 */
export function PlatformChrome({
  children,
  nav = null,
  flush = false,
  defaultTopbarCollapsed = false,
}: PlatformChromeProps) {
  const showMegaBar = hasPlatformNav(nav);
  const [topbarCollapsed, setTopbarCollapsed] = useState(() =>
    showMegaBar ? readTopbarCollapsed(defaultTopbarCollapsed) : false,
  );

  useEffect(() => {
    if (!showMegaBar) return;
    try {
      localStorage.setItem(TOPBAR_COLLAPSED_KEY, String(topbarCollapsed));
    } catch {
      // ignore
    }
  }, [showMegaBar, topbarCollapsed]);

  const collapseTopbar = useCallback(() => setTopbarCollapsed(true), []);
  const expandTopbar = useCallback(() => setTopbarCollapsed(false), []);

  return (
    <PlatformNavProvider nav={nav}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div
        className={[styles.shell, flush ? styles.flush : null].filter(Boolean).join(" ")}
      >
        {showMegaBar ? (
          topbarCollapsed ? (
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
          )
        ) : null}
        <main id="main-content" className={styles.content} tabIndex={-1}>
          {children}
        </main>
      </div>
    </PlatformNavProvider>
  );
}
