/** Shared hierarchy: Website → Bedroom → Experiences → individual routes. */
export type SiteNavLink = {
  to: string;
  label: string;
};

export const SITE_NAV: readonly SiteNavLink[] = [
  { to: "/", label: "Website" },
  { to: "/bedroom", label: "Bedroom" },
  { to: "/experiences", label: "Experiences" },
] as const;
