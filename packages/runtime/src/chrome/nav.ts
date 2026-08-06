/**
 * Injectable platform navigation — types and helpers with no product hosts.
 * Consumers (e.g. a catalogue host) supply {@link PlatformNavConfig}.
 */

export type PlatformNavLink = {
  id: string;
  label: string;
  /** Absolute https URL */
  href: string;
  /**
   * When true, open in a new tab (external destinations).
   * Same-product apps that mount PlatformChrome typically use false.
   */
  external: boolean;
  /** Short blurb for catalogue cards */
  description: string;
};

export type PlatformNavGroup = {
  id: string;
  label: string;
  /** One-line section intro on the catalogue */
  blurb: string;
  links: readonly PlatformNavLink[];
};

/**
 * Product-neutral nav payload for mega bar / catalogue chrome.
 * Omit or pass empty to hide the mega bar (solo apps default).
 */
export type PlatformNavConfig = {
  /** Optional home / catalogue root link */
  home?: PlatformNavLink;
  /** Sectioned flyout groups */
  groups?: readonly PlatformNavGroup[];
  /**
   * Absolute origin for cross-host logos (e.g. `https://apps.example.com`).
   * When unset, logos resolve as same-origin `/logos/<id>.*`.
   */
  logoOrigin?: string;
  /**
   * Hostname where local `/logos/` paths are preferred over {@link logoOrigin}.
   */
  logoLocalHostname?: string;
  /** Fallback accent colours keyed by link id */
  logoAccents?: Readonly<Record<string, string>>;
};

/** True when chrome should render a mega bar for this config. */
export function hasPlatformNav(config?: PlatformNavConfig | null): boolean {
  if (!config) return false;
  return Boolean(config.home) || (config.groups?.length ?? 0) > 0;
}

export function isPlatformNavActive(
  href: string,
  currentOrigin: string = typeof window !== "undefined" ? window.location.origin : "",
): boolean {
  if (!currentOrigin) return false;
  try {
    return new URL(href).origin === currentOrigin;
  } catch {
    return false;
  }
}

export function platformNavLinkProps(link: PlatformNavLink): {
  href: string;
  target?: "_blank";
  rel?: string;
} {
  if (link.external) {
    return { href: link.href, target: "_blank", rel: "noopener noreferrer" };
  }
  return { href: link.href };
}

function logoBase(config?: PlatformNavConfig | null): string {
  const origin = config?.logoOrigin?.replace(/\/$/, "") ?? "";
  const localHost = config?.logoLocalHostname;
  if (
    origin &&
    localHost &&
    typeof window !== "undefined" &&
    window.location.hostname === localHost
  ) {
    return "";
  }
  return origin;
}

/** Logo URL for nav/catalogue — single folder: `/logos/<id>.*`. */
export function platformNavLogoUrl(
  link: PlatformNavLink,
  config?: PlatformNavConfig | null,
): string {
  return `${logoBase(config)}/logos/${link.id}.svg`;
}

/** Alternate raster paths when SVG is missing (used by catalogue UI). */
export function platformNavLogoCandidates(
  link: PlatformNavLink,
  config?: PlatformNavConfig | null,
): readonly string[] {
  const base = logoBase(config);
  return [
    `${base}/logos/${link.id}.svg`,
    `${base}/logos/${link.id}.png`,
    `${base}/logos/${link.id}.webp`,
  ];
}

export {
  DEFAULT_LOGO_ACCENT,
  platformNavLogoAccent,
  extractDominantColor,
} from "./logoAccent.js";
