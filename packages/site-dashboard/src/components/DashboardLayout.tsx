import type { ReactNode } from "react";
import { useOsNotificationStubs } from "../hooks/useOsNotificationStubs.js";
import { DashboardNav } from "./DashboardNav.js";
import { InstallExperience } from "./InstallExperience.js";
import { NotificationBell } from "./NotificationBell.js";
import styles from "./DashboardLayout.module.css";

export function DashboardLayout({
  title,
  subtitle,
  children,
  actions,
  fullBleed = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Use the full main content width (run list + detail split). */
  fullBleed?: boolean;
}) {
  useOsNotificationStubs();

  return (
    <div className={[styles.page, fullBleed ? styles.pageFullBleed : ""].filter(Boolean).join(" ")}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>AI Development Dashboard</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div className={styles.headerRight}>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
          <NotificationBell />
        </div>
      </header>
      <DashboardNav />
      <InstallExperience />
      {children}
    </div>
  );
}
