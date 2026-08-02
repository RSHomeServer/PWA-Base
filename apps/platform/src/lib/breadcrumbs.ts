import type { SiteDefinition } from "@platform/site-registry";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  components: "Components",
};

export function buildBreadcrumbs(
  pathname: string,
  sites: readonly SiteDefinition[],
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (pathname === "/") {
    return [{ label: "Home" }];
  }

  const site = sites.find(
    (entry) => pathname === entry.basePath || pathname.startsWith(`${entry.basePath}/`),
  );

  if (site) {
    crumbs.push({ label: site.title, href: site.basePath });

    const remainder = pathname.slice(site.basePath.length).replace(/^\//, "");
    if (remainder) {
      const segments = remainder.split("/").filter(Boolean);
      let path = site.basePath;

      for (const segment of segments) {
        path = `${path}/${segment}`;
        const label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        crumbs.push({ label, href: path });
      }
    }

    crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1]!.label };
    return crumbs;
  }

  const topSegment = pathname.split("/").filter(Boolean)[0];
  if (topSegment && ROUTE_LABELS[topSegment]) {
    crumbs.push({ label: ROUTE_LABELS[topSegment]! });
  }

  return crumbs;
}
