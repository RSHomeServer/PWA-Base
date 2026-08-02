import { NavLink } from "react-router-dom";
import styles from "./DashboardNav.module.css";

const LINKS = [
  { to: "/", end: true, label: "History" },
  { to: "/notifications", end: false, label: "Notifications" },
  { to: "/ops", end: false, label: "Operations" },
  { to: "/settings", end: false, label: "Settings" },
] as const;

export function DashboardNav() {
  return (
    <nav className={styles.nav} aria-label="Dashboard sections">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            [styles.link, isActive ? styles.active : ""].filter(Boolean).join(" ")
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
