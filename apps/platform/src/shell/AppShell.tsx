import type { SiteDefinition } from "@platform/site-registry";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAtmosphereBreath } from "../hooks/useAtmosphereBreath";
import { PageOutlet } from "./PageOutlet";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import styles from "./AppShell.module.css";

const SIDEBAR_COLLAPSED_KEY = "songara-sidebar-collapsed";

interface AppShellProps {
  sites: readonly SiteDefinition[];
}

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function AppShell({ sites }: AppShellProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [mobileOpen, setMobileOpen] = useState(false);

  useAtmosphereBreath();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Ignore storage failures (private mode, quota, etc.)
    }
  }, [collapsed]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const openMobileNav = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className={styles.shell}>
        <Sidebar
          sites={sites}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={toggleCollapse}
          onCloseMobile={closeMobileNav}
        />
        <div className={styles.main}>
          <TopBar onOpenMobileNav={openMobileNav} pathname={location.pathname} sites={sites} />
          <PageOutlet />
        </div>
      </div>
    </>
  );
}
