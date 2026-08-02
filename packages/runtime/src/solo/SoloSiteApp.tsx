import type { ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import type { SiteDefinition } from "@platform/site-registry/contract";
import { PlatformChrome } from "../chrome/PlatformChrome.js";

/** Map a site route path onto the solo-app root (base `/`). */
export function soloRoutePath(routePath: string): string {
  if (!routePath || routePath === "" || routePath === "/") return "/";
  return routePath.startsWith("/") ? routePath : `/${routePath}`;
}

/**
 * Mount a site definition at `/` for independent packaging (ADR-004),
 * wrapped in shared platform chrome (mega bar).
 */
export function SoloSiteApp({ site }: { site: SiteDefinition }) {
  const flush =
    site.id === "birthday" ||
    site.id === "viz" ||
    site.id === "browser-lab" ||
    site.id === "memories";
  return (
    <PlatformChrome flush={flush} siteId={site.id}>
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
