import type { SiteDefinition } from "@platform/site-registry";
import { Link } from "react-router-dom";
import { buildBreadcrumbs } from "../lib/breadcrumbs";
import styles from "./Breadcrumbs.module.css";

interface BreadcrumbsProps {
  pathname: string;
  sites: readonly SiteDefinition[];
}

export function Breadcrumbs({ pathname, sites }: BreadcrumbsProps) {
  const crumbs = buildBreadcrumbs(pathname, sites);

  if (crumbs.length <= 1 && pathname !== "/") {
    return null;
  }

  if (pathname === "/") {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.list}>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={`${crumb.label}-${index}`} className={styles.item}>
              {index > 0 ? (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              ) : null}
              {isLast || !crumb.href ? (
                <span className={styles.current} aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.href} className={styles.link}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
