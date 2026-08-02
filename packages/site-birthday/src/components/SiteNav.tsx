import { Link, useLocation } from "react-router-dom";
import { SITE_NAV } from "../nav/siteNav.js";
import styles from "./SiteNav.module.css";

type Props = {
  /** Visual density — overlay sits lightly over full-bleed stages. */
  variant?: "bar" | "overlay" | "inline";
  className?: string;
};

/**
 * Single navigation strip for Website / Bedroom / Experiences.
 * Pages compose this instead of duplicating link lists.
 */
export function SiteNav({ variant = "bar", className }: Props) {
  const { pathname } = useLocation();

  return (
    <nav
      className={[styles.nav, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Site"
    >
      <ul className={styles.list} role="list">
        {SITE_NAV.map((item) => {
          const active =
            item.to === "/"
              ? pathname === "/" || pathname === "/keepsake"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <li key={item.to}>
              <Link
                className={[styles.link, active ? styles.active : ""]
                  .filter(Boolean)
                  .join(" ")}
                to={item.to}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
