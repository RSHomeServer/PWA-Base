import { useState } from "react";
import { IconButton, ThemeMenu } from "@platform/ui";
import {
  PLATFORM_HOME,
  PLATFORM_NAV_GROUPS,
  isPlatformNavActive,
  platformNavLinkProps,
} from "./nav.js";
import { NavLogoChip } from "./NavLogoChip.js";
import { UpdateControl } from "./UpdateControl.js";
import styles from "./MegaBar.module.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" width="16" height="16">
      <path
        d="M2.5 4.25h11M2.5 8h11M2.5 11.75h11"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MegaBar({ onCollapse }: { onCollapse: () => void }) {
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={styles.bar} aria-label="Platform mega menu">
      <IconButton
        label="Open navigation"
        variant="ghost"
        size="sm"
        className={styles.menuBtn}
        onClick={() => setMobileOpen(true)}
      >
        <MenuIcon />
      </IconButton>

      <a
        {...platformNavLinkProps(PLATFORM_HOME)}
        className={[
          styles.home,
          isPlatformNavActive(PLATFORM_HOME.href, currentOrigin) ? styles.homeActive : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <NavLogoChip link={PLATFORM_HOME} size={22} />
        <span>Homepage</span>
      </a>

      <nav className={styles.groups} aria-label="Platform sections">
        {PLATFORM_NAV_GROUPS.map((group) => (
          <div key={group.id} className={styles.group}>
            <button type="button" className={styles.groupLabel} aria-haspopup="true">
              {group.label}
            </button>
            <ul className={styles.flyout} role="list">
              {group.links.map((link) => (
                <li key={link.id}>
                  <a
                    {...platformNavLinkProps(link)}
                    className={[
                      styles.flyoutLink,
                      isPlatformNavActive(link.href, currentOrigin)
                        ? styles.flyoutLinkActive
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <NavLogoChip link={link} size={28} />
                    <span className={styles.flyoutLabel}>{link.label}</span>
                    {link.external ? (
                      <span className={styles.externalHint} aria-hidden="true">
                        ↗
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.actions}>
        <UpdateControl />
        <ThemeMenu />
        <IconButton
          label="Collapse top bar"
          variant="ghost"
          size="sm"
          onClick={onCollapse}
          title="Collapse top bar"
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M3 9.5 8 5l5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className={styles.mobileBackdrop}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <nav className={styles.mobileDrawer} aria-label="Platform navigation">
            <div className={styles.mobileHead}>
              <p className={styles.mobileTitle}>Navigate</p>
              <IconButton
                label="Close navigation"
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
              >
                ×
              </IconButton>
            </div>
            <a
              {...platformNavLinkProps(PLATFORM_HOME)}
              className={styles.mobileLink}
              onClick={() => setMobileOpen(false)}
            >
              <NavLogoChip link={PLATFORM_HOME} size={26} />
              <span>{PLATFORM_HOME.label}</span>
            </a>
            {PLATFORM_NAV_GROUPS.map((group) => (
              <div key={group.id} className={styles.mobileSection}>
                <p className={styles.mobileSectionLabel}>{group.label}</p>
                <ul className={styles.mobileList}>
                  {group.links.map((link) => (
                    <li key={link.id}>
                      <a
                        {...platformNavLinkProps(link)}
                        className={styles.mobileLink}
                        onClick={() => setMobileOpen(false)}
                      >
                        <NavLogoChip link={link} size={26} />
                        <span>
                          {link.label}
                          {link.external ? " ↗" : ""}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </>
      ) : null}
    </header>
  );
}
