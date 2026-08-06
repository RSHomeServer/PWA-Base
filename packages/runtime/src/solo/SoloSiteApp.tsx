import type { ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import {
  hasSiteCapability,
  SITE_CAPABILITY,
  type SiteDefinition,
} from "../../../site-registry/src/contract.js";
import { PlatformChrome } from "../chrome/PlatformChrome.js";
import type { PlatformNavConfig } from "../chrome/nav.js";

/** Map a site route path onto the solo-app root (base `/`). */
export function soloRoutePath(routePath: string): string {
  if (!routePath || routePath === "" || routePath === "/") return "/";
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

export type SoloSiteAppProps = {
  site: SiteDefinition;
  /**
   * Optional mega-bar navigation. Defaults to none — solo apps do not show
   * catalogue chrome unless they opt in with an explicit config.
   */
  nav?: PlatformNavConfig | null;
};

/**
 * Mount a site definition at `/` for independent packaging (ADR-004),
 * wrapped in shared platform chrome.
 *
 * Chrome layout is driven by {@link SITE_CAPABILITY} tags on the site —
 * never by hard-coded application ids. Mega bar requires an explicit `nav`.
 */
export function SoloSiteApp({ site, nav = null }: SoloSiteAppProps) {
  const flush = hasSiteCapability(site, SITE_CAPABILITY.fullBleed);
  const defaultTopbarCollapsed = hasSiteCapability(
    site,
    SITE_CAPABILITY.defaultTopbarCollapsed,
  );
  return (
    <PlatformChrome
      nav={nav}
      flush={flush}
      defaultTopbarCollapsed={defaultTopbarCollapsed}
    >
      <Routes>
        {site.routes.map((route) => {
          const Comp = route.component as ComponentType;
          const path = soloRoutePath(route.path);
          return <Route key={`${site.id}:${path}`} path={path} element={<Comp />} />;
        })}
      </Routes>
    </PlatformChrome>
  );
}
